import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DriverShell from '../components/shells/DriverShell';
import { subscribeRoutes, subscribeBuses } from '../services/transportService';
import { INITIAL_ROUTES, INITIAL_VEHICLES } from '../data/regionData';
import { MapPin, Bus, Clock, Users, ArrowLeft, ShieldCheck, ChevronRight } from 'lucide-react';

export default function DriverRoutePage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
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

  const assignedRoute = useMemo(() => {
    if (currentUser?.routeId || currentUser?.assignedRouteId) {
      const match = effectiveRoutes.find(r => r.id === (currentUser.routeId || currentUser.assignedRouteId));
      if (match) return match;
    }
    return effectiveRoutes[0];
  }, [currentUser, effectiveRoutes]);

  const assignedBus = useMemo(() => {
    if (currentUser?.busId || currentUser?.assignedBusId) {
      const match = effectiveFleet.find(b => b.id === (currentUser.busId || currentUser.assignedBusId));
      if (match) return match;
    }
    return effectiveFleet[0];
  }, [currentUser, effectiveFleet]);

  const stops = assignedRoute?.stops || [];

  return (
    <DriverShell activeTab="trip">
      <div style={{ maxWidth: '840px', margin: '0 auto', padding: '24px 16px 80px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <button
            onClick={() => navigate('/driver/dashboard')}
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
            <span>Driver Cockpit</span>
          </button>

          <span style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 600 }}>
            Operational Route Manifest
          </span>
        </div>

        {/* Route Overview Card */}
        <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <div>
              <span style={{ background: '#EFF6FF', color: '#2563EB', padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 800 }}>
                {assignedRoute?.code || assignedRoute?.id}
              </span>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', marginTop: '8px', marginBottom: '4px' }}>
                {assignedRoute?.name || 'Assigned Corridor Route'}
              </h1>
              <div style={{ fontSize: '0.9rem', color: '#64748B' }}>
                {assignedRoute?.institutionName || 'Authorized Institution'} · {stops.length} Scheduled Stops
              </div>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '12px 16px', borderRadius: '12px', textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 700 }}>
                Duty Vehicle
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1E293B' }}>
                {assignedBus?.busNumber || 'Assigned Bus'}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                {assignedBus?.registrationNumber || 'Commercial AP'}
              </div>
            </div>
          </div>
        </div>

        {/* Stops Sequence Checklist */}
        <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={20} color="#16A34A" />
            Corridor Passenger Pickup &amp; Drop Sequence
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {stops.map((stop, index) => {
              const isFirst = index === 0;
              const isLast = index === stops.length - 1;

              return (
                <div key={stop.name + index} style={{ display: 'flex', gap: '16px', position: 'relative', paddingBottom: isLast ? '0' : '26px' }}>
                  {!isLast && (
                    <div style={{ position: 'absolute', left: '15px', top: '30px', bottom: '0', width: '2px', background: '#E2E8F0' }} />
                  )}
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: isFirst ? '#2563EB' : isLast ? '#059669' : '#F1F5F9',
                      color: isFirst || isLast ? '#FFFFFF' : '#475569',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      zIndex: 2,
                      flexShrink: 0
                    }}
                  >
                    {index + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700, color: '#1E293B', fontSize: '0.96rem' }}>
                        {stop.name}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>
                        {stop.time || '07:30 AM'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>
                      {isFirst ? 'Route Departure Origin' : isLast ? 'Terminal Institution Campus' : 'Designated Stop'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </DriverShell>
  );
}
