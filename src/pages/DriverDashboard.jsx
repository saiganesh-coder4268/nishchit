import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import DriverVerificationCard from '../components/DriverVerificationCard';
import CommunicationPanel from '../components/CommunicationPanel';
import { subscribeBusState, updateBusState } from '../utils/busSync';
import { ref, onValue, push } from 'firebase/database';
import { database } from '../firebase';
import { 
  Play, Square, WifiOff, AlertTriangle, 
  ToggleLeft, ToggleRight, MessageSquare, Zap, ShieldCheck, Clock 
} from 'lucide-react';

// Predefined Simulated GPS Demo Route Coordinates (Urban Hyderabad School Route)
const DEMO_ROUTE_COORDS = [
  { lat: 17.4399, lng: 78.4983 },
  { lat: 17.4425, lng: 78.5012 },
  { lat: 17.4460, lng: 78.5050 },
  { lat: 17.4495, lng: 78.5090 },
  { lat: 17.4530, lng: 78.5130 },
  { lat: 17.4575, lng: 78.5180 }
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
  const [isConnected, setIsConnected] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [showCommPanel, setShowCommPanel] = useState(false);
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
    demoIntervalRef.current = setInterval(pushDemoPoint, 3500);
  };

  // START BUS handler
  const handleStartBus = () => {
    if (!currentUser) {
      setGpsError("AUTHENTICATION ERROR: User session not found. Please log in again.");
      return;
    }
    if (!hasAssignedBus) {
      setGpsError("NO ASSIGNED BUS: Your driver profile does not have an assigned bus ID.");
      return;
    }
    if (!isVerified) {
      setGpsError(`UNAUTHORIZED DRIVER: Only VERIFIED drivers can start a trip.`);
      return;
    }
    if (busData.status === 'LIVE') {
      setGpsError("Trip is already active and LIVE.");
      return;
    }

    stopAllTracking();
    setGpsError(null);
    const startTime = Date.now();

    if (isDemoMode) {
      startDemoRouteTracking(startTime);
      sendQuickBroadcast("Trip Started", `🚌 Trip Started: ${busData.busNumber || 'Bus 24'} is now LIVE on route.`);
      return;
    }

    if (!navigator.geolocation) {
      setGpsError("Browser GPS not supported. Switch to DEMO MODE.");
      return;
    }

    const options = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 };

    const handleSuccess = (position) => {
      if (!position || !position.coords) return;
      const { latitude, longitude, accuracy } = position.coords;
      const nLat = Number(latitude);
      const nLng = Number(longitude);

      if (isNaN(nLat) || isNaN(nLng)) return;

      updateBusState(busId, {
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
    };

    const handleError = (err) => {
      let errorMsg = "Unable to fetch GPS. Switch to DEMO MODE to demonstrate.";
      if (err.code === 1) errorMsg = "Location access denied. Please allow GPS permissions.";
      setGpsError(errorMsg);

      updateBusState(busId, {
        status: 'LIVE',
        lastUpdated: Date.now(),
        startedAt: busData.startedAt || startTime,
        isDemoMode: false
      });
    };

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options);
    watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, options);

    sendQuickBroadcast("Trip Started", `🚌 Trip Started: ${busData.busNumber || 'Bus 24'} is now LIVE on route.`);
  };

  // END TRIP handler
  const handleEndTrip = () => {
    if (busData.status !== 'LIVE') return;
    stopAllTracking();
    const endTime = Date.now();

    updateBusState(busId, {
      status: 'COMPLETED',
      endedAt: endTime,
      lastUpdated: endTime,
      latitude: busData.latitude || 17.4399,
      longitude: busData.longitude || 78.4983
    });

    sendQuickBroadcast("Trip Completed", `🏁 Trip Completed: Today's ${busData.busNumber || 'Bus 24'} trip has ended safely.`);
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

  const quickMessages = [
    { label: "Traffic delay", text: "Heavy traffic near main junction. Expect slight delay." },
    { label: "Running late", text: "Bus is running about 10 minutes late today." },
    { label: "Temporary stop", text: "Bus stopped temporarily for safety check." },
    { label: "Please be ready", text: "Bus is approaching upcoming stop. Please be ready!" },
    { label: "Emergency", text: "Emergency update: Vehicle check in progress. All students safe." }
  ];

  return (
    <div className="driver-dashboard-page">
      <div className="dashboard-container">

        {/* Offline Banner */}
        {!isConnected && (
          <div className="offline-banner">
            <WifiOff size={18} />
            <span>Connection temporarily offline. Local sync active.</span>
          </div>
        )}

        {/* GPS Error Alert */}
        {gpsError && (
          <div className="gps-error-banner">
            <AlertTriangle size={18} />
            <span>{gpsError}</span>
          </div>
        )}

        {/* Driver Verification Status */}
        <DriverVerificationCard driver={currentUser} busInfo={busData} />

        {/* Main Operational Control Panel */}
        <div className="driver-control-card">
          <div className="control-header">
            <div className="bus-route-title">
              <h2>{busData.busNumber || 'Bus 24'}</h2>
              <span className="route-pill">{busData.routeNumber || 'Route 04'}</span>
            </div>

            <button
              onClick={toggleDemoMode}
              className={`demo-toggle-btn ${isDemoMode ? 'active' : ''}`}
            >
              {isDemoMode ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
              <span>{isDemoMode ? 'DEMO ROUTE' : 'REAL GPS'}</span>
            </button>
          </div>

          <div className="state-summary-row">
            {isNotStarted && (
              <div className="state-info">
                <span className="status-badge verified">
                  <ShieldCheck size={16} /> VERIFIED
                </span>
                <span className="state-sub">BUS READY</span>
              </div>
            )}

            {isLive && (
              <div className="state-info">
                <span className="status-badge live">
                  <span className="pulse-dot" /> 🟢 LIVE
                </span>
                <span className="state-sub">Location sharing active</span>
                <span className="last-update-text">
                  <Clock size={14} /> Last update: {getRelativeTime(busData.lastUpdated)}
                </span>
              </div>
            )}

            {isCompleted && (
              <div className="state-info">
                <span className="status-badge completed">
                  TRIP COMPLETED
                </span>
                <span className="state-sub">Trip ended safely</span>
              </div>
            )}
          </div>

          {/* Primary Action Button (START BUS / END TRIP) */}
          <div className="primary-action-area">
            {isNotStarted && (
              <button
                onClick={handleStartBus}
                disabled={!isVerified || !hasAssignedBus}
                className="btn btn-success btn-huge-driver"
              >
                <Play size={28} fill="currentColor" />
                START BUS
              </button>
            )}

            {isLive && (
              <button
                onClick={handleEndTrip}
                className="btn btn-danger btn-huge-driver"
              >
                <Square size={24} fill="currentColor" />
                END TRIP
              </button>
            )}

            {isCompleted && (
              <button
                onClick={handleStartBus}
                className="btn btn-outline btn-huge-driver"
              >
                <Play size={24} />
                RESTART NEW TRIP
              </button>
            )}
          </div>
        </div>

        {/* Quick Communication Actions (Driver Safety First) */}
        <div className="driver-quick-comm-section">
          <div className="quick-comm-header">
            <Zap size={18} className="text-accent" />
            <h3>Quick Status Announcements (One-Tap)</h3>
          </div>

          <div className="quick-buttons-grid">
            {quickMessages.map((item, idx) => (
              <button
                key={idx}
                onClick={() => sendQuickBroadcast(item.label, item.text)}
                className="quick-action-btn"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Full Message Log Drawer Toggle */}
        <div className="driver-drawer-toggle">
          <button
            onClick={() => setShowCommPanel(!showCommPanel)}
            className="btn btn-outline btn-full"
          >
            <MessageSquare size={18} />
            {showCommPanel ? 'Hide Message History' : 'Open Message Log'}
          </button>
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
      </div>
    </div>
  );
}

