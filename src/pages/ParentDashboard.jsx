import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import BusMap from '../components/BusMap';
import CommunicationPanel from '../components/CommunicationPanel';
import NishchitAssistant from '../components/NishchitAssistant';
import { subscribeBusState } from '../utils/busSync';
import { ref, onValue, push } from 'firebase/database';
import { database } from '../firebase';
import { 
  Bus, Clock, User, CheckCircle2, 
  AlertCircle, MessageSquare, RefreshCw, Radio, WifiOff, X 
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

  const busId = currentUser?.busId || 'BUS24';
  const studentName = currentUser?.studentName || 'Aarav';
  const studentClass = currentUser?.studentClass || 'Class 8-A';

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

  const formatTime = (ts) => {
    if (!ts) return '--:--';
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isLive = busData.status === 'LIVE';
  const isCompleted = busData.status === 'COMPLETED';
  const isNotStarted = !isLive && !isCompleted;

  return (
    <div className="parent-dashboard-page">
      <div className="dashboard-container">
        {/* Connection Offline Banner */}
        {!isConnected && (
          <div className="gps-error-banner offline">
            <WifiOff size={20} />
            <div className="error-text">
              <strong>⚠️ LOCATION TEMPORARILY UNAVAILABLE</strong>
              <p>Showing last known location at {formatTime(busData.lastUpdated)}</p>
            </div>
          </div>
        )}

        {/* Student & Transport Profile Card */}
        <div className="card parent-info-card">
          <div className="student-profile-header">
            <div className="student-avatar">
              <User size={28} />
            </div>
            <div className="student-details">
              <h2>{studentName}</h2>
              <span className="student-meta">{studentClass} · St. Mary's High School</span>
            </div>

            <div className="parent-actions-group">
              <button
                onClick={() => setShowCommPanel(!showCommPanel)}
                className="btn btn-outline btn-sm"
              >
                <MessageSquare size={16} /> Contact Driver
              </button>

              <button
                onClick={() => setShowReportModal(true)}
                className="btn btn-outline btn-sm btn-report"
              >
                <AlertCircle size={16} /> Report Issue
              </button>
            </div>
          </div>
        </div>

        {/* Bus Status & Interactive Leaflet Live Map Card */}
        <div className="card parent-status-card">
          {/* Header Banner depending on Status */}
          <div className="state-header">
            {isNotStarted && (
              <span className="status-badge not-started">
                <span className="pulse-dot red" /> 🔴 BUS NOT STARTED
              </span>
            )}
            {isLive && (
              <span className="status-badge live">
                <span className="pulse-dot green" /> 🟢 BUS ON THE WAY {busData.isDemoMode ? '[DEMO MODE]' : ''}
              </span>
            )}
            {isCompleted && (
              <span className="status-badge completed">
                <CheckCircle2 size={16} /> ⚪ TRIP COMPLETED
              </span>
            )}

            <div className="live-update-indicator">
              <Radio size={16} className={`pulse-ring ${isLive ? 'text-success' : 'text-muted'}`} />
              <span>{isLive ? 'Realtime Tracking Active' : isCompleted ? 'Trip Completed' : 'Waiting for Driver'}</span>
            </div>
          </div>

          <div className="live-meta-row">
            <div className="meta-box">
              <Clock size={16} className="text-muted" />
              <span>Started: <strong>{formatTime(busData.startedAt)}</strong></span>
            </div>

            <div className="meta-box">
              <RefreshCw size={16} className="text-muted" />
              <span>Last Updated: <strong>{formatTime(busData.lastUpdated)}</strong></span>
            </div>

            <div className="meta-box">
              <Bus size={16} className="text-primary" />
              <span><strong>{busData.busNumber || 'Bus 24'}</strong> · {busData.routeNumber || 'Route 04'}</span>
            </div>
          </div>

          {/* Leaflet Map - Prominently Displayed for Parents */}
          <div className="parent-map-container">
            <BusMap busData={busData} />
          </div>
        </div>

        {/* Realtime Driver-Parent Communication Drawer */}
        {showCommPanel && (
          <div className="comm-panel-container">
            <CommunicationPanel
              currentUser={currentUser}
              busData={busData}
              onClose={() => setShowCommPanel(false)}
            />
          </div>
        )}

        {/* AI Transport Assistant Widget */}
        <NishchitAssistant busData={busData} currentUser={currentUser} />

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
                  <CheckCircle2 size={32} color="#10b981" />
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
