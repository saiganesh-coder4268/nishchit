import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import BusMap from '../components/BusMap';
import CommunicationPanel from '../components/CommunicationPanel';
import { Button } from '../components/ui';
import {
  subscribeSingleBus,
  subscribeSingleRoute,
  subscribeLiveLocation,
  submitIncidentReport
} from '../services/transportService';
import { getParentStatusInfo } from '../utils/busStatus';
import { INITIAL_ROUTES } from '../data/regionData';
import { ref, onValue } from 'firebase/database';
import { rtdb } from '../firebase';
import { 
  MessageSquare, AlertCircle, MapPin, CheckCircle2, 
  X, Navigation, Phone, UserCheck, Clock, Building2, Radio
} from 'lucide-react';


export default function ParentDashboard() {
  const { currentUser } = useAuth();
  const busId = currentUser?.busId || 'BUS-24';
  const routeId = currentUser?.routeId || 'ROUTE-VZ04';

  const [busData, setBusData] = useState({
    id: busId,
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
  const [showCommPanel, setShowCommPanel] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState("Bus hasn't moved / Delay");
  const [reportDesc, setReportDesc] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);
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
          // Preserve live coordinates if already streaming faster from RTDB
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

  // 3. Subscribe to Realtime Database High-Frequency GPS (~4 seconds)
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
        busId,
        routeId,
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

  const statusInfo = getParentStatusInfo(busData, now);

  const handleFocusBus = () => {
    if (statusInfo.status === 'NOT_STARTED') {
      setFocusNotice('Bus is currently parked at depot/starting terminal.');
      setTimeout(() => setFocusNotice(null), 3000);
    } else {
      setFocusNotice('Focusing live bus location on Google Maps...');
      setTimeout(() => setFocusNotice(null), 2500);
    }
    setFocusTrigger((prev) => prev + 1);
  };

  const activeStops = routeData?.stops?.length ? routeData.stops : (INITIAL_ROUTES.find((r) => r.id === routeId)?.stops || []);
  const activeRouteName = routeData?.routeName || routeData?.name || busData?.routeName || 'Vizianagaram Corridor Route';

  return (
    <div className="parent-dashboard-page">
      <div className="dashboard-container">

        {/* 1. STUDENT & VEHICLE CERTAINTY BANNER */}
        <div className="student-certainty-card">
          <div className="student-info-row">
            <div className="student-avatar-badge">
              <UserCheck size={24} color="#2563eb" />
            </div>
            <div className="student-details">
              <div className="student-name-row">
                <h2>{currentUser?.studentName || currentUser?.childName || 'Student'}</h2>
                <span className="roll-badge">{currentUser?.studentRollNo || 'Enrolled'}</span>
              </div>
              <p className="inst-subhead">
                <Building2 size={14} className="icon-inline" />
                {currentUser?.institutionName || 'MVGR College of Engineering (Autonomous), Vizianagaram'}
              </p>
            </div>
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
              <span className="stop-name-tag">Stop: {currentUser?.stopName || 'Mayuri Junction'}</span>
            </div>

            <div className="trans-box">
              <span className="trans-label">Authorized Driver</span>
              <strong>{busData?.driverName || 'Assigned Operator'}</strong>
              {busData?.driverPhone ? (
                <a href={`tel:${busData.driverPhone}`} className="driver-phone-link">
                  <Phone size={12} /> {busData.driverPhone}
                </a>
              ) : (
                <span className="driver-phone-link"><Phone size={12} /> Contact Desk</span>
              )}
            </div>
          </div>
        </div>

        {/* 2. REAL-TIME TRIP STATUS BAR */}
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
                <span>Live GPS Feed Active (~4s)</span>
              </div>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={handleFocusBus}
              icon={Navigation}
            >
              Focus on Map
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
                  : 'Bus Parked at Starting Platform / Depot'}
              </span>
            </div>

            {focusNotice && (
              <span className="map-focus-notice">{focusNotice}</span>
            )}
          </div>

          <div className="map-frame">
            <BusMap busData={busData} key={focusTrigger} />
          </div>
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

        {/* 5. DRIVER DISPATCH & BROADCASTS */}
        <div className="parent-actions-bar">
          <Button
            variant="outline"
            onClick={() => setShowCommPanel(!showCommPanel)}
            icon={MessageSquare}
          >
            {showCommPanel ? 'Hide Driver Announcements' : 'View Driver Announcements & Notices'}
          </Button>

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
          <div className="comm-panel-container">
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

      </div>
    </div>
  );
}
