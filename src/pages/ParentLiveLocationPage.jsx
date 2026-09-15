import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ParentShell from '../components/shells/ParentShell';
import BusMap from '../components/BusMap';
import {
  subscribeRoutes,
  subscribeBuses,
  subscribeLiveLocation,
  resolveBusJourneyDetails,
  subscribeActiveTrips
} from '../services/transportService';
import { INITIAL_ROUTES, INITIAL_VEHICLES } from '../data/regionData';
import { isValidCoordinate } from '../utils/busStatus';
import {
  ArrowLeft, Bus, Navigation, Radio, Clock, ShieldCheck,
  AlertTriangle, Phone, RefreshCw, MapPin
} from 'lucide-react';

export default function ParentLiveLocationPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const queryBusId = searchParams.get('busId') || currentUser?.busId;
  const queryRouteId = searchParams.get('routeId') || currentUser?.routeId;

  const [routesList, setRoutesList] = useState([]);
  const [fleetList, setFleetList] = useState([]);
  const [activeTripsList, setActiveTripsList] = useState([]);
  const [liveLocation, setLiveLocation] = useState(null);
  const [timeAgo, setTimeAgo] = useState('just now');

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

  // RTDB Telemetry
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
        setTimeAgo('Standby');
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
  const hasValidGps = liveLocation && isValidCoordinate(liveLocation.latitude, liveLocation.longitude);

  return (
    <ParentShell activeTab="track">
      <div className="parent-live-location-page" style={{ position: 'relative', width: '100%', minHeight: 'calc(100vh - 70px)' }}>
        
        {/* TOP FLOATING CONTROLS BAR */}
        <div
          style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            right: '16px',
            zIndex: 1000,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            pointerEvents: 'none'
          }}
        >
          {/* Prominent Back to Journey button */}
          <button
            onClick={() => navigate(`/parent/journey?busId=${resolvedBusId}&routeId=${targetRoute?.id}`)}
            style={{
              pointerEvents: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              padding: '10px 18px',
              borderRadius: '12px',
              color: '#0F172A',
              fontWeight: 800,
              fontSize: '0.92rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)'
            }}
          >
            <ArrowLeft size={18} />
            <span>← Back to Journey Stepper</span>
          </button>

          {/* Telemetry Status Pill */}
          <div
            style={{
              pointerEvents: 'auto',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(8px)',
              padding: '8px 16px',
              borderRadius: '999px',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)'
            }}
          >
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: isLive && hasValidGps ? '#22C55E' : '#EAB308',
                boxShadow: isLive && hasValidGps ? '0 0 8px #22C55E' : 'none'
              }}
            />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1E293B' }}>
              {isLive && hasValidGps ? `GPS Live · ${timeAgo}` : 'Standby · Awaiting Driver Initiation'}
            </span>
          </div>
        </div>

        {/* MAP CANVAS */}
        <div style={{ width: '100%', height: 'calc(100vh - 70px)', background: '#F8FAFC' }}>
          {isLive || hasValidGps ? (
            <BusMap
              selectedBus={journeyDetails?.bus}
              routeData={targetRoute}
              liveLocation={liveLocation}
              isLive={isLive}
            />
          ) : (
            /* Honest Standby State: No fake GPS coordinates */
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                textAlign: 'center',
                background: 'radial-gradient(circle at center, #F8FAFC 0%, #E2E8F0 100%)'
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '20px',
                  background: '#EFF6FF',
                  border: '2px solid #BFDBFE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563EB',
                  marginBottom: '16px'
                }}
              >
                <Bus size={32} />
              </div>

              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                {journeyDetails?.busNumber || 'Bus'} is Currently on Standby
              </h2>

              <p style={{ maxWidth: '440px', color: '#64748B', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '24px' }}>
                This bus has not initiated today's journey yet. Authentic GPS telemetry will stream automatically the moment the verified driver presses <strong>Start Trip</strong> in the mobile cockpit.
              </p>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => navigate(`/parent/journey?busId=${resolvedBusId}&routeId=${targetRoute?.id}`)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '10px',
                    background: '#2563EB',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  View Route Schedule &amp; Stops
                </button>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM FLOATING INFO DRAWER (When live) */}
        {isLive && (
          <div
            style={{
              position: 'absolute',
              bottom: '24px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '90%',
              maxWidth: '680px',
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '16px 20px',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)',
              border: '1px solid #E2E8F0',
              zIndex: 1000,
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px'
            }}
          >
            <div>
              <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '1rem' }}>
                {journeyDetails?.busNumber || 'Bus'} · {targetRoute?.name || 'Corridor'}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '2px' }}>
                Driver: <strong>{journeyDetails?.driverName || 'Operator'}</strong> · Route Stops: {targetRoute?.stops?.length || 0}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {journeyDetails?.driverPhone && (
                <a
                  href={`tel:${journeyDetails.driverPhone}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    color: '#16A34A',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    textDecoration: 'none'
                  }}
                >
                  <Phone size={14} />
                  <span>Call Driver</span>
                </a>
              )}

              <button
                onClick={() => navigate(`/parent/journey?busId=${resolvedBusId}&routeId=${targetRoute?.id}`)}
                style={{
                  background: '#2563EB',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer'
                }}
              >
                Journey Details
              </button>
            </div>
          </div>
        )}

      </div>
    </ParentShell>
  );
}
