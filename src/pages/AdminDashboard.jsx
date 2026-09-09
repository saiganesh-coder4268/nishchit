import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import BusMap from '../components/BusMap';
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
  subscribeLiveLocation
} from '../services/transportService';
import {
  ShieldCheck, Bus, MapPin, Building2, AlertTriangle,
  CheckCircle2, XCircle, Clock, Radio, Plus, UserCheck,
  Phone, Check, Navigation, Trash2, Edit3, History
} from 'lucide-react';

export default function AdminDashboard() {
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState('fleet'); // 'fleet' | 'drivers' | 'buses' | 'routes' | 'history' | 'incidents'
  const [fleetList, setFleetList] = useState([]);
  const [routesList, setRoutesList] = useState([]);
  const [driverApps, setDriverApps] = useState([]);
  const [activeTrips, setActiveTrips] = useState([]);
  const [tripHistory, setTripHistory] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [selectedBusForMap, setSelectedBusForMap] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);


  // Modals state
  const [approvingDriver, setApprovingDriver] = useState(null);
  const [decliningDriver, setDecliningDriver] = useState(null);
  const [declineReason, setDeclineReason] = useState('');
  const [assignBusId, setAssignBusId] = useState('');
  const [assignRouteId, setAssignRouteId] = useState('');

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

  // 1. Realtime Firestore Subscriptions
  useEffect(() => {
    const unsubBuses = subscribeBuses((data) => {
      setFleetList(data);
      if (data.length > 0 && !selectedBusForMap) {
        setSelectedBusForMap(data[0]);
      } else if (selectedBusForMap) {
        const updated = data.find((b) => b.id === selectedBusForMap.id);
        if (updated) setSelectedBusForMap((prev) => ({ ...prev, ...updated }));
      }
    });

    const unsubRoutes = subscribeRoutes((data) => {
      setRoutesList(data);
    });

    const unsubDrivers = subscribeDriverApplications((data) => {
      setDriverApps(data);
    });

    const unsubActiveTrips = subscribeActiveTrips((data) => {
      setActiveTrips(data);
    });

    const unsubHistory = subscribeTripHistory((data) => {
      setTripHistory(data);
    });

    const unsubIncidents = subscribeIncidentReports((data) => {
      setIncidents(data);
    });

    return () => {
      unsubBuses();
      unsubRoutes();
      unsubDrivers();
      unsubActiveTrips();
      unsubHistory();
      unsubIncidents();
    };
  }, []);

  // 2. Realtime GPS Subscription for Selected Bus on Map
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

  // Driver Approval
  const handleApprove = async () => {
    if (!approvingDriver) return;
    try {
      const bId = assignBusId || fleetList[0]?.id || 'BUS-24';
      const rId = assignRouteId || routesList[0]?.id || 'ROUTE-VZ04';
      await approveDriverApplication(
        approvingDriver.applicationId || approvingDriver.id,
        approvingDriver.driverId || approvingDriver.uid,
        bId,
        rId,
        currentUser?.uid || 'admin'
      );
      showFeedback(`Driver ${approvingDriver.fullName || approvingDriver.name} verified & assigned to ${bId}!`);
      setApprovingDriver(null);
    } catch (err) {
      console.error(err);
      showFeedback(`Error: ${err.message}`);
    }
  };

  // Driver Decline
  const handleDecline = async (e) => {
    e.preventDefault();
    if (!decliningDriver) return;
    try {
      await rejectDriverApplication(
        decliningDriver.applicationId || decliningDriver.id,
        decliningDriver.driverId || decliningDriver.uid,
        declineReason || 'Documentation validity could not be confirmed.',
        currentUser?.uid || 'admin'
      );
      showFeedback(`Application for ${decliningDriver.fullName || decliningDriver.name} marked as Rejected.`);
      setDecliningDriver(null);
      setDeclineReason('');
    } catch (err) {
      console.error(err);
      showFeedback(`Error: ${err.message}`);
    }
  };

  // Bus Management Submit
  const handleSaveBus = async (e) => {
    e.preventDefault();
    try {
      if (editingBus) {
        await updateBus(editingBus.id, {
          busNumber: busForm.busNumber,
          registrationNumber: busForm.registrationNumber,
          capacity: Number(busForm.capacity),
          status: busForm.status
        });
        showFeedback(`Bus ${busForm.busNumber} updated.`);
      } else {
        await createBus(busForm);
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

  // Route Management Submit
  const handleSaveRoute = async (e) => {
    e.preventDefault();
    try {
      const stops = routeForm.stopsText.split(',').map((s, idx) => ({
        name: s.trim(),
        scheduledTime: `${7 + Math.floor(idx / 4)}:${(idx % 4) * 15 || '00'} AM`
      })).filter((s) => s.name);

      const payload = {
        routeName: routeForm.routeName,
        name: routeForm.routeName,
        code: routeForm.code || 'RT',
        from: routeForm.from,
        to: routeForm.to,
        reportingTime: routeForm.reportingTime,
        departureTime: routeForm.departureTime,
        expectedArrival: routeForm.expectedArrival,
        stops
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

  // Operational Dynamic Statistics from Firebase
  const totalBuses = fleetList.length;
  const activeBuses = fleetList.filter((b) => b.status === 'ON_TRIP' || b.status === 'LIVE').length;
  const verifiedDrivers = driverApps.filter((d) => (d.status || d.verificationStatus) === 'approved').length;
  const pendingVerifications = driverApps.filter((d) => (d.status || d.verificationStatus) === 'pending').length;
  const totalRoutes = routesList.length;
  const activeTripsCount = activeTrips.length;

  return (
    <div className="admin-dashboard-page">

      {/* 1. TOP CONTROL ROOM HEADER */}
      <div className="admin-header-bar">
        <div className="admin-title-group">
          <div className="admin-badge"><ShieldCheck size={20} /></div>
          <div>
            <h1>Transport Authority Control Room</h1>
            <p>Vizianagaram – Thagarapuvalasa – Visakhapatnam Corridor Dispatch</p>
          </div>
        </div>

        <div className="admin-profile-chip">
          <div className="admin-avatar">AD</div>
          <div>
            <strong>{currentUser?.name || currentUser?.fullName || 'Transport Controller'}</strong>
            <span>Chief Transport Officer</span>
          </div>
        </div>
      </div>

      {actionNotice && (
        <div className="admin-action-notice">
          <CheckCircle2 size={18} color="#16a34a" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* 2. STATS & OPERATIONAL METRICS STRIP (All from Firebase) */}
      <div className="admin-metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
        <div className="metric-card" onClick={() => setActiveTab('buses')}>
          <div className="metric-icon blue"><Bus size={22} /></div>
          <div className="metric-data">
            <span className="metric-number">{totalBuses}</span>
            <span className="metric-label">Total Buses</span>
          </div>
        </div>

        <div className="metric-card" onClick={() => setActiveTab('fleet')}>
          <div className="metric-icon green"><Radio size={22} /></div>
          <div className="metric-data">
            <span className="metric-number">{activeBuses || activeTripsCount}</span>
            <span className="metric-label">Active Buses on Trip</span>
          </div>
        </div>

        <div className="metric-card" onClick={() => setActiveTab('drivers')}>
          <div className="metric-icon amber"><UserCheck size={22} /></div>
          <div className="metric-data">
            <span className="metric-number">{pendingVerifications}</span>
            <span className="metric-label">Pending Verifications</span>
          </div>
        </div>

        <div className="metric-card" onClick={() => setActiveTab('drivers')}>
          <div className="metric-icon green"><CheckCircle2 size={22} /></div>
          <div className="metric-data">
            <span className="metric-number">{verifiedDrivers}</span>
            <span className="metric-label">Verified Drivers</span>
          </div>
        </div>

        <div className="metric-card" onClick={() => setActiveTab('routes')}>
          <div className="metric-icon blue"><MapPin size={22} /></div>
          <div className="metric-data">
            <span className="metric-number">{totalRoutes}</span>
            <span className="metric-label">Total Routes</span>
          </div>
        </div>

        <div className="metric-card" onClick={() => setActiveTab('history')}>
          <div className="metric-icon gray"><History size={22} /></div>
          <div className="metric-data">
            <span className="metric-number">{tripHistory.length}</span>
            <span className="metric-label">Completed Trips</span>
          </div>
        </div>
      </div>

      {/* 3. NAVIGATION TABS */}
      <div className="admin-nav-tabs">
        <button
          className={`tab-btn ${activeTab === 'fleet' ? 'active' : ''}`}
          onClick={() => setActiveTab('fleet')}
        >
          <Bus size={16} /> Live Fleet & Map
          {activeBuses > 0 && <span className="tab-counter-badge green">{activeBuses}</span>}
        </button>

        <button
          className={`tab-btn ${activeTab === 'drivers' ? 'active' : ''}`}
          onClick={() => setActiveTab('drivers')}
        >
          <ShieldCheck size={16} /> Driver Verification Queue
          {pendingVerifications > 0 && <span className="tab-counter-badge">{pendingVerifications}</span>}
        </button>

        <button
          className={`tab-btn ${activeTab === 'buses' ? 'active' : ''}`}
          onClick={() => setActiveTab('buses')}
        >
          <Bus size={16} /> Bus Management ({fleetList.length})
        </button>

        <button
          className={`tab-btn ${activeTab === 'routes' ? 'active' : ''}`}
          onClick={() => setActiveTab('routes')}
        >
          <MapPin size={16} /> Route Management ({routesList.length})
        </button>

        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={16} /> Trip Audit History
        </button>

        <button
          className={`tab-btn ${activeTab === 'incidents' ? 'active' : ''}`}
          onClick={() => setActiveTab('incidents')}
        >
          <AlertTriangle size={16} /> Incidents & Safety ({incidents.length})
        </button>
      </div>

      {/* 4. TAB CONTENTS */}
      <div className="admin-tab-content">

        {/* TAB 1: LIVE FLEET & MAP */}
        {activeTab === 'fleet' && (
          <div className="fleet-tab-layout">
            <div className="fleet-list-col">
              <div className="col-header">
                <h3>Live Fleet Telemetry ({fleetList.length})</h3>
                <span className="subhead">Click any bus to inspect realtime GPS</span>
              </div>

              <div className="fleet-cards-scroll">
                {fleetList.length === 0 ? (
                  <div className="empty-state-card" style={{ padding: '24px' }}>
                    <Bus size={32} color="#94a3b8" />
                    <p>No buses configured yet.</p>
                  </div>
                ) : (
                  fleetList.map((bus) => {
                    const isSelected = selectedBusForMap?.id === bus.id;
                    const isLive = bus.status === 'ON_TRIP' || bus.status === 'LIVE';
                    return (
                      <div 
                        key={bus.id}
                        className={`fleet-item-card ${isSelected ? 'selected' : ''} ${isLive ? 'live-border' : ''}`}
                        onClick={() => setSelectedBusForMap(bus)}
                      >
                        <div className="item-header">
                          <strong>{bus.busNumber}</strong>
                          <span className={`status-pill-sm ${isLive ? 'live' : bus.status === 'COMPLETED' ? 'completed' : 'not_started'}`}>
                            {isLive && <span className="pulse-dot-green"></span>}
                            {isLive ? 'LIVE ON TRIP' : bus.status === 'COMPLETED' ? 'COMPLETED' : bus.status || 'AVAILABLE'}
                          </span>
                        </div>

                        <div className="item-sub">
                          <span>Reg: <code>{bus.registrationNumber}</code></span>
                          <span>Cap: {bus.capacity || 52} seats</span>
                        </div>

                        <div className="item-route">
                          <MapPin size={12} />
                          <span>{bus.routeName || 'Corridor Route'}</span>
                        </div>

                        <div className="item-driver">
                          <UserCheck size={12} />
                          <span>Driver: <strong>{bus.driverName || 'No Driver Assigned'}</strong></span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="fleet-map-col">
              <div className="map-col-header">
                <div className="selected-bus-meta">
                  <span className="selected-title">Inspecting: <strong>{selectedBusForMap?.busNumber || 'Fleet Vehicle'}</strong></span>
                  <span className="selected-reg">({selectedBusForMap?.registrationNumber || 'AP 35 XX'})</span>
                </div>
                <div className="telem-chip">
                  <Radio size={14} color="#16a34a" />
                  <span>
                    Lat: {selectedBusForMap?.latitude ? Number(selectedBusForMap.latitude).toFixed(4) : '--'}°, 
                    Lng: {selectedBusForMap?.longitude ? Number(selectedBusForMap.longitude).toFixed(4) : '--'}°
                  </span>
                </div>
              </div>

              <div className="admin-map-frame">
                <BusMap busData={selectedBusForMap} key={selectedBusForMap?.id} />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DRIVER APPLICATIONS QUEUE */}
        {activeTab === 'drivers' && (
          <div className="drivers-queue-layout">
            <div className="section-title-row">
              <div>
                <h2>Driver Verification & Authorization Queue</h2>
                <p>Review submitted license proofs, verify KYC details, and authorize vehicles and routes.</p>
              </div>
            </div>

            {driverApps.length === 0 ? (
              <div className="empty-state-card">
                <ShieldCheck size={48} color="#94a3b8" />
                <h3>No Driver Applications in Queue</h3>
                <p>When drivers register on Nishchit and submit onboarding documents, their applications appear here for verification.</p>
              </div>
            ) : (
              <div className="driver-apps-grid">
                {driverApps.map((app) => {
                  const status = (app.status || app.verificationStatus || 'pending').toLowerCase();
                  const isPending = status === 'pending';
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
                          <span className="phone-line"><Phone size={12} /> {app.phone}</span>
                          <span className="institution-line"><Building2 size={12} /> {app.institutionName || 'Corridor Transport'}</span>
                        </div>

                        <div className="app-status-badge">
                          <span className={`status-pill ${status}`}>
                            {status.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="kyc-details-strip">
                        <div className="kyc-row">
                          <span className="kyc-label">Driving Licence:</span>
                          <strong>{app.licenceNumber || 'Not specified'}</strong>
                          {app.licenceValidity && <span className="validity-tag">Valid till {app.licenceValidity}</span>}
                        </div>

                        <div className="kyc-row">
                          <span className="kyc-label">Requested Corridor:</span>
                          <span>{app.from || 'Vizianagaram'} → {app.to || 'Visakhapatnam'}</span>
                        </div>

                        <div className="kyc-row">
                          <span className="kyc-label">Locality / PIN:</span>
                          <span>{app.locality || 'Corridor Area'} ({app.pincode || '535002'})</span>
                        </div>

                        <div className="kyc-row">
                          <span className="kyc-label">Experience:</span>
                          <span>{app.experienceYears || 'Commercial Vehicle Experience'}</span>
                        </div>

                        <div className="kyc-row">
                          <span className="kyc-label">Submitted At:</span>
                          <span>{app.submittedAt ? new Date(app.submittedAt).toLocaleString() : 'Recent'}</span>
                        </div>

                        {isRejected && app.rejectionReason && (
                          <div className="kyc-row" style={{ color: '#dc2626' }}>
                            <span className="kyc-label">Decline Reason:</span>
                            <span>{app.rejectionReason}</span>
                          </div>
                        )}
                      </div>

                      {isPending && (
                        <div className="app-card-actions">
                          <button
                            type="button"
                            onClick={() => {
                              setApprovingDriver(app);
                              setAssignBusId(fleetList[0]?.id || '');
                              setAssignRouteId(routesList[0]?.id || '');
                            }}
                            className="btn btn-primary btn-sm"
                          >
                            <Check size={14} /> Review & Approve Assignment
                          </button>

                          <button
                            type="button"
                            onClick={() => setDecliningDriver(app)}
                            className="btn btn-outline btn-sm text-danger"
                          >
                            <XCircle size={14} /> Decline
                          </button>
                        </div>
                      )}

                      {isApproved && (
                        <div className="approved-assignment-tag">
                          <CheckCircle2 size={14} color="#16a34a" />
                          <span>Assigned to <strong>{app.assignedBusId || 'Bus'}</strong> on <strong>{app.assignedRouteId || 'Route'}</strong></span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: BUS MANAGEMENT */}
        {activeTab === 'buses' && (
          <div className="bus-management-tab">
            <div className="section-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2>Fleet Vehicle Management</h2>
                <p>Register new buses, manage registration plates, seating capacity, and driver allocations.</p>
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
                    <th>Registration No.</th>
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

        {/* TAB 4: ROUTE MANAGEMENT */}
        {activeTab === 'routes' && (
          <div className="routes-management-tab">
            <div className="section-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2>Corridor Transport Routes</h2>
                <p>Define departure timings, scheduled student boarding stops, and assigned vehicles.</p>
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

                  <div className="timing-strip">
                    <div className="timing-item">
                      <Clock size={12} />
                      <span>Reporting: <strong>{route.reportingTime || '06:50 AM'}</strong></span>
                    </div>
                    <div className="timing-item">
                      <Navigation size={12} />
                      <span>Departure: <strong>{route.departureTime || '07:15 AM'}</strong></span>
                    </div>
                    <div className="timing-item">
                      <Building2 size={12} />
                      <span>Arrival: <strong>{route.expectedArrival || '08:15 AM'}</strong></span>
                    </div>
                  </div>

                  <div className="stops-admin-list">
                    <h4>Boarding Stops ({(route.stops || []).length})</h4>
                    <ol className="stops-ordered-list">
                      {(route.stops || []).map((stop, sIdx) => (
                        <li key={sIdx} className="stop-admin-row">
                          <span className="stop-name-bold">{stop.name}</span>
                          <span className="stop-time-tag">{stop.scheduledTime || '—'}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: TRIP HISTORY */}
        {activeTab === 'history' && (
          <div className="history-tab-layout">
            <div className="section-title-row">
              <div>
                <h2>Completed Transport Trips Audit Log</h2>
                <p>Historical records of safely completed corridor bus runs stored in Firestore.</p>
              </div>
            </div>

            {tripHistory.length === 0 ? (
              <div className="empty-state-card">
                <History size={48} color="#94a3b8" />
                <h3>No Completed Trips in Audit Log</h3>
                <p>When drivers end active trips, historical operational records with duration and timestamps appear here.</p>
              </div>
            ) : (
              <div className="students-table-frame">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th>Trip ID</th>
                      <th>Bus Number</th>
                      <th>Driver Name</th>
                      <th>Route</th>
                      <th>Started At</th>
                      <th>Ended At</th>
                      <th>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tripHistory.map((trip) => (
                      <tr key={trip.id}>
                        <td><code>{trip.id}</code></td>
                        <td><strong>{trip.busNumber || trip.busId}</strong></td>
                        <td>{trip.driverName || 'Driver'}</td>
                        <td>{trip.routeName || 'Corridor Run'}</td>
                        <td>{trip.startedAt ? new Date(trip.startedAt).toLocaleTimeString() : '—'}</td>
                        <td>{trip.endedAt ? new Date(trip.endedAt).toLocaleTimeString() : '—'}</td>
                        <td><span className="badge-chip">{trip.durationMinutes || 1} min</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: INCIDENTS DESK */}
        {activeTab === 'incidents' && (
          <div className="incidents-tab-layout">
            <div className="section-title-row">
              <div>
                <h2>Incident & Safety Dispatch Desk</h2>
                <p>Live incoming reports from parents and drivers in the corridor.</p>
              </div>
            </div>

            {incidents.length === 0 ? (
              <div className="empty-state-card">
                <CheckCircle2 size={48} color="#16a34a" />
                <h3>All Clear Across the Corridor</h3>
                <p>No active incidents or reports submitted at this time.</p>
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
                        {new Date(inc.timestamp || Date.now()).toLocaleString()}
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

      {/* DRIVER APPROVAL MODAL */}
      {approvingDriver && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Approve Driver & Assign Transport</h3>
              <button onClick={() => setApprovingDriver(null)} className="drawer-close-btn">
                <XCircle size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p>
                Authorizing <strong>{approvingDriver.fullName || approvingDriver.name}</strong> for corridor operations.
              </p>

              <div className="form-group">
                <label>Select Fleet Vehicle</label>
                <select value={assignBusId} onChange={(e) => setAssignBusId(e.target.value)}>
                  {fleetList.map((b) => (
                    <option key={b.id} value={b.id}>{b.busNumber} ({b.registrationNumber})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Select Scheduled Route</label>
                <select value={assignRouteId} onChange={(e) => setAssignRouteId(e.target.value)}>
                  {routesList.map((r) => (
                    <option key={r.id} value={r.id}>{r.code || 'RT'} - {r.routeName || r.name}</option>
                  ))}
                </select>
              </div>

              <div className="modal-actions-row">
                <button type="button" onClick={() => setApprovingDriver(null)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="button" onClick={handleApprove} className="btn btn-primary">
                  Confirm Approval & Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DRIVER DECLINE MODAL */}
      {decliningDriver && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Decline Driver Application</h3>
              <button onClick={() => setDecliningDriver(null)} className="drawer-close-btn">
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleDecline} className="modal-body">
              <p>
                Please provide an official rejection reason for <strong>{decliningDriver.fullName || decliningDriver.name}</strong>.
              </p>

              <div className="form-group">
                <label>Rejection Reason</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g., Commercial heavy vehicle license validity expired or KYC photo mismatch..."
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                />
              </div>

              <div className="modal-actions-row">
                <button type="button" onClick={() => setDecliningDriver(null)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#dc2626', borderColor: '#dc2626' }}>
                  Decline Application
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
  );
}
