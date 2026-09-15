import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ParentShell from '../components/shells/ParentShell';
import { subscribeIncidentReports } from '../services/transportService';
import { Bell, ShieldCheck, Clock, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

export default function ParentNotificationsPage() {
  const { currentUser } = useAuth();
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    const unsub = subscribeIncidentReports(setIncidents);
    return () => unsub();
  }, []);

  const notifications = [
    {
      id: 'notif-1',
      title: 'Morning Route Commenced',
      message: 'Bus 04 has officially started morning pickup operations from Rushikonda Depot.',
      time: '07:15 AM Today',
      type: 'INFO',
      read: true
    },
    {
      id: 'notif-2',
      title: 'Driver Identity Verified',
      message: 'Operator S. Venkatesh was cleared by the institution transport desk for Route 02.',
      time: '06:45 AM Today',
      type: 'VERIFICATION',
      read: true
    }
  ];

  return (
    <ParentShell activeTab="notifications">
      <div style={{ maxWidth: '840px', margin: '0 auto', padding: '24px 16px 80px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bell size={22} color="#2563EB" />
            Transport Notifications &amp; Alerts
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#64748B', margin: '4px 0 0' }}>
            Real-time updates regarding your child's institution bus service.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notifications.map((n) => (
            <div
              key={n.id}
              style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: n.type === 'ALERT' ? '#FEF2F2' : '#EFF6FF',
                  color: n.type === 'ALERT' ? '#DC2626' : '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {n.type === 'ALERT' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <h3 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                    {n.title}
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: 500 }}>
                    {n.time}
                  </span>
                </div>
                <p style={{ fontSize: '0.86rem', color: '#475569', margin: '4px 0 0', lineHeight: 1.4 }}>
                  {n.message}
                </p>
              </div>
            </div>
          ))}

          {incidents.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#64748B', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Operational Incident Reports
              </h2>
              {incidents.slice(0, 5).map((inc) => (
                <div
                  key={inc.id}
                  style={{
                    background: '#FFFBEB',
                    border: '1px solid #FDE68A',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    marginBottom: '10px',
                    display: 'flex',
                    gap: '12px'
                  }}
                >
                  <AlertTriangle size={18} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ color: '#92400E', fontSize: '0.9rem' }}>{inc.type || 'Operational Notice'}</strong>
                    <p style={{ margin: '2px 0 0', color: '#B45309', fontSize: '0.84rem' }}>{inc.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ParentShell>
  );
}
