import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CommunicationPanel from '../components/CommunicationPanel';
import { Button, ConfirmDialog, QuickMessageButton } from '../components/ui';
import {
  subscribeSingleBus,
  subscribeSingleRoute,
  startDriverTrip,
  streamDriverGpsLocation,
  endDriverTrip
} from '../services/transportService';
import { ref, onValue, push } from 'firebase/database';
import { rtdb } from '../firebase';

import {
  Play, Square, AlertTriangle, MessageSquare, Zap, Clock, ShieldCheck,
  CheckCircle2, MapPin, Navigation, Radio, Building2, Calendar,
  AlertCircle
} from 'lucide-react';

export default function DriverDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const busId = currentUser?.busId || currentUser?.assignedBusId;
  const routeId = currentUser?.routeId || currentUser?.assignedRouteId;

  const [busData, setBusData] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [activeTripId, setActiveTripId] = useState(null);

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
  const lastStreamTime = useRef(0);

  const verificationStatus = (currentUser?.verificationStatus || 'pending').toLowerCase();
  const isApproved = verificationStatus === 'approved';
  const isRejected = verificationStatus === 'rejected';
  const isPending = !isApproved && !isRejected;

  // Time ticker for freshness
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 4000);
    return () => clearInterval(timer);
  }, []);

  // Firebase connection state
  useEffect(() => {
    const connRef = ref(rtdb, '.info/connected');
    const unsubscribe = onValue(connRef, (snap) => {
      setIsConnected(snap.val() === true);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to Assigned Bus
  useEffect(() => {
    if (!busId) return;
    const unsubBus = subscribeSingleBus(busId, (val) => {
      if (val) {
        setBusData(val);
        if (val.activeTripId) {
          setActiveTripId(val.activeTripId);
        }
      }
    });
    return () => unsubBus();
  }, [busId]);

  // Subscribe to Assigned Route
  useEffect(() => {
    if (!routeId) return;
    const unsubRoute = subscribeSingleRoute(routeId, (val) => {
      if (val) {
        setRouteData(val);
      }
    });
    return () => unsubRoute();
  }, [routeId]);

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
    if (!busId) return;
    try {
      const messagesRef = ref(rtdb, `messages/${busId}`);
      await push(messagesRef, {
        senderId: currentUser?.uid || 'driver',
        senderName: currentUser?.name || currentUser?.fullName || 'Driver',
        senderRole: 'driver',
        message: text,
        timestamp: Date.now(),
        isQuickMessage: true
      });
      setQuickNotice(`Broadcasted: "${label}"`);
      setTimeout(() => setQuickNotice(null), 3000);
    } catch (e) {
      console.warn('Quick broadcast failed:', e);
    }
  };

  // START BUS TRIP using Real Device Geolocation
  const handleStartBus = async () => {
    if (!currentUser) {
      setGpsError('Session expired. Please log in again.');
      return;
    }
    if (!busId) {
      setGpsError('No vehicle assigned. Please contact your transport administrator.');
      return;
    }
    if (!isApproved) {
      setGpsError('Your profile is pending admin approval.');
      return;
    }
    const isAlreadyLive = busData?.status === 'ON_TRIP' || busData?.status === 'LIVE';
    if (isAlreadyLive || isStarting) {
      return;
    }

    setIsStarting(true);
    setGpsError(null);
    stopTracking();

    if (!navigator.geolocation) {
      setGpsError('Browser Geolocation is not supported on this device/browser.');
      setIsStarting(false);
      return;
    }

    try {
      // 1. Acquire high-accuracy position fix
      const initialPosition = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos),
          (err) => {
            let msg = 'Could not obtain GPS position.';
            if (err.code === 1) msg = 'Location permission was denied. Please enable GPS permissions in your browser.';
            else if (err.code === 2) msg = 'GPS signal unavailable. Please ensure location services are enabled on your device.';
            else if (err.code === 3) msg = 'GPS fix acquisition timed out. Please retry.';
            reject(new Error(msg));
          },
          { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
        );
      });

      const { latitude, longitude, accuracy, speed, heading } = initialPosition.coords;
      const coords = { latitude, longitude, accuracy, speed, heading };
      setCurrentCoords(coords);

      // 2. Start Trip in Firestore & Realtime Database
      const trip = await startDriverTrip({
        busId,
        routeId: routeId || '',
        driverInfo: {
          ...currentUser,
          busNumber: busData?.busNumber || currentUser?.busNumber || 'Bus',
          busRegistrationNumber: busData?.registrationNumber || currentUser?.busRegistrationNumber || '',
          routeName: routeData?.routeName || routeData?.name || currentUser?.routeName || ''
        },
        initialCoords: coords
      });

      setActiveTripId(trip.tripId);
      lastStreamTime.current = Date.now();

      // 3. Start continuous watchPosition loop (~4 seconds throttled)
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

            // Throttle GPS updates to ~3.5-4s
            const timeSinceLast = Date.now() - lastStreamTime.current;
            if (timeSinceLast >= 3500) {
              lastStreamTime.current = Date.now();
              streamDriverGpsLocation({
                tripId: trip.tripId,
                busId,
                coords: updated
              });
            }
          }
        },
        (watchErr) => {
          console.warn('GPS Watch warning:', watchErr);
        },
        { enableHighAccuracy: true, maximumAge: 2000 }
      );
    } catch (err) {
      setGpsError(err.message || 'Failed to start GPS tracking. Please verify browser location permissions.');
    } finally {
      setIsStarting(false);
    }
  };

  const handleOpenEndConfirm = () => {
    setShowEndConfirm(true);
  };

  const handleConfirmEndTrip = async () => {
    if (isEnding) return;
    setIsEnding(true);
    setGpsError(null);

    try {
      stopTracking();
      await endDriverTrip({
        tripId: activeTripId || busData?.activeTripId,
        busId,
        driverInfo: currentUser,
        finalCoords: currentCoords
      });
      setShowEndConfirm(false);
      setActiveTripId(null);
    } catch (err) {
      console.error('Error completing trip:', err);
      setGpsError(err?.message || 'Failed to end trip.');
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

  const isLive = busData?.status === 'ON_TRIP' || busData?.status === 'LIVE';
  const isCompleted = busData?.status === 'COMPLETED';
  const isNotStarted = !isLive && !isCompleted;

  const quickMessages = [
    { label: 'Traffic Delay', text: 'Heavy traffic near Mayuri Junction / NH16. Expect 5-10 min delay.' },
    { label: 'Approaching Stop', text: 'Bus is approaching the next scheduled stop. Please be ready at pickup point!' },
    { label: 'Temporary Stop', text: 'Bus stopped temporarily at railway crossing / safety check.' },
    { label: 'Route Clear', text: 'Corridor traffic is clear. Moving smoothly on scheduled timing.' },
    { label: 'Emergency Notice', text: 'Emergency update: Route diversion via Denkada Road. All students safe.' }
  ];

  // 1. NON-APPROVED STATES
  if (isPending) {
    return (
      <main className="driver-dashboard-page">
        <div className="driver-operator-container" style={{ maxWidth: '680px', margin: '40px auto' }}>
          <section className="driver-status-card" style={{ padding: '36px', textAlign: 'center', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'inline-flex', padding: '16px', background: '#eff6ff', borderRadius: '50%', marginBottom: '16px' }}>
              <ShieldCheck size={44} color="#2563eb" />
            </div>
            <span className="section-label" style={{ color: '#2563eb', fontWeight: 700, fontSize: '0.85rem' }}>DRIVER APPLICATION</span>
            <h1 style={{ fontSize: '1.8rem', color: '#0f172a', margin: '10px 0' }}>Verification Under Review</h1>
            <p style={{ color: '#475569', fontSize: '1rem', lineHeight: '1.6', marginBottom: '24px' }}>
              Your application has been submitted to transport administration. Once your driving credentials and commercial vehicle license are reviewed and accepted, you will be assigned a corridor vehicle and route to begin live operations.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button onClick={() => navigate('/driver/onboarding')} className="btn btn-outline">
                View Application Details
              </button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (isRejected) {
    return (
      <main className="driver-dashboard-page">
        <div className="driver-operator-container" style={{ maxWidth: '680px', margin: '40px auto' }}>
          <section className="driver-status-card" style={{ padding: '36px', textAlign: 'center', background: '#ffffff', borderRadius: '16px', border: '1px solid #fee2e2', boxShadow: '0 4px 20px rgba(220,38,38,0.05)' }}>
            <div style={{ display: 'inline-flex', padding: '16px', background: '#fef2f2', borderRadius: '50%', marginBottom: '16px' }}>
              <AlertCircle size={44} color="#dc2626" />
            </div>
            <span className="section-label" style={{ color: '#dc2626', fontWeight: 700, fontSize: '0.85rem' }}>APPLICATION DECLINED</span>
            <h1 style={{ fontSize: '1.8rem', color: '#0f172a', margin: '10px 0' }}>Verification Declined</h1>
            <p style={{ color: '#475569', fontSize: '1rem', lineHeight: '1.6', marginBottom: '16px' }}>
              Transport administration reviewed your submission and declined the application:
            </p>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '24px', color: '#991b1b', fontWeight: 600 }}>
              "{currentUser?.rejectionReason || 'Documentation validity could not be confirmed.'}"
            </div>
            <button onClick={() => navigate('/driver/onboarding')} className="btn btn-primary">
              Update & Resubmit Documents
            </button>
          </section>
        </div>
      </main>
    );
  }

  // 2. APPROVED DRIVER BUT NO VEHICLE ASSIGNED
  if (!busId) {
    return (
      <main className="driver-dashboard-page">
        <div className="driver-operator-container" style={{ maxWidth: '680px', margin: '40px auto' }}>
          <section className="driver-status-card" style={{ padding: '36px', textAlign: 'center', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'inline-flex', padding: '16px', background: '#f0fdf4', borderRadius: '50%', marginBottom: '16px' }}>
              <CheckCircle2 size={44} color="#16a34a" />
            </div>
            <span className="section-label" style={{ color: '#16a34a', fontWeight: 700, fontSize: '0.85rem' }}>ACCOUNT VERIFIED</span>
            <h1 style={{ fontSize: '1.8rem', color: '#0f172a', margin: '10px 0' }}>Awaiting Vehicle & Route Allocation</h1>
            <p style={{ color: '#475569', fontSize: '1rem', lineHeight: '1.6', marginBottom: '24px' }}>
              Hello <strong>{currentUser?.name || currentUser?.fullName}</strong>! Your account has been verified by the Transport Controller. The administration is currently assigning your fleet vehicle and designated corridor route.
            </p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <div className="driver-dashboard-page">
      <div className="driver-operator-container">

        {/* 1. OPERATOR HEADER */}
        <div className="driver-auth-bar">
          <div className="auth-status-chip">
            <ShieldCheck size={16} />
            <span>VERIFIED OPERATOR</span>
            {!isConnected && <span className="offline-tag">• Offline Sync</span>}
          </div>
          <div className="auth-details">
            <strong>{currentUser?.name || currentUser?.fullName || 'Driver'}</strong>
            <span className="dot">•</span>
            <span>DL: {currentUser?.licenceNumber || 'Verified'}</span>
            <span className="dot">•</span>
            <span>{currentUser?.institutionName || 'Corridor Transport'}</span>
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

          <div className="cockpit-header">
            <div className="bus-route-group">
              <span className="bus-number-hero">{busData?.busNumber || 'Assigned Bus'}</span>
              <span className="reg-badge-hero">{busData?.registrationNumber || 'AP 35 XX'}</span>
            </div>
            <div className="route-tag-hero">
              <MapPin size={14} />
              <span>{routeData?.code || 'ROUTE'}</span>
            </div>
          </div>

          <div className="route-description-line">
            <Navigation size={14} color="#2563eb" />
            <span>{routeData?.routeName || routeData?.name || 'Corridor Scheduled Route'}</span>
          </div>

          <div className="cockpit-schedule-bar">
            <div className="schedule-item">
              <Calendar size={14} />
              <span>Reporting: <strong>{routeData?.reportingTime || '06:50 AM'}</strong></span>
            </div>
            <div className="schedule-item">
              <Clock size={14} />
              <span>Departure: <strong>{routeData?.departureTime || '07:15 AM'}</strong></span>
            </div>
            <div className="schedule-item">
              <Building2 size={14} />
              <span>Campus Arrival: <strong>{routeData?.expectedArrival || '08:15 AM'}</strong></span>
            </div>
          </div>

          <div className="cockpit-status-section">
            {isNotStarted && (
              <div className="status-box not-started">
                <div className="status-title-row">
                  <span className="status-badge-hero not-started">🅿️ TRIP READY TO START</span>
                </div>
                <p className="status-subtext">Device GPS is in standby. Tap START BUS TRIP when departing the depot/starting point.</p>
              </div>
            )}

            {isLive && (
              <div className="status-box live">
                <div className="status-title-row">
                  <span className="status-badge-hero live">
                    <span className="pulse-dot-green"></span> 🟢 LIVE ON ROUTE
                  </span>
                  <span className="gps-signal-badge">
                    <Radio size={14} color="#16a34a" /> Live GPS Streaming (~4s)
                  </span>
                </div>

                <div className="live-telemetry-grid">
                  <div className="telem-item">
                    <span className="telem-label">Latitude</span>
                    <strong>{currentCoords?.latitude ? Number(currentCoords.latitude).toFixed(4) : busData?.latitude ? Number(busData.latitude).toFixed(4) : '--'}° N</strong>
                  </div>
                  <div className="telem-item">
                    <span className="telem-label">Longitude</span>
                    <strong>{currentCoords?.longitude ? Number(currentCoords.longitude).toFixed(4) : busData?.longitude ? Number(busData.longitude).toFixed(4) : '--'}° E</strong>
                  </div>
                  <div className="telem-item">
                    <span className="telem-label">Accuracy</span>
                    <strong>±{Math.round(currentCoords?.accuracy || busData?.accuracy || 8)} m</strong>
                  </div>
                  <div className="telem-item">
                    <span className="telem-label">Last Streamed</span>
                    <strong>{getRelativeTime(busData?.lastUpdated || Date.now())}</strong>
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

          <div className="hero-action-area">
            {isNotStarted && (
              <Button
                variant="success"
                size="huge"
                loading={isStarting}
                loadingText="Acquiring Device GPS Fix..."
                disabled={isStarting}
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
              <div className="completed-summary-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <CheckCircle2 size={24} color="#059669" />
                <span>Today's trip is complete. Transport desk has been notified.</span>
              </div>
            )}
          </div>
        </div>

        {/* 4. ONE-TAP STATUS BROADCASTS */}
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
