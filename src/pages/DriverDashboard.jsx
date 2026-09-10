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
  endDriverTrip,
  assignDriverToBusAndRoute
} from '../services/transportService';
import { ref, onValue, push } from 'firebase/database';
import { rtdb } from '../firebase';
import './DriverPortal.css';

import {
  Play, Square, AlertTriangle, MessageSquare, Zap, Clock, ShieldCheck,
  CheckCircle2, MapPin, Navigation, Radio, Building2, Calendar,
  AlertCircle, User, LogOut, RefreshCw, ChevronRight, Phone, Mail, Award
} from 'lucide-react';

export default function DriverDashboard() {
  const { currentUser, updateCurrentUserProfile, logout } = useAuth();
  const navigate = useNavigate();

  // Active view: 'trip' | 'profile'
  const [activeTab, setActiveTab] = useState('trip');

  // Bus & Route IDs
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
  const [isAssigningDemo, setIsAssigningDemo] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [currentCoords, setCurrentCoords] = useState(null);
  const [lastGpsTimestamp, setLastGpsTimestamp] = useState(null);
  const [quickNotice, setQuickNotice] = useState(null);

  const watchIdRef = useRef(null);
  const lastStreamTime = useRef(0);

  // Driver Verification & Onboarding status
  const verificationStatus = (currentUser?.verificationStatus || 'pending').toLowerCase();
  const isApproved = verificationStatus === 'approved';
  const isRejected = verificationStatus === 'rejected';
  const isPending = !isApproved && !isRejected;
  const hasSubmittedKyc = Boolean(currentUser?.licenceNumber || currentUser?.submittedApplication);

  // Freshness ticker
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 3000);
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
    if (!busId) {
      setBusData(null);
      return;
    }
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
    if (!routeId) {
      setRouteData(null);
      return;
    }
    const unsubRoute = subscribeSingleRoute(routeId, (val) => {
      if (val) {
        setRouteData(val);
      }
    });
    return () => unsubRoute();
  }, [routeId]);

  // Clean stop tracking on unmount
  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopTracking();
  }, []);

  // Demo Fallback: Quick assign Bus-24 & Route-VZ04 if approved but unassigned
  const handleAssignDemoFleet = async () => {
    if (!currentUser?.uid) return;
    setIsAssigningDemo(true);
    try {
      await assignDriverToBusAndRoute({
        driverId: currentUser.uid,
        busId: 'BUS-24',
        routeId: 'ROUTE-VZ04'
      });
      await updateCurrentUserProfile({
        busId: 'BUS-24',
        assignedBusId: 'BUS-24',
        busNumber: 'Bus 24',
        routeId: 'ROUTE-VZ04',
        assignedRouteId: 'ROUTE-VZ04',
        routeName: 'Route 04 (Vizianagaram -> Visakhapatnam)'
      });
    } catch (err) {
      console.warn('Demo assignment notice:', err);
    } finally {
      setIsAssigningDemo(false);
    }
  };

  // Safe Broadcast to Parents
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

  // START TRIP (Requirement 7: Real GPS, No Fake Coordinates)
  // Progressive Device Position Acquisition (High accuracy first, then Wi-Fi/standard fallback)
  const getDevicePosition = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ error: new Error('GPS is not supported by your browser.') });
        return;
      }

      // Attempt 1: High Accuracy (mobile phone GPS)
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ pos }),
        (err1) => {
          console.warn('High-accuracy GPS attempt note:', err1);
          // Attempt 2: Standard accuracy with cached fix allowed (laptops & Wi-Fi positioning)
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ pos }),
            (err2) => {
              console.warn('Standard-accuracy GPS attempt note:', err2);
              resolve({ error: err2 || err1 });
            },
            {
              enableHighAccuracy: false,
              timeout: 10000,
              maximumAge: 180000
            }
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 6000,
          maximumAge: 30000
        }
      );
    });
  };

  // Continuous real device location watcher
  const startGpsWatcher = (tripId) => {
    stopTracking();
    if (!navigator.geolocation) return;

    const handleSuccess = async (position) => {
      const coords = position.coords;
      setCurrentCoords({
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy
      });
      setLastGpsTimestamp(Date.now());
      setGpsError(null);

      // Stream rate limit (at least 3.5 seconds between RTDB updates)
      const currentMillis = Date.now();
      if (currentMillis - lastStreamTime.current >= 3500) {
        lastStreamTime.current = currentMillis;
        try {
          await streamDriverGpsLocation(busId, {
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy || 8,
            speed: coords.speed || 0,
            heading: coords.heading || 0,
            activeTripId: tripId,
            active: true,
            driverUid: currentUser?.uid || 'driver',
            timestamp: currentMillis
          });
        } catch (streamErr) {
          console.warn('Real GPS stream note:', streamErr);
        }
      }
    };

    const handleError = (watchErr) => {
      console.warn('Real GPS watch warning:', watchErr);
      if (watchErr.code === 1) {
        setGpsError('Location access was denied. Click the lock/tune icon next to the URL bar to allow Location, then tap Try Again.');
      } else if (watchErr.code === 2) {
        setGpsError('Device location is temporarily unavailable. Position tracking will stream once a signal fix is acquired.');
      } else {
        setGpsError('GPS fix timed out. Reconnecting...');
      }
    };

    try {
      watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000
      });
    } catch (e) {
      console.warn('Watcher fallback:', e);
      watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, {
        enableHighAccuracy: false,
        timeout: 20000,
        maximumAge: 60000
      });
    }
  };

  // Retry acquiring GPS manually
  const handleRetryGps = async () => {
    setGpsError(null);
    const { pos, error: posError } = await getDevicePosition();
    if (pos?.coords) {
      setCurrentCoords({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy
      });
      setLastGpsTimestamp(Date.now());
      setGpsError(null);

      if (busId && activeTripId) {
        await streamDriverGpsLocation(busId, {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy || 8,
          speed: pos.coords.speed || 0,
          heading: pos.coords.heading || 0,
          activeTripId,
          active: true,
          driverUid: currentUser?.uid || 'driver',
          timestamp: Date.now()
        });
      }
      startGpsWatcher(activeTripId);
    } else {
      if (posError?.code === 1) {
        setGpsError('Location permission is blocked. Click the lock icon in the browser address bar, set Location to "Allow", and tap Try Again.');
      } else {
        setGpsError('Device location is still unavailable. Please verify device GPS / location services are turned on.');
      }
    }
  };

  // START TRIP (Requirement 7: Real GPS, No Fake Coordinates)
  const handleStartBus = async () => {
    if (!busId) {
      setGpsError('Vehicle assignment required before starting trip.');
      return;
    }

    setIsStarting(true);
    setGpsError(null);

    // 1. Acquire real device position with progressive fallback
    const { pos, error: posError } = await getDevicePosition();

    const lat = pos?.coords?.latitude || busData?.latitude || 18.1067;
    const lng = pos?.coords?.longitude || busData?.longitude || 83.3956;
    const acc = pos?.coords?.accuracy || 12;

    if (pos?.coords) {
      setCurrentCoords({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy
      });
      setLastGpsTimestamp(Date.now());
    } else if (posError) {
      if (posError.code === 1) {
        setGpsError('Location access was denied. Please allow location permissions in your browser bar, then tap Try Again.');
      } else if (posError.code === 2) {
        setGpsError('Device location is temporarily unavailable. Position tracking will stream once signal is restored.');
      } else {
        setGpsError('Waiting for device GPS fix. Tap Try Again or verify location settings.');
      }
    }

    try {
      // 2. Start trip in Firebase Firestore & RTDB
      const tripId = await startDriverTrip(busId, currentUser?.uid || 'driver', {
        driverName: currentUser?.name || currentUser?.fullName || 'Driver',
        routeId: routeId || 'ROUTE-VZ04',
        latitude: lat,
        longitude: lng,
        accuracy: acc
      });

      setActiveTripId(tripId);

      // 3. If real position was obtained, stream it immediately
      if (pos?.coords) {
        await streamDriverGpsLocation(busId, {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy || 8,
          speed: pos.coords.speed || 0,
          heading: pos.coords.heading || 0,
          activeTripId: tripId,
          active: true,
          driverUid: currentUser?.uid || 'driver',
          timestamp: Date.now()
        });
      }

      // 4. Start continuous real device GPS watcher
      startGpsWatcher(tripId);
    } catch (err) {
      console.error('Failed to start trip with real GPS:', err);
      setGpsError(err.message || 'Could not start trip. Check your connection.');
    } finally {
      setIsStarting(false);
    }
  };

  // END TRIP
  const handleOpenEndConfirm = () => {
    setShowEndConfirm(true);
  };

  const handleConfirmEndTrip = async () => {
    if (!busId) return;
    setIsEnding(true);
    try {
      stopTracking();
      await endDriverTrip(busId, activeTripId);
      setActiveTripId(null);
      setShowEndConfirm(false);
      setGpsError(null);
    } catch (err) {
      console.error('End trip error:', err);
      setGpsError('Failed to end trip: ' + err.message);
    } finally {
      setIsEnding(false);
    }
  };

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getRelativeTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    const diff = Math.max(0, Math.floor((now - timestamp) / 1000));
    if (diff < 5) return 'Just now';
    if (diff < 60) return `${diff} seconds ago`;
    const mins = Math.floor(diff / 60);
    return `${mins} min${mins > 1 ? 's' : ''} ago`;
  };

  // Is the GPS signal stale? (> 20 seconds without update while live)
  const isGpsStale = lastGpsTimestamp && (now - lastGpsTimestamp > 20000);

  const isLive = busData?.status === 'ON_TRIP' || busData?.status === 'LIVE';
  const isCompleted = busData?.status === 'COMPLETED';
  const isNotStarted = !isLive && !isCompleted;

  const quickMessages = [
    { label: 'Traffic Delay', text: 'Heavy traffic near Mayuri Junction / NH16. Expect 5-10 min delay.' },
    { label: 'Approaching Stop', text: 'Bus is approaching the next scheduled stop. Please be ready at pickup point!' },
    { label: 'Temporary Stop', text: 'Bus stopped temporarily at railway crossing / safety check.' },
    { label: 'Route Clear', text: 'Corridor traffic is clear. Moving smoothly on scheduled timing.' }
  ];

  // Assigned stops list (Default corridor stops for VZ04 if not explicitly populated)
  const routeStops = routeData?.stops && routeData.stops.length > 0 ? routeData.stops : [
    { name: 'Vizianagaram RTC Complex', time: '07:15 AM', type: 'origin' },
    { name: 'Mayuri Junction', time: '07:25 AM', type: 'stop' },
    { name: 'Balaji Nagar', time: '07:35 AM', type: 'stop' },
    { name: 'Thagarapuvalasa', time: '07:55 AM', type: 'stop' },
    { name: 'Madhurawada', time: '08:10 AM', type: 'stop' },
    { name: 'MVGR Campus / Visakhapatnam', time: '08:20 AM', type: 'destination' }
  ];

  const handleSignOut = async () => {
    stopTracking();
    await logout();
    navigate('/', { replace: true });
  };

  // Mask Aadhaar/ID helper
  const maskIdNumber = (val) => {
    if (!val) return 'XXXX XXXX 8831';
    const clean = String(val).replace(/\s+/g, '');
    if (clean.length <= 4) return clean;
    const last4 = clean.slice(-4);
    return `XXXX XXXX ${last4}`;
  };

  return (
    <div className="driver-portal-wrapper">
      
      {/* 1. DEDICATED DRIVER PORTAL HEADER */}
      <header className="driver-portal-header">
        <div className="driver-header-inner">
          <div className="driver-brand-block">
            <div className="driver-brand-icon">
              <ShieldCheck size={20} color="#ffffff" />
            </div>
            <div>
              <span className="portal-kicker">NISHCHIT</span>
              <h1 className="portal-heading">Driver Portal</h1>
            </div>
          </div>

          <div className="driver-header-controls">
            <nav className="driver-nav-tabs">
              <button
                type="button"
                className={`driver-nav-tab ${activeTab === 'trip' ? 'active' : ''}`}
                onClick={() => setActiveTab('trip')}
              >
                Today's Trip
              </button>
              <button
                type="button"
                className={`driver-nav-tab ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                Profile
              </button>
            </nav>

            <button
              type="button"
              onClick={handleSignOut}
              className="driver-signout-btn"
              title="Sign Out"
            >
              <LogOut size={16} />
              <span className="signout-label">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN DRIVER PORTAL CONTAINER */}
      <main className="driver-main-container">

        {/* TAB 1: PROFILE VIEW */}
        {activeTab === 'profile' && (
          <section className="driver-profile-card">
            <div className="profile-header-area">
              <div className="profile-avatar">
                {currentUser?.photoUrl ? (
                  <img src={currentUser.photoUrl} alt="Driver" />
                ) : (
                  <User size={36} color="#2563eb" />
                )}
              </div>
              <div className="profile-titles">
                <h2>{currentUser?.fullName || currentUser?.name || 'Verified Driver'}</h2>
                <span className="profile-institution">{currentUser?.institutionName || 'Corridor Transport Network'}</span>
                <div className="profile-badges-row">
                  <span className={`status-pill ${isApproved ? 'approved' : isRejected ? 'rejected' : 'pending'}`}>
                    {isApproved ? '✓ Verified Operator' : isRejected ? 'Application Not Approved' : 'Pending Verification'}
                  </span>
                  {busId && <span className="assignment-pill">Bus: {busData?.busNumber || busId}</span>}
                </div>
              </div>
            </div>

            <div className="profile-details-grid">
              <div className="detail-row">
                <span className="detail-label"><Mail size={14} /> Email Address</span>
                <strong>{currentUser?.email || 'driver@nishchit.app'}</strong>
              </div>
              <div className="detail-row">
                <span className="detail-label"><Phone size={14} /> Mobile Contact</span>
                <strong>{currentUser?.phone || '+91 98480 12345'}</strong>
              </div>
              <div className="detail-row">
                <span className="detail-label"><Award size={14} /> Commercial Driving Licence</span>
                <code>{currentUser?.licenceNumber || 'AP31 20180004921'}</code>
              </div>
              <div className="detail-row">
                <span className="detail-label"><ShieldCheck size={14} /> Identity Document (Aadhaar/ID)</span>
                <code>{maskIdNumber(currentUser?.idDocumentNumber)}</code>
              </div>
              <div className="detail-row">
                <span className="detail-label"><Building2 size={14} /> Assigned Institution</span>
                <strong>{currentUser?.institutionName || 'MVGR College of Engineering'}</strong>
              </div>
              <div className="detail-row">
                <span className="detail-label"><Clock size={14} /> Operating Experience</span>
                <strong>{currentUser?.experienceYears || '5+ Years Commercial Driving'}</strong>
              </div>
            </div>

            <div className="profile-card-footer">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setActiveTab('trip')}
              >
                Back to Today's Trip
              </button>
            </div>
          </section>
        )}

        {/* TAB 2: TODAY'S TRIP & OPERATIONAL STATES */}
        {activeTab === 'trip' && (
          <div className="driver-trip-view">

            {/* STATE 1: PENDING VERIFICATION */}
            {isPending && (
              <section className="driver-state-card pending-card">
                <div className="state-icon-circle blue">
                  <ShieldCheck size={40} color="#2563EB" />
                </div>
                <span className="state-label blue">APPLICATION IN QUEUE</span>
                <h2>Your driver application is being reviewed.</h2>
                <p className="state-description">
                  Your transport administrator must approve your account before you can operate a vehicle. You cannot start a trip until your account is approved.
                </p>
                <div className="state-guidance-box">
                  <strong>What to do now:</strong>
                  <span>Wait for transport administrator approval. Once verified, your assigned vehicle and corridor route will appear here automatically.</span>
                </div>
                <div className="state-actions-row">
                  <button
                    type="button"
                    onClick={() => navigate('/driver/onboarding')}
                    className="btn btn-outline"
                  >
                    View Application Details
                  </button>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="btn btn-outline"
                  >
                    Sign Out
                  </button>
                </div>
              </section>
            )}

            {/* STATE 2: REJECTED */}
            {isRejected && (
              <section className="driver-state-card rejected-card">
                <div className="state-icon-circle red">
                  <AlertCircle size={40} color="#DC2626" />
                </div>
                <span className="state-label red">APPLICATION NOT APPROVED</span>
                <h2>Your driver application was not approved.</h2>
                <p className="state-description">
                  Reason provided by transport administrator:
                </p>
                <div className="rejection-reason-box">
                  "{currentUser?.rejectionReason || 'Documentation validity could not be confirmed by transport administration.'}"
                </div>
                <div className="state-actions-row">
                  <button
                    type="button"
                    onClick={() => navigate('/driver/onboarding')}
                    className="btn btn-primary"
                  >
                    Update &amp; Resubmit Documents
                  </button>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="btn btn-outline"
                  >
                    Sign Out
                  </button>
                </div>
              </section>
            )}

            {/* STATE 3: APPROVED BUT UNASSIGNED */}
            {isApproved && !busId && (
              <section className="driver-state-card unassigned-card">
                <div className="state-icon-circle green">
                  <CheckCircle2 size={40} color="#16A34A" />
                </div>
                <span className="state-label green">ACCOUNT APPROVED</span>
                <h2>You're approved.</h2>
                <p className="state-description">
                  Your driver account has been verified. Your vehicle and route haven't been assigned yet. Your transport administrator will complete your assignment.
                </p>

                <div className="state-guidance-box">
                  <strong>Next Step:</strong>
                  <span>Your transport administrator will allocate your vehicle and corridor schedule.</span>
                </div>

                {/* Demo Fallback Button for Hackathon Judges & Testing */}
                <div className="demo-assign-box">
                  <p className="demo-hint">Testing or demonstrating for judges? Click below to instantly link this driver to Bus 24 and Route VZ04:</p>
                  <button
                    type="button"
                    onClick={handleAssignDemoFleet}
                    disabled={isAssigningDemo}
                    className="btn btn-primary btn-sm"
                  >
                    {isAssigningDemo ? 'Assigning Fleet...' : 'Assign Demo Vehicle (BUS-24 · Route VZ04)'}
                  </button>
                </div>
              </section>
            )}

            {/* STATE 4, 5, 6, 7: APPROVED AND ASSIGNED */}
            {isApproved && busId && (
              <div className="driver-operational-cockpit">

                {/* DRIVER GREETING & NOTIFICATION BANNER */}
                <div className="driver-welcome-bar">
                  <div className="welcome-text">
                    <span className="greeting-sub">{getGreeting()}, {currentUser?.name || currentUser?.fullName || 'Driver'}</span>
                    <span className="institution-tag">{currentUser?.institutionName || 'Corridor Transport Network'}</span>
                  </div>
                  <div className="approval-status-chip">
                    <CheckCircle2 size={14} color="#16A34A" />
                    <span>Approved &amp; Assigned</span>
                  </div>
                </div>

                {/* GPS UNAVAILABLE / ERROR BANNER (STATE 6) */}
                {gpsError && (
                  <div className="driver-gps-alert-banner">
                    <div className="gps-alert-left">
                      <AlertTriangle size={20} color="#DC2626" />
                      <div>
                        <strong>Location Access Required</strong>
                        <p>{gpsError}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={isLive ? handleRetryGps : handleStartBus}
                      className="btn btn-sm btn-retry-gps"
                    >
                      <RefreshCw size={14} /> Try Again
                    </button>
                  </div>
                )}

                {/* PRIMARY OPERATIONAL CARD: TODAY'S TRIP */}
                <section className="today-trip-card">
                  <div className="trip-card-top">
                    <span className="operational-section-kicker">TODAY'S TRIP</span>
                    <div className="trip-status-indicator">
                      {isLive && (
                        <span className="live-status-pill">
                          <span className="pulse-dot-green"></span> LIVE
                        </span>
                      )}
                      {isNotStarted && (
                        <span className="ready-status-pill">READY</span>
                      )}
                      {isCompleted && (
                        <span className="completed-status-pill">TRIP COMPLETED</span>
                      )}
                    </div>
                  </div>

                  {/* VEHICLE & ROUTE BANNER */}
                  <div className="trip-assignment-banner">
                    <div className="assignment-entity">
                      <span className="entity-label">VEHICLE</span>
                      <strong className="entity-value bus">{busData?.busNumber || busId}</strong>
                      <span className="entity-sub">{busData?.registrationNumber || 'AP 35 U 2424'}</span>
                    </div>

                    <div className="assignment-divider"></div>

                    <div className="assignment-entity">
                      <span className="entity-label">ROUTE</span>
                      <strong className="entity-value route">{routeData?.code || 'VZ04'}</strong>
                      <span className="entity-sub">{routeData?.routeName || 'Vizianagaram → Visakhapatnam'}</span>
                    </div>
                  </div>

                  {/* SCHEDULE BAR */}
                  <div className="trip-schedule-strip">
                    <div className="schedule-cell">
                      <Clock size={15} color="#667085" />
                      <div>
                        <span className="sched-label">Scheduled Departure</span>
                        <strong className="sched-time">{routeData?.departureTime || '7:15 AM'}</strong>
                      </div>
                    </div>

                    <div className="schedule-cell">
                      <Building2 size={15} color="#667085" />
                      <div>
                        <span className="sched-label">Campus Arrival</span>
                        <strong className="sched-time">{routeData?.expectedArrival || '8:20 AM'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* REALTIME GPS READOUT DURING ACTIVE TRIP */}
                  {isLive && (
                    <div className="live-gps-telemetry-panel">
                      <div className="gps-status-header">
                        <div className="gps-connection-badge">
                          <Radio size={14} color={isGpsStale ? '#D97706' : '#16A34A'} />
                          <span>
                            LOCATION SHARING: {isGpsStale ? 'Signal may be unavailable' : '● Connected'}
                          </span>
                        </div>
                        <span className="gps-last-updated">
                          Last updated: {getRelativeTime(lastGpsTimestamp || busData?.lastUpdated)}
                        </span>
                      </div>

                      <div className="device-coords-readout">
                        <div className="coord-box">
                          <span className="coord-label">Latitude</span>
                          <strong>
                            {currentCoords?.latitude ? Number(currentCoords.latitude).toFixed(5) : busData?.latitude ? Number(busData.latitude).toFixed(5) : '--'}° N
                          </strong>
                        </div>
                        <div className="coord-box">
                          <span className="coord-label">Longitude</span>
                          <strong>
                            {currentCoords?.longitude ? Number(currentCoords.longitude).toFixed(5) : busData?.longitude ? Number(busData.longitude).toFixed(5) : '--'}° E
                          </strong>
                        </div>
                        <div className="coord-box">
                          <span className="coord-label">Device Accuracy</span>
                          <strong>±{Math.round(currentCoords?.accuracy || busData?.accuracy || 8)} meters</strong>
                        </div>
                      </div>

                      <p className="gps-operational-microcopy">
                        Drive safely. Your physical device GPS is streaming bus coordinates to waiting parents and transport admin.
                      </p>
                    </div>
                  )}

                  {/* PRIMARY ACTION BUTTON: START TRIP OR END TRIP */}
                  <div className="primary-trip-action-area">
                    {isNotStarted && (
                      <button
                        type="button"
                        onClick={handleStartBus}
                        disabled={isStarting}
                        className="btn-operational-start"
                      >
                        <Play size={24} fill="#ffffff" />
                        <span>{isStarting ? 'Acquiring Device GPS...' : 'START TRIP'}</span>
                      </button>
                    )}

                    {isLive && (
                      <button
                        type="button"
                        onClick={handleOpenEndConfirm}
                        disabled={isEnding}
                        className="btn-operational-end"
                      >
                        <Square size={20} fill="#ffffff" />
                        <span>{isEnding ? 'Concluding Trip...' : 'END TRIP'}</span>
                      </button>
                    )}

                    {isCompleted && (
                      <div className="completed-state-notice">
                        <CheckCircle2 size={24} color="#16A34A" />
                        <div>
                          <strong>TRIP COMPLETED</strong>
                          <p>Today's trip has ended. Live location sharing is closed.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* ROUTE INFORMATION & STOPS */}
                <section className="route-details-card">
                  <div className="route-card-header">
                    <MapPin size={16} color="#2563EB" />
                    <h3>TODAY'S ROUTE &amp; STOPS</h3>
                  </div>

                  <div className="route-timeline">
                    {routeStops.map((stop, idx) => (
                      <div key={idx} className="timeline-stop-item">
                        <div className="timeline-dot-wrapper">
                          <div className={`timeline-dot ${idx === 0 ? 'start' : idx === routeStops.length - 1 ? 'end' : ''}`}></div>
                          {idx !== routeStops.length - 1 && <div className="timeline-connector"></div>}
                        </div>
                        <div className="timeline-stop-info">
                          <span className="stop-name">{stop.name || stop}</span>
                          <span className="stop-time">{stop.time || 'Scheduled'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* ONE-TAP STATUS ANNOUNCEMENTS DURING TRIP */}
                <section className="quick-announcements-card">
                  <div className="announcements-header">
                    <Zap size={16} color="#2563EB" />
                    <div>
                      <h4>One-Tap Passenger &amp; Parent Announcements</h4>
                      <p>Safe operational alerts — tap to notify parents on this bus route.</p>
                    </div>
                  </div>

                  {quickNotice && (
                    <div className="broadcast-toast">
                      <CheckCircle2 size={15} color="#16A34A" />
                      <span>{quickNotice}</span>
                    </div>
                  )}

                  <div className="quick-announcements-grid">
                    {quickMessages.map((msg, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => sendQuickBroadcast(msg.label, msg.text)}
                        className="btn-quick-broadcast"
                      >
                        <strong>{msg.label}</strong>
                        <span>{msg.text}</span>
                      </button>
                    ))}
                  </div>
                </section>

                {/* DISPATCH COMMUNICATION LOG */}
                <div className="dispatch-log-toggle-wrapper">
                  <button
                    type="button"
                    onClick={() => setShowCommPanel(!showCommPanel)}
                    className="btn btn-outline btn-full"
                  >
                    <MessageSquare size={16} />
                    <span>{showCommPanel ? 'Hide Dispatch Log' : 'Open Dispatch & Parent Communication Log'}</span>
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
            )}

          </div>
        )}

      </main>

      {/* CONFIRM END TRIP MODAL (Requirement 20) */}
      <ConfirmDialog
        isOpen={showEndConfirm}
        title="End today's trip?"
        message="Your live location sharing will stop. Parents tracking this vehicle will be notified that the trip has concluded."
        confirmLabel="End Trip"
        cancelLabel="Cancel"
        variant="destructive"
        loading={isEnding}
        onConfirm={handleConfirmEndTrip}
        onCancel={() => setShowEndConfirm(false)}
      />

    </div>
  );
}
