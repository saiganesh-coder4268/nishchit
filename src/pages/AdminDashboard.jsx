import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import BusMap from '../components/BusMap';
import { 
  subscribeFleet, 
  subscribeDriverApplications, 
  approveDriverApplication, 
  rejectDriverApplication,
  subscribeIncidentReports 
} from '../utils/transportService';
import { 
  REGISTERED_INSTITUTIONS, 
  INITIAL_VEHICLES, 
  INITIAL_ROUTES, 
  INITIAL_STUDENTS 
} from '../data/regionData';
import { 
  ShieldCheck, Bus, MapPin, Users, Building2, AlertTriangle, 
  CheckCircle2, XCircle, Clock, Radio, Search, Plus, UserCheck, 
  Calendar, Phone, FileText, Check, Navigation, Eye
} from 'lucide-react';

export default function AdminDashboard() {
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState('fleet'); // 'fleet' | 'drivers' | 'institutions' | 'routes' | 'students' | 'incidents'
  const [fleetList, setFleetList] = useState(INITIAL_VEHICLES);
  const [driverApps, setDriverApps] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [selectedBusForMap, setSelectedBusForMap] = useState(INITIAL_VEHICLES[0]);
  const [actionNotice, setActionNotice] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected driver modal for approval
  const [approvingDriver, setApprovingDriver] = useState(null);
  const [assignBusId, setAssignBusId] = useState('BUS-24');
  const [assignRouteId, setAssignRouteId] = useState('ROUTE-VZ04');

  // Subscriptions
  useEffect(() => {
    const unsubFleet = subscribeFleet((data) => {
      setFleetList(data);
      if (selectedBusForMap) {
        const updatedSelected = data.find(b => b.id === selectedBusForMap.id);
        if (updatedSelected) setSelectedBusForMap(updatedSelected);
      }
    });

    const unsubDrivers = subscribeDriverApplications((data) => {
      setDriverApps(data);
    });

    const unsubIncidents = subscribeIncidentReports((data) => {
      setIncidents(data);
    });

    return () => {
      unsubFleet();
      unsubDrivers();
      unsubIncidents();
    };
  }, []);

  const showFeedback = (msg) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleApprove = async () => {
    if (!approvingDriver) return;
    try {
      await approveDriverApplication(approvingDriver.driverId || approvingDriver.uid, assignBusId, assignRouteId);
      showFeedback(`Driver ${approvingDriver.fullName || approvingDriver.name} approved & assigned to ${assignBusId}!`);
      setApprovingDriver(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (driver) => {
    try {
      await rejectDriverApplication(driver.driverId || driver.uid, "Documentation validity expired.");
      showFeedback(`Driver application for ${driver.fullName || driver.name} marked as Rejected.`);
    } catch (err) {
      console.error(err);
    }
  };

  // Metrics
  const totalBuses = fleetList.length;
  const liveBuses = fleetList.filter(b => b.status === 'LIVE').length;
  const pendingDrivers = driverApps.filter(d => d.verificationStatus === 'PENDING').length;
  const openIncidents = incidents.filter(i => i.status === 'OPEN' || !i.status).length;

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
          <div className="admin-avatar">KR</div>
          <div>
            <strong>{currentUser?.name || 'K. Ramakrishna'}</strong>
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

      {/* 2. STATS & METRICS STRIP */}
      <div className="admin-metrics-grid">
        <div className="metric-card" onClick={() => setActiveTab('fleet')}>
          <div className="metric-icon blue"><Bus size={22} /></div>
          <div className="metric-data">
            <span className="metric-number">{totalBuses}</span>
            <span className="metric-label">Registered Fleet Vehicles</span>
          </div>
        </div>

        <div className="metric-card" onClick={() => setActiveTab('fleet')}>
          <div className="metric-icon green"><Radio size={22} /></div>
          <div className="metric-data">
            <span className="metric-number">{liveBuses}</span>
            <span className="metric-label">Live On Route Now</span>
          </div>
        </div>

        <div className="metric-card" onClick={() => setActiveTab('drivers')}>
          <div className="metric-icon amber"><UserCheck size={22} /></div>
          <div className="metric-data">
            <span className="metric-number">{pendingDrivers}</span>
            <span className="metric-label">Driver Verification Requests</span>
          </div>
        </div>

        <div className="metric-card" onClick={() => setActiveTab('incidents')}>
          <div className="metric-icon red"><AlertTriangle size={22} /></div>
          <div className="metric-data">
            <span className="metric-number">{openIncidents}</span>
            <span className="metric-label">Active Incident Tickets</span>
          </div>
        </div>
      </div>

      {/* 3. NAVIGATION TABS */}
      <div className="admin-nav-tabs">
        <button
          className={`tab-btn ${activeTab === 'fleet' ? 'active' : ''}`}
          onClick={() => setActiveTab('fleet')}
        >
          <Bus size={16} /> Live Fleet Telemetry & Map
        </button>

        <button
          className={`tab-btn ${activeTab === 'drivers' ? 'active' : ''}`}
          onClick={() => setActiveTab('drivers')}
        >
          <ShieldCheck size={16} /> Driver Verification Queue
          {pendingDrivers > 0 && <span className="tab-counter-badge">{pendingDrivers}</span>}
        </button>

        <button
          className={`tab-btn ${activeTab === 'institutions' ? 'active' : ''}`}
          onClick={() => setActiveTab('institutions')}
        >
          <Building2 size={16} /> Campuses & Institutions
        </button>

        <button
          className={`tab-btn ${activeTab === 'routes' ? 'active' : ''}`}
          onClick={() => setActiveTab('routes')}
        >
          <MapPin size={16} /> Routes & Schedules
        </button>

        <button
          className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          <Users size={16} /> Student Directory
        </button>

        <button
          className={`tab-btn ${activeTab === 'incidents' ? 'active' : ''}`}
          onClick={() => setActiveTab('incidents')}
        >
          <AlertTriangle size={16} /> Incidents & Safety
          {openIncidents > 0 && <span className="tab-counter-badge red">{openIncidents}</span>}
        </button>
      </div>

      {/* 4. TAB CONTENTS */}
      <div className="admin-tab-content">
        
        {/* TAB 1: FLEET & LIVE MAP */}
        {activeTab === 'fleet' && (
          <div className="fleet-tab-layout">
            <div className="fleet-list-col">
              <div className="col-header">
                <h3>Fleet Status ({fleetList.length})</h3>
                <span className="subhead">Click a bus to inspect telemetry</span>
              </div>

              <div className="fleet-cards-scroll">
                {fleetList.map((bus) => {
                  const isSelected = selectedBusForMap?.id === bus.id;
                  const isLive = bus.status === 'LIVE';
                  return (
                    <div 
                      key={bus.id}
                      className={`fleet-item-card ${isSelected ? 'selected' : ''} ${isLive ? 'live-border' : ''}`}
                      onClick={() => setSelectedBusForMap(bus)}
                    >
                      <div className="item-header">
                        <strong>{bus.busNumber}</strong>
                        <span className={`status-pill-sm ${bus.status?.toLowerCase() || 'not_started'}`}>
                          {isLive && <span className="pulse-dot-green"></span>}
                          {bus.status === 'LIVE' ? 'LIVE ON ROUTE' : bus.status === 'COMPLETED' ? 'COMPLETED' : 'PARKED'}
                        </span>
                      </div>

                      <div className="item-sub">
                        <span>Reg: <code>{bus.registrationNumber}</code></span>
                        <span>Cap: {bus.capacity || 52} seats</span>
                      </div>

                      <div className="item-route">
                        <MapPin size={12} />
                        <span>{bus.routeName || 'Assigned Corridor Route'}</span>
                      </div>

                      <div className="item-driver">
                        <UserCheck size={12} />
                        <span>Driver: <strong>{bus.driverName || 'Assigned Operator'}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="fleet-map-col">
              <div className="map-col-header">
                <div className="selected-bus-meta">
                  <span className="selected-title">Inspecting: <strong>{selectedBusForMap?.busNumber || 'Bus 24'}</strong></span>
                  <span className="selected-reg">({selectedBusForMap?.registrationNumber || 'AP 35 U 2424'})</span>
                </div>
                <div className="telem-chip">
                  <Radio size={14} color="#16a34a" />
                  <span>Lat: {selectedBusForMap?.latitude ? Number(selectedBusForMap.latitude).toFixed(4) : '--'}°, Lng: {selectedBusForMap?.longitude ? Number(selectedBusForMap.longitude).toFixed(4) : '--'}°</span>
                </div>
              </div>

              <div className="admin-map-frame">
                <BusMap busData={selectedBusForMap} key={selectedBusForMap?.id} />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DRIVER APPLICATIONS */}
        {activeTab === 'drivers' && (
          <div className="drivers-queue-layout">
            <div className="section-title-row">
              <div>
                <h2>Driver Verification & Authorization Queue</h2>
                <p>Review submitted driving licence validity, passport/Aadhaar proof, and assign transport.</p>
              </div>
            </div>

            {driverApps.length === 0 ? (
              <div className="empty-state-card">
                <ShieldCheck size={48} color="#94a3b8" />
                <h3>No Driver Applications in Queue</h3>
                <p>When drivers register via the Driver Portal and submit KYC, they appear here for verification.</p>
              </div>
            ) : (
              <div className="driver-apps-grid">
                {driverApps.map((app) => {
                  const isPending = app.verificationStatus === 'PENDING';
                  const isApproved = app.verificationStatus === 'APPROVED';
                  const isRejected = app.verificationStatus === 'REJECTED';
                  return (
                    <div key={app.driverId || app.uid} className="driver-application-card">
                      <div className="app-card-header">
                        <div className="driver-avatar-box">
                          {app.photoUrl ? (
                            <img src={app.photoUrl} alt="Driver" className="driver-avatar-img" />
                          ) : (
                            <div className="avatar-placeholder"><UserCheck size={24} /></div>
                          )}
                        </div>

                        <div className="app-driver-title">
                          <h3>{app.fullName || app.name || 'Rajesh Kumar'}</h3>
                          <span className="phone-line"><Phone size={12} /> {app.phone}</span>
                          <span className="institution-line"><Building2 size={12} /> {app.institutionName || 'MVGR College of Engineering'}</span>
                        </div>

                        <div className="app-status-badge">
                          <span className={`status-pill ${app.verificationStatus?.toLowerCase()}`}>
                            {app.verificationStatus || 'PENDING'}
                          </span>
                        </div>
                      </div>

                      <div className="kyc-details-strip">
                        <div className="kyc-row">
                          <span className="kyc-label">Driving Licence:</span>
                          <strong>{app.licenceNumber}</strong>
                          <span className="validity-tag">Valid till {app.licenceValidity}</span>
                        </div>

                        <div className="kyc-row">
                          <span className="kyc-label">{app.idDocumentType || 'Aadhaar'}:</span>
                          <strong>{app.idDocumentNumber || '9844 2109 8831'}</strong>
                          <span className="validity-tag">({app.idDocValidity || 'Permanent'})</span>
                        </div>

                        <div className="kyc-row">
                          <span className="kyc-label">Experience:</span>
                          <span>{app.experienceYears || '5+ Years'}</span>
                        </div>

                        <div className="kyc-row">
                          <span className="kyc-label">Operating Locality:</span>
                          <span>{app.locality || 'Vizianagaram'} (PIN: {app.pincode || '535002'})</span>
                        </div>
                      </div>

                      {isPending && (
                        <div className="app-card-actions">
                          <button
                            type="button"
                            onClick={() => {
                              setApprovingDriver(app);
                              setAssignBusId('BUS-24');
                              setAssignRouteId('ROUTE-VZ04');
                            }}
                            className="btn btn-primary btn-sm"
                          >
                            <Check size={14} /> Review & Approve Assignment
                          </button>

                          <button
                            type="button"
                            onClick={() => handleReject(app)}
                            className="btn btn-outline btn-sm text-danger"
                          >
                            <XCircle size={14} /> Reject
                          </button>
                        </div>
                      )}

                      {isApproved && (
                        <div className="approved-assignment-tag">
                          <CheckCircle2 size={14} color="#16a34a" />
                          <span>Assigned to <strong>{app.assignedBusId || 'Bus 24'}</strong> on <strong>{app.assignedRouteId || 'Route 04'}</strong></span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: INSTITUTIONS */}
        {activeTab === 'institutions' && (
          <div className="institutions-tab-layout">
            <div className="section-title-row">
              <div>
                <h2>Registered Educational Campuses</h2>
                <p>Colleges and schools participating in the Vizianagaram – Thagarapuvalasa – Visakhapatnam corridor.</p>
              </div>
            </div>

            <div className="institutions-grid-full">
              {REGISTERED_INSTITUTIONS.map((inst) => (
                <div key={inst.id} className="institution-admin-card">
                  <div className="inst-badge-top">
                    <Building2 size={20} color="#2563eb" />
                    <span className="inst-id-tag">{inst.id}</span>
                  </div>

                  <h3>{inst.name}</h3>
                  <p className="campus-text">{inst.campus}</p>

                  <div className="inst-meta-grid">
                    <div className="meta-box">
                      <span className="meta-label">District</span>
                      <strong>{inst.district}</strong>
                    </div>
                    <div className="meta-box">
                      <span className="meta-label">Postal PIN</span>
                      <strong>{inst.pincode}</strong>
                    </div>
                    <div className="meta-box">
                      <span className="meta-label">Fleet Size</span>
                      <strong>{inst.busesCount} Buses</strong>
                    </div>
                  </div>

                  <div className="active-routes-list">
                    <span className="routes-label">Active Corridor Routes:</span>
                    <div className="route-tags">
                      {inst.activeRoutes.map((r, i) => (
                        <span key={i} className="route-pill-sm">{r}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: ROUTES & SCHEDULES */}
        {activeTab === 'routes' && (
          <div className="routes-tab-layout">
            <div className="section-title-row">
              <div>
                <h2>Corridor Transport Routes & Shift Timings</h2>
                <p>Route itineraries, designated student boarding stops, and arrival timetables.</p>
              </div>
            </div>

            <div className="routes-grid-admin">
              {INITIAL_ROUTES.map((route) => (
                <div key={route.id} className="route-admin-card">
                  <div className="route-header-row">
                    <div className="route-code-badge">{route.code}</div>
                    <div>
                      <h3>{route.name}</h3>
                      <span className="inst-assigned-text">Assigned Bus: <strong>{route.busId}</strong></span>
                    </div>
                  </div>

                  <div className="timing-strip">
                    <div className="timing-item">
                      <Clock size={12} />
                      <span>Reporting: <strong>{route.reportingTime}</strong></span>
                    </div>
                    <div className="timing-item">
                      <Navigation size={12} />
                      <span>Departure: <strong>{route.departureTime}</strong></span>
                    </div>
                    <div className="timing-item">
                      <Building2 size={12} />
                      <span>Campus Arrival: <strong>{route.expectedArrival}</strong></span>
                    </div>
                  </div>

                  <div className="stops-admin-list">
                    <h4>Boarding Stops ({route.stops.length})</h4>
                    <ol className="stops-ordered-list">
                      {route.stops.map((stop, sIdx) => (
                        <li key={sIdx} className="stop-admin-row">
                          <span className="stop-name-bold">{stop.name}</span>
                          <span className="stop-time-tag">{stop.scheduledTime}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: STUDENTS DIRECTORY */}
        {activeTab === 'students' && (
          <div className="students-tab-layout">
            <div className="section-title-row">
              <div>
                <h2>Enrolled Student Transport Registry</h2>
                <p>Pass holders, parent emergency links, and assigned corridor stops.</p>
              </div>
            </div>

            <div className="students-table-frame">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Roll Number</th>
                    <th>Student Name</th>
                    <th>Class / Year</th>
                    <th>Institution</th>
                    <th>Assigned Bus & Route</th>
                    <th>Boarding Stop</th>
                    <th>Parent / Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {INITIAL_STUDENTS.map((stu) => (
                    <tr key={stu.id}>
                      <td><code>{stu.rollNo}</code></td>
                      <td><strong>{stu.name}</strong></td>
                      <td>{stu.studentClass}</td>
                      <td>{stu.institutionId}</td>
                      <td><span className="badge-chip">{stu.busId} ({stu.routeId})</span></td>
                      <td>{stu.stopName}</td>
                      <td>
                        <div className="parent-contact-cell">
                          <strong>{stu.parentName}</strong>
                          <span className="phone-sub">{stu.parentPhone}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: INCIDENTS & SAFETY */}
        {activeTab === 'incidents' && (
          <div className="incidents-tab-layout">
            <div className="section-title-row">
              <div>
                <h2>Incident & Safety Dispatch Desk</h2>
                <p>Live incoming reports from drivers and parents in the corridor.</p>
              </div>
            </div>

            {incidents.length === 0 ? (
              <div className="empty-state-card">
                <CheckCircle2 size={48} color="#16a34a" />
                <h3>All Clear Across the Corridor</h3>
                <p>No active incidents or delays reported at this time.</p>
              </div>
            ) : (
              <div className="incidents-list">
                {incidents.map((inc) => (
                  <div key={inc.id} className="incident-ticket-card">
                    <div className="ticket-header">
                      <div className="ticket-title-group">
                        <AlertTriangle size={18} color="#dc2626" />
                        <h4>{inc.type || 'Delay Notice'}</h4>
                        <span className="bus-tag">{inc.busId || 'Bus 24'}</span>
                      </div>
                      <span className="ticket-time">
                        {new Date(inc.timestamp || Date.now()).toLocaleTimeString()}
                      </span>
                    </div>

                    <p className="ticket-desc">{inc.description || 'Report details'}</p>

                    <div className="ticket-footer">
                      <span className="reported-by">Reported by: <strong>{inc.parentName || inc.studentName || 'Parent'}</strong></span>
                      <span className="ticket-status-pill open">OPEN TICKET</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* APPROVAL & ASSIGNMENT MODAL */}
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
                  {fleetList.map(b => (
                    <option key={b.id} value={b.id}>{b.busNumber} ({b.registrationNumber})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Select Scheduled Route</label>
                <select value={assignRouteId} onChange={(e) => setAssignRouteId(e.target.value)}>
                  {INITIAL_ROUTES.map(r => (
                    <option key={r.id} value={r.id}>{r.code} - {r.name}</option>
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

    </div>
  );
}
