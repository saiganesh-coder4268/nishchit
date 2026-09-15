import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ParentShell from '../components/shells/ParentShell';
import { subscribeRoutes, subscribeBuses } from '../services/transportService';
import { INITIAL_ROUTES, INITIAL_VEHICLES } from '../data/regionData';
import { MapPin, Clock, Bus, ShieldCheck, Phone, ArrowLeft, Navigation } from 'lucide-react';

export default function ParentRoutePage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const queryRouteId = searchParams.get('routeId') || currentUser?.routeId;
  const [routesList, setRoutesList] = useState([]);
  const [fleetList, setFleetList] = useState([]);

  useEffect(() => {
    const unsubR = subscribeRoutes(setRoutesList);
    const unsubB = subscribeBuses(setFleetList);
    return () => {
      unsubR();
      unsubB();
    };
  }, []);

  const effectiveRoutes = routesList.length > 0 ? routesList : INITIAL_ROUTES;
  const effectiveFleet = fleetList.length > 0 ? fleetList : INITIAL_VEHICLES;

  const currentRoute = useMemo(() => {
    if (queryRouteId) {
      const match = effectiveRoutes.find(r => r.id === queryRouteId || r.code === queryRouteId);
      if (match) return match;
    }
    return effectiveRoutes[0];
  }, [queryRouteId, effectiveRoutes]);

  const assignedBus = useMemo(() => {
    if (!currentRoute) return null;
    return effectiveFleet.find(b => b.routeId === currentRoute.id || b.assignedRouteId === currentRoute.id) || null;
  }, [currentRoute, effectiveFleet]);

  const stops = currentRoute?.stops || [];

  return (
    <ParentShell activeTab="transport">
      <div style={{ maxWidth: '840px', margin: '0 auto', padding: '24px 16px 80px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <button
            onClick={() => navigate(-1)}
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
            <span>Back</span>
          </button>

          <div style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 600 }}>
            Authorized Route Specification
          </div>
        </div>

        {/* Route Header Card */}
        <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <div>
              <span style={{ background: '#EFF6FF', color: '#2563EB', padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 800 }}>
                {currentRoute?.code || currentRoute?.id}
              </span>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', marginTop: '8px', marginBottom: '4px' }}>
                {currentRoute?.name || 'Corridor Route'}
              </h1>
              <div style={{ fontSize: '0.9rem', color: '#64748B' }}>
                {currentRoute?.institutionName || 'Institution'} · {stops.length} Official Corridor Stops
              </div>
            </div>

            {assignedBus && (
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '12px 16px', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 700 }}>
                  Assigned Bus
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1E293B' }}>
                  {assignedBus.busNumber}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                  {assignedBus.registrationNumber || 'AP Commercial'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stops Timeline */}
        <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={20} color="#2563EB" />
            Official Stop Itinerary &amp; Scheduled Timings
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {stops.map((stop, index) => {
              const isFirst = index === 0;
              const isLast = index === stops.length - 1;

              return (
                <div key={stop.name + index} style={{ display: 'flex', gap: '16px', position: 'relative', paddingBottom: isLast ? '0' : '28px' }}>
                  {!isLast && (
                    <div style={{ position: 'absolute', left: '15px', top: '30px', bottom: '0', width: '2px', background: '#E2E8F0' }} />
                  )}
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: isFirst ? '#2563EB' : isLast ? '#059669' : '#F1F5F9',
                      color: isFirst || isLast ? '#FFFFFF' : '#64748B',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      zIndex: 2,
                      flexShrink: 0
                    }}
                  >
                    {index + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#1E293B', fontSize: '0.96rem' }}>
                      {stop.name}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={13} />
                      <span>Scheduled: {stop.time || '07:30 AM'}</span>
                      {isFirst && <span style={{ color: '#2563EB', fontWeight: 600 }}>· Route Origin</span>}
                      {isLast && <span style={{ color: '#059669', fontWeight: 600 }}>· Final Destination</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </ParentShell>
  );
}
