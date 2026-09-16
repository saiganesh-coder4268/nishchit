import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DriverShell from '../components/shells/DriverShell';
import BusMap from '../components/BusMap';
import CommunicationPanel from '../components/CommunicationPanel';
import { ConfirmDialog } from '../components/ui';
import {
  subscribeSingleBus,
  subscribeSingleRoute,
  startDriverTrip,
  streamDriverGpsLocation,
  endDriverTrip,
  subscribeJobPostings,
  applyForJob,
  subscribeDriverInvitations,
  respondToDriverInvitation,
  subscribeJobApplications,
  subscribeTripHistory,
  saveDriverProfile
} from '../services/transportService';
import { ref, onValue, push } from 'firebase/database';
import { rtdb } from '../firebase';
import './DriverPortal.css';

import {
  Play, Square, AlertTriangle, MessageSquare, Zap, Clock, ShieldCheck,
  CheckCircle2, MapPin, Radio, Building2, User, RefreshCw, ChevronRight, Phone, Mail, Award,
  Users, AlertCircle, Bus, Sparkles, Send, Check, X, Search, Star, FileText
} from 'lucide-react';

export default function DriverDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Active view: 'trip' | 'jobs' | 'applications' | 'profile' | 'history'
  const [activeTab, setActiveTab] = useState('trip');

  // Bus & Route IDs (Strictly from authenticated user assignment)
  const busId = currentUser?.busId || currentUser?.assignedBusId || null;
  const routeId = currentUser?.routeId || currentUser?.assignedRouteId || busData?.routeId || busData?.assignedRouteId || null;
  const institutionId = currentUser?.institutionId || currentUser?.instituteId || 'INST-AU';
  const institutionName = currentUser?.institutionName || 'Andhra University';

  const [busData, setBusData] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [activeTripId, setActiveTripId] = useState(null);

  const [gpsError, setGpsError] = useState(null);
  const [isConnected, setIsConnected] = useState(true);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [currentCoords, setCurrentCoords] = useState(null);
  const [lastGpsTimestamp, setLastGpsTimestamp] = useState(null);
  const [quickNotice, setQuickNotice] = useState(null);

  // Marketplace & Applications State
  const [jobPostings, setJobPostings] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [applications, setApplications] = useState([]);
  const [tripHistoryList, setTripHistoryList] = useState([]);
  const [jobSearchQuery, setJobSearchQuery] = useState('');
  const [selectedJobToApply, setSelectedJobToApply] = useState(null);
  const [applicationExpectedSalary, setApplicationExpectedSalary] = useState('₹28,000 / month');
  const [applicationNote, setApplicationNote] = useState('');
  const [driverAvailability, setDriverAvailability] = useState(currentUser?.availability || 'AVAILABLE');

  const watchIdRef = useRef(null);
  const lastStreamTime = useRef(0);

  // Driver Verification & Onboarding status
  const verificationStatus = (currentUser?.verificationStatus || currentUser?.status || 'pending').toLowerCase();
  const isApproved = verificationStatus === 'approved' || verificationStatus === 'verified' || verificationStatus === 'active';
  const isRejected = verificationStatus === 'rejected';
  const isPending = !isApproved && !isRejected;
  const hasValidAssignment = isApproved && Boolean(busId) && Boolean(routeId);

  // Freshness ticker
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 3000);
    return () => clearInterval(timer);
  }, []);

  // Firebase connection monitor
  useEffect(() => {
    const connRef = ref(rtdb, '.info/connected');
    const unsubscribe = onValue(connRef, (snap) => {
      setIsConnected(snap.val() === true);
    });
    return () => unsubscribe();
  }, []);

  // 1. Subscribe to Bus document in Firestore
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

  // 2. Subscribe to Route document in Firestore
  useEffect(() => {
    if (!routeId) {
      setRouteData(null);
      return;
    }
    const unsubRoute = subscribeSingleRoute(routeId, (val) => {
      if (val) setRouteData(val);
    });
    return () => unsubRoute();
  }, [routeId]);

  // 3. Subscribe to Job Marketplace & Applications
  useEffect(() => {
    const unsubJobs = subscribeJobPostings((jobs) => {
      setJobPostings(jobs);
    });

    const driverId = currentUser?.uid || currentUser?.id || '';
    const unsubInvs = subscribeDriverInvitations(driverId, (invs) => {
      setInvitations(invs);
    });

    const unsubApps = subscribeJobApplications((apps) => {
      const myApps = apps.filter(a => a.driverId === driverId);
      setApplications(myApps);
    });

    const unsubHistory = subscribeTripHistory((history) => {
      setTripHistoryList(history);
    });

    return () => {
      unsubJobs();
      unsubInvs();
      unsubApps();
      unsubHistory();
    };
  }, [currentUser?.uid, currentUser?.id]);

  // Clean up GPS watcher on component unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  // Start Hardware Device GPS Streaming via watchPosition()
  const startGpsTracking = (tripId) => {
    if (!navigator.geolocation) {
      setGpsError('Hardware Geolocation is not supported by this browser.');
      return;
    }

    setGpsError(null);

    const options = {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000
    };

    const successHandler = async (pos) => {
      const { latitude, longitude, speed, heading, accuracy } = pos.coords;
      const timestamp = pos.timestamp || Date.now();

      setCurrentCoords({ latitude, longitude, speed: speed || 0, heading: heading || 0, accuracy });
      setLastGpsTimestamp(timestamp);
      setGpsError(null);

      // Stream to Firebase RTDB every ~3 seconds
      const nowMs = Date.now();
      if (nowMs - lastStreamTime.current > 3000) {
        lastStreamTime.current = nowMs;
        try {
          await streamDriverGpsLocation(busId, {
            tripId,
            latitude,
            longitude,
            speed: speed ? Math.round(speed * 3.6) : 0, // km/h
            heading: heading || 0,
            accuracy: Math.round(accuracy || 5),
            timestamp,
            driverId: currentUser?.uid || '',
            driverName: currentUser?.fullName || currentUser?.name || 'Verified Driver',
            driverPhone: currentUser?.phone || '',
            busId,
            institutionId: currentUser?.institutionId || currentUser?.instituteId || busData?.institutionId || 'INST-AU',
            institutionName: currentUser?.institutionName || busData?.institutionName || 'Andhra University'
          });
        } catch (err) {
          console.error('GPS telemetry sync error:', err);
        }
      }
    };

    const errorHandler = (err) => {
      console.warn('Geolocation watch error:', err.message);
      if (err.code === 1) {
        setGpsError('Location access was denied. Please allow location permissions in your browser settings.');
      } else if (err.code === 2) {
        setGpsError('GPS signal temporarily unavailable. Seeking satellite fix...');
      } else {
        setGpsError('GPS acquisition timeout. Ensuring device antenna has clear sky view.');
      }
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      successHandler,
      errorHandler,
      options
    );
  };

  // Stop Geolocation Watcher
  const stopGpsTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  // Handle Start Trip Action: Requires valid assignment and real hardware GPS fix
  const handleStartTrip = async () => {
    if (!hasValidAssignment) {
      setGpsError('Cannot start trip: Driver profile must be approved with an assigned vehicle and route.');
      return;
    }

    setIsStarting(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError('Live location unavailable: Browser geolocation is not supported on this device.');
      setIsStarting(false);
      return;
    }

    try {
      // Prompt and obtain genuine hardware GPS fix
      const initialPos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 0
        });
      });

      const { latitude, longitude, speed, heading, accuracy } = initialPos.coords;
      const startingCoords = {
        latitude,
        longitude,
        speed: speed ? Math.round(speed * 3.6) : 0,
        heading: heading || 0,
        accuracy: Math.round(accuracy || 5)
      };

      const institutionId = currentUser?.institutionId || currentUser?.instituteId || busData?.institutionId || 'INST-AU';
      const institutionName = currentUser?.institutionName || busData?.institutionName || 'Andhra University';

      const tripId = await startDriverTrip({
        busId,
        routeId,
        institutionId,
        institutionName,
        driverInfo: {
          uid: currentUser?.uid || '',
          driverId: currentUser?.uid || '',
          name: currentUser?.fullName || currentUser?.name || 'Verified Driver',
          phone: currentUser?.phone || '',
          busNumber: busData?.busNumber || busId,
          busRegistrationNumber: busData?.registrationNumber || busData?.plateNumber || '',
          routeName: routeData?.name || routeData?.routeName || 'Assigned Route',
          institutionId,
          institutionName
        },
        initialCoords: startingCoords
      });

      setActiveTripId(tripId);
      setCurrentCoords(startingCoords);
      setLastGpsTimestamp(Date.now());

      // Start continuous real hardware GPS streaming
      startGpsTracking(tripId);

      setQuickNotice('Trip started. Live hardware GPS telemetry streaming.');
      setTimeout(() => setQuickNotice(null), 4000);
    } catch (err) {
      console.error('Failed to start trip with hardware GPS:', err);
      let msg = 'Live location unavailable: Please grant browser GPS location permissions to start your trip.';
      if (err.code === 1) {
        msg = 'Live location unavailable: GPS permission was denied in your browser settings.';
      } else if (err.code === 2) {
        msg = 'Live location unavailable: Hardware GPS signal unavailable. Please ensure sky view.';
      } else if (err.code === 3) {
        msg = 'Live location unavailable: GPS acquisition timed out. Please try again.';
      }
      setGpsError(msg);
    } finally {
      setIsStarting(false);
    }
  };

  // Handle End Trip Confirmation
  const handleEndTripConfirm = async () => {
    setIsEnding(true);
    setShowEndConfirm(false);

    try {
      stopGpsTracking();

      const tripId = activeTripId || busData?.activeTripId;
      await endDriverTrip(busId, tripId, {
        uid: currentUser?.uid,
        name: currentUser?.fullName || currentUser?.name || 'Verified Driver',
        phone: currentUser?.phone || '',
        institutionId: currentUser?.institutionId || currentUser?.instituteId || busData?.institutionId || 'INST-AU'
      });

      setActiveTripId(null);
      setCurrentCoords(null);
      setLastGpsTimestamp(null);

      setQuickNotice('Trip completed. Vehicle status marked as ready.');
      setTimeout(() => setQuickNotice(null), 4000);
    } catch (err) {
      console.error('Failed to end trip:', err);
      alert('Failed to end trip: ' + err.message);
    } finally {
      setIsEnding(false);
    }
  };

  // Quick broadcast message
  const handleSendBroadcast = async (text) => {
    if (!busId) return;
    try {
      const msgRef = ref(rtdb, `messages/${busId}`);
      await push(msgRef, {
        senderId: currentUser?.uid || 'driver',
        senderName: currentUser?.fullName || currentUser?.name || 'Driver',
        senderRole: 'driver',
        message: text,
        timestamp: Date.now()
      });
      setQuickNotice(`Broadcast sent: "${text}"`);
      setTimeout(() => setQuickNotice(null), 3000);
    } catch (err) {
      console.error('Broadcast failed:', err);
    }
  };

  // Apply for Job
  const handleApplyForJob = async (e) => {
    e.preventDefault();
    if (!selectedJobToApply) return;
    try {
      const driverId = currentUser?.uid || currentUser?.id || '';
      await applyForJob(driverId, selectedJobToApply.id, {
        driverName: currentUser?.fullName || currentUser?.name || 'Authorized Driver',
        driverPhone: currentUser?.phone || '',
        experienceYears: currentUser?.experienceYears || '5',
        vehicleCategories: ['School Bus', 'Heavy Passenger Vehicle'],
        jobTitle: selectedJobToApply.title,
        institutionName: selectedJobToApply.institutionName || 'Authorized Institution',
        expectedSalary: applicationExpectedSalary,
        note: applicationNote || 'I am a platform verified driver with commercial school transport experience.'
      });
      setQuickNotice(`Application submitted to ${selectedJobToApply.institutionName || 'Institution'}!`);
      setSelectedJobToApply(null);
      setApplicationNote('');
      setActiveTab('applications');
      setTimeout(() => setQuickNotice(null), 4000);
    } catch (err) {
      alert(`Application failed: ${err.message}`);
    }
  };

  // Respond to Invitation
  const handleAcceptInvitation = async (inv) => {
    try {
      const driverId = currentUser?.uid || currentUser?.id || '';
      await respondToDriverInvitation(inv.id, 'ACCEPTED', {
        driverId,
        institutionId: inv.institutionId,
        institutionName: inv.institutionName
      });
      setQuickNotice(`Invitation accepted! You are now connected with ${inv.institutionName}.`);
      setTimeout(() => setQuickNotice(null), 4000);
    } catch (err) {
      alert(`Error accepting invitation: ${err.message}`);
    }
  };

  const handleDeclineInvitation = async (inv) => {
    try {
      await respondToDriverInvitation(inv.id, 'DECLINED');
      setQuickNotice('Invitation declined.');
      setTimeout(() => setQuickNotice(null), 3000);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleToggleAvailability = async () => {
    const next = driverAvailability === 'AVAILABLE' ? 'BUSY' : 'AVAILABLE';
    setDriverAvailability(next);
    const driverId = currentUser?.uid || currentUser?.id || '';
    await saveDriverProfile(driverId, { availability: next });
    setQuickNotice(`Availability updated to ${next === 'AVAILABLE' ? '🟢 Available for Hire' : '🔴 Busy / On Contract'}`);
    setTimeout(() => setQuickNotice(null), 3000);
  };

  const isTripActive = Boolean(activeTripId || busData?.status === 'ON_TRIP');

  // GPS Freshness assessment
  const getGpsFreshnessStatus = () => {
    if (!isTripActive) return { label: 'Standby', class: 'neutral' };
    if (!lastGpsTimestamp) return { label: 'Acquiring GPS...', class: 'amber' };
    const ageSeconds = Math.round((now - lastGpsTimestamp) / 1000);
    if (ageSeconds <= 15) return { label: 'Live Streaming', class: 'green' };
    if (ageSeconds <= 60) return { label: `Stale (${ageSeconds}s ago)`, class: 'amber' };
    return { label: 'Signal Lost (>1m)', class: 'red' };
  };

  const gpsStatus = getGpsFreshnessStatus();
  const stopsList = routeData?.stops || [];

  const pendingInvitationsCount = useMemo(() => {
    return invitations.filter(i => (i.status || 'PENDING') === 'PENDING').length;
  }, [invitations]);

  return (
    <DriverShell
      activeTab={activeTab}
      onTabChange={setActiveTab}
      isGpsActive={isTripActive && gpsStatus.class === 'green'}
      unreadCount={pendingInvitationsCount}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* ===================================================================
            DRIVER VERIFICATION STATUS BANNER (SPEC SECTION 6)
            =================================================================== */}
        <div style={{
          background: isApproved ? '#ECFDF5' : isPending ? '#FFFBEB' : '#FEF2F2',
          border: `1px solid ${isApproved ? '#A7F3D0' : isPending ? '#FDE68A' : '#FECACA'}`,
          borderRadius: '12px',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: isApproved ? '#10B981' : isPending ? '#F59E0B' : '#EF4444',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {isApproved ? <ShieldCheck size={20} /> : <Clock size={20} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong style={{ fontSize: '0.94rem', color: isApproved ? '#065F46' : isPending ? '#92400E' : '#991B1B' }}>
                  {isApproved ? '🟢 Platform Verified Driver' : '🟠 Profile Under Platform Compliance Review'}
                </strong>
                <span style={{ fontSize: '0.74rem', background: '#FFFFFF', padding: '2px 8px', borderRadius: '999px', border: '1px solid rgba(0,0,0,0.1)', fontWeight: 700 }}>
                  Rating: ⭐ {currentUser?.rating || '4.8'}
                </span>
              </div>
              <span style={{ fontSize: '0.78rem', color: isApproved ? '#047857' : '#B45309' }}>
                {isApproved
                  ? 'Commercial HPV License, Identity Verification, and Experience verified by Nishchit Platform.'
                  : 'Your driving documents are submitted and awaiting operator approval.'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleToggleAvailability}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                background: driverAvailability === 'AVAILABLE' ? '#10B981' : '#64748B',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {driverAvailability === 'AVAILABLE' ? '🟢 Available for Hire' : '🔴 On Duty / Busy'}
            </button>
          </div>
        </div>

        {/* Quick Notification Toast */}
        {quickNotice && (
          <div style={{
            background: '#0F172A',
            color: '#FFFFFF',
            padding: '10px 18px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.86rem',
            fontWeight: 600
          }}>
            <CheckCircle2 size={16} color="#10B981" />
            <span>{quickNotice}</span>
          </div>
        )}

        {/* ===================================================================
            TAB 1: TODAY'S DUTY / COCKPIT (SPEC SECTION 21)
            =================================================================== */}
        {activeTab === 'trip' && (
          <div>
            {!hasValidAssignment ? (
              /* UNASSIGNED OR PENDING APPROVAL STATE */
              <div style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                padding: '40px 24px',
                textAlign: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: isApproved ? '#EFF6FF' : '#FFFBEB',
                  color: isApproved ? '#2563EB' : '#D97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto'
                }}>
                  {isApproved ? <Bus size={32} /> : <Clock size={32} />}
                </div>

                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 6px 0', color: '#0F172A' }}>
                  {isApproved
                    ? 'Awaiting Bus & Route Duty Assignment'
                    : 'Driver Verification in Progress'}
                </h2>
                <p style={{ maxWidth: '540px', margin: '0 auto 24px auto', fontSize: '0.88rem', color: '#64748B', lineHeight: '1.5' }}>
                  {isApproved
                    ? `Your driver profile is Platform Verified for ${currentUser?.institutionName || 'Andhra University'}. The transport department is currently assigning your operating vehicle and route corridor.`
                    : `Your driver profile and commercial documents have been submitted to ${currentUser?.institutionName || 'Andhra University'} and are currently being reviewed by the transport administrator.`}
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setActiveTab('jobs')}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      background: '#2563EB',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '0.86rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Sparkles size={16} />
                    <span>Browse Job Opportunities ({jobPostings.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('applications')}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      background: '#F1F5F9',
                      color: '#0F172A',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.86rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Mail size={16} />
                    <span>View Received Invitations ({invitations.length})</span>
                  </button>
                </div>
              </div>
            ) : (
              /* ACTIVE ASSIGNED COCKPIT */
              <div className="driver-workspace-grid-layout">
                {/* Main Column */}
                <div className="driver-main-cockpit-column">
                  
                  {/* Trip Card */}
                  <div className="driver-card current-trip-cockpit-card">
                    <div className="trip-card-header-row">
                      <div className="trip-title-cluster">
                        <span className="route-eyebrow">Operating Corridor</span>
                        <h2>{routeData?.name || routeData?.routeName || 'Assigned Institutional Corridor'}</h2>
                      </div>

                      <div className="trip-status-pill-wrap">
                        <span className={`status-pill ${isTripActive ? 'live' : 'scheduled'}`}>
                          {isTripActive && <span className="live-pulsing-dot" />}
                          {isTripActive ? '● TRIP LIVE' : 'Ready to Depart'}
                        </span>
                      </div>
                    </div>

                    {/* Next Stop Highlight Box */}
                    <div className="next-stop-highlight-box">
                      <div className="next-stop-info">
                        <span className="next-stop-label">Next Corridor Stop:</span>
                        <strong className="next-stop-name">
                          {stopsList.length > 0 ? (isTripActive ? (stopsList[1]?.name || stopsList[0].name) : stopsList[0].name) : 'Campus Terminal'}
                        </strong>
                      </div>
                      <div className="next-stop-eta">
                        <span>Status:</span>
                        <strong>{isTripActive ? 'Live In Transit' : 'Scheduled'}</strong>
                      </div>
                    </div>

                    {/* GPS Error Alert */}
                    {gpsError && (
                      <div style={{
                        margin: '12px 0',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        background: '#FEF2F2',
                        border: '1px solid #FECACA',
                        color: '#991B1B',
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <AlertCircle size={18} style={{ flexShrink: 0 }} />
                        <span>{gpsError}</span>
                      </div>
                    )}

                    {/* Large Start/End Trip Action Button */}
                    <div className="cockpit-action-controls-row">
                      {!isTripActive ? (
                        <button
                          type="button"
                          onClick={handleStartTrip}
                          disabled={isStarting}
                          className="btn-cockpit btn-start-trip"
                          style={{ cursor: 'pointer' }}
                        >
                          <Play size={24} fill="#FFFFFF" />
                          <span>{isStarting ? 'Initiating Telemetry...' : 'START TRIP'}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowEndConfirm(true)}
                          disabled={isEnding}
                          className="btn-cockpit btn-end-trip"
                          style={{ cursor: 'pointer' }}
                        >
                          <Square size={22} fill="#FFFFFF" />
                          <span>{isEnding ? 'Completing Trip...' : 'END TRIP'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* GPS Telemetry HUD */}
                  <div className="driver-card gps-telemetry-status-card">
                    <div className="card-header-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Radio size={18} color="#2563EB" />
                        <h3>Live GPS Telemetry (Driver Device)</h3>
                      </div>
                      <span className={`gps-status-tag ${gpsStatus.class}`}>
                        {gpsStatus.label}
                      </span>
                    </div>

                    <div className="telemetry-metrics-grid">
                      <div className="telemetry-metric-item">
                        <span className="metric-label">Vehicle Speed</span>
                        <strong className="metric-val">{currentCoords?.speed != null ? `${currentCoords.speed} km/h` : (isTripActive ? '0 km/h' : 'Standby')}</strong>
                      </div>

                      <div className="telemetry-metric-item">
                        <span className="metric-label">Accuracy</span>
                        <strong className="metric-val">{currentCoords?.accuracy != null ? `±${currentCoords.accuracy}m` : (isTripActive ? 'Acquiring...' : '--')}</strong>
                      </div>

                      <div className="telemetry-metric-item">
                        <span className="metric-label">Coordinates</span>
                        <strong className="metric-val">
                          {currentCoords
                            ? `${currentCoords.latitude.toFixed(4)}°N, ${currentCoords.longitude.toFixed(4)}°E`
                            : (isTripActive ? 'Acquiring satellite lock...' : 'Awaiting trip start')}
                        </strong>
                      </div>

                      <div className="telemetry-metric-item">
                        <span className="metric-label">Cloud Sync</span>
                        <strong className="metric-val green">{isConnected ? (isTripActive ? 'RTDB Streaming' : 'RTDB Connected') : 'Connecting...'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Map */}
                  <div className="driver-card driver-map-viewport-card">
                    <div className="card-header-row">
                      <h3>Route Corridor &amp; Realtime Position</h3>
                      <div className="map-badge-tag">
                        <MapPin size={13} /> {stopsList.length} Stops
                      </div>
                    </div>

                    <div className="driver-map-container" style={{ height: '320px', position: 'relative' }}>
                      <BusMap
                        busData={{
                          ...busData,
                          latitude: currentCoords?.latitude || busData?.latitude || 17.7290,
                          longitude: currentCoords?.longitude || busData?.longitude || 83.3180,
                          speed: currentCoords?.speed || 0,
                          heading: currentCoords?.heading || 0,
                          status: isTripActive ? 'LIVE' : 'AVAILABLE',
                          busNumber: busData?.busNumber || busId,
                          driverName: currentUser?.fullName || currentUser?.name || 'Verified Driver'
                        }}
                        routePath={routeData?.polyline}
                        stops={stopsList}
                        busNumber={busData?.busNumber || busId}
                        isLive={isTripActive}
                      />
                    </div>
                  </div>

                </div>

                {/* Right Side Column */}
                <div className="driver-side-info-column">
                  
                  {/* Vehicle Identity */}
                  <div className="driver-side-card vehicle-identity-card">
                    <div className="card-header-row">
                      <h3>Assigned Vehicle</h3>
                      <CheckCircle2 size={16} color="#16A34A" />
                    </div>

                    <div className="vehicle-profile-row">
                      <div className="vehicle-bus-icon-wrap">
                        <Bus size={32} color="#2563EB" />
                      </div>
                      <div className="vehicle-info-block">
                        <h4>Bus {busData?.busNumber || busId}</h4>
                        <code>{busData?.registrationNumber || busData?.plateNumber || '--'}</code>
                        <span className="campus-badge">
                          {currentUser?.institutionName || busData?.institutionName || 'Andhra University'}
                        </span>
                      </div>
                    </div>

                    <div className="vehicle-meta-strip">
                      <div className="meta-col">
                        <span className="col-label">Seating</span>
                        <strong className="col-val">{busData?.capacity ? `${busData.capacity} Seats` : 'Standard'}</strong>
                      </div>
                      <div className="meta-col">
                        <span className="col-label">Departure</span>
                        <strong className="col-val">{routeData?.departureTime || 'Scheduled'}</strong>
                      </div>
                      <div className="meta-col">
                        <span className="col-label">Students</span>
                        <strong className="col-val green">{busData?.assignedStudentsCount ? `${busData.assignedStudentsCount} Assigned` : 'Configured'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Stops Checklist */}
                  <div className="driver-side-card stops-checklist-card">
                    <div className="card-header-row">
                      <h3>Today's Stops Checklist</h3>
                      <span className="stops-count-tag">{stopsList.length} Stops</span>
                    </div>

                    <div className="stops-checklist-list">
                      {stopsList.map((stop, idx) => (
                        <div key={idx} className={`checklist-stop-item ${idx === 0 && isTripActive ? 'completed' : ''}`}>
                          <div className="checklist-time">{stop.time || '07:00 AM'}</div>
                          <div className="checklist-bullet-line">
                            <div className="bullet-dot" />
                            {idx < stopsList.length - 1 && <div className="connector-line" />}
                          </div>
                          <div className="checklist-details">
                            <strong>{stop.name || stop.stopName}</strong>
                            <span className={`status-pill-small ${idx === 0 && isTripActive ? 'done' : 'upcoming'}`}>
                              {idx === 0 && isTripActive ? 'Passed' : 'Upcoming'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Broadcasts */}
                  <div className="driver-side-card quick-broadcasts-card">
                    <div className="card-header-row">
                      <h3>Safety Broadcasts</h3>
                      <MessageSquare size={16} color="#2563EB" />
                    </div>
                    <p className="broadcast-note">Tap to notify parents instantly on this route.</p>

                    <div className="broadcast-buttons-list">
                      <button
                        type="button"
                        onClick={() => handleSendBroadcast('Departing on schedule from Benz Circle.')}
                        className="broadcast-preset-btn"
                      >
                        Departed First Stop
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendBroadcast('Running ~10 min behind schedule due to highway roadwork.')}
                        className="broadcast-preset-btn amber"
                      >
                        Traffic Delay (10m)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendBroadcast('Bus is arriving at Campus entrance.')}
                        className="broadcast-preset-btn blue"
                      >
                        Approaching Destination
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================================================================
            TAB 2: FIND OPPORTUNITIES / MARKETPLACE (SPEC SECTION 16)
            =================================================================== */}
        {activeTab === 'jobs' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 4px 0', color: '#0F172A' }}>
                  Educational Transport Opportunities
                </h2>
                <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748B' }}>
                  Verified driver job requirements posted directly by schools and colleges.
                </p>
              </div>

              {/* Search Bar */}
              <div style={{ position: 'relative', width: '280px' }}>
                <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search positions or areas..."
                  value={jobSearchQuery}
                  onChange={(e) => setJobSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.84rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
              {jobPostings.map(job => (
                <div key={job.id} style={{
                  background: '#FFFFFF',
                  borderRadius: '14px',
                  border: '1px solid #E2E8F0',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Building2 size={13} />
                        <span>{job.institutionName || 'ABC International School'}</span>
                      </span>
                      <strong style={{ fontSize: '1.05rem', color: '#0F172A', display: 'block', marginTop: '2px' }}>
                        {job.title}
                      </strong>
                      <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                        📍 {job.location || 'Vijayawada'} • {job.jobType || 'Full-time'}
                      </span>
                    </div>

                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: '#ECFDF5',
                      color: '#059669',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <ShieldCheck size={13} />
                      <span>Verified Institution</span>
                    </span>
                  </div>

                  <div style={{
                    padding: '10px 12px',
                    background: '#F8FAFC',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.82rem'
                  }}>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.72rem' }}>Compensation</span>
                      <strong style={{ color: '#0F172A' }}>{job.salaryRange}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.72rem' }}>Experience</span>
                      <strong style={{ color: '#0F172A' }}>{job.experienceRequired}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.72rem' }}>Vehicle</span>
                      <strong style={{ color: '#0F172A' }}>{job.vehicleType || 'Bus'}</strong>
                    </div>
                  </div>

                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569', lineHeight: '1.4' }}>
                    {job.description}
                  </p>

                  <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '12px', marginTop: 'auto' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedJobToApply(job);
                        setApplicationExpectedSalary(job.salaryRange || '₹28,000 / month');
                      }}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        background: '#2563EB',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Send size={14} />
                      <span>Apply for Position</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 3: MY APPLICATIONS & INVITATIONS (SPEC SECTION 17 & 18)
            =================================================================== */}
        {activeTab === 'applications' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Section 1: Direct Institutional Invitations */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Mail size={20} color="#2563EB" />
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                  Direct Invitations from Institutions ({invitations.length})
                </h2>
              </div>

              {invitations.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', background: '#FFFFFF', borderRadius: '12px', border: '1px dashed #CBD5E1', color: '#64748B', fontSize: '0.84rem' }}>
                  No pending invitations. When colleges or schools find your verified profile, their direct offers will appear here.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '14px' }}>
                  {invitations.map(inv => (
                    <div key={inv.id} style={{
                      background: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1.5px solid #BFDBFE',
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      boxShadow: '0 4px 12px rgba(37,99,235,0.05)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div>
                          <strong style={{ fontSize: '1rem', color: '#0F172A', display: 'block' }}>
                            {inv.institutionName || 'ABC International School'}
                          </strong>
                          <span style={{ fontSize: '0.82rem', color: '#2563EB', fontWeight: 700 }}>
                            {inv.jobTitle || 'School Bus Driver'}
                          </span>
                        </div>

                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: inv.status === 'ACCEPTED' ? '#DCFCE7' : inv.status === 'DECLINED' ? '#FEE2E2' : '#EFF6FF',
                          color: inv.status === 'ACCEPTED' ? '#15803D' : inv.status === 'DECLINED' ? '#991B1B' : '#1D4ED8',
                          fontSize: '0.72rem',
                          fontWeight: 800
                        }}>
                          {inv.status || 'NEW INVITATION'}
                        </span>
                      </div>

                      <div style={{ padding: '8px 10px', background: '#F8FAFC', borderRadius: '6px', fontSize: '0.8rem', color: '#334155' }}>
                        Compensation: <strong>{inv.salaryRange || '₹27,000 - ₹30,000 / month'}</strong>
                      </div>

                      {inv.note && (
                        <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B', fontStyle: 'italic' }}>
                          "{inv.note}"
                        </p>
                      )}

                      {(!inv.status || inv.status === 'PENDING') && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid #F1F5F9' }}>
                          <button
                            onClick={() => handleAcceptInvitation(inv)}
                            style={{
                              flex: 1.5,
                              padding: '8px',
                              borderRadius: '6px',
                              background: '#10B981',
                              color: '#FFFFFF',
                              border: 'none',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px'
                            }}
                          >
                            <Check size={14} />
                            <span>Accept &amp; Connect</span>
                          </button>

                          <button
                            onClick={() => handleDeclineInvitation(inv)}
                            style={{
                              flex: 1,
                              padding: '8px',
                              borderRadius: '6px',
                              background: '#F1F5F9',
                              color: '#64748B',
                              border: '1px solid #CBD5E1',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 2: Submitted Applications Pipeline */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Clock size={20} color="#6366F1" />
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                  Submitted Applications Pipeline ({applications.length})
                </h2>
              </div>

              {applications.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', background: '#FFFFFF', borderRadius: '12px', border: '1px dashed #CBD5E1', color: '#64748B', fontSize: '0.84rem' }}>
                  You have not submitted any applications yet. Browse the Opportunities tab to apply.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {applications.map(app => (
                    <div key={app.id} style={{
                      background: '#FFFFFF',
                      borderRadius: '10px',
                      border: '1px solid #E2E8F0',
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}>
                      <div>
                        <strong style={{ fontSize: '0.94rem', color: '#0F172A', display: 'block' }}>
                          {app.jobTitle || 'School Bus Driver'}
                        </strong>
                        <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                          Institution: {app.institutionName || 'ABC School'} • Expected: {app.expectedSalary}
                        </span>
                      </div>

                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.76rem',
                        fontWeight: 800,
                        background: app.status === 'SELECTED' ? '#DCFCE7' : app.status === 'SHORTLISTED' ? '#FEF3C7' : '#EFF6FF',
                        color: app.status === 'SELECTED' ? '#15803D' : app.status === 'SHORTLISTED' ? '#B45309' : '#1D4ED8'
                      }}>
                        {app.status || 'APPLIED'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ===================================================================
            TAB 4: PROFESSIONAL PROFILE (SPEC SECTION 15)
            =================================================================== */}
        {activeTab === 'profile' && (
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            padding: '28px',
            maxWidth: '680px',
            margin: '0 auto',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: '#EFF6FF',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 800
              }}>
                {(currentUser?.fullName || currentUser?.name || 'Ravi Kumar')[0]}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                    {currentUser?.fullName || currentUser?.name || 'Ravi Kumar'}
                  </h2>
                  <ShieldCheck size={20} color="#059669" />
                </div>
                <span style={{ fontSize: '0.84rem', color: '#64748B' }}>
                  Commercial Driver • Rating: ⭐ {currentUser?.rating || '4.8'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.86rem' }}>
              <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Years of Experience:</span>
                  <strong style={{ color: '#0F172A' }}>8 Years Commercial Driving</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Preferred Locations:</span>
                  <strong style={{ color: '#0F172A' }}>Vijayawada, Guntur</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Vehicle Classes:</span>
                  <strong style={{ color: '#0F172A' }}>Heavy Passenger Vehicle (HPV), School Bus</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Current Status:</span>
                  <strong style={{ color: '#059669' }}>🟢 Platform Verified &amp; Active</strong>
                </div>
              </div>

              <div style={{ padding: '14px', background: '#F0FDF4', borderRadius: '10px', border: '1px solid #BBF7D0' }}>
                <strong style={{ display: 'block', color: '#166534', marginBottom: '8px' }}>
                  Platform Verified Credentials
                </strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: '#15803D', fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Check size={16} />
                    <span>Commercial Driving License (Badge Validated)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Check size={16} />
                    <span>Aadhaar Identity Compliance Completed</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Check size={16} />
                    <span>Clean Background &amp; Driving Record</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 5: TRIP HISTORY
            =================================================================== */}
        {activeTab === 'history' && (
          <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '20px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 14px 0', color: '#0F172A' }}>
              Completed Trip History
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { route: 'Route 05: Benz Circle → ABC College', date: 'Today, 07:00 AM - 08:05 AM', passengers: '28 Students', status: 'Completed' },
                { route: 'Route 05: ABC College → Benz Circle', date: 'Yesterday, 03:30 PM - 04:40 PM', passengers: '27 Students', status: 'Completed' },
                { route: 'Route 05: Benz Circle → ABC College', date: 'Yesterday, 07:00 AM - 08:00 AM', passengers: '28 Students', status: 'Completed' }
              ].map((trip, idx) => (
                <div key={idx} style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <strong style={{ fontSize: '0.9rem', color: '#0F172A', display: 'block' }}>
                      {trip.route}
                    </strong>
                    <span style={{ fontSize: '0.76rem', color: '#64748B' }}>
                      {trip.date} • {trip.passengers}
                    </span>
                  </div>

                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: '#DCFCE7',
                    color: '#15803D',
                    fontSize: '0.74rem',
                    fontWeight: 700
                  }}>
                    {trip.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ===================================================================
          MODAL: APPLY FOR JOB
          =================================================================== */}
      {selectedJobToApply && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px'
        }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '440px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 4px 0' }}>
              Apply for {selectedJobToApply.title}
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0 0 16px 0' }}>
              {selectedJobToApply.institutionName || 'Institution'} • {selectedJobToApply.salaryRange}
            </p>

            <form onSubmit={handleApplyForJob} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Expected Monthly Compensation
                </label>
                <input
                  type="text"
                  required
                  value={applicationExpectedSalary}
                  onChange={(e) => setApplicationExpectedSalary(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Experience / Introduction Note
                </label>
                <textarea
                  rows={3}
                  placeholder="Introduce yourself and specify your driving license badge details..."
                  value={applicationNote}
                  onChange={(e) => setApplicationNote(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedJobToApply(null)}
                  style={{ padding: '8px 14px', borderRadius: '8px', background: '#F1F5F9', border: 'none', color: '#475569', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', borderRadius: '8px', background: '#2563EB', border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={14} />
                  <span>Submit Application</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* End Trip Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showEndConfirm}
        onClose={() => setShowEndConfirm(false)}
        onConfirm={handleEndTripConfirm}
        title="Conclude Daily Trip?"
        message="Are you sure you want to end this trip? Telemetry broadcast will cease and parents will be notified of safe arrival at destination."
        confirmText="Yes, End Trip"
        cancelText="Keep Driving"
        variant="danger"
      />
    </DriverShell>
  );
}
