import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ParentShell from '../components/shells/ParentShell';
import CommunicationPanel from '../components/CommunicationPanel';
import { subscribeBuses } from '../services/transportService';
import { INITIAL_VEHICLES } from '../data/regionData';
import { MessageSquare, Bus, ShieldCheck } from 'lucide-react';

export default function ParentMessagesPage() {
  const { currentUser } = useAuth();
  const [buses, setBuses] = useState([]);

  useEffect(() => {
    const unsub = subscribeBuses(setBuses);
    return () => unsub();
  }, []);

  const effectiveBuses = buses.length > 0 ? buses : INITIAL_VEHICLES;
  const activeBus = effectiveBuses.find(b => b.id === currentUser?.busId) || effectiveBuses[0];

  return (
    <ParentShell activeTab="help">
      <div style={{ maxWidth: '840px', margin: '0 auto', padding: '24px 16px 80px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MessageSquare size={22} color="#2563EB" />
            Driver &amp; Transport Desk Messaging
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#64748B', margin: '4px 0 0' }}>
            Two-way dispatch channel connected to {activeBus?.busNumber || 'Assigned Bus'}.
          </p>
        </div>

        <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden', minHeight: '520px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <CommunicationPanel
            busId={activeBus?.id || 'BUS-04'}
            busData={activeBus}
            currentUser={currentUser}
            role="parent"
            isDriver={false}
          />
        </div>
      </div>
    </ParentShell>
  );
}
