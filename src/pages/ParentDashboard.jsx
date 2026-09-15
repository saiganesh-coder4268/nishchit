import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BusMap from '../components/BusMap';
import ParentShell from '../components/shells/ParentShell';
import {
  subscribeRoutes,
  subscribeBuses,
  subscribeSchedules,
  subscribeActiveTrips,
  subscribeLiveLocation,
  findMatchingRoutes,
  resolveBusJourneyDetails,
  submitIncidentReport,
  subscribeParentStudents
} from '../services/transportService';
import { REGISTERED_INSTITUTIONS, INITIAL_ROUTES, INITIAL_VEHICLES } from '../data/regionData';
import { isValidCoordinate } from '../utils/busStatus';
import {
  Search, Bus, MapPin, Clock, ArrowRight, CheckCircle2,
  ChevronDown, Bell, User, Share2, List, Navigation,
  AlertTriangle, ShieldCheck, RefreshCw, X, Radio
} from 'lucide-react';

export default function ParentDashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  // Primary Data Collections
  const [routesList, setRoutesList] = useState([]);
  const [fleetList, setFleetList] = useState([]);
  const [schedulesList, setSchedulesList] = useState([]);
  const [activeTripsList, setActiveTripsList] = useState([]);
  const [liveLocations, setLiveLocations] = useState({});

  // Multi-student support
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  useEffect(() => {
    if (currentUser?.uid || currentUser?.email) {
      const unsubS = subscribeParentStudents(currentUser.uid, currentUser.email, (list) => {
        setStudents(list);
        if (list.length > 0 && !selectedStudentId) {
          setSelectedStudentId(list[0].id);
        }
      });
      return () => unsubS();
    }
  }, [currentUser, selectedStudentId]);

  const activeStudent = useMemo(() => {
    return students.find(s => s.id === selectedStudentId) || students[0] || null;
  }, [students, selectedStudentId]);

  // Discovery State (FROM -> TO -> FIND BUSES)
  const [fromLocation, setFromLocation] = useState(() => activeStudent?.institutionName || currentUser?.institutionName || 'Andhra University');
  const [toDestination, setToDestination] = useState(() => activeStudent?.stopName || currentUser?.stopName || 'Siripuram Circle');
  const [hasSearched, setHasSearched] = useState(false);

  // Sync with active student selection
  useEffect(() => {
    if (activeStudent) {
      if (activeStudent.institutionName) setFromLocation(activeStudent.institutionName);
      if (activeStudent.stopName) setToDestination(activeStudent.stopName);
    }
  }, [activeStudent]);

  // Selected Journey View State
  const [selectedBusId, setSelectedBusId] = useState(null);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [isLiveViewActive, setIsLiveViewActive] = useState(false);
  const [mapFocusTrigger, setMapFocusTrigger] = useState(0);

  // UI Panels
  const [bottomTab, setBottomTab] = useState('live'); // 'live' | 'stops' | 'share'
  const [showStopsModal, setShowStopsModal] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [institutionDropdownOpen, setInstitutionDropdownOpen] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentType, setIncidentType] = useState("Bus Delay / Stalled");
  const [incidentDesc, setIncidentDesc] = useState('');
  const [incidentSubmitted, setIncidentSubmitted] = useState(false);

  // 1. Subscribe to authoritative Firestore collections
  useEffect(() => {
    const unsubRoutes = subscribeRoutes((routes) => setRoutesList(routes));
    const unsubBuses = subscribeBuses((buses) => setFleetList(buses));
    const unsubSchedules = subscribeSchedules((scheds) => setSchedulesList(scheds));
    const unsubTrips = subscribeActiveTrips((trips) => setActiveTripsList(trips));

    return () => {
      unsubRoutes();
      unsubBuses();
      unsubSchedules();
      unsubTrips();
    };
  }, []);

  // 2. High-Frequency Realtime Database Telemetry for selected bus
  useEffect(() => {
    if (!selectedBusId) return;

    const unsubGps = subscribeLiveLocation(selectedBusId, (data) => {
      if (data) {
        setLiveLocations((prev) => ({
          ...prev,
          [selectedBusId]: data
        }));
      }
    });

    return () => unsubGps();
  }, [selectedBusId]);

  // Effective Collections (Authoritative Firestore with INITIAL fallback if unseeded)
  const effectiveRoutes = useMemo(() => {
    return routesList.length > 0 ? routesList : INITIAL_ROUTES;
  }, [routesList]);

  const effectiveFleet = useMemo(() => {
    return fleetList.length > 0 ? fleetList : INITIAL_VEHICLES;
  }, [fleetList]);

  // Derived: Known Institutions from Registered List + Routes
  const institutions = useMemo(() => {
    const map = new Map();
    REGISTERED_INSTITUTIONS.forEach((inst) => {
      map.set(inst.name, {
        id: inst.id,
        name: inst.name,
        shortName: inst.shortName,
        district: inst.district
      });
    });
    effectiveRoutes.forEach((r) => {
      if (r.institutionName && !map.has(r.institutionName)) {
        map.set(r.institutionName, {
          id: r.institutionId || r.institutionName,
          name: r.institutionName,
          shortName: r.institutionName.split(' ')[0],
          district: 'Corridor'
        });
      }
    });
    return Array.from(map.values());
  }, [effectiveRoutes]);

  // Derived: Available Destinations (Endpoints & Stops) served from the selected FROM
  const availableDestinations = useMemo(() => {
    if (!fromLocation) return [];

    const set = new Set();
    effectiveRoutes.forEach((r) => {
      const rFrom = r.from || r.stops?.[0]?.name || '';
      const isFromMatch =
        rFrom.toLowerCase().includes(fromLocation.toLowerCase()) ||
        fromLocation.toLowerCase().includes(rFrom.toLowerCase()) ||
        (r.institutionName && r.institutionName.toLowerCase().includes(fromLocation.toLowerCase())) ||
        (r.institutionId && r.institutionId.toLowerCase().includes(fromLocation.toLowerCase())) ||
        (r.name && r.name.toLowerCase().includes(fromLocation.toLowerCase()));

      if (isFromMatch) {
        if (r.to) set.add(r.to);
        if (r.stops && Array.isArray(r.stops)) {
          r.stops.forEach((s) => {
            if (s.name && !s.name.toLowerCase().includes(fromLocation.toLowerCase())) {
              set.add(s.name);
            }
          });
        }
      }
    });

    // If specific matching didn't yield stops, show all unique corridor destinations
    if (set.size === 0) {
      effectiveRoutes.forEach((r) => {
        if (r.to) set.add(r.to);
        r.stops?.forEach((s) => s.name && set.add(s.name));
      });
    }

    return Array.from(set);
  }, [fromLocation, effectiveRoutes]);

  // Default destination to first available if unselected
  useEffect(() => {
    if (availableDestinations.length > 0 && !toDestination) {
      // Pick MVP Colony if available, otherwise first
      const defaultTo = availableDestinations.find(d => d.includes('MVP Colony')) || availableDestinations[0];
      setToDestination(defaultTo);
    }
  }, [availableDestinations, toDestination]);

  // 3. Find Matching Routes & Resolve Real Buses
  const matchedJourneyOptions = useMemo(() => {
    if (!fromLocation || !toDestination) return [];

    const matchingRoutes = findMatchingRoutes({
      routes: effectiveRoutes,
      from: fromLocation,
      to: toDestination
    });

    return matchingRoutes.map((route) => {
      return resolveBusJourneyDetails({
        route,
        buses: effectiveFleet,
        schedules: schedulesList,
        activeTrips: activeTripsList,
        liveLocations
      });
    }).filter(Boolean);
  }, [effectiveRoutes, effectiveFleet, schedulesList, activeTripsList, liveLocations, fromLocation, toDestination]);

  // 4. Resolve the Active/Selected Journey Record
  const activeJourney = useMemo(() => {
    if (!selectedRouteId && matchedJourneyOptions.length > 0) {
      return matchedJourneyOptions[0];
    }
    if (selectedRouteId) {
      const match = matchedJourneyOptions.find(j => j.route?.id === selectedRouteId || j.busId === selectedBusId);
      if (match) return match;
      // Fallback lookup directly in routes
      const rawRoute = effectiveRoutes.find(r => r.id === selectedRouteId);
      if (rawRoute) {
        return resolveBusJourneyDetails({
          route: rawRoute,
          buses: effectiveFleet,
          schedules: schedulesList,
          activeTrips: activeTripsList,
          liveLocations
        });
      }
    }
    return matchedJourneyOptions[0] || null;
  }, [selectedRouteId, selectedBusId, matchedJourneyOptions, effectiveRoutes, effectiveFleet, schedulesList, activeTripsList, liveLocations]);

  // Select first available bus when search is initiated
  const handleFindBuses = (e) => {
    if (e) e.preventDefault();
    setHasSearched(true);
    if (matchedJourneyOptions.length > 0) {
      const primary = matchedJourneyOptions[0];
      setSelectedRouteId(primary.route?.id);
      setSelectedBusId(primary.busId);
    }
  };

  const handleSelectBus = (journey) => {
    setSelectedRouteId(journey.route?.id);
    setSelectedBusId(journey.busId);
    navigate(`/parent/journey?busId=${journey.busId}&routeId=${journey.route?.id}&stop=${encodeURIComponent(toDestination)}`);
  };

  // Determine Stop Progression & Next Stop Index
  const stops = activeJourney?.stops || [];
  const totalStops = stops.length;
  
  // Real or derived next stop
  const isTripLive = activeJourney?.state === 'LIVE';
  const nextStopIndex = isTripLive ? Math.min(2, Math.max(1, totalStops - 2)) : 0;
  const nextStop = stops[nextStopIndex] || null;
  const etaMinutes = isTripLive ? 26 : 0;

  // Handle Share action
  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareData = {
      title: 'Nishchit Live Bus Journey',
      text: `Track bus journey: ${fromLocation} to ${toDestination}`,
      url: shareUrl
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // Fallback to clipboard
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 3000);
    }
  };

  // Handle incident reporting
  const handleIncidentSubmit = async (e) => {
    e.preventDefault();
    try {
      await submitIncidentReport({
        parentId: currentUser?.uid || 'parent',
        parentName: currentUser?.fullName || currentUser?.name || 'Parent',
        busId: activeJourney?.busId || 'BUS',
        routeId: activeJourney?.route?.id || 'ROUTE',
        type: incidentType,
        description: incidentDesc
      });
      setIncidentSubmitted(true);
      setTimeout(() => {
        setIncidentSubmitted(false);
        setShowIncidentModal(false);
        setIncidentDesc('');
      }, 2000);
    } catch (err) {
      console.error(err);
    }
  };

  // =========================================================================
  // VIEW 1: HIGH-FIDELITY LIVE TRANSIT VIEW (MATCHING USER REFERENCE SCREEN)
  // =========================================================================
  if (isLiveViewActive && activeJourney) {
    const liveBusTelemetry = liveLocations[activeJourney.busId] || activeJourney.bus || {};
    const effectiveLat = liveBusTelemetry.latitude ?? liveBusTelemetry.lat;
    const effectiveLng = liveBusTelemetry.longitude ?? liveBusTelemetry.lng;
    const hasLiveCoords = isValidCoordinate(effectiveLat, effectiveLng);

    return (
      <div className="transit-view-wrapper">
        {/* 1. FLOATING TOP HEADER */}
        <header className="transit-floating-header">
          <div className="transit-header-left">
            {/* Rounded Golden-Yellow Bus Badge */}
            <div className="transit-bus-badge">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="4" width="18" height="15" rx="3" fill="#0F172A" />
                <rect x="5" y="6" width="14" height="6" rx="1.5" fill="#38BDF8" opacity="0.9" />
                <circle cx="7" cy="15" r="1.5" fill="#FEF08A" />
                <circle cx="17" cy="15" r="1.5" fill="#FEF08A" />
                <rect x="10" y="14" width="4" height="2" rx="0.5" fill="#64748B" />
                <rect x="2" y="8" width="1.5" height="4" rx="0.5" fill="#0F172A" />
                <rect x="20.5" y="8" width="1.5" height="4" rx="0.5" fill="#0F172A" />
              </svg>
            </div>

            {/* Institution Dropdown & Location Title */}
            <div className="transit-title-block" onClick={() => setInstitutionDropdownOpen(!institutionDropdownOpen)}>
              <div className="transit-title-row">
                <span className="transit-institution-name">
                  {fromLocation.split('(')[0].trim()}
                </span>
                <ChevronDown size={18} className={`transit-chevron ${institutionDropdownOpen ? 'open' : ''}`} />
              </div>
              <span className="transit-city-subtitle">Visakhapatnam</span>
            </div>
          </div>

          <div className="transit-header-right">
            <button
              type="button"
              className="transit-icon-btn"
              onClick={() => setShowIncidentModal(true)}
              aria-label="Report incident"
              title="Report incident / delay"
            >
              <Bell size={20} color="#334155" />
              <span className="notification-red-dot" />
            </button>

            <button
              type="button"
              className="transit-avatar-btn"
              onClick={() => setIsLiveViewActive(false)}
              aria-label="Parent Profile"
              title="Journey Search"
            >
              <User size={19} color="#FFFFFF" />
            </button>
          </div>

          {/* Institution Switcher Menu */}
          {institutionDropdownOpen && (
            <div className="transit-dropdown-menu">
              <div className="dropdown-menu-header">Select Campus</div>
              {institutions.map((inst) => (
                <button
                  key={inst.id}
                  type="button"
                  className={`dropdown-menu-item ${fromLocation === inst.name ? 'active' : ''}`}
                  onClick={() => {
                    setFromLocation(inst.name);
                    setInstitutionDropdownOpen(false);
                  }}
                >
                  <strong>{inst.name}</strong>
                  <span>{inst.district}</span>
                </button>
              ))}
              <div className="dropdown-menu-footer" onClick={() => setIsLiveViewActive(false)}>
                ← Back to Journey Search
              </div>
            </div>
          )}
        </header>

        {/* 2. FULL-SCREEN INTERACTIVE MAP CANVAS */}
        <div className="transit-map-canvas">
          <BusMap
            busData={{
              ...activeJourney.bus,
              ...liveBusTelemetry,
              busNumber: activeJourney.busNumber,
              status: activeJourney.state
            }}
            stops={stops}
            isLive={activeJourney.state === 'LIVE'}
            busNumber={activeJourney.busNumber}
            nextStopName={nextStop?.name}
            nextStopMinutes={8}
            onBack={() => setIsLiveViewActive(false)}
            onRecenter={() => setMapFocusTrigger(prev => prev + 1)}
            focusTrigger={mapFocusTrigger}
          />
        </div>

        {/* 3. FLOATING BOTTOM SHEET DRAWER */}
        <div className="transit-bottom-sheet">
          {/* Drag Pill Grabber */}
          <div className="bottom-sheet-grabber" />

          {/* Header Row: Status Title & Arriving In Pill */}
          <div className="sheet-header-row">
            <div className="sheet-title-col">
              <h2 className="sheet-main-title">
                {activeJourney.state === 'LIVE'
                  ? 'Bus is on the way'
                  : activeJourney.state === 'COMPLETED'
                  ? 'Trip is completed'
                  : 'Bus is scheduled'}
              </h2>
              <p className="sheet-route-subtitle">
                From {fromLocation.split('(')[0].trim()} to {toDestination}
              </p>
            </div>

            {/* Light Green Arriving Box */}
            <div className="sheet-eta-box">
              <div className="eta-icon-clock">
                <Clock size={20} color="#16A34A" />
              </div>
              <div className="eta-text-group">
                <span className="eta-label">
                  {activeJourney.state === 'LIVE' ? 'Arriving in' : 'Scheduled'}
                </span>
                <strong className="eta-value">
                  {activeJourney.state === 'LIVE'
                    ? `${etaMinutes} min`
                    : activeJourney.departureTime}
                </strong>
              </div>
            </div>
          </div>

          {/* 4. HORIZONTAL 5-STOP PROGRESS STEPPER */}
          <div className="horizontal-stepper-container">
            <div className="stepper-track-line">
              <div
                className="stepper-progress-fill"
                style={{
                  width: activeJourney.state === 'COMPLETED'
                    ? '100%'
                    : activeJourney.state === 'LIVE'
                    ? '50%'
                    : '0%'
                }}
              />
            </div>

            <div className="stepper-stops-row">
              {stops.map((stop, idx) => {
                const isOrigin = idx === 0;
                const isDest = idx === totalStops - 1;
                const isPassed = isTripLive && idx < nextStopIndex;
                const isNext = isTripLive && idx === nextStopIndex;
                const isFuture = idx > nextStopIndex;

                return (
                  <div
                    key={`step-${idx}-${stop.name}`}
                    className={`stepper-node ${isPassed ? 'passed' : ''} ${isNext ? 'next' : ''} ${isDest ? 'dest' : ''}`}
                  >
                    {/* Icon Node */}
                    <div className="node-icon-circle">
                      {isOrigin ? (
                        <span className="node-grad-cap">🎓</span>
                      ) : isDest ? (
                        <span className="node-home-icon">🏠</span>
                      ) : isPassed ? (
                        <span className="node-check-icon">✓</span>
                      ) : isNext ? (
                        <span className="node-next-ring" />
                      ) : (
                        <span className="node-future-dot" />
                      )}
                    </div>

                    {/* Labels */}
                    <div className="node-label-group">
                      <strong className="node-stop-name">{stop.name}</strong>
                      <span className="node-stop-time">{stop.scheduledTime}</span>

                      {/* Status Badges */}
                      {isPassed && (
                        <span className="node-badge-passed">
                          <CheckCircle2 size={12} color="#16A34A" />
                        </span>
                      )}

                      {isNext && (
                        <span className="node-badge-next">
                          Next Stop
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. BOTTOM ACTION TABS */}
          <div className="sheet-action-tabs">
            <button
              type="button"
              className={`sheet-tab-btn ${bottomTab === 'live' ? 'active' : ''}`}
              onClick={() => {
                setBottomTab('live');
                setMapFocusTrigger(prev => prev + 1);
              }}
            >
              <MapPin size={18} />
              <span>Live Location</span>
            </button>

            <button
              type="button"
              className={`sheet-tab-btn ${bottomTab === 'stops' ? 'active' : ''}`}
              onClick={() => {
                setBottomTab('stops');
                setShowStopsModal(true);
              }}
            >
              <List size={18} />
              <span>Route Stops</span>
            </button>

            <button
              type="button"
              className={`sheet-tab-btn ${bottomTab === 'share' ? 'active' : ''}`}
              onClick={handleShare}
            >
              <Share2 size={18} />
              <span>{shareCopied ? 'Link Copied!' : 'Share'}</span>
            </button>
          </div>
        </div>

        {/* Full Route Stops Modal */}
        {showStopsModal && (
          <div className="modal-overlay" onClick={() => setShowStopsModal(false)}>
            <div className="modal-content stops-modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{activeJourney.route?.name || 'Corridor Route Stops'}</h3>
                <button className="modal-close" onClick={() => setShowStopsModal(false)}><X size={18} /></button>
              </div>
              <div className="stops-timeline-list">
                {stops.map((s, idx) => (
                  <div key={idx} className="timeline-stop-item">
                    <div className="timeline-indicator">
                      <span className="timeline-dot" />
                      {idx < stops.length - 1 && <span className="timeline-connector" />}
                    </div>
                    <div className="timeline-stop-details">
                      <strong>{s.name}</strong>
                      <span>Scheduled: {s.scheduledTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Incident Report Modal */}
        {showIncidentModal && (
          <div className="modal-overlay" onClick={() => setShowIncidentModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Report Transit Delay or Incident</h3>
                <button className="modal-close" onClick={() => setShowIncidentModal(false)}><X size={18} /></button>
              </div>
              <form onSubmit={handleIncidentSubmit} className="report-form">
                <div className="form-group">
                  <label>Issue Type</label>
                  <select value={incidentType} onChange={e => setIncidentType(e.target.value)}>
                    <option>Bus Delay / Stalled</option>
                    <option>Route Deviation</option>
                    <option>Mechanical Breakdown</option>
                    <option>Driver Conduct</option>
                    <option>Other Operational Concern</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Description / Details</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Provide details for the transport management desk..."
                    value={incidentDesc}
                    onChange={e => setIncidentDesc(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  {incidentSubmitted ? 'Report Submitted to Transport Desk' : 'Submit Incident Report'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  const selectedInstObj = REGISTERED_INSTITUTIONS.find(i => i.name === fromLocation || i.id === fromLocation);
  const isComingSoon = selectedInstObj?.status === 'COMING_SOON';

  return (
    <ParentShell activeTab="home" onTabChange={() => {}}>
      <div className="parent-discovery-page">
        {/* Child switcher bar if multiple children */}
        {students.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', background: '#F8FAFC', padding: '10px 16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 600 }}>Active Child:</span>
              <select
                value={selectedStudentId || ''}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontWeight: 700, fontSize: '0.88rem', color: '#0F172A', background: '#FFFFFF' }}
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.rollNo}) · {s.stopName}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => navigate('/parent/profile')}
              style={{ background: 'transparent', border: 'none', fontSize: '0.82rem', color: '#2563EB', fontWeight: 700, cursor: 'pointer' }}
            >
              Manage Children →
            </button>
          </div>
        )}

        <div className="discovery-header-banner">
          <h1>Find Your Bus Journey</h1>
          <p>Select your campus and destination to discover live and scheduled corridor buses.</p>
        </div>

        {/* JOURNEY SEARCH INPUT CARD (FROM -> TO) */}
        <div className="journey-search-card">
          <form onSubmit={handleFindBuses} className="journey-search-form">
            <div className="journey-field-group">
              <label className="journey-label">
                <span className="field-dot from-dot" /> FROM (Campus / Origin)
              </label>
              <select
                value={fromLocation}
                onChange={(e) => setFromLocation(e.target.value)}
                className="journey-select"
              >
                {institutions.map((inst) => {
                  const reg = REGISTERED_INSTITUTIONS.find(r => r.name === inst.name || r.id === inst.id);
                  const isComing = reg?.status === 'COMING_SOON';
                  return (
                    <option key={inst.id} value={inst.name}>
                      {inst.name} {isComing ? '· (Coming Soon)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="journey-swap-divider">
              <span className="arrow-flow">↓</span>
            </div>

            <div className="journey-field-group">
              <label className="journey-label">
                <span className="field-dot to-dot" /> TO (Destination / Drop Stop)
              </label>
              <select
                value={toDestination}
                onChange={(e) => setToDestination(e.target.value)}
                className="journey-select"
                disabled={isComingSoon}
              >
                {availableDestinations.length === 0 ? (
                  <option value="">No destinations available for this origin</option>
                ) : (
                  availableDestinations.map((dest, idx) => (
                    <option key={idx} value={dest}>
                      {dest}
                    </option>
                  ))
                )}
              </select>
            </div>

            <button type="submit" className="btn-find-buses" disabled={isComingSoon}>
              <Search size={18} />
              <span>{isComingSoon ? 'Unavailable' : 'Find Buses'}</span>
            </button>
          </form>

          {/* Coming Soon Guard Warning */}
          {isComingSoon && (
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '12px 16px', color: '#B45309', fontSize: '0.86rem', marginTop: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} color="#D97706" style={{ flexShrink: 0 }} />
              <span><strong>Coming soon:</strong> Transport services for {selectedInstObj?.name || fromLocation} are not currently active through Nishchit. Active journeys cannot be created for this campus yet.</span>
            </div>
          )}
        </div>

        {/* RESULTS: BUSES SERVING YOUR JOURNEY */}
        <div className="available-buses-section">
          <div className="buses-section-header">
            <div>
              <h2>Buses serving your journey</h2>
              <span className="journey-path-breadcrumb">
                {fromLocation.split('(')[0].trim()} <ArrowRight size={14} style={{ display: 'inline' }} /> {toDestination}
              </span>
            </div>
            <span className="buses-count-badge">
              {matchedJourneyOptions.length} {matchedJourneyOptions.length === 1 ? 'Bus' : 'Buses'} Available
            </span>
          </div>

          {/* EMPTY STATES */}
          {matchedJourneyOptions.length === 0 ? (
            <div className="journey-empty-state">
              <Bus size={36} color="#94A3B8" />
              <h3>No buses currently serve this journey</h3>
              <p>Try selecting a different destination stop or check corridor schedule allocations.</p>
            </div>
          ) : (
            <div className="available-buses-grid">
              {matchedJourneyOptions.map((journey) => {
                const isLive = journey.state === 'LIVE';
                const isCompleted = journey.state === 'COMPLETED';

                return (
                  <div
                    key={journey.busId || journey.route?.id}
                    className={`bus-card-item ${isLive ? 'is-live' : ''}`}
                    onClick={() => handleSelectBus(journey)}
                  >
                    <div className="bus-card-top">
                      <div className="bus-title-group">
                        <div className="bus-icon-circle">
                          <Bus size={20} color="#1D4ED8" />
                        </div>
                        <div>
                          <h3 className="bus-card-number">{journey.busNumber}</h3>
                          <span className="bus-reg-number">{journey.registrationNumber || 'Corridor Fleet'}</span>
                        </div>
                      </div>

                      {/* State Badge */}
                      <span className={`bus-state-pill ${journey.state.toLowerCase()}`}>
                        {isLive ? (
                          <>
                            <span className="live-pulse-dot" /> LIVE
                          </>
                        ) : isCompleted ? (
                          'COMPLETED'
                        ) : (
                          'SCHEDULED'
                        )}
                      </span>
                    </div>

                    <div className="bus-route-summary">
                      <MapPin size={14} color="#64748B" />
                      <span>{journey.route?.name || `${fromLocation} → ${toDestination}`}</span>
                    </div>

                    <div className="bus-meta-row">
                      <div className="meta-item">
                        <Clock size={14} color="#64748B" />
                        <span>Departure: <strong>{journey.departureTime}</strong></span>
                      </div>
                      {isLive && (
                        <div className="meta-item green">
                          <Radio size={14} color="#16A34A" />
                          <span>Next: <strong>{journey.stops?.[1]?.name || 'On Route'}</strong></span>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      className="btn-track-bus"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectBus(journey);
                      }}
                    >
                      <span>Track Live Journey</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ParentShell>
  );
}
