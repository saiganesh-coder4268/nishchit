import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ParentShell from '../components/shells/ParentShell';
import BusMap from '../components/BusMap';
import NishchitLogo from '../components/NishchitLogo';
import {
  subscribeRoutes,
  subscribeBuses,
  subscribeLiveLocation,
  resolveBusJourneyDetails,
  subscribeActiveTrips
} from '../services/transportService';
import { INITIAL_ROUTES, INITIAL_VEHICLES, REGISTERED_INSTITUTIONS } from '../data/regionData';
import { isValidCoordinate } from '../utils/busStatus';
import {
  ArrowLeft, Bus, Navigation, Radio, Clock, ShieldCheck,
  Phone, MapPin, Crosshair, AlertCircle, Check, ChevronDown,
  Building2, Sparkles, UserCheck
} from 'lucide-react';

export default function ParentLiveLocationPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const queryBusId = searchParams.get('busId') || currentUser?.busId;
  const queryRouteId = searchParams.get('routeId') || currentUser?.routeId;
  const initialStop = searchParams.get('stop') || currentUser?.stopName;

  // Realtime Cloud Subscriptions
  const [routesList, setRoutesList] = useState([]);
  const [fleetList, setFleetList] = useState([]);
  const [activeTripsList, setActiveTripsList] = useState([]);
  const [liveLocation, setLiveLocation] = useState(null);
  const [timeAgo, setTimeAgo] = useState('Standby');

  // Destination Mode: 'registered_stop' | 'current_location'
  const [destinationMode, setDestinationMode] = useState('registered_stop');
  const [parentCoords, setParentCoords] = useState(null);
  const [gpsAcquiring, setGpsAcquiring] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [selectedStopName, setSelectedStopName] = useState(initialStop || '');

  // Road Driving Directions Metrics (Calculated via Google Maps DirectionsService)
  const [routingMetrics, setRoutingMetrics] = useState(null);

  useEffect(() => {
    const unsubRoutes = subscribeRoutes(setRoutesList);
    const unsubBuses = subscribeBuses(setFleetList);
    const unsubTrips = subscribeActiveTrips(setActiveTripsList);

    return () => {
      unsubRoutes();
      unsubBuses();
      unsubTrips();
    };
  }, []);

  const effectiveRoutes = routesList.length > 0 ? routesList : INITIAL_ROUTES;
  const effectiveFleet = fleetList.length > 0 ? fleetList : INITIAL_VEHICLES;

  // Find Target Route & Associated Fleet
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
      activeTrips: activeTripsList,
      liveLocations: liveLocation ? { [liveLocation.busId || queryBusId]: liveLocation } : {}
    });
  }, [targetRoute, effectiveFleet, activeTripsList, liveLocation, queryBusId]);

  const resolvedBusId = journeyDetails?.busId || queryBusId;

  // Realtime Database Telemetry from Driver Device
  useEffect(() => {
    if (!resolvedBusId) return;
    const unsubGps = subscribeLiveLocation(resolvedBusId, (data) => {
      setLiveLocation(data);
    });
    return () => unsubGps();
  }, [resolvedBusId]);

  // Telemetry Freshness Ticker
  useEffect(() => {
    const interval = setInterval(() => {
      if (!liveLocation?.timestamp) {
        setTimeAgo('Waiting for signal');
        return;
      }
      const diffSec = Math.floor((Date.now() - liveLocation.timestamp) / 1000);
      if (diffSec < 4) setTimeAgo('updated just now');
      else if (diffSec < 60) setTimeAgo(`updated ${diffSec}s ago`);
      else setTimeAgo(`updated ${Math.floor(diffSec / 60)}m ago`);
    }, 2000);

    return () => clearInterval(interval);
  }, [liveLocation]);

  const isLive = Boolean(journeyDetails?.state === 'LIVE' || liveLocation?.active);
  const hasValidDriverGps = liveLocation && isValidCoordinate(liveLocation.latitude, liveLocation.longitude);

  // Institution Metadata
  const currentInstitution = useMemo(() => {
    const instId = targetRoute?.institutionId || currentUser?.institutionId || 'INST-AU';
    return REGISTERED_INSTITUTIONS.find(i => i.id === instId || i.instituteId === instId) || {
      id: 'INST-AU',
      name: targetRoute?.institutionName || currentUser?.institutionName || 'Andhra University',
      city: 'Visakhapatnam',
      campus: 'Visakhapatnam Campus'
    };
  }, [targetRoute, currentUser]);

  // Initialize Default Stop
  useEffect(() => {
    if (targetRoute?.stops && targetRoute.stops.length > 0 && !selectedStopName) {
      const defaultStop = targetRoute.stops[Math.min(2, targetRoute.stops.length - 1)];
      setSelectedStopName(defaultStop.name || defaultStop.stopName);
    }
  }, [targetRoute, selectedStopName]);

  // Request Authentic Hardware Geolocation for Parent (Session only, never saved to cloud)
  const handleRequestParentLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setGpsAcquiring(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsAcquiring(false);
        setParentCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          label: 'Your Current Location'
        });
        setDestinationMode('current_location');
      },
      (err) => {
        setGpsAcquiring(false);
        if (err.code === 1) {
          setGpsError('Location permission denied. Please allow browser location access.');
        } else {
          setGpsError('Unable to acquire device GPS position. Please try again.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Resolve Active Destination Coordinates
  const activeDestinationCoords = useMemo(() => {
    if (destinationMode === 'current_location' && parentCoords) {
      return parentCoords;
    }

    // Registered Stop Mode
    if (targetRoute?.stops && targetRoute.stops.length > 0) {
      const match = targetRoute.stops.find(s => (s.name || s.stopName) === selectedStopName) || targetRoute.stops[0];
      if (isValidCoordinate(match.lat, match.lng)) {
        return {
          latitude: Number(match.lat),
          longitude: Number(match.lng),
          label: match.name || match.stopName || 'Registered Stop'
        };
      }
    }

    return null;
  }, [destinationMode, parentCoords, targetRoute, selectedStopName]);

  // Driver GPS coordinates
  const activeDriverCoords = useMemo(() => {
    if (hasValidDriverGps) {
      return {
        latitude: Number(liveLocation.latitude),
        longitude: Number(liveLocation.longitude)
      };
    }
    return null;
  }, [hasValidDriverGps, liveLocation]);

  return (
    <ParentShell activeTab="track">
      <div className="parent-live-location-page" style={{ position: 'relative', width: '100%', minHeight: 'calc(100vh - 70px)', background: '#F8FAFC' }}>
        
        {/* ===================================================================
            1. INSTITUTION & JOURNEY HEADER BAR
            =================================================================== */}
        <div style={{
          background: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          {/* Institution Cluster */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={() => navigate(`/parent/journey?busId=${resolvedBusId}&routeId=${targetRoute?.id}`)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#F1F5F9',
                border: '1px solid #CBD5E1',
                padding: '6px 12px',
                borderRadius: '8px',
                color: '#0F172A',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={16} color="#2563EB" />
                <strong style={{ fontSize: '0.98rem', color: '#0F172A' }}>
                  {currentInstitution.name}
                </strong>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: '#ECFDF5',
                  color: '#059669'
                }}>
                  {currentInstitution.city}
                </span>
              </div>
              <span style={{ fontSize: '0.76rem', color: '#64748B' }}>
                Corridor: <strong>{targetRoute?.name || 'Authorized Institutional Route'}</strong>
              </span>
            </div>
          </div>

          {/* Telemetry Status Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '999px',
              background: isLive && hasValidDriverGps ? '#ECFDF5' : '#FFFBEB',
              border: `1px solid ${isLive && hasValidDriverGps ? '#A7F3D0' : '#FDE68A'}`
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isLive && hasValidDriverGps ? '#10B981' : '#F59E0B',
                boxShadow: isLive && hasValidDriverGps ? '0 0 8px #10B981' : 'none'
              }} />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: isLive && hasValidDriverGps ? '#065F46' : '#92400E' }}>
                {isLive && hasValidDriverGps ? `● LIVE: ${timeAgo}` : 'Standby · Awaiting Driver Initiation'}
              </span>
            </div>
          </div>
        </div>

        {/* ===================================================================
            2. DESTINATION SELECTION BAR (REGISTERED STOP vs USE CURRENT LOCATION)
            =================================================================== */}
        <div style={{
          background: '#0F172A',
          color: '#FFFFFF',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94A3B8' }}>
              Select Destination Point:
            </span>

            {/* Option A: Registered Stop Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => setDestinationMode('registered_stop')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: destinationMode === 'registered_stop' ? '#2563EB' : '#1E293B',
                  border: `1px solid ${destinationMode === 'registered_stop' ? '#3B82F6' : '#334155'}`,
                  color: '#FFFFFF',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                🏫 Registered Stop
              </button>

              {destinationMode === 'registered_stop' && targetRoute?.stops && (
                <select
                  value={selectedStopName}
                  onChange={(e) => setSelectedStopName(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    background: '#1E293B',
                    border: '1px solid #475569',
                    color: '#FFFFFF',
                    fontSize: '0.8rem',
                    fontWeight: 600
                  }}
                >
                  {targetRoute.stops.map((s, idx) => (
                    <option key={idx} value={s.name || s.stopName}>
                      {s.name || s.stopName}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Option B: 📍 Use My Current Location */}
            <button
              onClick={handleRequestParentLocation}
              disabled={gpsAcquiring}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                background: destinationMode === 'current_location' ? '#10B981' : '#1E293B',
                border: `1px solid ${destinationMode === 'current_location' ? '#34D399' : '#334155'}`,
                color: '#FFFFFF',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Crosshair size={14} />
              <span>{gpsAcquiring ? 'Acquiring GPS fix...' : '📍 Use My Current Location'}</span>
            </button>
          </div>

          {/* Privacy Note */}
          <div style={{ fontSize: '0.74rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} color="#10B981" />
            <span>Parent location remains strictly in-memory and is never stored.</span>
          </div>
        </div>

        {/* GPS Error Notification if permission denied */}
        {gpsError && (
          <div style={{
            background: '#FEF2F2',
            color: '#991B1B',
            padding: '8px 20px',
            fontSize: '0.8rem',
            fontWeight: 600,
            borderBottom: '1px solid #FECACA',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={15} />
            <span>{gpsError}</span>
          </div>
        )}

        {/* ===================================================================
            3. INTERACTIVE MAP CANVAS (ROAD ROUTING & REALTIME POSITION)
            =================================================================== */}
        <div style={{ width: '100%', height: 'calc(100vh - 200px)', minHeight: '440px', position: 'relative' }}>
          <BusMap
            busData={{
              ...journeyDetails?.bus,
              latitude: liveLocation?.latitude || targetRoute?.stops?.[0]?.lat || 17.7290,
              longitude: liveLocation?.longitude || targetRoute?.stops?.[0]?.lng || 83.3180,
              speed: liveLocation?.speed || 0,
              heading: liveLocation?.heading || 0,
              status: isLive ? 'LIVE' : 'AVAILABLE',
              busNumber: journeyDetails?.busNumber || resolvedBusId,
              driverName: liveLocation?.driverName || journeyDetails?.driverName || 'Verified Driver'
            }}
            driverCoords={activeDriverCoords}
            destinationCoords={activeDestinationCoords}
            onRouteCalculated={(metrics) => setRoutingMetrics(metrics)}
            stops={targetRoute?.stops || []}
            busNumber={journeyDetails?.busNumber || resolvedBusId}
            isLive={isLive}
          />

          {/* STANDBY NOTICE OVERLAY (if driver has not started trip yet) */}
          {(!isLive || !hasValidDriverGps) && (
            <div style={{
              position: 'absolute',
              top: '16px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(15, 23, 42, 0.92)',
              backdropFilter: 'blur(8px)',
              color: '#FFFFFF',
              padding: '10px 18px',
              borderRadius: '10px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              zIndex: 500,
              maxWidth: '90%'
            }}>
              <Radio size={16} color="#F59E0B" />
              <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                Awaiting driver trip start in <strong>{currentInstitution.name}</strong> cockpit.
              </span>
            </div>
          )}
        </div>

        {/* ===================================================================
            4. LOWER TELEMETRY & ROUTING METRICS PANEL
            =================================================================== */}
        <div style={{
          position: 'fixed',
          bottom: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 32px)',
          maxWidth: '840px',
          background: '#FFFFFF',
          borderRadius: '16px',
          padding: '18px 22px',
          boxShadow: '0 8px 32px rgba(15, 23, 42, 0.14)',
          border: '1px solid #CBD5E1',
          zIndex: 1000
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'center' }}>
            
            {/* Route corridor endpoints */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: isLive ? '#15803D' : '#64748B', textTransform: 'uppercase' }}>
                  {isLive ? '● Live In Transit' : 'Scheduled Route'}
                </span>
              </div>
              <strong style={{ fontSize: '0.98rem', color: '#0F172A', display: 'block' }}>
                Bus {journeyDetails?.busNumber || resolvedBusId}
              </strong>
              <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                To: <strong style={{ color: '#2563EB' }}>{activeDestinationCoords?.label || 'Destination'}</strong>
              </span>
            </div>

            {/* Real Road Distance & Travel Duration */}
            <div style={{
              background: '#F8FAFC',
              borderRadius: '10px',
              padding: '10px 14px',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              gap: '12px'
            }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>
                  ROAD DISTANCE
                </span>
                <strong style={{ fontSize: '1.05rem', color: '#0F172A' }}>
                  {routingMetrics?.distanceText || (isLive ? 'Calculating...' : '--')}
                </strong>
              </div>

              <div style={{ width: '1px', height: '28px', background: '#CBD5E1' }} />

              <div>
                <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>
                  ESTIMATED TRAVEL
                </span>
                <strong style={{ fontSize: '1.05rem', color: '#2563EB' }}>
                  {routingMetrics?.durationText || (isLive ? 'Calculating...' : '--')}
                </strong>
              </div>
            </div>

            {/* Driver Contact and Identity */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
              <div style={{ textAlign: 'right' }}>
                <strong style={{ display: 'block', fontSize: '0.88rem', color: '#0F172A' }}>
                  {liveLocation?.driverName || journeyDetails?.driverName || 'Verified Driver'}
                </strong>
                <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
                  {journeyDetails?.registrationNumber || 'AP 31 TE 2024'}
                </span>
              </div>

              {(liveLocation?.driverPhone || journeyDetails?.driverPhone) && (
                <a
                  href={`tel:${liveLocation?.driverPhone || journeyDetails?.driverPhone}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    color: '#059669',
                    textDecoration: 'none'
                  }}
                  title="Call Driver"
                >
                  <Phone size={16} />
                </a>
              )}
            </div>

          </div>
        </div>

      </div>
    </ParentShell>
  );
}
