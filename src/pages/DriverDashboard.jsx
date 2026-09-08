import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import DriverVerificationCard from '../components/DriverVerificationCard';
import CommunicationPanel from '../components/CommunicationPanel';
import { subscribeBusState, updateBusState } from '../utils/busSync';
import { ref, onValue, push } from 'firebase/database';
import { database } from '../firebase';
import { 
  Play, Square, Navigation, AlertTriangle, 
  CheckCircle2, Clock, Smartphone, MessageSquare, Radio, WifiOff, ToggleLeft, ToggleRight 
} from 'lucide-react';

// Predefined Simulated GPS Demo Route Coordinates (Urban Hyderabad School Route)
const DEMO_ROUTE_COORDS = [
  { lat: 17.4399, lng: 78.4983 }, // Stop 1: Jubilee Hills School Gate
  { lat: 17.4425, lng: 78.5012 }, // Stop 2: Road No. 36 Junction
  { lat: 17.4460, lng: 78.5050 }, // Stop 3: Metro Station Crossing
  { lat: 17.4495, lng: 78.5090 }, // Stop 4: Residential Colony Stop
  { lat: 17.4530, lng: 78.5130 }, // Stop 5: Central Park Junction
  { lat: 17.4575, lng: 78.5180 }  // Stop 6: School Campus Main Gate
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

  const watchIdRef = useRef(null);
  const demoIntervalRef = useRef(null);
  const demoStepRef = useRef(0);

  const busId = currentUser?.busId || 'BUS24';
  const driverVerification = currentUser?.verificationStatus || 'VERIFIED';
  const isVerified = driverVerification === 'VERIFIED';

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

  // Broadcast automatic quick message to message feed
  const broadcastAutoMessage = async (text) => {
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
      console.warn("Auto broadcast message failed:", e);
    }
  };

  // Start Demo Simulated Movement
  const startDemoRouteTracking = (now) => {
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
        startedAt: busData.startedAt || now,
        isDemoMode: true,
        driverId: currentUser?.driverId || 'DRV001',
        driverName: currentUser?.name || 'Rajesh Kumar'
      });
    };

    pushDemoPoint();
    demoIntervalRef.current = setInterval(pushDemoPoint, 3500); // Step every 3.5 seconds
  };

  // START BUS handler
  const handleStartBus = () => {
    if (!isVerified) {
      alert("Only verified drivers can start a trip.");
      return;
    }

    stopAllTracking();
    setGpsError(null);
    const now = Date.now();

    // If Demo Mode is active
    if (isDemoMode) {
      startDemoRouteTracking(now);
      broadcastAutoMessage("🚌 Trip Started: Bus 24 is now LIVE on route [DEMO ROUTE].");
      return;
    }

    // Real GPS Mode
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser. Switch to DEMO MODE to demonstrate.");
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    };

    const handleSuccess = (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      const updateTime = Date.now();

      updateBusState(busId, {
        status: 'LIVE',
        latitude,
        longitude,
        accuracy: Math.round(accuracy),
        lastUpdated: updateTime,
        startedAt: busData.startedAt || now,
        isDemoMode: false,
        driverId: currentUser?.driverId || 'DRV001',
        driverName: currentUser?.name || 'Rajesh Kumar'
      });
    };

    const handleError = (err) => {
      let errorMsg = "Unable to get GPS location. Switch to DEMO MODE to demonstrate route movement.";
      if (err.code === 1) {
        errorMsg = "Location access denied. Please allow location permissions or switch to DEMO MODE.";
      }
      setGpsError(errorMsg);

      updateBusState(busId, {
        status: 'LIVE',
        lastUpdated: Date.now(),
        startedAt: busData.startedAt || now,
        isDemoMode: false
      });
    };

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options);
    const id = navigator.geolocation.watchPosition(handleSuccess, handleError, options);
    watchIdRef.current = id;

    broadcastAutoMessage("🚌 Trip Started: Bus 24 is now LIVE on Route 04.");
  };

  // END TRIP handler
  const handleEndTrip = () => {
    stopAllTracking();

    const now = Date.now();
    updateBusState(busId, {
      status: 'COMPLETED',
      endedAt: now,
      lastUpdated: now
    });

    broadcastAutoMessage("🏁 Trip Completed: Today's bus trip has arrived safely at school.");
  };

  const toggleDemoMode = () => {
    const nextVal = !isDemoMode;
    setIsDemoMode(nextVal);

    if (busData.status === 'LIVE') {
      stopAllTracking();
      const now = Date.now();
      if (nextVal) {
        startDemoRouteTracking(now);
      } else if (navigator.geolocation) {
        const options = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 };
        const handleSuccess = (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          updateBusState(busId, {
            status: 'LIVE',
            latitude,
            longitude,
            accuracy: Math.round(accuracy),
            lastUpdated: Date.now(),
            isDemoMode: false
          });
        };
        const handleError = (err) => {
          setGpsError(err.code === 1 ? "Location access denied. Please allow location permissions or switch to DEMO MODE." : "Unable to get GPS location.");
        };
        navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options);
        watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, options);
      }
    }

    updateBusState(busId, {
      isDemoMode: nextVal
    });
  };

  const formatTime = (ts) => {
    if (!ts) return '--:--';
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isLive = busData.status === 'LIVE';
  const isCompleted = busData.status === 'COMPLETED';
  const isNotStarted = !isLive && !isCompleted;

  return (
    <div className="driver-dashboard-page">
      <div className="dashboard-container">
        {/* Offline Warning */}
        {!isConnected && (
          <div className="gps-error-banner offline">
            <WifiOff size={20} />
            <div className="error-text">
              <strong>⚠️ CONNECTION LOST</strong>
              <p>Location updates using local sync channel. Reconnecting to network...</p>
            </div>
          </div>
        )}

        {/* Verification Card */}
        <DriverVerificationCard driver={currentUser} busInfo={busData} />

        {/* GPS Error Warning */}
        {gpsError && (
          <div className="gps-error-banner">
            <AlertTriangle size={20} />
            <div className="error-text">
              <strong>LOCATION WARNING</strong>
              <p>{gpsError}</p>
            </div>
          </div>
        )}

        {/* Status Card & Controls */}
        <div className="card driver-status-card">
          <div className="status-header-bar">
            <div className="bus-identity">
              <h2>{busData.busNumber || 'Bus 24'}</h2>
              <span className="route-pill">{busData.routeNumber || 'Route 04'}</span>
              
              {/* GPS / DEMO Mode Switcher */}
              <button
                onClick={toggleDemoMode}
                className={`demo-mode-toggle ${isDemoMode ? 'active' : ''}`}
                title="Toggle between Real GPS and Simulated Demo Route"
              >
                {isDemoMode ? <ToggleRight size={22} color="#10b981" /> : <ToggleLeft size={22} color="#64748b" />}
                <span>{isDemoMode ? 'DEMO MODE (ACTIVE)' : 'REAL GPS MODE'}</span>
              </button>
            </div>

            <div className="status-badge-container">
              {isNotStarted && (
                <span className="status-badge not-started">
                  <span className="pulse-dot red" /> TRIP NOT STARTED
                </span>
              )}
              {isLive && (
                <span className="status-badge live">
                  <span className="pulse-dot green" /> BUS IS LIVE {isDemoMode ? '[DEMO]' : ''}
                </span>
              )}
              {isCompleted && (
                <span className="status-badge completed">
                  <CheckCircle2 size={16} /> TRIP COMPLETED
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-button-area">
            {isNotStarted && (
              <button
                onClick={handleStartBus}
                disabled={!isVerified}
                className={`btn btn-success btn-huge ${!isVerified ? 'disabled' : ''}`}
              >
                <Play size={28} fill="currentColor" />
                START BUS
              </button>
            )}

            {isLive && (
              <div className="live-controls-group">
                <div className="live-status-details">
                  <div className="live-detail-box">
                    <Clock size={16} className="text-muted" />
                    <span>Trip Started: <strong>{formatTime(busData.startedAt)}</strong></span>
                  </div>

                  <div className="live-detail-box">
                    <Radio size={16} className="text-success" />
                    <span>Tracking Mode: <strong className="text-success">{isDemoMode ? 'SIMULATED DEMO ROUTE' : 'REAL BROWSER GPS'}</strong></span>
                  </div>

                  {busData.lastUpdated && (
                    <div className="live-detail-box">
                      <Navigation size={16} className="text-muted" />
                      <span>Last Update: <strong>{formatTime(busData.lastUpdated)}</strong></span>
                    </div>
                  )}
                </div>

                <div className="live-buttons-row">
                  <button
                    onClick={() => setShowCommPanel(!showCommPanel)}
                    className="btn btn-primary"
                  >
                    <MessageSquare size={18} /> MESSAGE PARENTS
                  </button>

                  <button
                    onClick={handleEndTrip}
                    className="btn btn-danger btn-huge"
                  >
                    <Square size={20} fill="currentColor" />
                    END TRIP
                  </button>
                </div>
              </div>
            )}

            {isCompleted && (
              <div className="completed-summary-box">
                <p>Today's trip has ended cleanly.</p>
                <button
                  onClick={handleStartBus}
                  className="btn btn-outline"
                >
                  Restart New Trip
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Communication Drawer Panel */}
        {(showCommPanel || isLive) && (
          <div className="comm-panel-container">
            <CommunicationPanel
              currentUser={currentUser}
              busData={busData}
              onClose={() => setShowCommPanel(false)}
            />
          </div>
        )}

        {/* Safety Disclaimer */}
        <div className="driver-safety-banner">
          <Smartphone size={18} />
          <span>Driver Safety First: Please do not operate mobile controls or type while driving. Use one-tap quick status messages.</span>
        </div>
      </div>
    </div>
  );
}
