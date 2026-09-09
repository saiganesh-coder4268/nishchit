import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import CommunicationPanel from '../components/CommunicationPanel';
import { Button, StatusIndicator, ConfirmDialog, QuickMessageButton } from '../components/ui';
import { subscribeBusState, updateBusState } from '../utils/busSync';
import { getDriverTrackingStatus } from '../utils/busStatus';
import { ref, onValue, push } from 'firebase/database';
import { database } from '../firebase';
import { 
  Play, Square, AlertTriangle, 
  ToggleLeft, ToggleRight, MessageSquare, Zap, Clock, ShieldCheck, CheckCircle2 
} from 'lucide-react';

// Predefined Simulated GPS Demo Route Coordinates (Urban Hyderabad School Route)
const DEMO_INTERVAL_MS = 3500;
const DEMO_ROUTE_COORDS = [
  { lat: 17.4399, lng: 78.4983 },
  { lat: 17.4415, lng: 78.5000 },
  { lat: 17.4435, lng: 78.5022 },
  { lat: 17.4460, lng: 78.5050 },
  { lat: 17.4480, lng: 78.5072 },
  { lat: 17.4505, lng: 78.5100 },
  { lat: 17.4530, lng: 78.5130 },
  { lat: 17.4555, lng: 78.5158 },
  { lat: 17.4575, lng: 78.5180 },
  { lat: 17.4600, lng: 78.5205 }
];

