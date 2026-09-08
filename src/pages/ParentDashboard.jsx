import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import BusMap from '../components/BusMap';
import CommunicationPanel from '../components/CommunicationPanel';
import NishchitAssistant from '../components/NishchitAssistant';
import { subscribeBusState } from '../utils/busSync';
import { ref, onValue, push } from 'firebase/database';
import { database } from '../firebase';
import { 
  MessageSquare, AlertCircle, 
  MapPin, CheckCircle2, WifiOff, X, Navigation 
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

  const [isConnected, setIsConnected] = useState(true);
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

  // Check Firebase Connection State
  useEffect(() => {
    const connRef = ref(database, '.info/connected');
    const unsubscribe = onValue(connRef, (snap) => {
      setIsConnected(snap.val() === true);
    });
    return () => unsubscribe();
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

  const getRelativeTime = (ts) => {
    if (!ts) return 'Never';
    const diffMs = Math.max(0, now - ts);
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 10) return '8 seconds ago';
    if (diffSec < 60) return `${diffSec} seconds ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin === 1) return '1 minute ago';
    if (diffMin < 60) return `${diffMin} minutes ago`;
    const diffHours = Math.floor(diffMin / 60);
    return `${diffHours} hours ago`;
  };

  const isLive = busData.status === 'LIVE';
  const isCompleted = busData.status === 'COMPLETED';
  const isNotStarted = !isLive && !isCompleted;
  
  // Stale threshold: 2 minutes (120,000ms) without updates during a live trip
  const STALE_THRESHOLD_MS = 2 * 60 * 1000;
  const isStale = isLive && Boolean(busData.lastUpdated) && (now - busData.lastUpdated > STALE_THRESHOLD_MS);

  const busNumberText = busData.busNumber || 'BUS 24';
  const routeNumberText = busData.routeNumber || 'ROUTE 04';

  const handleFocusBus = () => {
    setFocusTrigger((prev) => prev + 1);
  };

  return (
    <div className="parent-dashboard-page">
      <div className="dashboard-container">

        {/* Offline Banner */}
        {!isConnected && (
          <div className="offline-banner">
            <WifiOff size={18} />
            <span>Connection temporarily offline. Showing last known coordinates.</span>
          </div>
        )}

        {/* Top Status & Information Panel */}
        <div className="parent-status-panel">
          <div className="status-identity">
            <div className="bus-identifiers">
              <span className="bus-number-title">{busNumberText}</span>
              <span className="route-badge">{routeNumberText}</span>
            </div>

            <div className="status-indicator-group">
              {isStale && (
                <div className="status-badge stale">
                  ⚠️ LOCATION MAY BE OUTDATED
                </div>
              )}
              {!isStale && isLive && (
                <div className="status-badge live">
                  <span className="pulse-dot" /> 🟢 LIVE
                </div>
              )}
              {isNotStarted && (
                <div className="status-badge not-started">
                  NOT STARTED
                </div>
              )}
              {isCompleted && (
                <div className="status-badge completed">
                  TRIP COMPLETED
                </div>
              )}
            </div>
          </div>

          <div className="status-subtitle-row">
            {isStale && (
              <p className="subtitle-text text-stale">
                Last updated {getRelativeTime(busData.lastUpdated)}. Coordinates may not reflect exact live movement.
              </p>
            )}
            {!isStale && isLive && (
              <p className="subtitle-text">
                Last updated {getRelativeTime(busData.lastUpdated)}
              </p>
            )}
            {isNotStarted && (
              <p className="subtitle-text">
                Your bus hasn't started its trip yet.
              </p>
            )}
            {isCompleted && (
              <p className="subtitle-text">
                Today's bus trip has ended.
              </p>
            )}
          </div>
        </div>

        {/* Centerpiece Google Map Container */}
        <div className="parent-map-section">
          <div className="map-toolbar">
            <div className="map-toolbar-info">
              <MapPin size={16} />
              <span>{isLive ? 'Live Tracking Active' : 'Bus Location Map'}</span>
            </div>

            <button
              onClick={handleFocusBus}
              className="btn btn-primary btn-sm"
              title="Focus map on bus position"
            >
              <Navigation size={14} /> View / Focus Bus
            </button>
          </div>

          <div className="map-frame">
            <BusMap busData={busData} key={focusTrigger} />
          </div>
        </div>

        {/* Secondary Actions Bar */}
        <div className="parent-actions-bar">
          <button
            onClick={() => setShowCommPanel(!showCommPanel)}
            className="btn btn-outline"
          >
            <MessageSquare size={16} /> Contact Driver
          </button>

          <button
            onClick={() => setShowReportModal(true)}
            className="btn btn-ghost text-muted"
          >
            <AlertCircle size={16} /> Report Issue
          </button>
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

        {/* Secondary AI Transport Assistant Widget */}
        <div className="assistant-wrapper-secondary">
          <NishchitAssistant busData={busData} currentUser={currentUser} />
        </div>

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

                  <button type="submit" className="btn btn-primary btn-full">
                    Submit Issue Report
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

