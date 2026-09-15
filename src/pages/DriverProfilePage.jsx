import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DriverShell from '../components/shells/DriverShell';
import { User, ShieldCheck, Bus, MapPin, Building2, CreditCard, Award, ArrowLeft, Phone, Mail } from 'lucide-react';

export default function DriverProfilePage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const isVerified = (currentUser?.verificationStatus || currentUser?.status || '').toLowerCase() === 'approved';

  return (
    <DriverShell activeTab="profile">
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
            Commercial Driver Profile
          </span>
        </div>

        {/* Profile Identity Card */}
        <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.5rem', border: '1px solid #BBF7D0' }}>
              {(currentUser?.fullName || currentUser?.name || 'D').charAt(0).toUpperCase()}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  {currentUser?.fullName || currentUser?.name || 'Authorized Driver'}
                </h1>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: isVerified ? '#DCFCE7' : '#FEF3C7',
                    color: isVerified ? '#15803D' : '#B45309',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    fontSize: '0.74rem',
                    fontWeight: 800
                  }}
                >
                  <ShieldCheck size={14} />
                  {isVerified ? 'VERIFIED OPERATOR' : 'VERIFICATION PENDING'}
                </span>
              </div>

              <div style={{ fontSize: '0.86rem', color: '#64748B', marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Mail size={14} /> {currentUser?.email || 'driver@nishchit.app'}
                </span>
                {currentUser?.phone && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Phone size={14} /> {currentUser.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Credentials & Vehicle Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          
          {/* License Card */}
          <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '20px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={18} color="#2563EB" />
              Commercial Transport License
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                <span style={{ color: '#64748B' }}>DL Number</span>
                <strong style={{ color: '#0F172A' }}>{currentUser?.licenceNumber || 'AP-31-2018-994821'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                <span style={{ color: '#64748B' }}>License Validity</span>
                <strong style={{ color: '#0F172A' }}>{currentUser?.licenceValidity || 'Dec 2028 · Valid'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Experience</span>
                <strong style={{ color: '#0F172A' }}>{currentUser?.experienceYears || '6'} Years Commercial Bus</strong>
              </div>
            </div>
          </div>

          {/* Assigned Duty Card */}
          <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '20px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bus size={18} color="#16A34A" />
              Current Vehicle &amp; Campus Link
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                <span style={{ color: '#64748B' }}>Assigned Bus</span>
                <strong style={{ color: '#0F172A' }}>{currentUser?.busNumber || 'Bus 04'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                <span style={{ color: '#64748B' }}>Registration Plate</span>
                <strong style={{ color: '#0F172A' }}>{currentUser?.busRegistrationNumber || 'AP 31 TE 4421'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Institution Campus</span>
                <strong style={{ color: '#0F172A' }}>{currentUser?.institutionName || 'GITAM University Corridor'}</strong>
              </div>
            </div>
          </div>

        </div>

      </div>
    </DriverShell>
  );
}