export default function DriverDashboard() {
  const { currentUser } = useAuth();
  const [busData, setBusData] = useState({
    busNumber: 'Bus 24',
    routeNumber: 'Route 04',
    status: 'NOT_STARTED',
    latitude: 17.4399,
    longitude: 78.4983,
    accuracy: 10,
    startedAt: null,
    endedAt: null,
    lastUpdated: null,
    isDemoMode: false
  });

  const [gpsError, setGpsError] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [showCommPanel, setShowCommPanel] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const watchIdRef = useRef(null);
  const demoIntervalRef = useRef(null);
  const demoStepRef = useRef(0);

  const busId = currentUser?.busId || 'BUS24';
  const driverVerification = currentUser?.verificationStatus || (currentUser?.uid === 'demo-driver-001' ? 'VERIFIED' : 'PENDING');
  const isVerified = driverVerification === 'VERIFIED';
  const hasAssignedBus = Boolean(currentUser?.busId);

  // Keep relative time updated
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  // Check Firebase Connection State (.info/connected)
  useEffect(() => {
    const connRef = ref(database, '.info/connected');
    const unsubscribe = onValue(connRef, (snap) => {
      setIsConnected(snap.val() === true);
    });
    return () => unsubscribe();
  }, []);

  // Realtime DB & BroadcastChannel Sync Listener for Bus state
  useEffect(() => {
    const unsubscribe = subscribeBusState(busId, (val) => {
      if (val) {
        setBusData(val);
        if (val.isDemoMode !== undefined) {
          setIsDemoMode(val.isDemoMode);
        }
      }
    });

    return () => unsubscribe();
  }, [busId]);

  // Clean up watchers and intervals
  const stopAllTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (demoIntervalRef.current !== null) {
      clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopAllTracking();
  }, []);

  // Broadcast quick message
  const sendQuickBroadcast = async (label, text) => {
    try {
      const messagesRef = ref(database, `messages/${busId}`);
      await push(messagesRef, {
        senderId: currentUser?.uid || 'driver-1',
        senderName: currentUser?.name || 'Rajesh Kumar',
        senderRole: 'driver',
        message: text,
        timestamp: Date.now(),
        isQuickMessage: true
      });
    } catch (e) {
      console.warn("Quick broadcast failed:", e);
    }
  };

  // Start Demo Simulated Movement
  const startDemoRouteTracking = (startTime) => {
    stopAllTracking();
    demoStepRef.current = 0;

    const pushDemoPoint = () => {
      const point = DEMO_ROUTE_COORDS[demoStepRef.current % DEMO_ROUTE_COORDS.length];
      demoStepRef.current += 1;

      updateBusState(busId, {
        status: 'LIVE',
        latitude: point.lat,
        longitude: point.lng,
        accuracy: 5,
        lastUpdated: Date.now(),
        startedAt: busData.startedAt || startTime,
        isDemoMode: true,
        driverId: currentUser?.driverId || 'DRV001',
        driverName: currentUser?.name || 'Rajesh Kumar'
      });
    };

    pushDemoPoint();
    demoIntervalRef.current = setInterval(pushDemoPoint, DEMO_INTERVAL_MS);
  };

  // START BUS handler with deterministic 8s timeout Promise
  const handleStartBus = async () => {
    if (!currentUser) {
      setGpsError("AUTHENTICATION ERROR: User session not found. Please log in again.");
      return;
    }
    if (!hasAssignedBus) {
      setGpsError("NO ASSIGNED BUS: Your driver profile does not have an assigned bus ID.");
      return;
    }
    if (!isVerified) {
      setGpsError("UNAUTHORIZED DRIVER: Only VERIFIED drivers can start a trip.");
      return;
    }
    if (busData.status === 'LIVE' || isStarting) {
      return;
    }

    setIsStarting(true);
    setGpsError(null);
    stopAllTracking();
    const startTime = Date.now();

    try {
      if (isDemoMode) {
        startDemoRouteTracking(startTime);
        await sendQuickBroadcast("Trip Started", `🚌 Trip Started: ${busData.busNumber || 'Bus 24'} is now LIVE on route.`);
        setIsStarting(false);
        return;
      }

      if (!navigator.geolocation) {
        setGpsError("Browser GPS not supported on this device. Please switch to DEMO ROUTE mode.");
        setIsStarting(false);
        return;
      }

      // Wrap initial location fix & start state write in an 8-second maximum timeout Promise
      const acquireInitialFix = new Promise((resolve, reject) => {
        let options = { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 };

        const handleSuccess = async (position) => {
          if (!position || !position.coords) {
            reject(new Error("Invalid GPS position data received."));
            return;
          }
          const { latitude, longitude, accuracy } = position.coords;
          const nLat = Number(latitude);
          const nLng = Number(longitude);

          if (isNaN(nLat) || isNaN(nLng)) {
            reject(new Error("Invalid coordinate values received."));
            return;
          }

          try {
            await updateBusState(busId, {
              status: 'LIVE',
              latitude: nLat,
              longitude: nLng,
              accuracy: Math.round(accuracy || 0),
              lastUpdated: position.timestamp || Date.now(),
              startedAt: busData.startedAt || startTime,
              isDemoMode: false,
              driverId: currentUser?.driverId || 'DRV001',
              driverName: currentUser?.name || 'Rajesh Kumar'
            });

            // Start continuous watch position
            watchIdRef.current = navigator.geolocation.watchPosition(
              (pos) => {
                if (pos && pos.coords) {
                  updateBusState(busId, {
                    status: 'LIVE',
                    latitude: Number(pos.coords.latitude),
                    longitude: Number(pos.coords.longitude),
                    accuracy: Math.round(pos.coords.accuracy || 0),
                    lastUpdated: pos.timestamp || Date.now()
                  });
                }
              },
              (wErr) => console.warn("WatchPosition warning:", wErr),
              { enableHighAccuracy: true, maximumAge: 3000 }
            );

            resolve(true);
          } catch (e) {
            reject(e);
          }
        };

        const handleError = (err) => {
          let errorMsg = "Unable to fetch GPS. Switch to DEMO ROUTE mode.";
          if (err.code === 1) errorMsg = "Location access denied. Please allow GPS permissions.";
          else if (err.code === 2) errorMsg = "Position unavailable. Please check GPS connection.";
          else if (err.code === 3) errorMsg = "GPS request timed out. Retrying or switch to DEMO ROUTE.";
          reject(new Error(errorMsg));
        };

        navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options);
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("GPS fix acquisition timed out after 8 seconds. Please check device location settings or switch to DEMO ROUTE.")), 8500)
      );

      await Promise.race([acquireInitialFix, timeoutPromise]);
      await sendQuickBroadcast("Trip Started", `🚌 Trip Started: ${busData.busNumber || 'Bus 24'} is now LIVE on route.`);
    } catch (err) {
      setGpsError(err.message || "Failed to start trip. Please try again or switch to DEMO ROUTE.");
    } finally {
      setIsStarting(false);
    }
  };

  // Open End Trip Confirmation Dialog
  const handleOpenEndConfirm = () => {
    if (busData.status !== 'LIVE') return;
    setShowEndConfirm(true);
  };

  // Confirmed END TRIP handler
  const handleConfirmEndTrip = async () => {
    if (busData.status !== 'LIVE' || isEnding) return;
    setIsEnding(true);
    setGpsError(null);

    try {
      stopAllTracking();
      const endTime = Date.now();

      await updateBusState(busId, {
        status: 'COMPLETED',
        endedAt: endTime,
        lastUpdated: endTime,
        latitude: busData.latitude || 17.4399,
        longitude: busData.longitude || 78.4983
      });

      // Immediately dismiss modal & clean up confirm dialog state
      setShowEndConfirm(false);

      // Background message notification (non-blocking)
      sendQuickBroadcast("Trip Completed", `🏁 Trip Completed: Today's ${busData.busNumber || 'Bus 24'} trip has ended safely.`);
    } catch (err) {
      console.error("Error completing trip:", err);
      setGpsError(err?.message || "Failed to complete trip. Please try again.");
    } finally {
      setIsEnding(false);
    }
  };

  const toggleDemoMode = () => {
    const nextVal = !isDemoMode;
    setIsDemoMode(nextVal);
    if (busData.status === 'LIVE') {
      stopAllTracking();
      const nowTs = Date.now();
      if (nextVal) {
        startDemoRouteTracking(nowTs);
      }
    }
    updateBusState(busId, { isDemoMode: nextVal });
  };

  const getRelativeTime = (ts) => {
    if (!ts) return 'Just now';
    const diffSec = Math.floor(Math.max(0, now - ts) / 1000);
    if (diffSec < 5) return 'Just now';
    if (diffSec < 60) return `${diffSec} seconds ago`;
    const diffMin = Math.floor(diffSec / 60);
    return `${diffMin} min ago`;
  };

  const isLive = busData.status === 'LIVE';
  const isCompleted = busData.status === 'COMPLETED';
  const isNotStarted = !isLive && !isCompleted;

  const trackingInfo = getDriverTrackingStatus(busData, isStarting, gpsError, now);

  const quickMessages = [
    { label: "Traffic delay", text: "Heavy traffic near main junction. Expect slight delay." },
    { label: "Running late", text: "Bus is running about 10 minutes late today." },
    { label: "Temporary stop", text: "Bus stopped temporarily for safety check." },
    { label: "Please be ready", text: "Bus is approaching upcoming stop. Please be ready!" },
    { label: "Emergency", text: "Emergency update: Vehicle check in progress. All students safe." }
  ];

  return (
    <div className="driver-dashboard-page">
      <div className="driver-operator-container">
        
        {/* 1. Compact Authorization Bar (Inline Sleek Header) */}
        <div className="driver-auth-bar">
          <div className="auth-status-chip">
            <ShieldCheck size={16} />
            <span>AUTHORIZED DRIVER</span>
            {!isConnected && <span style={{ marginLeft: '6px', color: '#b45309' }}>• Offline</span>}
          </div>
          <div className="auth-details">
            <strong>{currentUser?.name || 'Rajesh Kumar'}</strong>
            <span className="dot">•</span>
            <span>ID: {currentUser?.driverId || 'DRV001'}</span>
            <span className="dot">•</span>
            <span>St. Mary's High School</span>
          </div>
        </div>

        {/* 2. GPS / System Error Banner */}
        {gpsError && (
          <div className="gps-error-banner">
            <AlertTriangle size={18} />
            <span>{gpsError}</span>
          </div>
        )}

        {/* 3. Hero Operational Cockpit (The Focal Area) */}
        <div className="driver-hero-cockpit">
          <div className="cockpit-header">
            <div className="bus-route-group">
              <span className="bus-number-hero">{busData.busNumber || 'BUS 24'}</span>
              <span className="route-badge-hero">{busData.routeNumber || 'ROUTE 04'}</span>
            </div>

            <button
              type="button"
              onClick={toggleDemoMode}
              className={`mode-pill ${isDemoMode ? 'demo' : 'real'}`}
              title="Toggle tracking mode"
            >
              {isDemoMode ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
              <span>{isDemoMode ? 'DEMO' : 'REAL GPS'}</span>
            </button>
          </div>

          <div className="cockpit-status-section">
            {isNotStarted && (
              <div className="status-box not-started">
                <div className="status-title-row">
                  <StatusIndicator status={isStarting ? "PENDING" : "NOT_STARTED"} label={trackingInfo.label} />
                </div>
                <p className="status-subtext">Location sharing ready. Tap START BUS when departing.</p>
              </div>
            )}

            {isLive && (
              <div className="status-box live">
                <div className="status-title-row">
                  <StatusIndicator status="LIVE" label={trackingInfo.label} />
                  <span className="location-active-badge">
                    <span className="pulse-dot-green"></span>
                    Location Sharing ACTIVE
                  </span>
                </div>
                <p className="status-subtext">
                  <Clock size={14} /> Last update: {getRelativeTime(busData.lastUpdated)}
                </p>
              </div>
            )}

            {isCompleted && (
              <div className="status-box completed">
                <div className="status-title-row">
                  <StatusIndicator status="COMPLETED" label="TRIP COMPLETED" />
                  <span className="location-inactive-badge">Location Sharing INACTIVE</span>
                </div>
                <p className="status-subtext">Today's bus trip has ended safely.</p>
              </div>
            )}
          </div>

          {/* Hero Action Button Area */}
          <div className="hero-action-area">
            {isNotStarted && (
              <Button
                variant="success"
                size="huge"
                loading={isStarting}
                loadingText="Starting trip..."
                disabled={!isVerified || !hasAssignedBus || isStarting}
                disabledReason={!hasAssignedBus ? "No assigned bus" : !isVerified ? "Driver pending verification" : undefined}
                onClick={handleStartBus}
                icon={Play}
                className="btn-hero-action"
              >
                START BUS
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
                END TRIP
              </Button>
            )}

            {isCompleted && (
              <div className="completed-summary-banner">
                <CheckCircle2 size={24} color="#059669" />
                <span>Today's bus trip has ended safely. Location sharing is inactive.</span>
              </div>
            )}
          </div>
        </div>

        {/* 4. Quick Parent Communication Announcements */}
        <div className="driver-quick-updates-card">
          <div className="quick-updates-header">
            <Zap size={18} color="#2563eb" />
            <div>
              <h3>Quick Parent Updates</h3>
              <p className="subhead">One-tap operational status broadcasting.</p>
            </div>
          </div>

          <div className="quick-buttons-grid">
            {quickMessages.map((item, idx) => (
              <QuickMessageButton
                key={idx}
                label={item.label}
                text={item.text}
                isEmergency={item.label === 'Emergency'}
                onClick={(txt) => sendQuickBroadcast(item.label, txt)}
              />
            ))}
          </div>
        </div>

        {/* 5. Collapsible Communication Log */}
        <div className="driver-drawer-toggle">
          <Button
            variant="outline"
            fullWidth
            onClick={() => setShowCommPanel(!showCommPanel)}
            icon={MessageSquare}
          >
            {showCommPanel ? 'Hide Message History' : 'Open Message Log'}
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

        {/* 6. End Trip Confirmation Modal */}
        <ConfirmDialog
          isOpen={showEndConfirm}
          title="End Today's Bus Trip?"
          message="Are you sure you want to end today's trip? This will stop live GPS location streaming for parents."
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



