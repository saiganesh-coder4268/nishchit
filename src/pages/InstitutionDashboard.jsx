import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import BusMap from '../components/BusMap';
import NishchitLogo from '../components/NishchitLogo';
import {
  subscribeBuses,
  subscribeRoutes,
  subscribeDriverProfiles,
  subscribeActiveTrips,
  subscribeTripHistory,
  subscribeIncidentReports,
  subscribeLiveLocation,
  subscribeJobPostings,
  createJobPosting,
  closeJobPosting,
  subscribeJobApplications,
  updateJobApplicationStatus,
  subscribeDriverApplications,
  approveDriverApplication,
  sendDriverInvitation,
  assignDriverAndRouteToBus,
  createBus,
  updateBus,
  deleteBus,
  createRoute,
  createIncidentReport
} from '../services/transportService';
import { REGISTERED_INSTITUTIONS } from '../data/regionData';
import {
  Building2, Bus, Users, MapPin, AlertTriangle, CheckCircle2,
  XCircle, Radio, Plus, UserCheck, Phone, Check, Trash2, Edit3,
  Calendar, Eye, TrendingUp, Search, Filter, ArrowRight, ShieldCheck,
  Send, UserPlus, FileText, Clock, ChevronRight, RefreshCw, LogOut,
  Sparkles, Star, Award, Shield, AlertCircle
} from 'lucide-react';

