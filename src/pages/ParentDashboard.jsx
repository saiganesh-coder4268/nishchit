import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import BusMap from '../components/BusMap';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebase';
import { 
  Bus, MapPin, Clock, User, ShieldCheck, CheckCircle2, 
  AlertCircle, MessageSquare, AlertTriangle, RefreshCw, Radio 
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
    lastUpdated: null
  });

  const busId = currentUser?.busId || 'BUS24';
  const studentName = currentUser?.studentName || 'Aarav';
  const studentClass = currentUser?.studentClass || 'Class 8-A';

  // Listen to Firebase Realtime DB updates for assigned bus
  useEffect(() => {
    const busRef = ref(database, `buses/${busId}`);
    const unsubscribe = onValue(busRef, (snapshot) => {
      if (snapshot.exists()) {
        setBusData(snapshot.val());
      }
    }, (err) => {
      console.error("Realtime listener error:", err);
    });

    return () => unsubscribe();
  }, [busId]);

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
        {/* Student & Transport Info Header Card */}
        <div className="card parent-info-card">
          <div className="student-profile-header">
            <div className="student-avatar">
              <User size={28} />
            </div>
            <div className="student-details">
              <h2>{studentName}</h2>
              <span className="student-meta">{studentClass} · St. Mary's High School</span>
            </div>

            <div className="bus-assignment-badge">
              <Bus size={18} />
              <span>{busData.busNumber || 'Bus 24'} ({busData.routeNumber || 'Route 04'})</span>
            </div>
          </div>
        </div>

        {/* Bus Trip Status Banner */}
        <div className="card parent-status-card">
          {/* IF BUS NOT STARTED */}
          {isNotStarted && (
            <div className="trip-state-box not-started">
              <div className="state-header">
                <span className="status-badge not-started">
                  <span className="pulse-dot red" /> 🔴 BUS NOT STARTED
                </span>
              </div>
              <h3>Your bus hasn't started yet.</h3>
              <p>The live location map will appear automatically as soon as the driver starts the trip.</p>
            </div>
          )}

          {/* IF BUS IS LIVE */}
          {isLive && (
            <div className="trip-state-box live">
              <div className="state-header">
                <span className="status-badge live">
                  <span className="pulse-dot green" /> 🟢 BUS ON THE WAY
                </span>
                <div className="live-update-indicator">
                  <Radio size={16} className="text-success pulse-ring" />
                  <span>Realtime Tracking Active</span>
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

              {/* Leaflet Live Map */}
              <div className="parent-map-container">
                <BusMap busData={busData} />
              </div>
            </div>
          )}

          {/* IF TRIP COMPLETED */}
          {isCompleted && (
            <div className="trip-state-box completed">
              <div className="state-header">
                <span className="status-badge completed">
                  <CheckCircle2 size={16} /> ⚪ TRIP COMPLETED
                </span>
              </div>
              <h3>Today's trip has ended.</h3>
              <div className="completed-times">
                <span>Trip Started: <strong>{formatTime(busData.startedAt)}</strong></span>
                <span>Ended: <strong>{formatTime(busData.endedAt)}</strong></span>
              </div>

              {/* Snapshot Map of Final Position */}
              <div className="parent-map-container completed-map">
                <BusMap busData={busData} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
