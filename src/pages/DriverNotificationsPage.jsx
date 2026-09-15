import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DriverShell from '../components/shells/DriverShell';
import { Bell, ArrowLeft, ShieldCheck, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

export default function DriverNotificationsPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const alerts = [
    {
      id: 'd-notif-1',
      title: 'Duty Assignment Cleared',
      message: 'Your route assignment for Route 02 and Bus 04 has been approved by the institution desk.',
      time: '06:30 AM Today',
      type: 'VERIFICATION'
    },
    {
      id: 'd-notif-2',
      title: 'Safety Policy Reminder',
      message: 'Mandatory pre-trip vehicle check: Ensure emergency doors and camera sensors are operational before starting the trip.',
      time: 'Yesterday',
      type: 'NOTICE'
    }
  ];

  return (
    <DriverShell activeTab="applications">
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
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bell size={22} color="#16A34A" />
            Driver Operational Dispatch Notices
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#64748B', margin: '4px 0 0' }}>
            Administrative dispatches, route schedule adjustments, and safety circulars.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {alerts.map((a) => (
            <div
              key={a.id}
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
                  background: a.type === 'ALERT' ? '#FEF2F2' : '#F0FDF4',
                  color: a.type === 'ALERT' ? '#DC2626' : '#16A34A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {a.type === 'ALERT' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <h3 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                    {a.title}
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: 500 }}>
                    {a.time}
                  </span>
                </div>
                <p style={{ fontSize: '0.86rem', color: '#475569', margin: '4px 0 0', lineHeight: 1.4 }}>
                  {a.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DriverShell>
  );
}
