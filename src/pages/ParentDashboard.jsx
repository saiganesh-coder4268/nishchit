import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import BusMap from '../components/BusMap';
import CommunicationPanel from '../components/CommunicationPanel';
import { Button, StatusIndicator } from '../components/ui';
import { subscribeBusState } from '../utils/busSync';
import { getParentStatusInfo } from '../utils/busStatus';
import { ref, push } from 'firebase/database';
import { database } from '../firebase';
import { 
  MessageSquare, AlertCircle, 
  MapPin, CheckCircle2, X, Navigation, User
} from 'lucide-react';

export default function ParentDashboard() {
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

  const [showCommPanel, setShowCommPanel] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState('Bus hasn\'t moved');
  const [reportDesc, setReportDesc] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [focusTrigger, setFocusTrigger] = useState(0);

  const busId = currentUser?.busId || 'BUS24';

  // Timer to keep relative time updated
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  // Listen to Bus State updates via Realtime DB + Local Sync Channel
  useEffect(() => {
    const unsubscribe = subscribeBusState(busId, (val) => {
      if (val) {
        setBusData(val);
      }
    });

    return () => unsubscribe();
  }, [busId]);

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    try {
      await push(ref(database, 'reports'), {
        parentId: currentUser?.uid || 'parent-1',
        parentName: currentUser?.name || 'Demo Parent',
        busId,
        type: reportType,
        description: reportDesc,
        timestamp: Date.now(),
        status: 'SUBMITTED'
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
  const isLive = statusInfo.status === 'LIVE';
  const isStale = statusInfo.status === 'STALE';
  const busNumberText = busData.busNumber || 'BUS 24';
  const routeNumberText = busData.routeNumber || 'ROUTE 04';
  const driverName = busData.driverName || 'Rajesh Kumar';

  const handleFocusBus = () => {
    setFocusTrigger((prev) => prev + 1);
  };

  return (
    <div className="parent-observer-page">
      <div className="observer-container">

        {/* 1. BUS STATUS HEADER (Observer Viewport Summary) */}
        <div className="observer-status-panel">
          <div className="observer-identity-row">
            <div className="observer-bus-titles">
              <h1 className="observer-bus-number">{busNumberText}</h1>
              <span className="observer-route-badge">{routeNumberText}</span>
            </div>

            <div className="observer-status-indicator">
              <StatusIndicator status={statusInfo.status} label={statusInfo.title} />
            </div>
          </div>

          <div className="observer-status-subrow">
            <p className={`observer-subtitle ${isStale ? 'text-warning' : ''}`}>
              {statusInfo.subtitle}
            </p>
          </div>
        </div>

        {/* 2. DOMINANT GOOGLE MAP VIEWPORT */}
        <div className="observer-map-container">
          <div className="map-view-header">
            <div className="map-view-title">
              <MapPin size={16} />
              <span>{isLive ? 'Live Tracking Map' : 'Bus Location Map'}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleFocusBus}
              icon={Navigation}
            >
              Focus Bus Marker
            </Button>
          </div>

          <div className="observer-map-viewport">
            <BusMap busData={busData} key={focusTrigger} />
          </div>

          {/* Map Footer Metadata: Driver info */}
          <div className="observer-map-footer">
            <div className="driver-info-item">
              <User size={15} />
              <span>Assigned Driver: <strong>{driverName}</strong></span>
            </div>
            <div className="route-info-item">
              <span>Bus Registration: <strong>TS 09 UB 2424</strong></span>
            </div>
          </div>
        </div>

        {/* 3. SECONDARY SUPPORT ACTIONS */}
        <div className="observer-actions-bar">
          <Button
            variant="outline"
            onClick={() => setShowCommPanel(!showCommPanel)}
            icon={MessageSquare}
          >
            Contact Driver
          </Button>

          <Button
            variant="ghost"
            onClick={() => setShowReportModal(true)}
            icon={AlertCircle}
          >
            Report Issue
          </Button>
        </div>

        {/* Driver Communication Panel (Drawer) */}
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
                  <CheckCircle2 size={32} color="#15803d" />
                  <p>Your report has been submitted to transport administration.</p>
                </div>
              ) : (
                <form onSubmit={handleReportSubmit} className="report-form">
                  <div className="form-group">
                    <label>Issue Type</label>
                    <select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                    >
                      <option value="Bus hasn't moved">Bus hasn't moved</option>
                      <option value="Bus is delayed">Bus is delayed</option>
                      <option value="Incorrect location">Incorrect location</option>
                      <option value="Driver communication issue">Driver communication issue</option>
                      <option value="Emergency">Emergency</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Description / Notes</label>
                    <textarea
                      rows={3}
                      placeholder="Describe what you observed..."
                      value={reportDesc}
                      onChange={(e) => setReportDesc(e.target.value)}
                    />
                  </div>

                  <Button type="submit" variant="primary" fullWidth>
                    Submit Issue Report
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
