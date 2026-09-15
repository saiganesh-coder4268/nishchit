import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DriverShell from '../components/shells/DriverShell';
import CommunicationPanel from '../components/CommunicationPanel';
import { subscribeBuses } from '../services/transportService';
import { INITIAL_VEHICLES } from '../data/regionData';
import { MessageSquare, ArrowLeft } from 'lucide-react';

export default function DriverMessagesPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [buses, setBuses] = useState([]);

  useEffect(() => {
    const unsub = subscribeBuses(setBuses);
    return () => unsub();
  }, []);

  const effectiveBuses = buses.length > 0 ? buses : INITIAL_VEHICLES;
  const activeBus = effectiveBuses.find(b => b.id === (currentUser?.busId || currentUser?.assignedBusId)) || effectiveBuses[0];

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
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MessageSquare size={22} color="#16A34A" />
            Passenger &amp; Parent Broadcast Channel
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#64748B', margin: '4px 0 0' }}>
            One-touch operational quick messages and direct parent communication for {activeBus?.busNumber || 'Assigned Bus'}.
          </p>
        </div>

        <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden', minHeight: '520px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <CommunicationPanel
            busId={activeBus?.id || 'BUS-04'}
            busData={activeBus}
            currentUser={currentUser}
            role="driver"
            isDriver={true}
          />
        </div>
      </div>
    </DriverShell>
  );
}
