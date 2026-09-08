import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import DriverVerificationCard from '../components/DriverVerificationCard';
import { ref, onValue, update } from 'firebase/database';
import { database } from '../firebase';
import { 
  Bus, MapPin, Play, Square, Navigation, AlertTriangle, 
  CheckCircle2, Clock, Smartphone, MessageSquare, Radio, ShieldCheck 
} from 'lucide-react';

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
  const [isWatchActive, setIsWatchActive] = useState(false);
  const watchIdRef = useRef(null);

  const busId = currentUser?.busId || 'BUS24';
  const driverVerification = currentUser?.verificationStatus || 'VERIFIED';
  const isVerified = driverVerification === 'VERIFIED';

  // Realtime Firebase DB Listener for Bus status
  useEffect(() => {
    const busRef = ref(database, `buses/${busId}`);
    const unsubscribe = onValue(busRef, (snapshot) => {
      if (snapshot.exists()) {
        setBusData(snapshot.val());
      }
    }, (error) => {
      console.error("Firebase read error:", error);
    });

    return () => unsubscribe();
  }, [busId]);

  // Clean up GPS watch on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // START BUS handler (Milestone 6 & 7)
  const handleStartBus = () => {
    if (!isVerified) {
      alert("Only verified drivers can start a trip.");
      return;
    }

    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser.");
      return;
    }

    // Start browser geolocation tracking
    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    };

    const handleSuccess = (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      const now = Date.now();

      // Store in Firebase Realtime DB
      update(ref(database, `buses/${busId}`), {
        status: 'LIVE',
        latitude,
        longitude,
        accuracy: Math.round(accuracy),
        lastUpdated: now,
        startedAt: busData.startedAt || now,
        driverId: currentUser?.driverId || 'DRV001',
        driverName: currentUser?.name || 'Rajesh Kumar'
      }).catch(err => console.error("Firebase update failed:", err));

      setIsWatchActive(true);
    };

    const handleError = (err) => {
      console.warn("GPS Error:", err);
      let errorMsg = "Unable to get current location.";
      if (err.code === 1) {
        errorMsg = "Location access was denied. Please enable location permissions in browser.";
      } else if (err.code === 2) {
        errorMsg = "Position unavailable. Please check GPS signal.";
      } else if (err.code === 3) {
        errorMsg = "Location request timed out.";
      }
      setGpsError(errorMsg);

      // Still set trip to LIVE with fallback position so demo can run if GPS fails indoors
      const now = Date.now();
      update(ref(database, `buses/${busId}`), {
        status: 'LIVE',
        lastUpdated: now,
        startedAt: busData.startedAt || now
      }).catch(e => console.error(e));
      setIsWatchActive(true);
    };

    // First snapshot
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options);

    // Watch position continuous updates
    const id = navigator.geolocation.watchPosition(handleSuccess, handleError, options);
    watchIdRef.current = id;
  };

  // END TRIP handler
  const handleEndTrip = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsWatchActive(false);

    const now = Date.now();
    update(ref(database, `buses/${busId}`), {
      status: 'COMPLETED',
      endedAt: now,
      lastUpdated: now
    }).catch(err => console.error("Firebase end trip failed:", err));
  };

  // Format time display
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
        {/* Verification Card Banner */}
        <DriverVerificationCard driver={currentUser} busInfo={busData} />

        {/* GPS Permission Warning */}
        {gpsError && (
          <div className="gps-error-banner">
            <AlertTriangle size={20} />
            <div className="error-text">
              <strong>LOCATION ACCESS WARNING</strong>
              <p>{gpsError}</p>
            </div>
          </div>
        )}

        {/* Main Status & Action Controls */}
        <div className="card driver-status-card">
          <div className="status-header-bar">
            <div className="bus-identity">
              <h2>{busData.busNumber || 'Bus 24'}</h2>
              <span className="route-pill">{busData.routeNumber || 'Route 04'}</span>
            </div>

            <div className="status-badge-container">
              {isNotStarted && (
                <span className="status-badge not-started">
                  <span className="pulse-dot red" /> TRIP NOT STARTED
                </span>
              )}
              {isLive && (
                <span className="status-badge live">
                  <span className="pulse-dot green" /> BUS IS LIVE
                </span>
              )}
              {isCompleted && (
                <span className="status-badge completed">
                  <CheckCircle2 size={16} /> TRIP COMPLETED
                </span>
              )}
            </div>
          </div>

          {/* Primary Action Button (START BUS / END TRIP) */}
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
                    <span>Location Sharing: <strong className="text-success">ACTIVE</strong></span>
                  </div>

                  {busData.lastUpdated && (
                    <div className="live-detail-box">
                      <Navigation size={16} className="text-muted" />
                      <span>Last Update: <strong>{formatTime(busData.lastUpdated)}</strong></span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleEndTrip}
                  className="btn btn-danger btn-huge"
                >
                  <Square size={24} fill="currentColor" />
                  END TRIP
                </button>
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

        {/* Safety Disclaimer Banner */}
        <div className="driver-safety-banner">
          <Smartphone size={18} />
          <span>Driver Safety First: Please do not operate mobile controls or type while driving.</span>
        </div>
      </div>
    </div>
  );
}
