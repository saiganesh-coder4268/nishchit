import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import DriverVerificationCard from '../components/DriverVerificationCard';
import CommunicationPanel from '../components/CommunicationPanel';
import { Button, StatusIndicator, ConfirmDialog, QuickMessageButton } from '../components/ui';
import { subscribeBusState, updateBusState } from '../utils/busSync';
import { getDriverTrackingStatus } from '../utils/busStatus';
import { ref, push } from 'firebase/database';
import { database } from '../firebase';
import { 
  Play, Square, AlertTriangle, 
  ToggleLeft, ToggleRight, MessageSquare, Zap, Clock, Radio, Shield
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
  const [isDemoMode, setIsDemoMode] = useState(false);
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

  // START BUS handler with deterministic timeout Promise
  const handleStartBus = async () => {
    if (!currentUser) {
      setGpsError("User session not found. Please log in again.");
      return;
    }
    if (!hasAssignedBus) {
      setGpsError("No bus assigned. Please contact institution administration.");
      return;
    }
    if (!isVerified) {
      setGpsError("Driver account pending verification.");
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
        await sendQuickBroadcast("Trip Started", `Trip Started: ${busData.busNumber || 'Bus 24'} is now on route.`);
        setIsStarting(false);
        return;
      }

      if (!navigator.geolocation) {
        setGpsError("GPS not supported on this device. Please switch to Demo GPS mode below.");
        setIsStarting(false);
        return;
      }

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
          let errorMsg = "Unable to fetch GPS. Switch to Demo GPS mode below.";
          if (err.code === 1) errorMsg = "Location access denied. Please allow location permissions.";
          else if (err.code === 2) errorMsg = "Location unavailable. Check device GPS signal.";
          else if (err.code === 3) errorMsg = "GPS request timed out. Retrying or switch to Demo GPS.";
          reject(new Error(errorMsg));
        };

        navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options);
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("GPS fix acquisition timed out after 8 seconds. Please check location settings or switch to Demo GPS.")), 8500)
      );

      await Promise.race([acquireInitialFix, timeoutPromise]);
      await sendQuickBroadcast("Trip Started", `Trip Started: ${busData.busNumber || 'Bus 24'} is now on route.`);
    } catch (err) {
      setGpsError(err.message || "Failed to start trip. Try again or use Demo GPS mode.");
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

      await sendQuickBroadcast("Trip Completed", `Trip Completed: Today's ${busData.busNumber || 'Bus 24'} trip has ended safely.`);
      setShowEndConfirm(false);
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
    <div className="driver-operator-page">
      <div className="operator-container">

        {/* GPS Error Alert */}
        {gpsError && (
          <div className="gps-error-banner">
            <AlertTriangle size={18} />
            <span>{gpsError}</span>
          </div>
        )}

        {/* Header: Assigned Bus & Route Identity */}
        <div className="operator-header">
          <div className="bus-assignment">
            <h1 className="operator-bus-title">{busData.busNumber || 'BUS 24'}</h1>
            <span className="operator-route-badge">{busData.routeNumber || 'ROUTE 04'}</span>
          </div>
          <div className="operator-driver-badge">
            <Shield size={14} />
            <span>Driver: <strong>{currentUser?.name || 'Rajesh Kumar'}</strong></span>
          </div>
        </div>

        {/* 1. MAIN OPERATION AREA (Focal Point Hero) */}
        <div className={`operator-hero-card ${isLive ? 'state-live' : isCompleted ? 'state-completed' : 'state-ready'}`}>
          
          <div className="operator-status-header">
            <StatusIndicator 
              status={isStarting ? "PENDING" : isLive ? "LIVE" : isCompleted ? "COMPLETED" : "NOT_STARTED"} 
              label={trackingInfo.label}
            />
            {isLive && (
              <span className="live-pulse-indicator">
                <Radio size={14} /> Location sharing active
              </span>
            )}
          </div>

          <p className="operator-status-subtext">{trackingInfo.subtext}</p>

          {isLive && busData.lastUpdated && (
            <p className="operator-timestamp">
              <Clock size={14} /> Updated {getRelativeTime(busData.lastUpdated)}
            </p>
          )}

          {/* PRIMARY ACTION BUTTON: START BUS / END TRIP */}
          <div className="operator-primary-action">
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
              >
                END TRIP
              </Button>
            )}

            {isCompleted && (
              <div className="completed-summary-box">
                <p className="completed-title">Trip Completed</p>
                <p className="completed-sub">Today's bus trip ended successfully. Active location sharing is turned off.</p>
              </div>
            )}
          </div>
        </div>

        {/* 2. COMMUNICATION AREA (Quick Parent Announcements) */}
        <div className="operator-comm-section">
          <div className="comm-header">
            <Zap size={18} className="text-accent" />
            <div>
              <h3>Parent Announcements</h3>
              <p className="comm-subtext">Tap once to broadcast quick status to waiting parents.</p>
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

          <div className="drawer-toggle-wrapper">
            <Button
              variant="outline"
              fullWidth
              onClick={() => setShowCommPanel(!showCommPanel)}
              icon={MessageSquare}
            >
              {showCommPanel ? 'Hide Broadcast Log' : 'Open Broadcast Log'}
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
        </div>

        {/* 3. SUPPORTING INFORMATION AREA (Bottom of Dashboard) */}
        <div className="operator-supporting-section">
          <div className="supporting-section-title">
            <span>Supporting Transport Information</span>
          </div>

          {/* Verification Details (Subordinate context, at bottom) */}
          <DriverVerificationCard driver={currentUser} busInfo={busData} />

          {/* Subordinate Demo Mode Toggle */}
          <div className="demo-control-bar">
            <span className="demo-label">Testing / Demo GPS Option:</span>
            <button
              type="button"
              onClick={toggleDemoMode}
              className={`demo-toggle-btn ${isDemoMode ? 'active' : ''}`}
            >
              {isDemoMode ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
              <span>{isDemoMode ? 'Demo GPS Active' : 'Real Device GPS'}</span>
            </button>
          </div>
        </div>

        {/* End Trip Confirmation Modal */}
        <ConfirmDialog
          isOpen={showEndConfirm}
          title="End Today's Bus Trip?"
          message="Are you sure you want to end today's trip? Live location sharing will turn off."
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
