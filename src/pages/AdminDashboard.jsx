import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BusMap from '../components/BusMap';
import AdminShell from '../components/shells/AdminShell';
import {
  subscribeBuses,
  subscribeRoutes,
  subscribeDriverApplications,
  approveDriverApplication,
  rejectDriverApplication,
  createBus,
  updateBus,
  deleteBus,
  createRoute,
  updateRoute,
  deleteRoute,
  subscribeActiveTrips,
  subscribeTripHistory,
  subscribeIncidentReports,
  subscribeLiveLocation,
  subscribeSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule
} from '../services/transportService';
import { REGISTERED_INSTITUTIONS } from '../data/regionData';
import {
  ShieldCheck, Bus, MapPin, Building2, AlertTriangle,
  CheckCircle2, XCircle, Radio, Plus, UserCheck,
  Phone, Check, Trash2, Edit3, Calendar,
  Eye, TrendingUp, Users
} from 'lucide-react';

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Institution context
  const institutionId = currentUser?.institutionId || currentUser?.instituteId || 'INST-AU';
  const currentInstitution = useMemo(() => {
    return REGISTERED_INSTITUTIONS.find(i => i.id === institutionId || i.instituteId === institutionId) || {
      id: institutionId,
      name: currentUser?.institutionName || 'Andhra University',
      city: 'Visakhapatnam',
      campus: 'Visakhapatnam Campus'
    };
  }, [institutionId, currentUser]);

  // Navigation tabs: 'overview' | 'drivers' | 'buses' | 'routes' | 'schedules' | 'fleet' | 'incidents'
  const [activeTab, setActiveTab] = useState('overview');

  // Sync activeTab with URL pathname
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/admin/drivers')) setActiveTab('drivers');
    else if (path.includes('/admin/vehicles') || path.includes('/admin/buses')) setActiveTab('buses');
    else if (path.includes('/admin/routes')) setActiveTab('routes');
    else if (path.includes('/admin/schedules')) setActiveTab('schedules');
    else if (path.includes('/admin/trips') || path.includes('/admin/fleet')) setActiveTab('fleet');
    else if (path.includes('/admin/incidents')) setActiveTab('incidents');
    else if (path.includes('/admin/history')) setActiveTab('history');
    else if (path.includes('/admin/profile')) setActiveTab('profile');
    else setActiveTab('overview');
  }, [location.pathname]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'overview') navigate('/admin/dashboard');
    else if (tab === 'buses') navigate('/admin/vehicles');
    else if (tab === 'fleet') navigate('/admin/trips');
    else navigate(`/admin/${tab}`);
  };

  const [fleetList, setFleetList] = useState([]);
  const [routesList, setRoutesList] = useState([]);
  const [driverApps, setDriverApps] = useState([]);
  const [schedulesList, setSchedulesList] = useState([]);
  const [activeTrips, setActiveTrips] = useState([]);
  const [tripHistory, setTripHistory] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [selectedBusForMap, setSelectedBusForMap] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);

  // Driver Review Drawer / Modal
  const [reviewingDriver, setReviewingDriver] = useState(null);
  const [assignBusId, setAssignBusId] = useState('');
  const [assignRouteId, setAssignRouteId] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);

  // Bus Add/Edit Modal
  const [showBusModal, setShowBusModal] = useState(false);
  const [editingBus, setEditingBus] = useState(null);
  const [busForm, setBusForm] = useState({
    busNumber: '',
    registrationNumber: '',
    capacity: 52,
    status: 'AVAILABLE'
  });

  // Route Add/Edit Modal
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [routeForm, setRouteForm] = useState({
    routeName: '',
    code: '',
    from: 'Vizianagaram',
    to: 'Visakhapatnam',
    reportingTime: '06:50 AM',
    departureTime: '07:15 AM',
    expectedArrival: '08:15 AM',
    stopsText: 'Vizianagaram RTC Complex, Mayuri Junction, MVGR Campus'
  });

  // Schedule Add/Edit Modal (Requirement 18)
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    busId: '',
    driverId: '',
    routeId: '',
    operatingDay: 'Daily (Monday - Saturday)',
    departureTime: '07:15 AM',
    reportingTime: '06:50 AM',
    expectedArrival: '08:20 AM',
    stopsText: 'Mayuri Junction — 07:25 AM, Balaji Nagar — 07:35 AM, Thagarapuvalasa — 07:55 AM'
  });

  // 1. Realtime Subscriptions
  useEffect(() => {
    const unsubBuses = subscribeBuses((data) => {
      setFleetList(data);
      if (data.length > 0 && !selectedBusForMap) {
        setSelectedBusForMap(data[0]);
      } else if (selectedBusForMap) {
        const updated = data.find((b) => b.id === selectedBusForMap.id);
        if (updated) setSelectedBusForMap((prev) => ({ ...prev, ...updated }));
      }
    }, institutionId);

    const unsubRoutes = subscribeRoutes((data) => {
      setRoutesList(data);
    }, institutionId);

    const unsubDrivers = subscribeDriverApplications((data) => {
      setDriverApps(data);
    }, institutionId);

    const unsubSchedules = subscribeSchedules((data) => {
      setSchedulesList(data);
    }, institutionId);

    const unsubActiveTrips = subscribeActiveTrips((data) => {
      setActiveTrips(data);
    }, institutionId);

    const unsubHistory = subscribeTripHistory((data) => {
      setTripHistory(data);
    }, institutionId);

    const unsubIncidents = subscribeIncidentReports((data) => {
      setIncidents(data);
    }, institutionId);

    return () => {
      unsubBuses();
      unsubRoutes();
      unsubDrivers();
      unsubSchedules();
      unsubActiveTrips();
      unsubHistory();
      unsubIncidents();
    };
  }, [institutionId]);

  // 2. Realtime GPS Stream for Map
  useEffect(() => {
    if (!selectedBusForMap?.id) return;
    const targetId = selectedBusForMap.activeTripId || selectedBusForMap.id;
    const unsubLive = subscribeLiveLocation(targetId, (livePos) => {
      if (livePos && livePos.active) {
        setSelectedBusForMap((prev) => ({
          ...prev,
          latitude: Number(livePos.latitude),
          longitude: Number(livePos.longitude),
          accuracy: Number(livePos.accuracy || 8),
          speed: Number(livePos.speed || 0),
          lastUpdated: livePos.timestamp || Date.now(),
          status: 'LIVE'
        }));
      }
    });
    return () => unsubLive();
  }, [selectedBusForMap?.id, selectedBusForMap?.activeTripId]);

  const showFeedback = (msg) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Approved drivers pool for scheduling
  const approvedDrivers = driverApps.filter(
    (d) => (d.status || d.verificationStatus) === 'approved'
  );

  // DRIVER VERIFICATION ACTIONS
  const handleApproveDriver = async () => {
    if (!reviewingDriver) return;
    const bId = assignBusId || fleetList[0]?.id;
    const rId = assignRouteId || routesList[0]?.id;
    if (!bId || !rId) {
      showFeedback('Please create or select a valid Bus and Route from the database to approve this driver.');
      return;
    }
    try {
      await approveDriverApplication(
        reviewingDriver.applicationId || reviewingDriver.id,
        {
          driverId: reviewingDriver.driverId || reviewingDriver.uid,
          busId: bId,
          routeId: rId,
          approvedBy: currentUser?.uid || 'admin',
          institutionId,
          institutionName: currentInstitution.name
        }
      );
      showFeedback(`Driver ${reviewingDriver.fullName || reviewingDriver.name} approved and assigned to Bus.`);
      setReviewingDriver(null);
      setShowRejectBox(false);
      setRejectReason('');
    } catch (err) {
      console.error(err);
      showFeedback(`Error: ${err.message}`);
    }
  };

  const handleRejectDriver = async (e) => {
    e?.preventDefault();
    if (!reviewingDriver) return;
    const cleanReason = rejectReason.trim();
    if (!cleanReason) {
      setShowRejectBox(true);
      showFeedback('Please provide a specific rejection reason.');
      return;
    }

    try {
      await rejectDriverApplication(
        reviewingDriver.applicationId || reviewingDriver.id,
        reviewingDriver.driverId || reviewingDriver.uid,
        cleanReason,
        currentUser?.uid || 'admin'
      );
      showFeedback(`Application for ${reviewingDriver.fullName || reviewingDriver.name} marked as Rejected.`);
      setReviewingDriver(null);
      setShowRejectBox(false);
      setRejectReason('');
    } catch (err) {
      console.error(err);
      showFeedback(`Error: ${err.message}`);
    }
  };

  // BUS ACTIONS
  const handleSaveBus = async (e) => {
    e.preventDefault();
    try {
      if (editingBus) {
        await updateBus(editingBus.id, {
          busNumber: busForm.busNumber,
          registrationNumber: busForm.registrationNumber,
          capacity: Number(busForm.capacity),
          status: busForm.status,
          institutionId,
          institutionName: currentInstitution.name
        });
        showFeedback(`Bus ${busForm.busNumber} updated.`);
      } else {
        await createBus({
          ...busForm,
          institutionId,
          institutionName: currentInstitution.name
        });
        showFeedback(`Bus ${busForm.busNumber} added to fleet.`);
      }
      setShowBusModal(false);
      setEditingBus(null);
    } catch (err) {
      console.error(err);
      showFeedback(`Error saving bus: ${err.message}`);
    }
  };

  const handleDeleteBus = async (bus) => {
    if (window.confirm(`Are you sure you want to remove ${bus.busNumber} (${bus.registrationNumber}) from fleet?`)) {
      try {
        await deleteBus(bus.id);
        showFeedback(`Bus ${bus.busNumber} removed.`);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // ROUTE ACTIONS
  const handleSaveRoute = async (e) => {
    e.preventDefault();
    try {
      const stops = routeForm.stopsText
        .split(',')
        .map((s, idx) => ({
          name: s.trim(),
          scheduledTime: `${7 + Math.floor(idx / 4)}:${(idx % 4) * 15 || '00'} AM`
        }))
        .filter((s) => s.name);

      const payload = {
        routeName: routeForm.routeName,
        name: routeForm.routeName,
        code: routeForm.code || 'RT',
        from: routeForm.from,
        to: routeForm.to,
        reportingTime: routeForm.reportingTime,
        departureTime: routeForm.departureTime,
        expectedArrival: routeForm.expectedArrival,
        stops,
        institutionId,
        institutionName: currentInstitution.name
      };

      if (editingRoute) {
        await updateRoute(editingRoute.id, payload);
        showFeedback(`Route ${routeForm.routeName} updated.`);
      } else {
        await createRoute(payload);
        showFeedback(`Route ${routeForm.routeName} created.`);
      }
      setShowRouteModal(false);
      setEditingRoute(null);
    } catch (err) {
      console.error(err);
      showFeedback(`Error saving route: ${err.message}`);
    }
  };

  const handleDeleteRoute = async (route) => {
    if (window.confirm(`Are you sure you want to delete route ${route.routeName || route.name}?`)) {
      try {
        await deleteRoute(route.id);
        showFeedback('Route deleted.');
      } catch (err) {
        console.error(err);
      }
    }
  };

  // SCHEDULE ACTIONS (Requirement 18)
  const handleOpenCreateSchedule = () => {
    setEditingSchedule(null);
    const defaultBus = fleetList[0];
    const defaultRoute = routesList[0];
    const defaultDriver = approvedDrivers[0];

    const stopsText = defaultRoute?.stops?.length
      ? defaultRoute.stops.map((s) => `${s.name} — ${s.scheduledTime || '07:25 AM'}`).join(', ')
      : 'Gajuwaka Junction — 07:25 AM, NAD Junction — 07:45 AM, AU Campus — 08:20 AM';

    setScheduleForm({
      busId: defaultBus?.id || '',
      driverId: defaultDriver?.driverId || defaultDriver?.uid || '',
      routeId: defaultRoute?.id || '',
      operatingDay: 'Daily (Monday - Saturday)',
      departureTime: defaultRoute?.departureTime || '07:15 AM',
      reportingTime: defaultRoute?.reportingTime || '06:50 AM',
      expectedArrival: defaultRoute?.expectedArrival || '08:20 AM',
      stopsText
    });
    setShowScheduleModal(true);
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    try {
      const selectedBus = fleetList.find((b) => b.id === scheduleForm.busId);
      const selectedRoute = routesList.find((r) => r.id === scheduleForm.routeId);
      const selectedDriver = approvedDrivers.find(
        (d) => (d.driverId || d.uid) === scheduleForm.driverId
      );

      const parsedStops = scheduleForm.stopsText
        .split(',')
        .map((item) => {
          const parts = item.split('—');
          return {
            name: (parts[0] || '').trim(),
            scheduledTime: (parts[1] || '').trim() || '07:30 AM'
          };
        })
        .filter((s) => s.name);

      const payload = {
        busId: scheduleForm.busId,
        busNumber: selectedBus?.busNumber || 'Bus',
        driverId: scheduleForm.driverId,
        driverName: selectedDriver?.fullName || selectedDriver?.name || 'Driver',
        routeId: scheduleForm.routeId,
        routeName: selectedRoute?.routeName || selectedRoute?.name || 'Corridor Route',
        routeCode: selectedRoute?.code || 'RT',
        operatingDay: scheduleForm.operatingDay,
        departureTime: scheduleForm.departureTime,
        reportingTime: scheduleForm.reportingTime,
        expectedArrival: scheduleForm.expectedArrival,
        stops: parsedStops,
        institutionId,
        institutionName: currentInstitution.name
      };

      if (editingSchedule) {
        await updateSchedule(editingSchedule.id, payload);
        showFeedback('Schedule updated successfully.');
      } else {
        await createSchedule(payload);
        showFeedback('Schedule created successfully.');
      }
      setShowScheduleModal(false);
      setEditingSchedule(null);
    } catch (err) {
      console.error(err);
      showFeedback(`Error saving schedule: ${err.message}`);
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (window.confirm('Are you sure you want to remove this schedule?')) {
      try {
        await deleteSchedule(scheduleId);
        showFeedback('Schedule removed.');
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Operational metrics from actual Firebase data
  const totalBuses = fleetList.length;
  const activeBuses = fleetList.filter((b) => b.status === 'ON_TRIP' || b.status === 'LIVE').length;
  const verifiedDriversCount = approvedDrivers.length;
  const pendingRequests = driverApps.filter(
    (d) => (d.status || d.verificationStatus || 'pending') === 'pending'
  );

  return (
    <AdminShell
      activeTab={activeTab}
      onTabChange={handleTabChange}
      pendingCount={pendingRequests.length}
      activeTripsCount={activeBuses}
    >
      <div className="admin-dashboard-page">

        {actionNotice && (
          <div className="admin-action-notice">
            <CheckCircle2 size={18} color="#16a34a" />
            <span>{actionNotice}</span>
          </div>
        )}

      {/* 2. STATS & OPERATIONAL METRICS */}
      <div className="admin-metrics-grid four-col-metrics">
        <div className="metric-card" onClick={() => handleTabChange('buses')}>
          <div className="metric-icon blue"><Bus size={22} color="#2563EB" /></div>
          <div className="metric-data">
            <span className="metric-number">{totalBuses}</span>
            <span className="metric-label">Total Buses</span>
            <span className="metric-sub-pill green">{totalBuses > 0 ? 'Fleet Registered' : 'None Registered'}</span>
          </div>
        </div>

        <div className="metric-card" onClick={() => handleTabChange('fleet')}>
          <div className="metric-icon green"><Radio size={22} color="#16A34A" /></div>
          <div className="metric-data">
            <span className="metric-number">{activeBuses}</span>
            <span className="metric-label">Active Trips</span>
            <span className="metric-sub-pill green">{activeBuses > 0 ? 'Streaming Live GPS' : 'Standby'}</span>
          </div>
        </div>

        <div className="metric-card" onClick={() => handleTabChange('drivers')}>
          <div className="metric-icon blue"><Users size={22} color="#2563EB" /></div>
          <div className="metric-data">
            <span className="metric-number">{verifiedDriversCount}</span>
            <span className="metric-label">Approved Drivers</span>
            <span className="metric-sub-pill blue">{pendingRequests.length > 0 ? `${pendingRequests.length} pending review` : 'All reviewed'}</span>
          </div>
        </div>

        <div className="metric-card" onClick={() => handleTabChange('routes')}>
          <div className="metric-icon amber"><TrendingUp size={22} color="#D97706" /></div>
          <div className="metric-data">
            <span className="metric-number">{routesList.length}</span>
            <span className="metric-label">Active Corridors</span>
            <span className="metric-sub-pill green">{schedulesList.length > 0 ? `${schedulesList.length} schedules` : 'No schedules'}</span>
          </div>
        </div>
      </div>

      {/* 3. NAVIGATION TABS */}
      <div className="admin-nav-tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => handleTabChange('overview')}
        >
          <Building2 size={16} /> Overview
        </button>

        <button
          className={`tab-btn ${activeTab === 'drivers' ? 'active' : ''}`}
          onClick={() => handleTabChange('drivers')}
        >
          <ShieldCheck size={16} /> Driver Requests
          {pendingRequests.length > 0 && <span className="tab-counter-badge">{pendingRequests.length}</span>}
        </button>

        <button
          className={`tab-btn ${activeTab === 'buses' ? 'active' : ''}`}
          onClick={() => handleTabChange('buses')}
        >
          <Bus size={16} /> Vehicles ({fleetList.length})
        </button>

        <button
          className={`tab-btn ${activeTab === 'routes' ? 'active' : ''}`}
          onClick={() => handleTabChange('routes')}
        >
          <MapPin size={16} /> Routes ({routesList.length})
        </button>

        <button
          className={`tab-btn ${activeTab === 'schedules' ? 'active' : ''}`}
          onClick={() => handleTabChange('schedules')}
        >
          <Calendar size={16} /> Schedules ({schedulesList.length})
        </button>

        <button
          className={`tab-btn ${activeTab === 'fleet' ? 'active' : ''}`}
          onClick={() => handleTabChange('fleet')}
        >
          <Radio size={16} /> Live Fleet
          {activeBuses > 0 && <span className="tab-counter-badge green">{activeBuses}</span>}
        </button>

        <button
          className={`tab-btn ${activeTab === 'incidents' ? 'active' : ''}`}
          onClick={() => handleTabChange('incidents')}
        >
          <AlertTriangle size={16} /> Incidents ({incidents.length})
        </button>
      </div>

      {/* 4. TAB CONTENTS */}
      <div className="admin-tab-content">

        {/* TAB: OVERVIEW (Reference 2 Layout) */}
        {activeTab === 'overview' && (
          <div className="overview-tab-rebuilt">
            <div className="admin-overview-grid-layout">
              
              {/* LEFT COLUMN: LIVE FLEET VIEW MAP */}
              <div className="overview-fleet-map-card">
                <div className="card-header-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Radio size={18} color="#16A34A" />
                    <h3>Live Fleet View</h3>
                  </div>

                  <div className="fleet-status-legends">
                    <span className="legend-chip green">● Active Trips {activeBuses}</span>
                    <span className="legend-chip slate">● Inactive {Math.max(0, fleetList.length - activeBuses)}</span>
                  </div>
                </div>

                <div className="overview-map-embed" style={{ height: '360px', position: 'relative' }}>
                  <BusMap
                    busData={selectedBusForMap ? {
                      ...selectedBusForMap,
                      status: selectedBusForMap.activeTripId || selectedBusForMap.status === 'ON_TRIP' ? 'LIVE' : selectedBusForMap.status
                    } : null}
                    routePath={routesList[0]?.polyline}
                    stops={routesList[0]?.stops || []}
                    busNumber={selectedBusForMap?.busNumber || 'Fleet Overview'}
                    isLive={activeBuses > 0}
                  />
                </div>

                <div className="overview-map-footer-strip">
                  <span>Showing real-time positions for registered educational corridor vehicles.</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('fleet')}
                    className="view-all-link-btn"
                  >
                    View All Buses &rarr;
                  </button>
                </div>
              </div>

              {/* RIGHT COLUMN: RECENT ALERTS & QUICK ACTIONS */}
              <div className="overview-side-stack">
                
                {/* 1. RECENT ALERTS */}
                <div className="admin-side-card recent-alerts-card">
                  <div className="card-header-row">
                    <h3>Recent Alerts</h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('incidents')}
                      className="view-all-sub-link"
                    >
                      View All
                    </button>
                  </div>

                  <div className="recent-alerts-list">
                    {incidents.length > 0 ? (
                      incidents.slice(0, 4).map((inc) => (
                        <div key={inc.id} className="recent-alert-item">
                          <AlertTriangle size={15} color="#D97706" />
                          <div className="alert-item-meta">
                            <strong>{inc.type}</strong>
                            <span>{inc.busId} · {inc.parentName || 'Parent report'}</span>
                          </div>
                          <span className="alert-time-tag">Recent</span>
                        </div>
                      ))
                    ) : pendingRequests.length > 0 ? (
                      <div className="recent-alert-item" onClick={() => setActiveTab('drivers')} style={{ cursor: 'pointer' }}>
                        <ShieldCheck size={15} color="#2563EB" />
                        <div className="alert-item-meta">
                          <strong>Driver Verification Pending</strong>
                          <span>{pendingRequests.length} driver application(s) awaiting review</span>
                        </div>
                        <span className="alert-time-tag">Action Required</span>
                      </div>
                    ) : (
                      <div style={{ padding: '24px 12px', textAlign: 'center', color: '#64748B', fontSize: '0.88rem' }}>
                        <CheckCircle2 size={24} color="#16A34A" style={{ display: 'block', margin: '0 auto 8px auto' }} />
                        <span>No active incidents or security alerts. Fleet operations normal.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. QUICK ACTIONS */}
                <div className="admin-side-card quick-actions-card">
                  <div className="card-header-row">
                    <h3>Quick Actions</h3>
                  </div>

                  <div className="quick-actions-grid">
                    <button
                      type="button"
                      className="quick-action-btn"
                      onClick={() => setShowCreateBusModal(true)}
                    >
                      <Plus size={16} color="#2563EB" />
                      <span>Add Vehicle</span>
                    </button>

                    <button
                      type="button"
                      className="quick-action-btn"
                      onClick={() => setActiveTab('drivers')}
                    >
                      <UserCheck size={16} color="#16A34A" />
                      <span>Review Drivers ({pendingRequests.length})</span>
                    </button>

                    <button
                      type="button"
                      className="quick-action-btn"
                      onClick={() => setShowCreateRouteModal(true)}
                    >
                      <MapPin size={16} color="#2563EB" />
                      <span>Create Route</span>
                    </button>

                    <button
                      type="button"
                      className="quick-action-btn"
                      onClick={() => setShowScheduleModal(true)}
                    >
                      <Calendar size={16} color="#D97706" />
                      <span>Add Schedule</span>
                    </button>
                  </div>

                  <div className="quick-actions-trust-footer">
                    <CheckCircle2 size={14} color="#16A34A" />
                    <span>Safer journeys. Brighter futures.</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* TAB: DRIVER VERIFICATION QUEUE (Requirement 11) */}
        {activeTab === 'drivers' && (
          <div className="drivers-queue-tab">
            <div className="section-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2>Driver Verification &amp; Credential Review</h2>
                <p>Review commercial driving licences, identity proofs, and assign corridor vehicles.</p>
              </div>
              <div className="queue-summary-tag" style={{ padding: '6px 14px', background: pendingRequests.length > 0 ? '#FEF3C7' : '#DCFCE7', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, color: pendingRequests.length > 0 ? '#92400E' : '#15803D' }}>
                Pending Requests: {pendingRequests.length}
              </div>
            </div>

            {driverApps.length === 0 ? (
              <div className="admin-empty-box" style={{ padding: '60px 20px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <UserCheck size={44} color="#94A3B8" style={{ marginBottom: '12px' }} />
                <h3>No Driver Applications Found</h3>
                <p style={{ color: '#64748B' }}>Driver onboarding submissions will appear here for administrative verification.</p>
              </div>
            ) : (
              <div className="driver-applications-grid">
                {driverApps.map((app) => {
                  const status = (app.status || app.verificationStatus || 'pending').toLowerCase();
                  const isApproved = status === 'approved';
                  const isRejected = status === 'rejected';

                  return (
                    <div key={app.id} className="driver-application-card">
                      <div className="app-card-header">
                        <div className="driver-avatar-box">
                          {app.photoUrl ? (
                            <img src={app.photoUrl} alt="Driver" className="driver-avatar-img" />
                          ) : (
                            <div className="avatar-placeholder"><UserCheck size={24} /></div>
                          )}
                        </div>

                        <div className="app-driver-title">
                          <h3>{app.fullName || app.name || 'Driver Applicant'}</h3>
                          <span className="phone-line"><Phone size={12} /> {app.phone || 'Phone not provided'}</span>
                          <span className="institution-line"><Building2 size={12} /> {app.institutionName || 'Corridor Transport'}</span>
                        </div>

                        <div className="app-status-badge">
                          <span className={`status-pill ${status}`}>
                            {status === 'approved' ? 'APPROVED' : status === 'rejected' ? 'REJECTED' : 'PENDING REVIEW'}
                          </span>
                        </div>
                      </div>

                      <div className="kyc-details-strip">
                        <div className="kyc-row">
                          <span className="kyc-label">Commercial Licence:</span>
                          <strong>{app.licenceNumber || 'Not specified'}</strong>
                          {app.licenceValidity && <span className="validity-tag">Valid till {app.licenceValidity}</span>}
                        </div>

                        <div className="kyc-row">
                          <span className="kyc-label">Identity Document:</span>
                          <span>{app.idDocumentType || 'National ID'} — {app.idDocumentNumber ? `${app.idDocumentNumber.slice(0, 4)} XXXX ${app.idDocumentNumber.slice(-4) || 'XXXX'}` : 'Verified'}</span>
                        </div>

                        <div className="kyc-row">
                          <span className="kyc-label">Locality / PIN:</span>
                          <span>{app.locality || 'Corridor Area'} ({app.pincode || '535002'})</span>
                        </div>

                        <div className="kyc-row">
                          <span className="kyc-label">Experience:</span>
                          <span>{app.experienceYears || 'Commercial Heavy Vehicle'}</span>
                        </div>

                        <div className="kyc-row">
                          <span className="kyc-label">Submitted At:</span>
                          <span>{app.submittedAt ? new Date(app.submittedAt).toLocaleString() : 'Recent'}</span>
                        </div>

                        {isRejected && app.rejectionReason && (
                          <div className="kyc-row" style={{ color: '#DC2626' }}>
                            <span className="kyc-label">Decline Reason:</span>
                            <span>{app.rejectionReason}</span>
                          </div>
                        )}
                      </div>

                      <div className="app-card-actions" style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setReviewingDriver(app);
                            setAssignBusId(app.busId || fleetList[0]?.id || '');
                            setAssignRouteId(app.routeId || routesList[0]?.id || '');
                            setShowRejectBox(false);
                            setRejectReason('');
                          }}
                          className="btn btn-primary btn-sm"
                          style={{ flex: 1 }}
                        >
                          <Eye size={14} /> Review Application
                        </button>
                      </div>

                      {isApproved && (
                        <div className="approved-assignment-tag" style={{ marginTop: '12px' }}>
                          <CheckCircle2 size={14} color="#16a34a" />
                          <span>{app.busNumber ? `Assigned to ${app.busNumber} (${app.routeName || app.routeId})` : 'Approved (Awaiting Schedule Allocation)'}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB: VEHICLE MANAGEMENT */}
        {activeTab === 'buses' && (
          <div className="bus-management-tab">
            <div className="section-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2>Fleet Vehicle Management</h2>
                <p>Register buses, configure vehicle plates, capacity, and current operational status.</p>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setEditingBus(null);
                  setBusForm({ busNumber: `Bus ${fleetList.length + 1}`, registrationNumber: 'AP 35 U ', capacity: 52, status: 'AVAILABLE' });
                  setShowBusModal(true);
                }}
              >
                <Plus size={16} /> Add New Bus
              </button>
            </div>

            <div className="students-table-frame">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Bus ID / No.</th>
                    <th>Registration Plate</th>
                    <th>Capacity</th>
                    <th>Status</th>
                    <th>Assigned Driver</th>
                    <th>Assigned Route</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fleetList.map((bus) => (
                    <tr key={bus.id}>
                      <td><strong>{bus.busNumber}</strong><br/><small style={{ color: '#94a3b8' }}>{bus.id}</small></td>
                      <td><code>{bus.registrationNumber}</code></td>
                      <td>{bus.capacity || 52} seats</td>
                      <td>
                        <span className={`status-pill-sm ${bus.status === 'ON_TRIP' || bus.status === 'LIVE' ? 'live' : 'not_started'}`}>
                          {bus.status || 'AVAILABLE'}
                        </span>
                      </td>
                      <td>{bus.driverName || '—'}</td>
                      <td>{bus.routeName || bus.routeId || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="btn btn-outline btn-sm"
                            title="Edit Bus"
                            onClick={() => {
                              setEditingBus(bus);
                              setBusForm({
                                busNumber: bus.busNumber,
                                registrationNumber: bus.registrationNumber,
                                capacity: bus.capacity || 52,
                                status: bus.status || 'AVAILABLE'
                              });
                              setShowBusModal(true);
                            }}
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            className="btn btn-outline btn-sm text-danger"
                            title="Delete Bus"
                            onClick={() => handleDeleteBus(bus)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: ROUTE MANAGEMENT */}
        {activeTab === 'routes' && (
          <div className="routes-management-tab">
            <div className="section-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2>Corridor Transport Routes</h2>
                <p>Define origins, destinations, scheduled departure times, and student boarding stops.</p>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setEditingRoute(null);
                  setRouteForm({
                    routeName: `Route 0${routesList.length + 1} Corridor`,
                    code: `ROUTE-VZ0${routesList.length + 1}`,
                    from: 'Vizianagaram RTC Complex',
                    to: 'Visakhapatnam',
                    reportingTime: '06:50 AM',
                    departureTime: '07:15 AM',
                    expectedArrival: '08:15 AM',
                    stopsText: 'Vizianagaram RTC Complex, Mayuri Junction, MVGR Campus'
                  });
                  setShowRouteModal(true);
                }}
              >
                <Plus size={16} /> Create New Route
              </button>
            </div>

            <div className="routes-grid-admin">
              {routesList.map((route) => (
                <div key={route.id} className="route-admin-card">
                  <div className="route-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div className="route-code-badge">{route.code || 'RT'}</div>
                      <div>
                        <h3>{route.routeName || route.name}</h3>
                        <span className="inst-assigned-text">
                          From <strong>{route.from}</strong> → <strong>{route.to}</strong>
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => {
                          setEditingRoute(route);
                          setRouteForm({
                            routeName: route.routeName || route.name,
                            code: route.code || 'RT',
                            from: route.from || '',
                            to: route.to || '',
                            reportingTime: route.reportingTime || '06:50 AM',
                            departureTime: route.departureTime || '07:15 AM',
                            expectedArrival: route.expectedArrival || '08:15 AM',
                            stopsText: (route.stops || []).map((s) => s.name).join(', ')
                          });
                          setShowRouteModal(true);
                        }}
                      >
                        <Edit3 size={13} /> Edit
                      </button>
                      <button
                        className="btn btn-outline btn-sm text-danger"
                        onClick={() => handleDeleteRoute(route)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="timing-strip" style={{ margin: '14px 0', display: 'flex', gap: '16px', fontSize: '0.85rem' }}>
                    <div>Reporting: <strong>{route.reportingTime || '06:50 AM'}</strong></div>
                    <div>Departure: <strong>{route.departureTime || '07:15 AM'}</strong></div>
                    <div>Arrival: <strong>{route.expectedArrival || '08:15 AM'}</strong></div>
                  </div>

                  <div className="stops-admin-list" style={{ borderTop: '1px solid #E2E8F0', paddingTop: '10px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>STOPS ({(route.stops || []).length}):</span>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#334155' }}>
                      {(route.stops || []).map((s) => s.name).join(' → ') || 'Stops not configured'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: SCHEDULE MANAGEMENT (Requirement 18) */}
        {activeTab === 'schedules' && (
          <div className="schedules-management-tab">
            <div className="section-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2>Transport Schedule Management</h2>
                <p>Assign approved drivers, vehicles, departure times, and stop timings for active transport shifts.</p>
              </div>
              <button className="btn btn-primary" onClick={handleOpenCreateSchedule}>
                <Plus size={16} /> Create Schedule
              </button>
            </div>

            {schedulesList.length === 0 ? (
              <div className="admin-empty-box" style={{ padding: '60px 20px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <Calendar size={44} color="#94A3B8" style={{ marginBottom: '12px' }} />
                <h3>No Schedules Configured</h3>
                <p style={{ color: '#64748B', marginBottom: '20px' }}>Create an operational schedule to link an approved driver, bus, and route.</p>
                <button className="btn btn-primary" onClick={handleOpenCreateSchedule}>
                  <Plus size={16} /> Create First Schedule
                </button>
              </div>
            ) : (
              <div className="schedules-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
                {schedulesList.map((sched) => (
                  <div key={sched.id} className="admin-card" style={{ padding: '20px', background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                      <div>
                        <span style={{ fontSize: '0.8rem', background: '#EFF6FF', color: '#2563EB', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
                          {sched.routeCode || 'SCHEDULE'}
                        </span>
                        <h3 style={{ margin: '8px 0 2px 0', fontSize: '1.15rem', color: '#0F172A' }}>{sched.busNumber || sched.busId}</h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>{sched.routeName || 'Corridor Route'}</p>
                      </div>
                      <button
                        className="btn btn-outline btn-sm text-danger"
                        onClick={() => handleDeleteSchedule(sched.id)}
                        title="Delete Schedule"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: '#F8FAFC', borderRadius: '8px', fontSize: '0.88rem' }}>
                      <div>Driver: <strong style={{ color: '#0F172A' }}>{sched.driverName || 'Assigned Driver'}</strong></div>
                      <div>Operating: <strong>{sched.operatingDay || 'Daily'}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Departure: <strong>{sched.departureTime}</strong></span>
                        <span>Arrival: <strong>{sched.expectedArrival}</strong></span>
                      </div>
                    </div>

                    {sched.stops && sched.stops.length > 0 && (
                      <div style={{ marginTop: '14px', borderTop: '1px solid #E2E8F0', paddingTop: '10px' }}>
                        <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>STOP TIMINGS:</span>
                        <ul style={{ margin: '6px 0 0 0', paddingLeft: '18px', fontSize: '0.82rem', color: '#334155' }}>
                          {sched.stops.slice(0, 4).map((st, i) => (
                            <li key={i} style={{ marginBottom: '2px' }}>
                              {st.name} — <strong>{st.scheduledTime}</strong>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: LIVE FLEET & MAP */}
        {activeTab === 'fleet' && (
          <div className="live-fleet-tab">
            <div className="fleet-layout-grid">
              {/* Bus Selector Column */}
              <div className="fleet-sidebar-col">
                <div className="col-header">
                  <h3>Corridor Fleet ({fleetList.length})</h3>
                  <span className="hint-text">Select bus to monitor live telemetry</span>
                </div>

                <div className="fleet-card-list">
                  {fleetList.map((bus) => {
                    const isSelected = selectedBusForMap?.id === bus.id;
                    const isLive = bus.status === 'ON_TRIP' || bus.status === 'LIVE';

                    return (
                      <div
                        key={bus.id}
                        className={`fleet-bus-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedBusForMap(bus)}
                      >
                        <div className="item-top-row">
                          <div className="bus-id-tag">
                            <Bus size={14} />
                            <strong>{bus.busNumber}</strong>
                          </div>
                          <span className={`status-pill-micro ${isLive ? 'live' : 'idle'}`}>
                            {isLive ? 'LIVE' : bus.status || 'AVAILABLE'}
                          </span>
                        </div>

                        <div className="item-route-text">
                          {bus.routeName || bus.routeId || 'Unassigned Route'}
                        </div>

                        <div className="item-meta-row">
                          <span>Driver: <strong>{bus.driverName || 'Unassigned'}</strong></span>
                          <code>{bus.registrationNumber}</code>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live Map Frame */}
              <div className="fleet-map-col">
                <div className="map-view-header">
                  <div className="bus-view-info">
                    <h2>{selectedBusForMap?.busNumber || 'Fleet Vehicle'}</h2>
                    <span className="bus-plate">{selectedBusForMap?.registrationNumber || 'AP 35 XX'}</span>
                    <span className="bus-route-hint">{selectedBusForMap?.routeName || 'Corridor Route'}</span>
                  </div>

                  <div className="driver-contact-pill">
                    <UserCheck size={14} />
                    <span>{selectedBusForMap?.driverName || 'Operator'}</span>
                    {selectedBusForMap?.driverPhone && (
                      <a href={`tel:${selectedBusForMap.driverPhone}`} className="driver-call">
                        <Phone size={12} /> {selectedBusForMap.driverPhone}
                      </a>
                    )}
                  </div>
                </div>

                <div className="map-render-shell" style={{ height: '480px' }}>
                  <BusMap busData={selectedBusForMap} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: INCIDENTS */}
        {activeTab === 'incidents' && (
          <div className="incidents-tab">
            <div className="section-title-row" style={{ marginBottom: '20px' }}>
              <h2>Parent Feedback &amp; Transport Incidents</h2>
              <p>Review delays, route queries, and safety notices logged by parents.</p>
            </div>

            {incidents.length === 0 ? (
              <div className="admin-empty-box" style={{ padding: '60px 20px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <CheckCircle2 size={44} color="#16a34a" style={{ marginBottom: '12px' }} />
                <h3>No Open Incidents</h3>
                <p style={{ color: '#64748B' }}>Corridor transport runs are operating without reported exceptions.</p>
              </div>
            ) : (
              <div className="incidents-list">
                {incidents.map((inc) => (
                  <div key={inc.id} className="incident-ticket-card">
                    <div className="ticket-header">
                      <div className="ticket-title-group">
                        <AlertTriangle size={18} color="#dc2626" />
                        <h4>{inc.type || 'Incident Report'}</h4>
                        <span className="bus-tag">{inc.busId || 'Bus'}</span>
                      </div>
                      <span className="ticket-time">
                        {inc.timestamp ? new Date(inc.timestamp).toLocaleString() : 'Recent'}
                      </span>
                    </div>

                    <p className="ticket-desc">{inc.description || 'Details'}</p>

                    <div className="ticket-footer">
                      <span className="reported-by">
                        Reported by: <strong>{inc.parentName || inc.studentName || 'Parent'}</strong>
                      </span>
                      <span className="ticket-status-pill open">{inc.status || 'OPEN'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* DRIVER REVIEW MODAL (Requirement 11) */}
      {reviewingDriver && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '620px', width: '90%' }}>
            <div className="modal-header">
              <h3>Driver Verification Review</h3>
              <button onClick={() => setReviewingDriver(null)} className="drawer-close-btn">
                <XCircle size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
              {/* Photo and identity summary */}
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center', padding: '16px', background: '#F8FAFC', borderRadius: '10px', marginBottom: '20px', border: '1px solid #E2E8F0' }}>
                <div style={{ width: '84px', height: '84px', borderRadius: '8px', overflow: 'hidden', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {reviewingDriver.photoUrl ? (
                    <img src={reviewingDriver.photoUrl} alt="Driver" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <UserCheck size={40} color="#94A3B8" />
                  )}
                </div>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.25rem', color: '#0F172A' }}>{reviewingDriver.fullName || reviewingDriver.name}</h3>
                  <div style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '4px' }}>
                    <Phone size={13} style={{ display: 'inline', marginRight: '4px' }} /> {reviewingDriver.phone || 'Phone not provided'}
                  </div>
                  <div style={{ color: '#64748B', fontSize: '0.9rem' }}>
                    {reviewingDriver.email || 'Email not provided'}
                  </div>
                </div>
              </div>

              {/* Detailed credentials */}
              <div className="submitted-summary-card" style={{ marginTop: 0 }}>
                <div className="summary-row">
                  <span>Educational Institution:</span>
                  <strong>{reviewingDriver.institutionName || 'Corridor Institution'}</strong>
                </div>
                <div className="summary-row">
                  <span>Operating Locality / PIN:</span>
                  <strong>{reviewingDriver.locality || 'Vizianagaram'} (PIN {reviewingDriver.pincode || '535002'})</strong>
                </div>
                <div className="summary-row">
                  <span>Driving Licence (DL) No:</span>
                  <code>{reviewingDriver.licenceNumber || 'Not provided'}</code>
                </div>
                <div className="summary-row">
                  <span>DL Expiry Date:</span>
                  <strong>{reviewingDriver.licenceValidity || 'Valid'}</strong>
                </div>
                <div className="summary-row">
                  <span>Identity Proof:</span>
                  <strong>{reviewingDriver.idDocumentType || 'National ID'} — {reviewingDriver.idDocumentNumber ? `${reviewingDriver.idDocumentNumber.slice(0, 4)} XXXX ${reviewingDriver.idDocumentNumber.slice(-4) || 'XXXX'}` : 'Verified'}</strong>
                </div>
                <div className="summary-row">
                  <span>Heavy Vehicle Experience:</span>
                  <strong>{reviewingDriver.experienceYears || 'Commercial Transport'}</strong>
                </div>
                <div className="summary-row">
                  <span>Application Submitted:</span>
                  <span>{reviewingDriver.submittedAt ? new Date(reviewingDriver.submittedAt).toLocaleString() : 'Recent'}</span>
                </div>
              </div>

              {/* Vehicle & Route Assignment during Approval */}
              <div style={{ marginTop: '16px', padding: '16px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', color: '#0F172A' }}>Vehicle &amp; Route Assignment</h4>
                <p style={{ margin: '0 0 12px 0', fontSize: '0.82rem', color: '#64748B' }}>Assign the physical bus and route this driver will operate today:</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Assigned Bus</label>
                    <select value={assignBusId || (fleetList[0]?.id || '')} onChange={(e) => setAssignBusId(e.target.value)}>
                      {fleetList.length > 0 ? (
                        fleetList.map((b) => (
                          <option key={b.id} value={b.id}>{b.busNumber} ({b.registrationNumber})</option>
                        ))
                      ) : (
                        <option value="">No registered vehicles available</option>
                      )}
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Assigned Route</label>
                    <select value={assignRouteId || (routesList[0]?.id || '')} onChange={(e) => setAssignRouteId(e.target.value)}>
                      {routesList.length > 0 ? (
                        routesList.map((r) => (
                          <option key={r.id} value={r.id}>{r.code ? `${r.code} - ` : ''}{r.routeName || r.name}</option>
                        ))
                      ) : (
                        <option value="">No configured routes available</option>
                      )}
                    </select>
                  </div>
                </div>
              </div>

              {/* Rejection reason box (Requirement 13) */}
              {showRejectBox && (
                <div style={{ marginTop: '16px', padding: '14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px' }}>
                  <label style={{ display: 'block', fontWeight: 600, color: '#991B1B', fontSize: '0.88rem', marginBottom: '6px' }}>
                    Mandatory Rejection Reason:
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="e.g. Commercial driving licence validity expired or mismatched KYC photo..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #FCA5A5', fontSize: '0.88rem' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                    <button type="button" onClick={() => setShowRejectBox(false)} className="btn btn-sm btn-outline">
                      Cancel
                    </button>
                    <button type="button" onClick={handleRejectDriver} className="btn btn-sm" style={{ background: '#DC2626', color: '#fff' }}>
                      Confirm Rejection
                    </button>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              {!showRejectBox && (
                <div className="modal-actions-row" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" onClick={() => setShowRejectBox(true)} className="btn btn-outline text-danger">
                    Reject Application
                  </button>
                  <button type="button" onClick={handleApproveDriver} className="btn btn-primary">
                    <Check size={16} /> Approve Driver
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT SCHEDULE MODAL (Requirement 18) */}
      {showScheduleModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '580px', width: '90%' }}>
            <div className="modal-header">
              <h3>{editingSchedule ? 'Edit Transport Schedule' : 'Create Transport Schedule'}</h3>
              <button onClick={() => setShowScheduleModal(false)} className="drawer-close-btn">
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="modal-body">
              <div className="form-group">
                <label>Assigned Vehicle</label>
                <select
                  required
                  value={scheduleForm.busId}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, busId: e.target.value })}
                >
                  <option value="">-- Select Bus --</option>
                  {fleetList.map((b) => (
                    <option key={b.id} value={b.id}>{b.busNumber} ({b.registrationNumber})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Assigned Driver (Approved Operators)</label>
                <select
                  required
                  value={scheduleForm.driverId}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, driverId: e.target.value })}
                >
                  <option value="">-- Select Approved Driver --</option>
                  {approvedDrivers.map((d) => (
                    <option key={d.driverId || d.uid} value={d.driverId || d.uid}>
                      {d.fullName || d.name} (DL: {d.licenceNumber || 'Verified'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Designated Route</label>
                <select
                  required
                  value={scheduleForm.routeId}
                  onChange={(e) => {
                    const r = routesList.find((rt) => rt.id === e.target.value);
                    setScheduleForm({
                      ...scheduleForm,
                      routeId: e.target.value,
                      departureTime: r?.departureTime || scheduleForm.departureTime,
                      expectedArrival: r?.expectedArrival || scheduleForm.expectedArrival,
                      stopsText: r?.stops?.length
                        ? r.stops.map((s) => `${s.name} — ${s.scheduledTime || '07:25 AM'}`).join(', ')
                        : scheduleForm.stopsText
                    });
                  }}
                >
                  <option value="">-- Select Route --</option>
                  {routesList.map((r) => (
                    <option key={r.id} value={r.id}>{r.code || 'RT'} — {r.routeName || r.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Departure Time</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 07:15 AM"
                    value={scheduleForm.departureTime}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, departureTime: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Campus Arrival Time</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 08:20 AM"
                    value={scheduleForm.expectedArrival}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, expectedArrival: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Boarding Stops &amp; Timings</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Mayuri Junction — 07:25 AM, Balaji Nagar — 07:35 AM, Thagarapuvalasa — 07:55 AM"
                  value={scheduleForm.stopsText}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, stopsText: e.target.value })}
                />
                <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Format: Stop Name — HH:MM AM/PM (comma-separated)</span>
              </div>

              <div className="modal-actions-row" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowScheduleModal(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BUS ADD/EDIT MODAL */}
      {showBusModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingBus ? 'Edit Fleet Bus' : 'Add Fleet Bus'}</h3>
              <button onClick={() => setShowBusModal(false)} className="drawer-close-btn">
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveBus} className="modal-body">
              <div className="form-group">
                <label>Bus Display Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Bus 25"
                  value={busForm.busNumber}
                  onChange={(e) => setBusForm({ ...busForm, busNumber: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Registration Number (Plate)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., AP 35 U 2525"
                  value={busForm.registrationNumber}
                  onChange={(e) => setBusForm({ ...busForm, registrationNumber: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Seating Capacity</label>
                <input
                  type="number"
                  required
                  value={busForm.capacity}
                  onChange={(e) => setBusForm({ ...busForm, capacity: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={busForm.status}
                  onChange={(e) => setBusForm({ ...busForm, status: e.target.value })}
                >
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="ASSIGNED">ASSIGNED</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                  <option value="OFFLINE">OFFLINE</option>
                </select>
              </div>

              <div className="modal-actions-row">
                <button type="button" onClick={() => setShowBusModal(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingBus ? 'Save Changes' : 'Create Bus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ROUTE ADD/EDIT MODAL */}
      {showRouteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingRoute ? 'Edit Route' : 'Create New Route'}</h3>
              <button onClick={() => setShowRouteModal(false)} className="drawer-close-btn">
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRoute} className="modal-body">
              <div className="form-group">
                <label>Route Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Route 05 (RTC Complex -> Tagarapuvalasa)"
                  value={routeForm.routeName}
                  onChange={(e) => setRouteForm({ ...routeForm, routeName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Route Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., ROUTE-VZ05"
                  value={routeForm.code}
                  onChange={(e) => setRouteForm({ ...routeForm, code: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Origin</label>
                  <input
                    type="text"
                    required
                    value={routeForm.from}
                    onChange={(e) => setRouteForm({ ...routeForm, from: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Destination</label>
                  <input
                    type="text"
                    required
                    value={routeForm.to}
                    onChange={(e) => setRouteForm({ ...routeForm, to: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Departure Time</label>
                  <input
                    type="text"
                    required
                    value={routeForm.departureTime}
                    onChange={(e) => setRouteForm({ ...routeForm, departureTime: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Expected Arrival</label>
                  <input
                    type="text"
                    required
                    value={routeForm.expectedArrival}
                    onChange={(e) => setRouteForm({ ...routeForm, expectedArrival: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Boarding Stops (Comma separated)</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Vizianagaram RTC Complex, Mayuri Junction, Balaji Nagar, Campus Gate"
                  value={routeForm.stopsText}
                  onChange={(e) => setRouteForm({ ...routeForm, stopsText: e.target.value })}
                />
              </div>

              <div className="modal-actions-row">
                <button type="button" onClick={() => setShowRouteModal(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingRoute ? 'Save Changes' : 'Create Route'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
    </AdminShell>
  );
}
