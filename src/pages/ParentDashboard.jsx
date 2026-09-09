import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import BusMap from '../components/BusMap';
import CommunicationPanel from '../components/CommunicationPanel';
import { Button } from '../components/ui';
import { subscribeSingleBus, submitIncidentReport } from '../utils/transportService';
import { getParentStatusInfo } from '../utils/busStatus';
import { INITIAL_ROUTES } from '../data/regionData';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebase';
import { 
  MessageSquare, AlertCircle, MapPin, CheckCircle2, 
  X, Navigation, Phone, ShieldCheck, UserCheck, Clock, Building2, Radio
} from 'lucide-react';

export default function ParentDashboard() {
  const { currentUser } = useAuth();
  const busId = currentUser?.busId || 'BUS-24';
  const routeId = currentUser?.routeId || 'ROUTE-VZ04';

  const [busData, setBusData] = useState({
    busNumber: 'Bus 24',
    registrationNumber: 'AP 35 U 2424',
    routeName: 'Route 04 (Vizianagaram RTC Complex -> MVGR Campus)',
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

  const [showCommPanel, setShowCommPanel] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState("Bus hasn't moved / Delay");
  const [reportDesc, setReportDesc] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [focusTrigger, setFocusTrigger] = useState(0);
  const [focusNotice, setFocusNotice] = useState(null);
  const [isConnected, setIsConnected] = useState(true);

  // Active route details
  const activeRoute = INITIAL_ROUTES.find(r => r.id === routeId) || INITIAL_ROUTES[0];

  // Refresh relative time
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 4000);
    return () => clearInterval(timer);
  }, []);

  // Firebase connection state
  useEffect(() => {
    const connRef = ref(database, '.info/connected');
    const unsubscribe = onValue(connRef, (snap) => {
      setIsConnected(snap.val() === true);
    });
    return () => unsubscribe();
  }, []);

  // Realtime subscription to the assigned bus
  useEffect(() => {
    const unsubscribe = subscribeSingleBus(busId, (val) => {
      if (val) {
        setBusData(prev => ({ ...prev, ...val }));
      }
    });
    return () => unsubscribe();
  }, [busId]);

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    try {
      await submitIncidentReport({
        parentId: currentUser?.uid || 'demo-parent-001',
        parentName: currentUser?.name || 'Suresh Varma',
        studentName: currentUser?.studentName || 'Aarav Varma',
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
      console.error("Report submit error:", err);
    }
  };

  const statusInfo = getParentStatusInfo(busData, now);

  const handleFocusBus = () => {
    if (statusInfo.status === 'NOT_STARTED') {
      setFocusNotice("Bus is currently parked at depot/starting terminal.");
      setTimeout(() => setFocusNotice(null), 3000);
    } else {
      setFocusNotice("Focusing live bus location on Google Maps...");
      setTimeout(() => setFocusNotice(null), 2500);
    }
    setFocusTrigger((prev) => prev + 1);
  };

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
                <h2>{currentUser?.studentName || 'Aarav Varma'}</h2>
                <span className="roll-badge">{currentUser?.studentRollNo || '22331A0589'}</span>
              </div>
              <p className="inst-subhead">
                <Building2 size={14} className="icon-inline" />
                {currentUser?.institutionName || "MVGR College of Engineering (Autonomous), Vizianagaram"}
              </p>
            </div>
          </div>

          <div className="assigned-transport-grid">
            <div className="trans-box">
              <span className="trans-label">Assigned Vehicle</span>
              <strong>{busData.busNumber || 'Bus 24'}</strong>
              <code>{busData.registrationNumber || 'AP 35 U 2424'}</code>
            </div>

            <div className="trans-box">
              <span className="trans-label">Assigned Route</span>
              <strong>{busData.routeNumber || 'Route 04'}</strong>
              <span className="stop-name-tag">Stop: {currentUser?.stopName || 'Mayuri Junction'}</span>
            </div>

            <div className="trans-box">
              <span className="trans-label">Authorized Driver</span>
              <strong>{busData.driverName || 'Rajesh Kumar'}</strong>
              <a href={`tel:${busData.driverPhone || '+919876543210'}`} className="driver-phone-link">
                <Phone size={12} /> {busData.driverPhone || '+91 98765 43210'}
              </a>
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
                <span>Live GPS Feed Active</span>
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
              <p className="subtext">{activeRoute.name}</p>
            </div>
            <span className="route-badge-outline">{activeRoute.code}</span>
          </div>

          <div className="stops-timeline">
            {activeRoute.stops.map((stop, idx) => {
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
