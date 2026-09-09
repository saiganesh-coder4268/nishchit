import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CommunicationPanel from '../components/CommunicationPanel';
import { Button, StatusIndicator, ConfirmDialog, QuickMessageButton } from '../components/ui';
import { subscribeSingleBus, startDriverTrip, updateDriverGpsLocation, endDriverTrip } from '../utils/transportService';
import { getDriverTrackingStatus } from '../utils/busStatus';
import { ref, onValue, push } from 'firebase/database';
import { database } from '../firebase';
import { 
  Play, Square, AlertTriangle, MessageSquare, Zap, Clock, ShieldCheck, 
  CheckCircle2, MapPin, Navigation, Radio, Building2, Calendar, Phone, Activity
} from 'lucide-react';

export default function DriverDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const busId = currentUser?.busId || 'BUS-24';
  const [busData, setBusData] = useState({
    busNumber: currentUser?.busNumber || 'Bus 24',
    registrationNumber: currentUser?.busRegistrationNumber || 'AP 35 U 2424',
    routeName: currentUser?.routeName || 'Route 04 (Vizianagaram RTC Complex -> MVGR College)',
    routeNumber: 'ROUTE 04',
    status: 'NOT_STARTED',
    latitude: 18.1145,
    longitude: 83.4021,
    accuracy: 8,
    speed: 0,
    startedAt: null,
    endedAt: null,
    lastUpdated: null
  });

  const [gpsError, setGpsError] = useState(null);
  const [isConnected, setIsConnected] = useState(true);
  const [showCommPanel, setShowCommPanel] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [currentCoords, setCurrentCoords] = useState(null);
  const [quickNotice, setQuickNotice] = useState(null);

  const watchIdRef = useRef(null);

  const driverVerification = currentUser?.verificationStatus || 'APPROVED';
  const isVerified = driverVerification === 'APPROVED';
  const hasAssignedBus = Boolean(currentUser?.busId);

  // Time ticker
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 4000);
    return () => clearInterval(timer);
  }, []);

  // Firebase connection state
  useEffect(() => {
    const connRef = ref(database, '.info/connected');
    const unsubscribe = onValue(connRef, (snap) => {
      setIsConnected(snap.val() === true);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to Bus State
  useEffect(() => {
    const unsubscribe = subscribeSingleBus(busId, (val) => {
      if (val) {
        setBusData(prev => ({ ...prev, ...val }));
      }
    });
    return () => unsubscribe();
  }, [busId]);

  // Stop GPS tracking on unmount
  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopTracking();
  }, []);

  // Send quick broadcast to parents
  const sendQuickBroadcast = async (label, text) => {
    try {
      const messagesRef = ref(database, `messages/${busId}`);
      await push(messagesRef, {
        senderId: currentUser?.uid || 'DRV-901',
        senderName: currentUser?.name || currentUser?.fullName || 'Rajesh Kumar',
        senderRole: 'driver',
        message: text,
        timestamp: Date.now(),
        isQuickMessage: true
      });
      setQuickNotice(`Broadcasted: "${label}"`);
      setTimeout(() => setQuickNotice(null), 3000);
    } catch (e) {
      console.warn("Quick broadcast failed:", e);
    }
  };

  // START BUS TRIP using Real Device Geolocation
  const handleStartBus = async () => {
    if (!currentUser) {
      setGpsError("Session expired. Please log in again.");
      return;
    }
    if (!hasAssignedBus) {
      setGpsError("No vehicle assigned. Please contact your institution transport manager.");
      return;
    }
    if (!isVerified) {
      setGpsError("Your driver profile is pending verification. Only approved drivers can start trips.");
      return;
    }
    if (busData.status === 'LIVE' || isStarting) {
      return;
    }

    setIsStarting(true);
    setGpsError(null);
    stopTracking();

    if (!navigator.geolocation) {
      setGpsError("Browser Geolocation is not supported on this device/browser.");
      setIsStarting(false);
      return;
    }

    try {
      // Step 1: Acquire high-accuracy position fix
      const initialPosition = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos),
          (err) => {
            let msg = "Could not obtain GPS position.";
            if (err.code === 1) msg = "Location permission was denied. Please allow GPS access in your browser.";
            else if (err.code === 2) msg = "GPS signal unavailable. Please ensure location services are enabled.";
            else if (err.code === 3) msg = "GPS fix acquisition timed out. Retrying...";
            reject(new Error(msg));
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      });

      const { latitude, longitude, accuracy, speed, heading } = initialPosition.coords;
      const coords = { latitude, longitude, accuracy, speed, heading };
      setCurrentCoords(coords);

      // Step 2: Start Trip in Realtime DB
      await startDriverTrip(busId, currentUser, coords);

      // Step 3: Start continuous watchPosition loop
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          if (pos && pos.coords) {
            const updated = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              speed: pos.coords.speed,
              heading: pos.coords.heading
            };
            setCurrentCoords(updated);
            updateDriverGpsLocation(busId, updated);
          }
        },
        (watchErr) => {
          console.warn("GPS Watch warning:", watchErr);
        },
        { enableHighAccuracy: true, maximumAge: 2000 }
      );

    } catch (err) {
      setGpsError(err.message || "Failed to start GPS tracking. Please verify browser location permissions.");
    } finally {
      setIsStarting(false);
    }
  };

  // Open End Trip Confirm Dialog
  const handleOpenEndConfirm = () => {
    if (busData.status !== 'LIVE') return;
    setShowEndConfirm(true);
  };

  // Confirmed End Trip
  const handleConfirmEndTrip = async () => {
    if (busData.status !== 'LIVE' || isEnding) return;
    setIsEnding(true);
    setGpsError(null);

    try {
      stopTracking();
      await endDriverTrip(busId, currentUser);
      setShowEndConfirm(false);
    } catch (err) {
      console.error("Error completing trip:", err);
      setGpsError(err?.message || "Failed to end trip.");
    } finally {
      setIsEnding(false);
    }
  };

  const getRelativeTime = (ts) => {
    if (!ts) return 'No sync yet';
    const diffSec = Math.floor(Math.max(0, now - ts) / 1000);
    if (diffSec < 4) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    return `${diffMin}m ago`;
  };

  const isLive = busData.status === 'LIVE';
  const isCompleted = busData.status === 'COMPLETED';
  const isNotStarted = !isLive && !isCompleted;

  const quickMessages = [
    { label: "Traffic Delay", text: "Heavy traffic near Mayuri Junction / NH16. Expect 5-10 min delay." },
    { label: "Approaching Stop", text: "Bus is approaching the next scheduled stop. Please be ready at pickup point!" },
    { label: "Temporary Stop", text: "Bus stopped temporarily at railway crossing / safety check." },
    { label: "Route Clear", text: "Corridor traffic is clear. Moving smoothly on scheduled timing." },
    { label: "Emergency Notice", text: "Emergency update: Route diversion via Denkada Road. All students safe." }
  ];

  return (
    <div className="driver-dashboard-page">
      <div className="driver-operator-container">
        
        {/* 1. OPERATOR HEADER: Vehicle & Authorization Banner */}
        <div className="driver-auth-bar">
          <div className="auth-status-chip">
            <ShieldCheck size={16} />
            <span>VERIFIED OPERATOR</span>
            {!isConnected && <span className="offline-tag">• Offline Sync</span>}
          </div>
          <div className="auth-details">
            <strong>{currentUser?.name || currentUser?.fullName || 'Rajesh Kumar'}</strong>
            <span className="dot">•</span>
            <span>DL: {currentUser?.licenceNumber || 'AP-35-20180004921'}</span>
            <span className="dot">•</span>
            <span>{currentUser?.institutionName || 'MVGR College of Engineering'}</span>
          </div>
        </div>

        {/* 2. GPS ERROR NOTICE */}
        {gpsError && (
          <div className="gps-error-banner">
            <AlertTriangle size={18} />
            <span>{gpsError}</span>
          </div>
        )}

        {/* 3. OPERATIONAL HERO COCKPIT */}
        <div className="driver-hero-cockpit">
          
          {/* Top Identifier */}
          <div className="cockpit-header">
            <div className="bus-route-group">
              <span className="bus-number-hero">{busData.busNumber || 'Bus 24'}</span>
              <span className="reg-badge-hero">{busData.registrationNumber || 'AP 35 U 2424'}</span>
            </div>
            <div className="route-tag-hero">
              <MapPin size={14} />
              <span>{busData.routeNumber || 'ROUTE 04'}</span>
            </div>
          </div>

          <div className="route-description-line">
            <Navigation size={14} color="#2563eb" />
            <span>{busData.routeName || 'Vizianagaram RTC Complex -> Mayuri -> MVGR Campus'}</span>
          </div>

          {/* Schedule Banner */}
          <div className="cockpit-schedule-bar">
            <div className="schedule-item">
              <Calendar size={14} />
              <span>Reporting: <strong>06:50 AM</strong></span>
            </div>
            <div className="schedule-item">
              <Clock size={14} />
              <span>Departure: <strong>07:15 AM</strong></span>
            </div>
            <div className="schedule-item">
              <Building2 size={14} />
              <span>Campus Arrival: <strong>08:15 AM</strong></span>
            </div>
          </div>

          {/* Status Display Area */}
          <div className="cockpit-status-section">
            {isNotStarted && (
              <div className="status-box not-started">
                <div className="status-title-row">
                  <span className="status-badge-hero not-started">🅿️ TRIP NOT STARTED</span>
                </div>
                <p className="status-subtext">Device GPS is standby. Tap START BUS when departing the depot/platform.</p>
              </div>
            )}

            {isLive && (
              <div className="status-box live">
                <div className="status-title-row">
                  <span className="status-badge-hero live">
                    <span className="pulse-dot-green"></span> 🟢 LIVE ON ROUTE
                  </span>
                  <span className="gps-signal-badge">
                    <Radio size={14} color="#16a34a" /> Live GPS Streaming
                  </span>
                </div>
                
                {/* Live Telemetry Display */}
                <div className="live-telemetry-grid">
                  <div className="telem-item">
                    <span className="telem-label">Latitude</span>
                    <strong>{busData.latitude ? Number(busData.latitude).toFixed(4) : '--'}° N</strong>
                  </div>
                  <div className="telem-item">
                    <span className="telem-label">Longitude</span>
                    <strong>{busData.longitude ? Number(busData.longitude).toFixed(4) : '--'}° E</strong>
                  </div>
                  <div className="telem-item">
                    <span className="telem-label">GPS Accuracy</span>
                    <strong>±{busData.accuracy || 8} m</strong>
                  </div>
                  <div className="telem-item">
                    <span className="telem-label">Last Streamed</span>
                    <strong>{getRelativeTime(busData.lastUpdated)}</strong>
                  </div>
                </div>
              </div>
            )}

            {isCompleted && (
              <div className="status-box completed">
                <div className="status-title-row">
                  <span className="status-badge-hero completed">🏁 TRIP COMPLETED</span>
                </div>
                <p className="status-subtext">Today's transport shift has concluded safely. GPS streaming is deactivated.</p>
              </div>
            )}
          </div>

          {/* Primary Action Button (Huge, single focused action) */}
          <div className="hero-action-area">
            {isNotStarted && (
              <Button
                variant="success"
                size="huge"
                loading={isStarting}
                loadingText="Acquiring Device GPS Fix..."
                disabled={!isVerified || !hasAssignedBus || isStarting}
                onClick={handleStartBus}
                icon={Play}
                className="btn-hero-action"
              >
                START BUS TRIP
              </Button>
            )}

            {isLive && (
              <Button
                variant="destructive"
                size="huge"
                loading={isEnding}
                onClick={handleOpenEndConfirm}
                icon={Square}
                className="btn-hero-action"
              >
                END BUS TRIP
              </Button>
            )}

            {isCompleted && (
              <div className="completed-summary-banner">
                <CheckCircle2 size={24} color="#059669" />
                <span>Today's trip is complete. Transport desk has been notified.</span>
              </div>
            )}
          </div>
        </div>

        {/* 4. ONE-TAP PARENT STATUS BROADCASTS */}
        <div className="driver-quick-updates-card">
          <div className="quick-updates-header">
            <Zap size={18} color="#2563eb" />
            <div>
              <h3>One-Tap Passenger & Parent Announcements</h3>
              <p className="subhead">Safe pre-composed operational updates — no typing required while driving.</p>
            </div>
          </div>

          {quickNotice && (
            <div className="broadcast-success-notice">
              <CheckCircle2 size={16} color="#16a34a" />
              <span>{quickNotice}</span>
            </div>
          )}

          <div className="quick-buttons-grid">
            {quickMessages.map((item, idx) => (
              <QuickMessageButton
                key={idx}
                label={item.label}
                text={item.text}
                isEmergency={item.label.includes('Emergency')}
                onClick={(txt) => sendQuickBroadcast(item.label, txt)}
              />
            ))}
          </div>
        </div>

        {/* 5. PASSENGER & DISPATCH LOG */}
        <div className="driver-drawer-toggle">
          <Button
            variant="outline"
            fullWidth
            onClick={() => setShowCommPanel(!showCommPanel)}
            icon={MessageSquare}
          >
            {showCommPanel ? 'Hide Operational Dispatch Log' : 'Open Dispatch & Parent Communication Log'}
          </Button>
        </div>

        {showCommPanel && (
          <div className="comm-panel-container">
            <CommunicationPanel
              currentUser={currentUser}
              busData={busData}
              onClose={() => setShowCommPanel(false)}
            />
          </div>
        )}

        {/* 6. END TRIP CONFIRMATION MODAL */}
        <ConfirmDialog
          isOpen={showEndConfirm}
          title="Conclude Today's Bus Trip?"
          message="Are you sure you want to conclude today's bus run? This will terminate live GPS location streaming for all waiting parents and mark the trip completed."
          confirmLabel="End Trip"
          cancelLabel="Cancel"
          variant="destructive"
          loading={isEnding}
          onConfirm={handleConfirmEndTrip}
          onCancel={() => setShowEndConfirm(false)}
        />

      </div>
    </div>
  );
}
