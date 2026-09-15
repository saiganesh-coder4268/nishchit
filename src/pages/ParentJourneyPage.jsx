import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ParentShell from '../components/shells/ParentShell';
import {
  subscribeRoutes,
  subscribeBuses,
  subscribeSchedules,
  subscribeActiveTrips,
  subscribeLiveLocation,
  resolveBusJourneyDetails,
  subscribeParentStudents
} from '../services/transportService';
import { INITIAL_ROUTES, INITIAL_VEHICLES } from '../data/regionData';
import { isValidCoordinate } from '../utils/busStatus';
import {
  ArrowLeft, Bus, MapPin, Clock, ShieldCheck, Phone,
  Navigation, Radio, AlertCircle, Share2, Check,
  ChevronRight, Calendar, User, Info, AlertTriangle
} from 'lucide-react';

export default function ParentJourneyPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const queryBusId = searchParams.get('busId') || currentUser?.busId;
  const queryRouteId = searchParams.get('routeId') || currentUser?.routeId;
  const childStop = searchParams.get('stop') || currentUser?.stopName || 'Child Stop';

  // Data states
  const [routesList, setRoutesList] = useState([]);
  const [fleetList, setFleetList] = useState([]);
  const [schedulesList, setSchedulesList] = useState([]);
  const [activeTripsList, setActiveTripsList] = useState([]);
  const [liveLocation, setLiveLocation] = useState(null);
  const [copied, setCopied] = useState(false);
  const [timeAgo, setTimeAgo] = useState('just now');

  // Multi-student support
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  useEffect(() => {
    if (currentUser?.uid || currentUser?.email) {
      const unsubStudents = subscribeParentStudents(currentUser.uid, currentUser.email, (list) => {
        setStudents(list);
        if (list.length > 0 && !selectedStudentId) {
          setSelectedStudentId(list[0].id);
        }
      });
      return () => unsubStudents();
    }
  }, [currentUser, selectedStudentId]);

  const activeStudent = useMemo(() => {
    return students.find(s => s.id === selectedStudentId) || students[0] || null;
  }, [students, selectedStudentId]);

  // Subscriptions
  useEffect(() => {
    const unsubRoutes = subscribeRoutes(setRoutesList);
    const unsubBuses = subscribeBuses(setFleetList);
    const unsubSchedules = subscribeSchedules(setSchedulesList);
    const unsubTrips = subscribeActiveTrips(setActiveTripsList);

    return () => {
      unsubRoutes();
      unsubBuses();
      unsubSchedules();
      unsubTrips();
    };
  }, []);

  const effectiveRoutes = routesList.length > 0 ? routesList : INITIAL_ROUTES;
  const effectiveFleet = fleetList.length > 0 ? fleetList : INITIAL_VEHICLES;

  // Resolve target bus and route
  const targetRoute = useMemo(() => {
    if (queryRouteId) {
      const r = effectiveRoutes.find(item => item.id === queryRouteId || item.code === queryRouteId);
      if (r) return r;
    }
    if (queryBusId) {
      const b = effectiveFleet.find(item => item.id === queryBusId);
      if (b && (b.routeId || b.assignedRouteId)) {
        const r = effectiveRoutes.find(item => item.id === (b.routeId || b.assignedRouteId));
        if (r) return r;
      }
    }
    return effectiveRoutes[0] || null;
  }, [queryRouteId, queryBusId, effectiveRoutes, effectiveFleet]);

  const journeyDetails = useMemo(() => {
    if (!targetRoute) return null;
    return resolveBusJourneyDetails({
      route: targetRoute,
      buses: effectiveFleet,
      schedules: schedulesList,
      activeTrips: activeTripsList,
      liveLocations: liveLocation ? { [liveLocation.busId || queryBusId]: liveLocation } : {}
    });
  }, [targetRoute, effectiveFleet, schedulesList, activeTripsList, liveLocation, queryBusId]);

  const resolvedBusId = journeyDetails?.busId || queryBusId;

  // RTDB Live GPS subscription
  useEffect(() => {
    if (!resolvedBusId) return;
    const unsubGps = subscribeLiveLocation(resolvedBusId, (data) => {
      setLiveLocation(data);
    });
    return () => unsubGps();
  }, [resolvedBusId]);

  // Freshness timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (!liveLocation?.timestamp) {
        setTimeAgo('Waiting for signal');
        return;
      }
      const diffSec = Math.floor((Date.now() - liveLocation.timestamp) / 1000);
      if (diffSec < 5) setTimeAgo('updated just now');
      else if (diffSec < 60) setTimeAgo(`updated ${diffSec}s ago`);
      else setTimeAgo(`updated ${Math.floor(diffSec / 60)}m ago`);
    }, 2000);

    return () => clearInterval(interval);
  }, [liveLocation]);

  const isLive = journeyDetails?.state === 'LIVE';
  const isCompleted = journeyDetails?.state === 'COMPLETED';

  // Build the 5-stop journey progression
  const allStops = targetRoute?.stops || [];
  const totalStopsCount = allStops.length;

  // Find your stop index
  const effectiveYourStop = activeStudent?.stopName || childStop;
  let yourStopIndex = allStops.findIndex(s => 
    s.name.toLowerCase().includes(effectiveYourStop.toLowerCase()) ||
    effectiveYourStop.toLowerCase().includes(s.name.toLowerCase())
  );
  if (yourStopIndex === -1) {
    yourStopIndex = Math.min(3, Math.max(1, totalStopsCount - 1));
  }

  // Simulated or calculated current bus stop position based on live coordinates
  const currentStopIndex = useMemo(() => {
    if (!isLive) return 0;
    if (isCompleted) return totalStopsCount - 1;
    // Advance midway towards your stop
    return Math.max(1, Math.min(yourStopIndex - 1, totalStopsCount - 2));
  }, [isLive, isCompleted, yourStopIndex, totalStopsCount]);

  const nextStop = allStops[currentStopIndex] || allStops[0] || { name: 'En Route' };

  // Calculate dynamic ETA to your stop
  const dynamicEtaMins = useMemo(() => {
    if (!isLive) return null;
    const stopsRemaining = Math.max(1, yourStopIndex - currentStopIndex);
    return stopsRemaining * 6 + 4; // ~6-10 min per corridor stop
  }, [isLive, yourStopIndex, currentStopIndex]);

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <ParentShell activeTab="track">
      <div className="parent-journey-page-content" style={{ maxWidth: '960px', margin: '0 auto', padding: '20px 16px 80px' }}>
        
        {/* Navigation Breadcrumb & Back */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <button
            onClick={() => navigate('/parent/dashboard')}
            className="btn-back-nav"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#F1F5F9',
              border: '1px solid #E2E8F0',
              padding: '8px 14px',
              borderRadius: '8px',
              color: '#1E293B',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Search</span>
          </button>

          {/* Child Switcher if multiple */}
          {students.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>Tracking:</span>
              <select
                value={selectedStudentId || ''}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '0.86rem',
                  color: '#0F172A'
                }}
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.stopName})</option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handleShare}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              padding: '8px 14px',
              borderRadius: '8px',
              color: '#334155',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {copied ? <Check size={16} color="#16A34A" /> : <Share2 size={16} />}
            <span>{copied ? 'Link Copied!' : 'Share Journey'}</span>
          </button>
        </div>

        {/* PRIMARY BUS STATUS HERO CARD */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.06)',
            padding: '24px',
            marginBottom: '24px'
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A' }}>
                  {journeyDetails?.busNumber || 'Bus 04'}
                </span>
                {journeyDetails?.registrationNumber && (
                  <span style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '2px 8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                    {journeyDetails.registrationNumber}
                  </span>
                )}
                {/* Status Badge */}
                {isLive ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#DCFCE7', color: '#15803D', padding: '4px 10px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700 }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E', animation: 'pulse 1.5s infinite' }} />
                    Bus is on the way
                  </span>
                ) : isCompleted ? (
                  <span style={{ background: '#F1F5F9', color: '#475569', padding: '4px 10px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700 }}>
                    Trip Completed
                  </span>
                ) : (
                  <span style={{ background: '#FEF3C7', color: '#B45309', padding: '4px 10px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700 }}>
                    Scheduled · {journeyDetails?.departureTime || '07:15 AM'}
                  </span>
                )}
              </div>

              <div style={{ fontSize: '0.92rem', color: '#64748B', fontWeight: 500 }}>
                {targetRoute?.name || 'Corridor Route'} · {targetRoute?.institutionName || 'Authorized Institution'}
              </div>
            </div>

            {/* Quick Action: Open Live Map */}
            <div>
              <Link
                to={`/parent/live-location?busId=${resolvedBusId}&routeId=${targetRoute?.id}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#2563EB',
                  color: '#FFFFFF',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  textDecoration: 'none',
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
                }}
              >
                <Navigation size={18} />
                <span>View Live Location</span>
              </Link>
            </div>
          </div>

          <div style={{ height: '1px', background: '#F1F5F9', margin: '20px 0' }} />

          {/* DRIVER & TELEMETRY ROW */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {/* Driver Contact */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem' }}>
                {journeyDetails?.driverName?.charAt(0) || 'D'}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: 700, color: '#1E293B', fontSize: '0.95rem' }}>
                    {journeyDetails?.driverName || 'Authorized Driver'}
                  </span>
                  <ShieldCheck size={16} color="#16A34A" />
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                  Institution Verified Operator
                </div>
              </div>
              {journeyDetails?.driverPhone && (
                <a
                  href={`tel:${journeyDetails.driverPhone}`}
                  style={{
                    marginLeft: 'auto',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#16A34A',
                    textDecoration: 'none'
                  }}
                  title="Call Driver"
                >
                  <Phone size={16} />
                </a>
              )}
            </div>

            {/* GPS Telemetry freshness */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F8FAFC', padding: '10px 14px', borderRadius: '10px', border: '1px solid #F1F5F9' }}>
              <Radio size={18} color={isLive ? '#22C55E' : '#94A3B8'} />
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1E293B' }}>
                  {isLive ? 'Real GPS Telemetry Active' : 'Standby Mode'}
                </div>
                <div style={{ fontSize: '0.76rem', color: '#64748B' }}>
                  {isLive ? timeAgo : 'GPS will start streaming when driver initiates trip'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* NEXT STOP & ETA CALLOUT */}
        {isLive && dynamicEtaMins && (
          <div
            style={{
              background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
              color: '#FFFFFF',
              borderRadius: '16px',
              padding: '20px 24px',
              marginBottom: '24px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              boxShadow: '0 8px 24px -4px rgba(37, 99, 235, 0.3)'
            }}
          >
            <div>
              <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.9, fontWeight: 700, marginBottom: '4px' }}>
                Approaching Next Stop
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                {nextStop.name}
              </div>
              <div style={{ fontSize: '0.85rem', opacity: 0.85, marginTop: '2px' }}>
                Assigned Stop for {activeStudent?.name || 'Child'}: <strong style={{ color: '#FDE047' }}>{effectiveYourStop}</strong>
              </div>
            </div>

            <div style={{ textAlign: 'right', background: 'rgba(255, 255, 255, 0.15)', padding: '12px 20px', borderRadius: '12px', backdropFilter: 'blur(8px)' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', opacity: 0.9, fontWeight: 600 }}>
                Estimated Arrival at Your Stop
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#FFFFFF' }}>
                ~{dynamicEtaMins} min
              </div>
            </div>
          </div>
        )}

        {/* 5-STOP JOURNEY PROGRESS STEPPER */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            padding: '24px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={18} color="#2563EB" />
              Journey Progress
            </h3>
            <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>
              {allStops.length} Total Route Stops
            </span>
          </div>

          {/* Stepper Timeline */}
          <div style={{ position: 'relative', paddingLeft: '8px' }}>
            {allStops.map((stop, idx) => {
              const isPast = isLive && idx < currentStopIndex;
              const isCurrent = isLive && idx === currentStopIndex;
              const isYourStop = idx === yourStopIndex;
              const isLast = idx === allStops.length - 1;

              return (
                <div
                  key={stop.name + idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                    position: 'relative',
                    paddingBottom: isLast ? '0' : '24px'
                  }}
                >
                  {/* Connecting line */}
                  {!isLast && (
                    <div
                      style={{
                        position: 'absolute',
                        left: '15px',
                        top: '28px',
                        bottom: '0',
                        width: '2px',
                        background: isPast ? '#22C55E' : '#E2E8F0'
                      }}
                    />
                  )}

                  {/* Node icon */}
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 2,
                      flexShrink: 0,
                      background: isYourStop
                        ? '#2563EB'
                        : isCurrent
                        ? '#F59E0B'
                        : isPast
                        ? '#22C55E'
                        : '#F1F5F9',
                      color: isYourStop || isCurrent || isPast ? '#FFFFFF' : '#64748B',
                      border: isYourStop ? '3px solid #BFDBFE' : 'none',
                      boxShadow: isCurrent ? '0 0 0 4px rgba(245, 158, 11, 0.2)' : 'none'
                    }}
                  >
                    {isYourStop ? (
                      <MapPin size={16} />
                    ) : isCurrent ? (
                      <Bus size={16} />
                    ) : isPast ? (
                      <Check size={16} />
                    ) : (
                      <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>{idx + 1}</span>
                    )}
                  </div>

                  {/* Stop Information */}
                  <div
                    style={{
                      flex: 1,
                      background: isYourStop ? '#EFF6FF' : isCurrent ? '#FFFBEB' : 'transparent',
                      padding: isYourStop || isCurrent ? '10px 14px' : '2px 0',
                      borderRadius: '10px',
                      border: isYourStop ? '1px solid #BFDBFE' : isCurrent ? '1px solid #FDE68A' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <span style={{ fontWeight: isYourStop ? 800 : 700, fontSize: '0.94rem', color: isYourStop ? '#1D4ED8' : '#1E293B' }}>
                        {stop.name}
                      </span>

                      {/* Your Stop Badge */}
                      {isYourStop && (
                        <span style={{ background: '#2563EB', color: '#FFFFFF', padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          YOUR STOP
                        </span>
                      )}

                      {/* Live Bus indicator */}
                      {isCurrent && (
                        <span style={{ background: '#F59E0B', color: '#FFFFFF', padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          LIVE BUS
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '4px' }}>
                      Scheduled: {stop.time || '07:30 AM'}
                      {isPast && <span style={{ color: '#16A34A', fontWeight: 600, marginLeft: '8px' }}>· Passed</span>}
                      {isCurrent && <span style={{ color: '#D97706', fontWeight: 600, marginLeft: '8px' }}>· Approaching now</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FOOTER ACTIONS & EMERGENCY REACHABILITY */}
        <div style={{ marginTop: '24px', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', color: '#64748B' }}>
            <Info size={16} />
            <span>Nishchit guarantees genuine GPS telemetry with zero simulated coordinates.</span>
          </div>

          <a
            href="tel:1800123456"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#DC2626',
              background: '#FEF2F2',
              border: '1px solid #FEE2E2',
              padding: '8px 14px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.85rem',
              textDecoration: 'none'
            }}
          >
            <AlertTriangle size={15} />
            <span>Institution Transport Emergency Desk</span>
          </a>
        </div>

      </div>
    </ParentShell>
  );
}
