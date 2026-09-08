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
  MapPin, CheckCircle2, X, Navigation 
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
  const busNumberText = busData.busNumber || 'BUS 24';
  const routeNumberText = busData.routeNumber || 'ROUTE 04';

  const handleFocusBus = () => {
    setFocusTrigger((prev) => prev + 1);
  };

  return (
    <div className="parent-dashboard-page">
      <div className="dashboard-container">

        {/* Top Status & Information Panel */}
        <div className="parent-status-panel">
          <div className="status-identity">
            <div className="bus-identifiers">
              <span className="bus-number-title">{busNumberText}</span>
              <span className="route-badge">{routeNumberText}</span>
            </div>

            <div className="status-indicator-group">
              <StatusIndicator status={statusInfo.status} label={statusInfo.title} />
            </div>
          </div>

          <div className="status-subtitle-row">
            <p className={`subtitle-text ${statusInfo.status === 'STALE' ? 'text-stale' : ''}`}>
              {statusInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Centerpiece Google Map Container */}
        <div className="parent-map-section">
          <div className="map-toolbar">
            <div className="map-toolbar-info">
              <MapPin size={16} />
              <span>{isLive ? 'Live Tracking Active' : 'Bus Location Map'}</span>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={handleFocusBus}
              icon={Navigation}
            >
              View / Focus Bus
            </Button>
          </div>

          <div className="map-frame">
            <BusMap busData={busData} key={focusTrigger} />
          </div>
        </div>

        {/* Secondary Actions Bar */}
        <div className="parent-actions-bar">
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


