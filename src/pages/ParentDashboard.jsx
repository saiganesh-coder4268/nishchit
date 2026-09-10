import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import BusMap from '../components/BusMap';
import CommunicationPanel from '../components/CommunicationPanel';
import { Button } from '../components/ui';
import {
  subscribeSingleBus,
  subscribeSingleRoute,
  subscribeLiveLocation,
  subscribeSchedules,
  submitIncidentReport
} from '../services/transportService';
import { getParentStatusInfo } from '../utils/busStatus';
import { INITIAL_ROUTES, INITIAL_VEHICLES, REGISTERED_INSTITUTIONS } from '../data/regionData';
import { ref, onValue } from 'firebase/database';
import { rtdb } from '../firebase';
import { 
  MessageSquare, AlertCircle, MapPin, CheckCircle2, 
  X, Navigation, Phone, UserCheck, Clock, Building2, Radio,
  Edit3, ShieldCheck, Bus
} from 'lucide-react';

export default function ParentDashboard() {
  const { currentUser, updateCurrentUserProfile } = useAuth();

  const studentName = currentUser?.studentName || currentUser?.childName || '';
  const busId = currentUser?.busId || (studentName ? 'BUS-24' : null);
  const routeId = currentUser?.routeId || (busId === 'BUS-24' ? 'ROUTE-VZ04' : null);

  const [busData, setBusData] = useState({
    id: busId || 'BUS-24',
    busNumber: currentUser?.busNumber || 'Bus 24',
    registrationNumber: currentUser?.busRegistrationNumber || 'AP 35 U 2424',
    routeName: currentUser?.routeName || 'Route 04 (Vizianagaram RTC Complex -> MVGR Campus)',
    routeNumber: 'ROUTE 04',
    status: 'NOT_STARTED',
    latitude: 18.1145,
    longitude: 83.4021,
    accuracy: 8,
    speed: 0,
    startedAt: null,
    endedAt: null,
    lastUpdated: null,
    driverName: 'Rajesh Kumar',
    driverPhone: '+91 98765 43210'
  });

  const [routeData, setRouteData] = useState(null);
  const [scheduleData, setScheduleData] = useState(null);
  const [showCommPanel, setShowCommPanel] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showEditChildModal, setShowEditChildModal] = useState(false);
  
  const [reportType, setReportType] = useState("Bus hasn't moved / Delay");
  const [reportDesc, setReportDesc] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);
  
  // Child edit state
  const [editStudentName, setEditStudentName] = useState(currentUser?.studentName || currentUser?.childName || '');
  const [editRollNo, setEditRollNo] = useState(currentUser?.studentRollNo || '');
  const [editStopName, setEditStopName] = useState(currentUser?.stopName || 'Mayuri Junction / Balaji Nagar');
  const [editBusId, setEditBusId] = useState(currentUser?.busId || 'BUS-24');
  const [editSaving, setEditSaving] = useState(false);

  const [now, setNow] = useState(() => Date.now());
  const [focusTrigger, setFocusTrigger] = useState(0);
  const [focusNotice, setFocusNotice] = useState(null);
  const [isConnected, setIsConnected] = useState(true);

  // Time ticker (4s) for relative time / freshness calculation
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

  // 1. Subscribe to Firestore Bus document
  useEffect(() => {
    if (!busId) return;
    const unsubBus = subscribeSingleBus(busId, (val) => {
      if (val) {
        setBusData((prev) => ({
          ...prev,
          ...val,
          latitude: prev.isLiveStreaming ? prev.latitude : val.latitude || prev.latitude,
          longitude: prev.isLiveStreaming ? prev.longitude : val.longitude || prev.longitude,
          lastUpdated: prev.isLiveStreaming ? prev.lastUpdated : val.lastUpdated || prev.lastUpdated
        }));
      }
    });
    return () => unsubBus();
  }, [busId]);

  // 2. Subscribe to Firestore Route document
  useEffect(() => {
    if (!routeId) return;
    const unsubRoute = subscribeSingleRoute(routeId, (val) => {
      if (val) {
        setRouteData(val);
      }
    });
    return () => unsubRoute();
  }, [routeId]);

  // 3. Subscribe to Schedules collection for departure & arrival timings
  useEffect(() => {
    if (!busId && !routeId) return;
    const unsubSched = subscribeSchedules((schedules) => {
      const matched = schedules.find(s => (busId && s.busId === busId) || (routeId && s.routeId === routeId));
      if (matched) {
        setScheduleData(matched);
      }
    });
    return () => unsubSched();
  }, [busId, routeId]);

  // 4. Subscribe to Realtime Database High-Frequency GPS (~4 seconds)
  useEffect(() => {
    const targetId = busData?.activeTripId || busId;
    if (!targetId) return;

    const unsubGps = subscribeLiveLocation(targetId, (livePos) => {
      if (livePos && livePos.active) {
        setBusData((prev) => ({
          ...prev,
          status: 'LIVE',
          latitude: Number(livePos.latitude),
          longitude: Number(livePos.longitude),
          accuracy: Number(livePos.accuracy || 8),
          speed: Number(livePos.speed || 0),
          heading: Number(livePos.heading || 0),
          lastUpdated: livePos.timestamp || Date.now(),
          driverName: livePos.driverName || prev.driverName,
          driverPhone: livePos.driverPhone || prev.driverPhone,
          isLiveStreaming: true
        }));
      } else if (livePos && livePos.active === false) {
        setBusData((prev) => ({
          ...prev,
          status: 'COMPLETED',
          isLiveStreaming: false
        }));
      }
    });

    return () => unsubGps();
  }, [busData?.activeTripId, busId]);

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    try {
      await submitIncidentReport({
        parentId: currentUser?.uid || 'parent',
        parentName: currentUser?.name || 'Parent',
        studentName: currentUser?.studentName || currentUser?.childName || 'Student',
        busId: busData.id || busId,
        routeId: routeData?.id || routeId,
        type: reportType,
        description: reportDesc
      });
      setReportSubmitted(true);
      setTimeout(() => {
        setReportSubmitted(false);
        setShowReportModal(false);
        setReportDesc('');
      }, 2000);
    } catch (err) {
      console.error('Report submit error:', err);
    }
  };

  const handleSaveChildDetails = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    try {
      const selectedBus = INITIAL_VEHICLES.find(b => b.id === editBusId) || INITIAL_VEHICLES[0];
      await updateCurrentUserProfile({
        studentName: editStudentName.trim(),
        childName: editStudentName.trim(),
        studentRollNo: editRollNo.trim(),
        stopName: editStopName.trim(),
        busId: selectedBus.id,
        busNumber: selectedBus.busNumber,
        busRegistrationNumber: selectedBus.registrationNumber,
        routeId: selectedBus.routeId,
        routeName: selectedBus.routeName
      });
      setShowEditChildModal(false);
    } catch (err) {
      console.error('Failed to update student profile:', err);
    } finally {
      setEditSaving(false);
    }
  };

  const statusInfo = getParentStatusInfo(busData, now);

  const handleFocusBus = () => {
    if (statusInfo.status === 'NOT_STARTED') {
      setFocusNotice("Bus has not departed depot / terminal yet.");
      setTimeout(() => setFocusNotice(null), 3000);
    } else {
      setFocusNotice('Centering on live bus location...');
      setTimeout(() => setFocusNotice(null), 2500);
    }
    setFocusTrigger((prev) => prev + 1);
  };

  const activeStops = routeData?.stops?.length ? routeData.stops : (INITIAL_ROUTES.find((r) => r.id === routeId)?.stops || []);
  const activeRouteName = routeData?.routeName || routeData?.name || busData?.routeName || 'Vizianagaram Corridor Route';
  
  // Timing derivations
  const scheduledDeparture = scheduleData?.departureTime || routeData?.departureTime || '07:15 AM';
  const expectedArrival = scheduleData?.expectedArrival || routeData?.expectedArrival || '08:20 AM';
  const tripStartedTime = busData?.startedAt 
    ? new Date(busData.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    : (statusInfo.status === 'LIVE' ? 'In progress' : 'Not started');

  function renderEditChildModal() {
    return (
      <div className="modal-overlay">
        <div className="modal-content" style={{ maxWidth: '480px' }}>
          <div className="modal-header">
            <h3>Student Transport Settings</h3>
            <button onClick={() => setShowEditChildModal(false)} className="drawer-close-btn">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSaveChildDetails} className="report-form" style={{ marginTop: '14px' }}>
            <div className="form-group">
              <label>Student Full Name</label>
              <input
                type="text"
                required
                value={editStudentName}
                onChange={(e) => setEditStudentName(e.target.value)}
                placeholder="e.g. Aarav Varma"
              />
            </div>

            <div className="form-group">
              <label>Student Roll / ID Number</label>
              <input
                type="text"
                required
                value={editRollNo}
                onChange={(e) => setEditRollNo(e.target.value)}
                placeholder="e.g. 22331A0589"
              />
            </div>

            <div className="form-group">
              <label>Boarding / Drop-off Stop</label>
              <input
                type="text"
                required
                value={editStopName}
                onChange={(e) => setEditStopName(e.target.value)}
                placeholder="e.g. Mayuri Junction / Balaji Nagar"
              />
            </div>

            <div className="form-group">
              <label>Assigned Corridor Vehicle</label>
              <select
                value={editBusId}
                onChange={(e) => setEditBusId(e.target.value)}
              >
                {INITIAL_VEHICLES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.busNumber} — {v.registrationNumber} ({v.routeName.split('(')[0].trim()})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <Button type="button" variant="outline" fullWidth onClick={() => setShowEditChildModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" fullWidth loading={editSaving}>
                Save Details
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // =========================================================================
  // STATE 1: NO ASSOCIATED CHILD LINKED
  // =========================================================================
  if (!studentName) {
    return (
      <div className="parent-dashboard-page">
        <div className="dashboard-container" style={{ maxWidth: '640px', margin: '40px auto', textAlign: 'center' }}>
          <div className="student-certainty-card" style={{ padding: '40px 24px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <UserCheck size={32} color="#2563eb" />
            </div>
            <h2 style={{ fontSize: '1.4rem', color: '#0f172a', marginBottom: '8px' }}>Link Your Student to Begin Tracking</h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '24px' }}>
              Associate your account with your child's institution and school bus to view real device GPS tracking.
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={() => setShowEditChildModal(true)}
              icon={Edit3}
            >
              Configure Student Transport
            </Button>
          </div>
        </div>

        {showEditChildModal && renderEditChildModal()}
      </div>
    );
  }

  // =========================================================================
  // STATE 2: NO BUS ASSIGNED YET
  // =========================================================================
  if (!busId || busId === 'unassigned') {
    return (
      <div className="parent-dashboard-page">
        <div className="dashboard-container" style={{ maxWidth: '640px', margin: '40px auto', textAlign: 'center' }}>
          <div className="student-certainty-card" style={{ padding: '40px 24px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Bus size={32} color="#d97706" />
            </div>
            <h2 style={{ fontSize: '1.35rem', color: '#0f172a', marginBottom: '8px' }}>No Bus Assigned to Your Child Yet</h2>
            <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '20px' }}>
              {studentName} ({currentUser?.studentRollNo || 'Enrolled'}) is registered, but the transport office has not assigned a route vehicle yet.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Button
                variant="outline"
                size="md"
                onClick={() => setShowEditChildModal(true)}
                icon={Edit3}
              >
                Change Assignment
              </Button>
              <a href="tel:+918922241732" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                <Phone size={15} /> Call Transport Desk
              </a>
            </div>
          </div>
        </div>

        {showEditChildModal && renderEditChildModal()}
      </div>
    );
  }

  // =========================================================================
  // STATE 3: FULL OPERATIONAL PARENT TRACKING PORTAL
  // =========================================================================
  return (
    <div className="parent-dashboard-page">
      <div className="dashboard-container">

        {/* 1. STUDENT & VEHICLE CERTAINTY BANNER */}
        <div className="student-certainty-card">
          <div className="student-info-row" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div className="student-avatar-badge">
                <UserCheck size={24} color="#2563eb" />
              </div>
              <div className="student-details">
                <div className="student-name-row">
                  <h2>{studentName}</h2>
                  <span className="roll-badge">{currentUser?.studentRollNo || 'Enrolled'}</span>
                </div>
                <p className="inst-subhead">
                  <Building2 size={14} className="icon-inline" />
                  {currentUser?.institutionName || 'MVGR College of Engineering (Autonomous), Vizianagaram'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowEditChildModal(true)}
              className="btn btn-outline"
              style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Edit student and bus assignment"
            >
              <Edit3 size={14} /> Update Details
            </button>
          </div>

          <div className="assigned-transport-grid">
            <div className="trans-box">
              <span className="trans-label">Assigned Vehicle</span>
              <strong>{busData?.busNumber || 'Bus 24'}</strong>
              <code>{busData?.registrationNumber || 'AP 35 U 2424'}</code>
            </div>

            <div className="trans-box">
              <span className="trans-label">Assigned Route</span>
              <strong>{routeData?.code || busData?.routeNumber || 'Route 04'}</strong>
              <span className="stop-name-tag">Pickup Stop: {currentUser?.stopName || 'Mayuri Junction'}</span>
            </div>

            <div className="trans-box">
              <span className="trans-label">Authorized Driver</span>
              <strong>{busData?.driverName || 'Assigned Operator'}</strong>
              {busData?.driverPhone ? (
                <a href={`tel:${busData.driverPhone}`} className="driver-phone-link" title="Call Driver">
                  <Phone size={12} /> {busData.driverPhone}
                </a>
              ) : (
                <span className="driver-phone-link"><Phone size={12} /> Contact Desk</span>
              )}
            </div>
          </div>
        </div>

        {/* 2. REAL-TIME TRIP STATUS BAR (Calm, Trustworthy Hierarchy) */}
        <div className={`parent-trip-status-card status-${statusInfo.status.toLowerCase()}`}>
          <div className="status-main-col">
            <div className="status-header-line">
              <span className={`status-pill ${statusInfo.status.toLowerCase()}`}>
                {statusInfo.status === 'LIVE' && <span className="pulse-dot-green"></span>}
                {statusInfo.title}
              </span>
              {!isConnected && <span className="offline-pill">• Syncing</span>}
            </div>
            <p className="status-desc-text">{statusInfo.subtitle}</p>
          </div>

          <div className="status-telemetry-col">
            {statusInfo.status === 'LIVE' && (
              <div className="telem-badge">
                <Radio size={14} color="#16a34a" />
                <span>Live GPS Feed Active</span>
              </div>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={handleFocusBus}
              icon={Navigation}
            >
              Center on Bus
            </Button>
          </div>
        </div>

        {/* 3. CENTERPIECE GOOGLE MAP */}
        <div className="parent-map-section">
          <div className="map-toolbar">
            <div className="map-toolbar-info">
              <MapPin size={16} color="#2563eb" />
              <span>
                {statusInfo.status === 'LIVE' 
                  ? 'Real-Time Driver Device GPS Location' 
                  : statusInfo.status === 'COMPLETED' 
                  ? 'Trip Concluded — Final Vehicle Position' 
                  : statusInfo.status === 'STALE'
                  ? 'Last Known Position (Location Stale)'
                  : 'Bus Parked at Starting Platform / Depot'}
              </span>
            </div>

            {focusNotice && (
              <span className="map-focus-notice">{focusNotice}</span>
            )}
          </div>

          <div className="map-frame" style={{ height: '420px', borderRadius: '12px', overflow: 'hidden' }}>
            <BusMap busData={busData} focusTrigger={focusTrigger} />
          </div>

          {/* Schedule & Timing Strip (Section 28) */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
            gap: '12px', 
            background: '#ffffff', 
            padding: '14px 18px', 
            borderRadius: '10px', 
            marginTop: '12px', 
            border: '1px solid #e2e8f0',
            fontSize: '0.82rem'
          }}>
            <div>
              <span style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>Scheduled Departure</span>
              <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{scheduledDeparture}</div>
            </div>
            <div>
              <span style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>Trip Started</span>
              <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{tripStartedTime}</div>
            </div>
            <div>
              <span style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>Expected Campus Arrival</span>
              <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{expectedArrival}</div>
            </div>
            <div>
              <span style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>Boarding Stop</span>
              <div style={{ fontWeight: 700, color: '#2563eb', marginTop: '2px' }}>{currentUser?.stopName || 'Mayuri Junction'}</div>
            </div>
          </div>

          <p style={{ fontSize: '0.76rem', color: '#94a3b8', textAlign: 'center', margin: '8px 0 0' }}>
            Location is shared from the driver's device. No simulated GPS or invented arrival times.
          </p>
        </div>

        {/* 4. ROUTE STOPS PROGRESSION */}
        <div className="route-schedule-card">
          <div className="route-card-header">
            <div>
              <h3>Route Stops & Scheduled Timings</h3>
              <p className="subtext">{activeRouteName}</p>
            </div>
            <span className="route-badge-outline">{routeData?.code || 'ROUTE'}</span>
          </div>

          <div className="stops-timeline">
            {activeStops.map((stop, idx) => {
              const isStudentStop = stop.name.toLowerCase().includes((currentUser?.stopName || 'mayuri').toLowerCase());
              return (
                <div key={idx} className={`timeline-stop-item ${isStudentStop ? 'student-pickup' : ''}`}>
                  <div className="stop-dot-indicator">
                    {isStudentStop ? <UserCheck size={14} color="#fff" /> : <span>{idx + 1}</span>}
                  </div>
                  <div className="stop-content">
                    <div className="stop-name-row">
                      <strong className="stop-name">{stop.name}</strong>
                      {isStudentStop && <span className="your-stop-badge">Your Child's Pickup Stop</span>}
                    </div>
                    <span className="stop-time">
                      <Clock size={12} /> Scheduled: {stop.scheduledTime}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. DRIVER DISPATCH, NOTICES & EMERGENCY ACTIONS */}
        <div className="parent-actions-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '16px' }}>
          <Button
            variant="outline"
            onClick={() => setShowCommPanel(!showCommPanel)}
            icon={MessageSquare}
          >
            {showCommPanel ? 'Hide Driver Announcements' : 'View Driver Announcements & Notices'}
          </Button>

          {busData?.driverPhone && (
            <a 
              href={`tel:${busData.driverPhone}`} 
              className="btn btn-outline" 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
              title="Call driver directly"
            >
              <Phone size={15} color="#16a34a" /> Call Driver
            </a>
          )}

          <a 
            href="tel:+918922241732" 
            className="btn btn-outline" 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
            title="Call Institution Transport Desk"
          >
            <ShieldCheck size={15} color="#2563eb" /> Institution Transport Desk
          </a>

          <Button
            variant="ghost"
            onClick={() => setShowReportModal(true)}
            icon={AlertCircle}
          >
            Report Issue to Transport Desk
          </Button>
        </div>

        {/* Communication Drawer */}
        {showCommPanel && (
          <div className="comm-panel-container" style={{ marginTop: '14px' }}>
            <CommunicationPanel
              currentUser={currentUser}
              busData={busData}
              onClose={() => setShowCommPanel(false)}
            />
          </div>
        )}

        {/* Report Issue Modal */}
        {showReportModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Report Transport Issue</h3>
                <button onClick={() => setShowReportModal(false)} className="drawer-close-btn">
                  <X size={18} />
                </button>
              </div>

              {reportSubmitted ? (
                <div className="report-success-box">
                  <CheckCircle2 size={36} color="#16a34a" />
                  <h4>Incident Logged Successfully</h4>
                  <p>Your report has been forwarded to the Institution Transport Management Control Room.</p>
                </div>
              ) : (
                <form onSubmit={handleReportSubmit} className="report-form">
                  <div className="form-group">
                    <label>Issue Type</label>
                    <select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                    >
                      <option value="Bus hasn't moved / Delay">Bus hasn't moved / Heavy delay</option>
                      <option value="Missed stop / Route discrepancy">Missed stop / Route discrepancy</option>
                      <option value="Driver communication issue">Driver communication issue</option>
                      <option value="Vehicle breakdown reported">Vehicle breakdown / Tyre issue</option>
                      <option value="Emergency Safety Notice">Emergency safety concern</option>
                      <option value="Other Issue">Other transport feedback</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Details & Specific Location</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Provide specific observations or queries for the transport officer..."
                      value={reportDesc}
                      onChange={(e) => setReportDesc(e.target.value)}
                    />
                  </div>

                  <Button type="submit" variant="primary" fullWidth>
                    Submit Issue to Transport Desk
                  </Button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Edit Child Settings Modal */}
        {showEditChildModal && renderEditChildModal()}

      </div>
    </div>
  );
}