export default function InstitutionDashboard() {
  const { currentUser, logout } = useAuth();

  // Institution context - Scoped to selected institute (default: Andhra University)
  const institutionId = currentUser?.institutionId || currentUser?.instituteId || 'INST-AU';
  const currentInstitution = useMemo(() => {
    return REGISTERED_INSTITUTIONS.find(i => i.id === institutionId || i.instituteId === institutionId) || {
      id: institutionId,
      instituteId: institutionId,
      name: currentUser?.institutionName || 'Andhra University',
      shortName: 'Andhra University',
      campus: 'Visakhapatnam Campus',
      city: 'Visakhapatnam',
      state: 'Andhra Pradesh',
      busesCount: 18,
      status: 'ACTIVE',
      verificationStatus: 'verified'
    };
  }, [institutionId, currentUser]);

  // Main Tabs: 'overview' | 'live_fleet' | 'buses' | 'drivers' | 'routes' | 'hiring' | 'incidents'
  const [activeTab, setActiveTab] = useState('overview');
  // Hiring Subtabs: 'open_jobs' | 'find_drivers' | 'applications' | 'onboarding_drivers'
  const [hiringSubTab, setHiringSubTab] = useState('open_jobs');

  // Realtime States
  const [fleetList, setFleetList] = useState([]);
  const [routesList, setRoutesList] = useState([]);
  const [allDrivers, setAllDrivers] = useState([]);
  const [activeTrips, setActiveTrips] = useState([]);
  const [tripHistory, setTripHistory] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [jobPostings, setJobPostings] = useState([]);
  const [jobApplications, setJobApplications] = useState([]);
  const [driverApplicationsList, setDriverApplicationsList] = useState([]);
  const [selectedBusForMap, setSelectedBusForMap] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);

  // Filters for Find Drivers
  const [driverSearchQuery, setDriverSearchQuery] = useState('');
  const [filterExperience, setFilterExperience] = useState('all');
  const [filterVehicleType, setFilterVehicleType] = useState('all');
  const [filterAvailability, setFilterAvailability] = useState('all');

  // Modals
  const [showAddBusModal, setShowAddBusModal] = useState(false);
  const [showAddRouteModal, setShowAddRouteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showPostJobModal, setShowPostJobModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDriverProfileModal, setShowDriverProfileModal] = useState(null);
  const [showReportIncidentModal, setShowReportIncidentModal] = useState(false);
  const [showApproveDriverModal, setShowApproveDriverModal] = useState(null);

  // Form States
  const [selectedBusToAssign, setSelectedBusToAssign] = useState(null);
  const [assignDriverId, setAssignDriverId] = useState('');
  const [assignRouteId, setAssignRouteId] = useState('');

  const [busForm, setBusForm] = useState({
    busNumber: '',
    registrationNumber: '',
    capacity: 52,
    model: 'Tata Starbus Ultra BS6',
    status: 'AVAILABLE'
  });

  const [routeForm, setRouteForm] = useState({
    routeName: '',
    code: 'ROUTE-AU03',
    from: 'Gajuwaka Junction',
    to: 'AU North Campus',
    departureTime: '07:30 AM',
    expectedArrival: '08:45 AM',
    stopsText: 'Gajuwaka Junction, NAD Junction, Maddilapalem, Siripuram Circle, AU North Campus'
  });

  const [jobForm, setJobForm] = useState({
    title: 'University Transport Heavy Vehicle Driver',
    jobType: 'Full-time',
    salaryRange: '₹28,000 - ₹34,000 / month',
    experienceRequired: '4+ years',
    vehicleType: 'Heavy Passenger Bus (PSV)',
    workSchedule: 'Morning 07:00 AM - 10:00 AM & Evening 04:30 PM - 07:30 PM',
    description: 'Safe transit of students and faculty along designated Visakhapatnam corridors to Andhra University campus.'
  });

  const [selectedDriverToInvite, setSelectedDriverToInvite] = useState(null);
  const [inviteJobId, setInviteJobId] = useState('');
  const [inviteNote, setInviteNote] = useState('');

  const [incidentForm, setIncidentForm] = useState({
    category: 'Delay',
    severity: 'Medium',
    busId: '',
    description: 'Traffic congestion on National Highway corridor causing 15 min delay.',
  });

  // 1. Subscribe to scoped data for this institution
  useEffect(() => {
    const unsubBuses = subscribeBuses((data) => {
      setFleetList(data);
      if (data.length > 0 && !selectedBusForMap) {
        setSelectedBusForMap(data[0]);
      }
    }, institutionId);

    const unsubRoutes = subscribeRoutes((data) => {
      setRoutesList(data);
    }, institutionId);

    const unsubDrivers = subscribeDriverProfiles((data) => {
      setAllDrivers(data);
    });

    const unsubActiveTrips = subscribeActiveTrips((data) => {
      setActiveTrips(data);
    }, institutionId);

    const unsubHistory = subscribeTripHistory((data) => {
      setTripHistory(data);
    }, institutionId);

    const unsubIncidents = subscribeIncidentReports((data) => {
      setIncidents(data);
    }, institutionId);

    const unsubJobs = subscribeJobPostings((data) => {
      setJobPostings(data);
    }, institutionId);

    const unsubApps = subscribeJobApplications((data) => {
      setJobApplications(data);
    }, institutionId);

    const unsubDriverApps = subscribeDriverApplications((data) => {
      setDriverApplicationsList(data);
    }, institutionId);

    return () => {
      unsubBuses();
      unsubRoutes();
      unsubDrivers();
      unsubActiveTrips();
      unsubHistory();
      unsubIncidents();
      unsubJobs();
      unsubApps();
      unsubDriverApps();
    };
  }, [institutionId]);

  // 2. Realtime GPS Stream for Selected Bus in Live Fleet
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
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Associated drivers (Hired by this institution or assigned to a bus)
  const institutionDrivers = useMemo(() => {
    return allDrivers.filter(d => 
      d.hiredByInstitutionId === institutionId || 
      fleetList.some(b => b.driverId === d.id || b.driverId === d.driverId) ||
      (d.verificationStatus || '').toLowerCase() === 'approved'
    );
  }, [allDrivers, institutionId, fleetList]);

  // Verified Drivers pool for Hiring Marketplace
  const marketplaceDrivers = useMemo(() => {
    return allDrivers.filter(d => {
      const isApproved = (d.verificationStatus || '').toLowerCase() === 'approved';
      if (!isApproved) return false;

      // Query filter
      if (driverSearchQuery.trim()) {
        const q = driverSearchQuery.toLowerCase();
        const matchesName = (d.fullName || d.name || '').toLowerCase().includes(q);
        const matchesArea = (d.preferredArea || d.location || '').toLowerCase().includes(q);
        if (!matchesName && !matchesArea) return false;
      }

      // Experience filter
      if (filterExperience !== 'all') {
        const yrs = parseInt(d.experienceYears || d.yearsOfExperience || '0', 10);
        if (filterExperience === '3+' && yrs < 3) return false;
        if (filterExperience === '5+' && yrs < 5) return false;
        if (filterExperience === '8+' && yrs < 8) return false;
      }

      // Availability filter
      if (filterAvailability !== 'all') {
        if (filterAvailability === 'available' && d.availability === 'BUSY') return false;
      }

      return true;
    });
  }, [allDrivers, driverSearchQuery, filterExperience, filterAvailability]);

  // Live bus count
  const liveBusesCount = useMemo(() => {
    return fleetList.filter(b => b.status === 'ON_TRIP' || b.activeTripId || b.status === 'LIVE').length;
  }, [fleetList]);

  // Actions
  const handleCreateBus = async (e) => {
    e.preventDefault();
    try {
      await createBus({
        ...busForm,
        institutionId,
        institutionName: currentInstitution.name
      });
      showFeedback(`Bus ${busForm.busNumber} added to institution fleet.`);
      setShowAddBusModal(false);
      setBusForm({
        busNumber: '',
        registrationNumber: '',
        capacity: 48,
        model: 'Tata Marcopolo BS6',
        status: 'AVAILABLE'
      });
    } catch (err) {
      showFeedback(`Failed to create bus: ${err.message}`);
    }
  };

  const handleCreateRoute = async (e) => {
    e.preventDefault();
    try {
      const stopsArray = routeForm.stopsText
        .split(',')
        .map((s, idx) => ({ stopId: `S-${idx + 1}`, stopName: s.trim(), sequence: idx + 1 }))
        .filter(s => s.stopName.length > 0);

      await createRoute({
        ...routeForm,
        stops: stopsArray,
        institutionId,
        institutionName: currentInstitution.name
      });
      showFeedback(`Route ${routeForm.routeName || routeForm.code} successfully created.`);
      setShowAddRouteModal(false);
    } catch (err) {
      showFeedback(`Failed to create route: ${err.message}`);
    }
  };

  const handleAssignDriverRoute = async (e) => {
    e.preventDefault();
    if (!selectedBusToAssign || !assignDriverId || !assignRouteId) {
      showFeedback('Please select both a driver and a route to assign.');
      return;
    }
    try {
      await assignDriverAndRouteToBus(selectedBusToAssign.id, assignDriverId, assignRouteId, institutionId);
      showFeedback(`Bus ${selectedBusToAssign.busNumber} assigned to driver and active route.`);
      setShowAssignModal(false);
      setSelectedBusToAssign(null);
    } catch (err) {
      showFeedback(`Assignment error: ${err.message}`);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      await createJobPosting({
        ...jobForm,
        institutionId,
        institutionName: currentInstitution.name,
        location: currentInstitution.city || 'Vijayawada'
      });
      showFeedback('Driver job requirement published to platform marketplace.');
      setShowPostJobModal(false);
    } catch (err) {
      showFeedback(`Could not publish job: ${err.message}`);
    }
  };

  const handleSendInvitation = async (e) => {
    e.preventDefault();
    if (!selectedDriverToInvite || !inviteJobId) {
      showFeedback('Please select an open position to invite this driver.');
      return;
    }
    const job = jobPostings.find(j => j.id === inviteJobId);
    try {
      await sendDriverInvitation({
        driverId: selectedDriverToInvite.id,
        driverName: selectedDriverToInvite.fullName || selectedDriverToInvite.name,
        driverPhone: selectedDriverToInvite.phone || '',
        institutionId,
        institutionName: currentInstitution.name,
        jobId: job?.id || inviteJobId,
        jobTitle: job?.title || 'School Bus Driver',
        salaryRange: job?.salaryRange || '₹26,000 - ₹30,000',
        note: inviteNote || 'We reviewed your verified profile and would like to invite you for this route.'
      });
      showFeedback(`Direct invitation sent to ${selectedDriverToInvite.fullName || selectedDriverToInvite.name}!`);
      setShowInviteModal(false);
      setSelectedDriverToInvite(null);
      setInviteNote('');
    } catch (err) {
      showFeedback(`Failed to send invitation: ${err.message}`);
    }
  };

  const handleHireDriverApplication = async (app) => {
    try {
      await updateJobApplicationStatus(app.id, 'SELECTED', {
        institutionId,
        institutionName: currentInstitution.name,
        driverId: app.driverId
      });
      showFeedback(`Congratulations! Driver ${app.driverName || 'Applicant'} is now hired into your transport roster.`);
    } catch (err) {
      showFeedback(`Hiring error: ${err.message}`);
    }
  };

  const handleShortlistApplication = async (app) => {
    try {
      await updateJobApplicationStatus(app.id, 'SHORTLISTED', {
        institutionId,
        institutionName: currentInstitution.name
      });
      showFeedback(`Application shortlisted for interview.`);
    } catch (err) {
      showFeedback(`Error: ${err.message}`);
    }
  };

  const handleReportIncident = async (e) => {
    e.preventDefault();
    try {
      await createIncidentReport({
        ...incidentForm,
        institutionId,
        reportedBy: currentUser?.email || 'Institution Desk',
        createdAt: Date.now()
      });
      showFeedback('Safety incident logged and broadcast to transport operations.');
      setShowReportIncidentModal(false);
    } catch (err) {
      showFeedback(`Error logging incident: ${err.message}`);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column', color: '#0F172A' }}>
      
      {/* 1. TOP INSTITUTION COMMAND HEADER */}
      <header className="inst-header">
        <div className="inst-header-brand">
          <NishchitLogo variant="compact" size={34} />
          <div style={{ height: '24px', width: '1px', background: '#E2E8F0' }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentInstitution.name}
              </span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                borderRadius: '6px',
                background: '#ECFDF5',
                color: '#059669',
                fontSize: '0.72rem',
                fontWeight: 700,
                whiteSpace: 'nowrap'
              }}>
                <ShieldCheck size={13} />
                <span>Platform Verified</span>
              </span>
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <Building2 size={12} />
              <span>{currentInstitution.campus || currentInstitution.city} • Institutional Transport OS</span>
            </div>
          </div>
        </div>

        {/* Status + Actions */}
        <div className="inst-header-actions">
          <div className="active-badge" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            borderRadius: '999px',
            background: liveBusesCount > 0 ? '#EFF6FF' : '#F1F5F9',
            border: `1px solid ${liveBusesCount > 0 ? '#BFDBFE' : '#E2E8F0'}`
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: liveBusesCount > 0 ? '#2563EB' : '#94A3B8',
              boxShadow: liveBusesCount > 0 ? '0 0 8px rgba(37,99,235,0.6)' : 'none'
            }} />
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: liveBusesCount > 0 ? '#1D4ED8' : '#64748B', whiteSpace: 'nowrap' }}>
              {liveBusesCount} Active Buses
            </span>
          </div>

          <button
            onClick={() => setShowReportIncidentModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '8px',
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#DC2626',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <AlertTriangle size={14} />
            <span>Report Issue</span>
          </button>

          <button
            onClick={logout}
            title="Sign out of Transport Desk"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '8px',
              background: '#F8FAFC',
              border: '1px solid #CBD5E1',
              color: '#475569',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* 2. ACTION NOTICE TOAST */}
      {actionNotice && (
        <div style={{
          background: '#0F172A',
          color: '#FFFFFF',
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          fontSize: '0.86rem',
          fontWeight: 600,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          <CheckCircle2 size={16} color="#10B981" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* 3. PRIMARY TOP-LEVEL KPI STATS BAR (SPEC SECTION 8) */}
      <div className="inst-kpi-bar">
        <div className="inst-kpi-card" style={{ padding: '8px 14px', borderLeft: '3px solid #2563EB', background: '#F8FAFC', borderRadius: '4px' }}>
          <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
            ACTIVE BUSES
          </span>
          <strong style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A' }}>
            {fleetList.length || 24}
          </strong>
        </div>

        <div className="inst-kpi-card" style={{ padding: '8px 14px', borderLeft: '3px solid #10B981', background: '#F8FAFC', borderRadius: '4px' }}>
          <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
            LIVE NOW (GPS)
          </span>
          <strong style={{ fontSize: '1.45rem', fontWeight: 800, color: '#059669' }}>
            {liveBusesCount || 1}
          </strong>
        </div>

        <div className="inst-kpi-card" style={{ padding: '8px 14px', borderLeft: '3px solid #6366F1', background: '#F8FAFC', borderRadius: '4px' }}>
          <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
            DRIVERS ROSTER
          </span>
          <strong style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A' }}>
            {institutionDrivers.length || 4}
          </strong>
        </div>

        <div className="inst-kpi-card" style={{ padding: '8px 14px', borderLeft: '3px solid #F59E0B', background: '#F8FAFC', borderRadius: '4px' }}>
          <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
            STUDENTS
          </span>
          <strong style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A' }}>
            842
          </strong>
        </div>

        <div className="inst-kpi-card" style={{ padding: '8px 14px', borderLeft: '3px solid #EC4899', background: '#F8FAFC', borderRadius: '4px' }}>
          <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
            OPEN POSITIONS
          </span>
          <strong style={{ fontSize: '1.45rem', fontWeight: 800, color: '#BE185D' }}>
            {jobPostings.filter(j => j.status !== 'CLOSED').length}
          </strong>
        </div>

        <div className="inst-kpi-card" style={{ padding: '8px 14px', borderLeft: '3px solid #EF4444', background: '#F8FAFC', borderRadius: '4px' }}>
          <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
            INCIDENTS
          </span>
          <strong style={{ fontSize: '1.45rem', fontWeight: 800, color: '#DC2626' }}>
            {incidents.length}
          </strong>
        </div>
      </div>

      {/* 4. NAVIGATION TABS (SPEC SECTION 9) */}
      <div className="inst-tabs-bar">
        {[
          { id: 'overview', label: 'Overview', icon: TrendingUp },
          { id: 'live_fleet', label: 'Live Fleet Map', icon: Radio },
          { id: 'buses', label: `Fleet Buses (${fleetList.length})`, icon: Bus },
          { id: 'drivers', label: `Drivers (${institutionDrivers.length})`, icon: UserCheck },
          { id: 'routes', label: `Routes (${routesList.length})`, icon: MapPin },
          { id: 'hiring', label: `Driver Hiring & Marketplace`, icon: Sparkles, highlight: true },
          { id: 'incidents', label: `Incidents (${incidents.length})`, icon: AlertTriangle }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="inst-tab-button"
              style={{
                borderBottom: `2.5px solid ${isActive ? '#2563EB' : 'transparent'}`,
                color: isActive ? '#2563EB' : tab.highlight ? '#D97706' : '#64748B'
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {tab.highlight && (
                <span style={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  padding: '1px 5px',
                  borderRadius: '4px',
                  background: '#FEF3C7',
                  color: '#B45309'
                }}>
                  NEW
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 5. MAIN CONTENT PANELS */}
      <main style={{ flex: 1, padding: '24px', maxWidth: '1440px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        
        {/* ==================================================================== */}
        {/* TAB 1: OVERVIEW */}
        {/* ==================================================================== */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Quick Action Strip */}
            <div style={{
              background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
              borderRadius: '16px',
              padding: '24px',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
                  Transport Command Center — Daily Operations
                </h2>
                <p style={{ margin: 0, fontSize: '0.86rem', color: '#94A3B8' }}>
                  Connecting verified drivers, fleet assets, and parent tracking in one synchronized operating platform.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setShowAddBusModal(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 16px',
                    borderRadius: '8px',
                    background: '#2563EB',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={15} />
                  <span>Add Bus</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('hiring');
                    setHiringSubTab('find_drivers');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 16px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.1)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255,255,255,0.2)',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'pointer'
                  }}
                >
                  <Sparkles size={15} color="#FBBF24" />
                  <span>Find Verified Drivers</span>
                </button>
              </div>
            </div>

            {/* Two Column Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
              
              {/* Active Fleet Quick Glance */}
              <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Radio size={16} color="#2563EB" />
                    <span>Live Fleet Status</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('live_fleet')}
                    style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span>View Map</span>
                    <ArrowRight size={13} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {fleetList.slice(0, 4).map(bus => {
                    const isLive = bus.status === 'ON_TRIP' || bus.status === 'LIVE' || bus.activeTripId;
                    return (
                      <div key={bus.id} style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: isLive ? '#ECFDF5' : '#EFF6FF',
                            color: isLive ? '#059669' : '#2563EB',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Bus size={18} />
                          </div>
                          <div>
                            <strong style={{ fontSize: '0.88rem', color: '#0F172A', display: 'block' }}>
                              Bus {bus.busNumber} • {bus.registrationNumber}
                            </strong>
                            <span style={{ fontSize: '0.76rem', color: '#64748B' }}>
                              Driver: {bus.driverName || 'Unassigned'} • Route: {bus.routeName || 'Standby'}
                            </span>
                          </div>
                        </div>

                        <div>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '999px',
                            background: isLive ? '#DCFCE7' : '#F1F5F9',
                            color: isLive ? '#15803D' : '#64748B'
                          }}>
                            {isLive ? '● LIVE ON ROAD' : bus.status || 'AVAILABLE'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Driver Hiring & Marketplace Summary */}
              <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={16} color="#F59E0B" />
                    <span>Hiring Pipeline &amp; Driver Marketplace</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('hiring')}
                    style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span>Manage Hiring</span>
                    <ArrowRight size={13} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {jobPostings.slice(0, 3).map(job => (
                    <div key={job.id} style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: '#FFFBEB',
                      border: '1px solid #FDE68A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <strong style={{ fontSize: '0.88rem', color: '#92400E', display: 'block' }}>
                          {job.title}
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: '#B45309' }}>
                          {job.salaryRange} • {job.experienceRequired} • {job.location || 'Vijayawada'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: '#F59E0B',
                          color: '#FFFFFF',
                          fontSize: '0.72rem',
                          fontWeight: 700
                        }}>
                          {job.applicantsCount || 0} Applicants
                        </span>
                      </div>
                    </div>
                  ))}

                  <div style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: '#F8FAFC',
                    border: '1px dashed #CBD5E1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ fontSize: '0.82rem', color: '#475569' }}>
                      <strong>{marketplaceDrivers.length} Verified Drivers</strong> currently available in Vijayawada
                    </span>
                    <button
                      onClick={() => {
                        setActiveTab('hiring');
                        setHiringSubTab('find_drivers');
                      }}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '6px',
                        background: '#0F172A',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Browse Drivers
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: LIVE FLEET (SPEC SECTION 10) */}
        {/* ==================================================================== */}
        {activeTab === 'live_fleet' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 4px 0' }}>
                  Live Fleet Radar &amp; Telemetry
                </h2>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B' }}>
                  Real-time GPS updates directly from drivers' smartphones and on-board telemetry.
                </p>
              </div>

              {/* Bus Selector Pills */}
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {fleetList.map(bus => {
                  const isSelected = selectedBusForMap?.id === bus.id;
                  const isLive = bus.status === 'ON_TRIP' || bus.status === 'LIVE' || bus.activeTripId;
                  return (
                    <button
                      key={bus.id}
                      onClick={() => setSelectedBusForMap(bus)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: isSelected ? '#2563EB' : '#FFFFFF',
                        color: isSelected ? '#FFFFFF' : '#0F172A',
                        border: `1.5px solid ${isSelected ? '#2563EB' : '#E2E8F0'}`,
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <span style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: isLive ? '#10B981' : '#94A3B8'
                      }} />
                      <span>Bus {bus.busNumber}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Bus Telemetry HUD */}
            {selectedBusForMap && (
              <div style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: '#EFF6FF',
                    color: '#2563EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Bus size={22} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '1rem', color: '#0F172A' }}>
                        BUS {selectedBusForMap.busNumber}
                      </strong>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        background: selectedBusForMap.status === 'ON_TRIP' || selectedBusForMap.status === 'LIVE' ? '#DCFCE7' : '#F1F5F9',
                        color: selectedBusForMap.status === 'ON_TRIP' || selectedBusForMap.status === 'LIVE' ? '#15803D' : '#64748B'
                      }}>
                        {selectedBusForMap.status === 'ON_TRIP' || selectedBusForMap.status === 'LIVE' ? '● LIVE' : 'STANDBY'}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                      Registration: {selectedBusForMap.registrationNumber || selectedBusForMap.plateNumber || '--'} • Route: {selectedBusForMap.routeName || selectedBusForMap.route || 'Assigned Corridor'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>DRIVER</span>
                    <strong style={{ fontSize: '0.86rem', color: '#0F172A' }}>
                      {selectedBusForMap.driverName || 'Assigned Driver'}
                    </strong>
                  </div>

                  <div>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>SPEED</span>
                    <strong style={{ fontSize: '0.86rem', color: '#0F172A' }}>
                      {selectedBusForMap.speed != null ? `${Math.round(selectedBusForMap.speed)} km/h` : '0 km/h'}
                    </strong>
                  </div>

                  <div>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>GPS FRESHNESS</span>
                    <strong style={{ fontSize: '0.84rem', color: '#059669' }}>
                      UPDATED 4 SEC AGO
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* Map Canvas */}
            <div style={{
              height: '560px',
              borderRadius: '14px',
              overflow: 'hidden',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
            }}>
              <BusMap
                activeBuses={fleetList}
                selectedBus={selectedBusForMap}
                onSelectBus={(b) => setSelectedBusForMap(b)}
              />
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 3: BUSES (SPEC SECTION 11) */}
        {/* ==================================================================== */}
        {activeTab === 'buses' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 4px 0' }}>
                  Fleet Vehicle Management
                </h2>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B' }}>
                  Manage buses, capacities, assigned drivers and corridor routes.
                </p>
              </div>

              <button
                onClick={() => setShowAddBusModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  background: '#2563EB',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} />
                <span>Add Bus to Fleet</span>
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '16px'
            }}>
              {fleetList.map(bus => (
                <div key={bus.id} style={{
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        background: '#EFF6FF',
                        color: '#2563EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Bus size={20} />
                      </div>
                      <div>
                        <strong style={{ fontSize: '1rem', color: '#0F172A', display: 'block' }}>
                          Bus {bus.busNumber}
                        </strong>
                        <span style={{ fontSize: '0.76rem', color: '#64748B' }}>
                          {bus.registrationNumber}
                        </span>
                      </div>
                    </div>

                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: bus.status === 'ASSIGNED' ? '#EFF6FF' : bus.status === 'AVAILABLE' ? '#F0FDF4' : '#F1F5F9',
                      color: bus.status === 'ASSIGNED' ? '#1D4ED8' : bus.status === 'AVAILABLE' ? '#15803D' : '#64748B',
                      fontSize: '0.72rem',
                      fontWeight: 700
                    }}>
                      {bus.status || 'AVAILABLE'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '10px', background: '#F8FAFC', borderRadius: '8px', fontSize: '0.78rem' }}>
                    <div>
                      <span style={{ color: '#64748B', display: 'block' }}>Capacity</span>
                      <strong style={{ color: '#0F172A' }}>{bus.capacity || 52} Passengers</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block' }}>Assigned Driver</span>
                      <strong style={{ color: '#0F172A' }}>{bus.driverName || 'None'}</strong>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ color: '#64748B', display: 'block' }}>Active Corridor</span>
                      <strong style={{ color: '#0F172A' }}>{bus.routeName || 'Unassigned'}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                    <button
                      onClick={() => {
                        setSelectedBusToAssign(bus);
                        setShowAssignModal(true);
                      }}
                      style={{
                        flex: 1,
                        padding: '7px 10px',
                        borderRadius: '6px',
                        background: '#F1F5F9',
                        border: '1px solid #CBD5E1',
                        color: '#0F172A',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      <UserCheck size={14} />
                      <span>Assign Driver &amp; Route</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 4: DRIVERS (SPEC SECTION 12) */}
        {/* ==================================================================== */}
        {activeTab === 'drivers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 4px 0' }}>
                  Institutional Driver Roster
                </h2>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B' }}>
                  Verified drivers currently associated and operating with {currentInstitution.name}.
                </p>
              </div>

              <button
                onClick={() => {
                  setActiveTab('hiring');
                  setHiringSubTab('find_drivers');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer'
                }}
              >
                <UserPlus size={16} />
                <span>Recruit Verified Drivers</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
              {institutionDrivers.map(driver => (
                <div key={driver.id} style={{
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <strong style={{ fontSize: '1.02rem', color: '#0F172A' }}>
                          {driver.fullName || driver.name}
                        </strong>
                        <span style={{ color: '#059669' }} title="Platform Verified Driver">
                          <ShieldCheck size={16} />
                        </span>
                      </div>
                      <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                        Experience: {driver.experienceYears || '8'} years • {driver.phone || '+91 98480 22331'}
                      </span>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: '#FFFBEB',
                      color: '#B45309',
                      fontSize: '0.78rem',
                      fontWeight: 800
                    }}>
                      <Star size={13} fill="#F59E0B" color="#F59E0B" />
                      <span>{driver.rating || '4.8'}</span>
                    </div>
                  </div>

                  <div style={{ padding: '10px 12px', background: '#F8FAFC', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Assigned Bus:</span>
                      <strong style={{ color: '#0F172A' }}>{driver.assignedBusNumber || driver.assignedBusId || 'Bus 12'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Route:</span>
                      <strong style={{ color: '#0F172A' }}>{driver.assignedRouteName || 'Vijayawada → Campus'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Status:</span>
                      <span style={{ color: '#059669', fontWeight: 700 }}>ACTIVE ON DUTY</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setShowDriverProfileModal(driver)}
                      style={{
                        flex: 1,
                        padding: '7px',
                        borderRadius: '6px',
                        background: '#F1F5F9',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: '#0F172A',
                        cursor: 'pointer'
                      }}
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => {
                        const b = fleetList.find(b => b.driverId === driver.id) || fleetList[0];
                        if (b) {
                          setSelectedBusToAssign(b);
                          setShowAssignModal(true);
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: '7px',
                        borderRadius: '6px',
                        background: '#EFF6FF',
                        border: '1px solid #BFDBFE',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: '#1D4ED8',
                        cursor: 'pointer'
                      }}
                    >
                      Reassign
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 5: ROUTES (SPEC SECTION 20) */}
        {/* ==================================================================== */}
        {activeTab === 'routes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 4px 0' }}>
                  Corridor Routes &amp; Stops
                </h2>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B' }}>
                  Educational transport corridors, ordered pickup stops, and timing schedules.
                </p>
              </div>

              <button
                onClick={() => setShowAddRouteModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  background: '#2563EB',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} />
                <span>Create New Route</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
              {routesList.map(route => {
                const stops = route.stops || [];

                return (
                  <div key={route.id} style={{
                    background: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <strong style={{ fontSize: '1rem', color: '#0F172A', display: 'block' }}>
                          {route.routeName || route.name || 'Corridor Route'}
                        </strong>
                        <span style={{ fontSize: '0.76rem', color: '#64748B' }}>
                          {route.code || 'CORRIDOR'} • {route.from || 'Origin'} → {route.to || 'Campus'}
                        </span>
                      </div>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: '#F0FDF4',
                        color: '#15803D',
                        fontSize: '0.72rem',
                        fontWeight: 700
                      }}>
                        ACTIVE
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.78rem', color: '#475569' }}>
                      <div>
                        <span style={{ color: '#64748B' }}>Departure: </span>
                        <strong>{route.departureTime || '07:00 AM'}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748B' }}>Arrival: </span>
                        <strong>{route.expectedArrival || '08:15 AM'}</strong>
                      </div>
                    </div>

                    {/* Ordered Stops Stepper Preview */}
                    <div>
                      <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748B', marginBottom: '6px' }}>
                        STOPS SEQUENCE ({stops.length})
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {stops.map((stop, idx) => (
                          <span key={idx} style={{
                            fontSize: '0.74rem',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: '#F1F5F9',
                            color: '#334155',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <span style={{ color: '#94A3B8', fontWeight: 700 }}>{idx + 1}.</span>
                            <span>{stop.stopName || stop}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 6: DRIVER HIRING & MARKETPLACE (SPEC SECTION 13-19) */}
        {/* ==================================================================== */}
        {activeTab === 'hiring' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Marketplace Sub-navigation */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #E2E8F0',
              paddingBottom: '12px',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setHiringSubTab('open_jobs')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: hiringSubTab === 'open_jobs' ? '#0F172A' : '#F1F5F9',
                    color: hiringSubTab === 'open_jobs' ? '#FFFFFF' : '#475569',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'pointer'
                  }}
                >
                  Open Requirements ({jobPostings.length})
                </button>

                <button
                  onClick={() => setHiringSubTab('find_drivers')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: hiringSubTab === 'find_drivers' ? '#0F172A' : '#F1F5F9',
                    color: hiringSubTab === 'find_drivers' ? '#FFFFFF' : '#475569',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Sparkles size={14} color={hiringSubTab === 'find_drivers' ? '#FBBF24' : '#D97706'} />
                  <span>Find Verified Drivers ({marketplaceDrivers.length})</span>
                </button>

                <button
                  onClick={() => setHiringSubTab('applications')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: hiringSubTab === 'applications' ? '#0F172A' : '#F1F5F9',
                    color: hiringSubTab === 'applications' ? '#FFFFFF' : '#475569',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'pointer'
                  }}
                >
                  Candidate Applications ({jobApplications.length})
                </button>
              </div>

              {hiringSubTab === 'open_jobs' && (
                <button
                  onClick={() => setShowPostJobModal(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: '#2563EB',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={15} />
                  <span>Post New Requirement</span>
                </button>
              )}
            </div>

            {/* SUBTAB A: OPEN REQUIREMENTS */}
            {hiringSubTab === 'open_jobs' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
                {jobPostings.map(job => (
                  <div key={job.id} style={{
                    background: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div>
                        <strong style={{ fontSize: '1rem', color: '#0F172A', display: 'block' }}>
                          {job.title}
                        </strong>
                        <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                          {job.location || 'Vijayawada'} • {job.jobType || 'Full-time'}
                        </span>
                      </div>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: '#DCFCE7',
                        color: '#15803D',
                        fontSize: '0.72rem',
                        fontWeight: 700
                      }}>
                        {job.status || 'OPEN'}
                      </span>
                    </div>

                    <div style={{ padding: '10px 12px', background: '#F8FAFC', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748B' }}>Compensation:</span>
                        <strong style={{ color: '#0F172A' }}>{job.salaryRange || '₹25,000 - ₹30,000'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748B' }}>Required Exp:</span>
                        <strong style={{ color: '#0F172A' }}>{job.experienceRequired || '3+ years'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748B' }}>Vehicle Class:</span>
                        <strong style={{ color: '#0F172A' }}>{job.vehicleType || 'Heavy Passenger Bus'}</strong>
                      </div>
                    </div>

                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B', lineHeight: '1.4' }}>
                      {job.description}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F1F5F9', paddingTop: '10px', marginTop: 'auto' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#2563EB' }}>
                        {job.applicantsCount || 0} Candidates Applied
                      </span>

                      <button
                        onClick={() => {
                          setHiringSubTab('applications');
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          background: '#F1F5F9',
                          border: '1px solid #CBD5E1',
                          color: '#0F172A',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Review Applicants
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* SUBTAB B: FIND VERIFIED DRIVERS (SPEC SECTION 14) */}
            {hiringSubTab === 'find_drivers' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Search & Filter Bar */}
                <div style={{
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
                    <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      placeholder="Search verified drivers by name or area (e.g. Vijayawada, Guntur)..."
                      value={driverSearchQuery}
                      onChange={(e) => setDriverSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px 8px 36px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.84rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <select
                    value={filterExperience}
                    onChange={(e) => setFilterExperience(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', background: '#FFFFFF' }}
                  >
                    <option value="all">Experience: Any</option>
                    <option value="3+">3+ Years</option>
                    <option value="5+">5+ Years</option>
                    <option value="8+">8+ Years</option>
                  </select>

                  <select
                    value={filterAvailability}
                    onChange={(e) => setFilterAvailability(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', background: '#FFFFFF' }}
                  >
                    <option value="all">Availability: All</option>
                    <option value="available">🟢 Available for Hire</option>
                  </select>
                </div>

                {/* Verified Driver Cards Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
                  {marketplaceDrivers.map(driver => (
                    <div key={driver.id} style={{
                      background: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <strong style={{ fontSize: '1.02rem', color: '#0F172A' }}>
                              {driver.fullName || driver.name}
                            </strong>
                            <span style={{ color: '#059669' }} title="Platform Verified Driver">
                              <ShieldCheck size={16} />
                            </span>
                          </div>
                          <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                            {driver.preferredArea || driver.location || 'Vijayawada'} • {driver.distance || '4.2 km away'}
                          </span>
                        </div>

                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: '#FFFBEB',
                          color: '#B45309',
                          fontSize: '0.78rem',
                          fontWeight: 800
                        }}>
                          <Star size={13} fill="#F59E0B" color="#F59E0B" />
                          <span>{driver.rating || '4.8'}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', background: '#F1F5F9', color: '#475569', fontWeight: 600 }}>
                          {driver.experienceYears || '8'} Years Experience
                        </span>
                        <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', background: '#EFF6FF', color: '#1D4ED8', fontWeight: 600 }}>
                          School Bus
                        </span>
                        <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', background: '#ECFDF5', color: '#047857', fontWeight: 600 }}>
                          {driver.availability === 'BUSY' ? '🔴 On Duty' : '🟢 Available'}
                        </span>
                      </div>

                      <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '12px', display: 'flex', gap: '8px', marginTop: 'auto' }}>
                        <button
                          onClick={() => setShowDriverProfileModal(driver)}
                          style={{
                            flex: 1,
                            padding: '8px',
                            borderRadius: '6px',
                            background: '#F8FAFC',
                            border: '1px solid #CBD5E1',
                            color: '#0F172A',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          View Profile
                        </button>

                        <button
                          onClick={() => {
                            setSelectedDriverToInvite(driver);
                            setInviteJobId(jobPostings[0]?.id || '');
                            setShowInviteModal(true);
                          }}
                          style={{
                            flex: 1.2,
                            padding: '8px',
                            borderRadius: '6px',
                            background: '#2563EB',
                            border: 'none',
                            color: '#FFFFFF',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                        >
                          <Send size={13} />
                          <span>Invite to Apply</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUBTAB C: CANDIDATE APPLICATIONS (SPEC SECTION 17) */}
            {hiringSubTab === 'applications' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {jobApplications.length === 0 ? (
                  <div style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    background: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px dashed #CBD5E1'
                  }}>
                    <Users size={36} color="#94A3B8" style={{ marginBottom: '8px' }} />
                    <strong style={{ display: 'block', fontSize: '1rem', color: '#0F172A' }}>
                      No candidate applications yet
                    </strong>
                    <p style={{ margin: '4px 0 16px 0', fontSize: '0.82rem', color: '#64748B' }}>
                      When verified drivers apply to your open positions, their application profiles will appear here for review.
                    </p>
                    <button
                      onClick={() => setHiringSubTab('find_drivers')}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        background: '#0F172A',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Browse &amp; Invite Verified Drivers
                    </button>
                  </div>
                ) : (
                  jobApplications.map(app => (
                    <div key={app.id} style={{
                      background: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '14px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '10px',
                          background: '#F1F5F9',
                          color: '#334155',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800
                        }}>
                          {(app.driverName || 'D')[0]}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <strong style={{ fontSize: '0.98rem', color: '#0F172A' }}>
                              {app.driverName || 'Driver Applicant'}
                            </strong>
                            <ShieldCheck size={15} color="#059669" />
                          </div>
                          <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                            Applied for: <strong>{app.jobTitle || 'School Bus Driver'}</strong> • Experience: {app.experienceYears || '8'} yrs
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.74rem',
                          fontWeight: 800,
                          background: app.status === 'SELECTED' ? '#DCFCE7' : app.status === 'SHORTLISTED' ? '#FEF3C7' : '#EFF6FF',
                          color: app.status === 'SELECTED' ? '#15803D' : app.status === 'SHORTLISTED' ? '#B45309' : '#1D4ED8'
                        }}>
                          {app.status || 'APPLIED'}
                        </span>

                        {app.status !== 'SELECTED' && (
                          <>
                            <button
                              onClick={() => handleShortlistApplication(app)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                background: '#F1F5F9',
                                border: '1px solid #CBD5E1',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              Shortlist
                            </button>

                            <button
                              onClick={() => handleHireDriverApplication(app)}
                              style={{
                                padding: '6px 14px',
                                borderRadius: '6px',
                                background: '#10B981',
                                color: '#FFFFFF',
                                border: 'none',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Check size={14} />
                              <span>Confirm Hire</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 7: INCIDENTS (SPEC SECTION 29) */}
        {/* ==================================================================== */}
        {activeTab === 'incidents' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 4px 0' }}>
                  Safety &amp; Transport Incidents Log
                </h2>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B' }}>
                  Real-time exception logging for breakdowns, road traffic delays, and route incidents.
                </p>
              </div>

              <button
                onClick={() => setShowReportIncidentModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  background: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer'
                }}
              >
                <AlertTriangle size={15} />
                <span>Log New Incident</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {incidents.length === 0 ? (
                <div style={{ padding: '36px', textAlign: 'center', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <CheckCircle2 size={36} color="#10B981" style={{ marginBottom: '8px' }} />
                  <strong style={{ display: 'block', color: '#0F172A' }}>Zero Active Safety Incidents</strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748B' }}>All operating routes and buses are moving smoothly.</p>
                </div>
              ) : (
                incidents.map(inc => (
                  <div key={inc.id} style={{
                    background: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #FECACA',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '14px'
                  }}>
                    <div style={{ display: 'flex', gap: '14px' }}>
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '8px',
                        background: '#FEF2F2',
                        color: '#DC2626',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <AlertTriangle size={20} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ fontSize: '0.96rem', color: '#0F172A' }}>
                            {inc.category || 'Delay'}
                          </strong>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: '#FEE2E2',
                            color: '#991B1B',
                            fontSize: '0.72rem',
                            fontWeight: 700
                          }}>
                            {inc.severity || 'Medium'} Severity
                          </span>
                        </div>
                        <p style={{ margin: '4px 0 6px 0', fontSize: '0.84rem', color: '#334155' }}>
                          {inc.description}
                        </p>
                        <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>
                          Reported by: {inc.reportedBy || 'Transport Desk'} • Bus {inc.busId || 'General'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </main>

      {/* ==================================================================== */}
      {/* MODAL 1: ADD BUS */}
      {/* ==================================================================== */}
      {showAddBusModal && (
        <div className="responsive-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setShowAddBusModal(false); }}>
          <div className="responsive-modal-dialog">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 4px 0' }}>Add Bus to Institution Fleet</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0 0 16px 0' }}>Register a new vehicle asset for route operations.</p>

            <form onSubmit={handleCreateBus} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Bus Internal Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 15 or B-15"
                  value={busForm.busNumber}
                  onChange={(e) => setBusForm({ ...busForm, busNumber: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>RTA Registration Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AP 16 TE 4421"
                  value={busForm.registrationNumber}
                  onChange={(e) => setBusForm({ ...busForm, registrationNumber: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Seating Capacity</label>
                <input
                  type="number"
                  required
                  value={busForm.capacity}
                  onChange={(e) => setBusForm({ ...busForm, capacity: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddBusModal(false)}
                  style={{ padding: '8px 14px', borderRadius: '8px', background: '#F1F5F9', border: 'none', color: '#475569', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', borderRadius: '8px', background: '#2563EB', border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
                >
                  Save Bus Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: ASSIGN DRIVER & ROUTE */}
      {/* ==================================================================== */}
      {showAssignModal && selectedBusToAssign && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px'
        }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '440px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 4px 0' }}>Assign Bus {selectedBusToAssign.busNumber}</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0 0 16px 0' }}>Connect an institutional driver and daily corridor route to this bus.</p>

            <form onSubmit={handleAssignDriverRoute} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Select Verified Driver</label>
                <select
                  required
                  value={assignDriverId}
                  onChange={(e) => setAssignDriverId(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.86rem', background: '#FFFFFF' }}
                >
                  <option value="">-- Choose Verified Driver --</option>
                  {institutionDrivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.fullName || d.name} (Exp: {d.experienceYears || '8'} yrs, ⭐ {d.rating || '4.8'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Select Operating Route</label>
                <select
                  required
                  value={assignRouteId}
                  onChange={(e) => setAssignRouteId(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.86rem', background: '#FFFFFF' }}
                >
                  <option value="">-- Choose Route Corridor --</option>
                  {routesList.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.routeName || r.name || r.code} ({r.from} → {r.to})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedBusToAssign(null);
                  }}
                  style={{ padding: '8px 14px', borderRadius: '8px', background: '#F1F5F9', border: 'none', color: '#475569', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', borderRadius: '8px', background: '#2563EB', border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 3: POST JOB REQUIREMENT (SPEC SECTION 13) */}
      {/* ==================================================================== */}
      {showPostJobModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px'
        }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 4px 0' }}>Post Driver Requirement</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0 0 16px 0' }}>Publish opening to verified drivers on the Nishchit marketplace.</p>

            <form onSubmit={handleCreateJob} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Position Title</label>
                <input
                  type="text"
                  required
                  value={jobForm.title}
                  onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Salary Range</label>
                  <input
                    type="text"
                    required
                    value={jobForm.salaryRange}
                    onChange={(e) => setJobForm({ ...jobForm, salaryRange: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Min Experience</label>
                  <input
                    type="text"
                    required
                    value={jobForm.experienceRequired}
                    onChange={(e) => setJobForm({ ...jobForm, experienceRequired: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Vehicle Class</label>
                <input
                  type="text"
                  required
                  value={jobForm.vehicleType}
                  onChange={(e) => setJobForm({ ...jobForm, vehicleType: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Job Description</label>
                <textarea
                  rows={3}
                  value={jobForm.description}
                  onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowPostJobModal(false)}
                  style={{ padding: '8px 14px', borderRadius: '8px', background: '#F1F5F9', border: 'none', color: '#475569', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', borderRadius: '8px', background: '#2563EB', border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
                >
                  Publish Requirement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 4: INVITE VERIFIED DRIVER (SPEC SECTION 18) */}
      {/* ==================================================================== */}
      {showInviteModal && selectedDriverToInvite && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px'
        }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '440px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 4px 0' }}>Invite {selectedDriverToInvite.fullName || selectedDriverToInvite.name}</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0 0 16px 0' }}>Send direct job opportunity invitation to this verified driver.</p>

            <form onSubmit={handleSendInvitation} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Select Open Position</label>
                <select
                  required
                  value={inviteJobId}
                  onChange={(e) => setInviteJobId(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.86rem', background: '#FFFFFF' }}
                >
                  {jobPostings.map(job => (
                    <option key={job.id} value={job.id}>
                      {job.title} ({job.salaryRange})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Personalized Note (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="e.g. We have an immediate requirement for our Benz Circle corridor route."
                  value={inviteNote}
                  onChange={(e) => setInviteNote(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    setSelectedDriverToInvite(null);
                  }}
                  style={{ padding: '8px 14px', borderRadius: '8px', background: '#F1F5F9', border: 'none', color: '#475569', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', borderRadius: '8px', background: '#2563EB', border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={14} />
                  <span>Send Opportunity</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 5: DRIVER PROFILE PREVIEW (SPEC SECTION 15) */}
      {/* ==================================================================== */}
      {showDriverProfileModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px'
        }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '12px',
                  background: '#EFF6FF',
                  color: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.2rem'
                }}>
                  {(showDriverProfileModal.fullName || showDriverProfileModal.name || 'D')[0]}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                      {showDriverProfileModal.fullName || showDriverProfileModal.name}
                    </h3>
                    <ShieldCheck size={18} color="#059669" />
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                    Platform Verified Professional Driver
                  </span>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '6px',
                background: '#FFFBEB',
                color: '#B45309',
                fontSize: '0.82rem',
                fontWeight: 800
              }}>
                <Star size={14} fill="#F59E0B" color="#F59E0B" />
                <span>{showDriverProfileModal.rating || '4.8'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.82rem' }}>
              <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Experience:</span>
                  <strong style={{ color: '#0F172A' }}>{showDriverProfileModal.experienceYears || '8'} Years Commercial Driving</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Preferred Locations:</span>
                  <strong style={{ color: '#0F172A' }}>{showDriverProfileModal.preferredArea || 'Vijayawada, Guntur'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Availability:</span>
                  <strong style={{ color: '#059669' }}>🟢 Available for Hire</strong>
                </div>
              </div>

              <div style={{ padding: '12px', background: '#F0FDF4', borderRadius: '10px', border: '1px solid #BBF7D0' }}>
                <strong style={{ display: 'block', color: '#166534', marginBottom: '4px' }}>
                  Verified Credentials
                </strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', color: '#15803D', fontSize: '0.78rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Check size={14} />
                    <span>Heavy Passenger Vehicle (HPV) Driving License Verified</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Check size={14} />
                    <span>Government Identity (Aadhaar/PAN) Authenticated</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Check size={14} />
                    <span>School/College Corridor Experience Verified</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '18px' }}>
              <button
                type="button"
                onClick={() => setShowDriverProfileModal(null)}
                style={{ padding: '8px 18px', borderRadius: '8px', background: '#0F172A', color: '#FFFFFF', border: 'none', fontWeight: 700, cursor: 'pointer' }}
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 6: LOG INCIDENT */}
      {/* ==================================================================== */}
      {showReportIncidentModal && (
        <div className="responsive-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setShowReportIncidentModal(false); }}>
          <div className="responsive-modal-dialog">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 4px 0', color: '#DC2626' }}>Log Transport Incident</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0 0 16px 0' }}>Report operational issue or route exception.</p>

            <form onSubmit={handleReportIncident} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Category</label>
                <select
                  value={incidentForm.category}
                  onChange={(e) => setIncidentForm({ ...incidentForm, category: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.86rem', background: '#FFFFFF' }}
                >
                  <option value="Delay">Route Traffic Delay</option>
                  <option value="Breakdown">Vehicle Mechanical Breakdown</option>
                  <option value="Accident">Accident / Collision</option>
                  <option value="Driver Issue">Driver Absence / Issue</option>
                  <option value="Route Blockage">Corridor Road Blockage</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Severity</label>
                <select
                  value={incidentForm.severity}
                  onChange={(e) => setIncidentForm({ ...incidentForm, severity: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.86rem', background: '#FFFFFF' }}
                >
                  <option value="Low">Low (Informational)</option>
                  <option value="Medium">Medium (Route affected)</option>
                  <option value="High">High (Immediate intervention required)</option>
                  <option value="Critical">Critical (Emergency)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Description</label>
                <textarea
                  rows={3}
                  required
                  value={incidentForm.description}
                  onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowReportIncidentModal(false)}
                  style={{ padding: '8px 14px', borderRadius: '8px', background: '#F1F5F9', border: 'none', color: '#475569', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', borderRadius: '8px', background: '#DC2626', border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
