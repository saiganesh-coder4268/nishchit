import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Bus, MapPin, ShieldCheck, Building2 } from 'lucide-react';

export default function LandingPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // If already authenticated, instantly redirect to the corresponding role workspace
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'driver') {
        const isApproved = (currentUser.verificationStatus || '').toLowerCase() === 'approved';
        navigate(isApproved ? '/driver/dashboard' : '/driver/onboarding', { replace: true });
      } else if (currentUser.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/parent/dashboard', { replace: true });
      }
    }
  }, [currentUser, navigate]);

  if (currentUser) {
    return null;
  }
  return (
    <div className="landing-page premium-landing">
      {/* 1. HERO SECTION */}
      <section className="landing-hero">
        <div className="eyebrow">
          <MapPin size={15} /> Vizianagaram · Thagarapuvalasa · Visakhapatnam Corridor
        </div>
        <h1>NISHCHIT</h1>
        <p className="landing-kicker">School &amp; College Transportation Certainty</p>
        <h2>Real Device GPS. Certainty for Every Parent.</h2>
        <p className="landing-copy">
          A calm, accountable transport tracking network connecting institution transport management, verified drivers, and families. No simulated movements, fake ETAs, or artificial animations.
        </p>
      </section>

      {/* 2. THREE ROLE WORKSPACE GATEWAYS */}
      <section className="landing-portals-grid" style={{
        maxWidth: '1100px',
        margin: '0 auto 48px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px',
        padding: '0 20px'
      }}>
        {/* DRIVER GATEWAY */}
        <div className="portal-card" style={{
          background: '#ffffff',
          border: '1.5px solid #e2e8f0',
          borderRadius: '14px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bus size={24} color="#2563eb" />
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#2563eb', background: '#dbeafe', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                Operator
              </span>
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>Driver Portal</h3>
            <p style={{ color: '#64748b', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '18px' }}>
              Submit verified KYC credentials, receive assigned vehicle &amp; corridor route schedules, and stream genuine device GPS during active runs.
            </p>
          </div>
          <button
            onClick={() => navigate('/driver/login')}
            className="btn btn-outline"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Bus size={16} /> Driver Sign In <ArrowRight size={16} />
          </button>
        </div>

        {/* PARENT GATEWAY */}
        <div className="portal-card" style={{
          background: '#ffffff',
          border: '2px solid #2563eb',
          borderRadius: '14px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 6px 20px rgba(37, 99, 235, 0.08)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={24} color="#16a34a" />
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#16a34a', background: '#dcfce7', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                Observer
              </span>
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>Parent &amp; Guardian Portal</h3>
            <p style={{ color: '#64748b', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '18px' }}>
              Follow your child's assigned school bus live on Google Maps with real-time GPS telemetry, scheduled stop timings, and direct safety desk contact.
            </p>
          </div>
          <button
            onClick={() => navigate('/parent/login')}
            className="btn btn-primary"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            Parent Sign In <ArrowRight size={16} />
          </button>
        </div>

        {/* ADMIN GATEWAY */}
        <div className="portal-card" style={{
          background: '#ffffff',
          border: '1.5px solid #e2e8f0',
          borderRadius: '14px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={24} color="#d97706" />
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#d97706', background: '#fef3c7', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                Control Room
              </span>
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>Transport Administration</h3>
            <p style={{ color: '#64748b', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '18px' }}>
              Review driver KYC requests, manage fleet buses &amp; corridor routes, configure scheduled runs, and monitor active fleet runs in real time.
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/login')}
            className="btn btn-outline"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <ShieldCheck size={16} /> Admin Desk Login <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* 3. CERTAINTY ARCHITECTURE FLOW */}
      <section className="certainty-flow" aria-label="How Nishchit works">
        <div>
          <Building2 size={22} />
          <strong>1. Transport Administration</strong>
          <span>Verifies drivers, configures routes, and sets schedules</span>
        </div>
        <ArrowRight className="flow-arrow" />
        <div>
          <Bus size={22} />
          <strong>2. Driver Operator</strong>
          <span>Transmits only authorized, real device GPS location</span>
        </div>
        <ArrowRight className="flow-arrow" />
        <div>
          <MapPin size={22} />
          <strong>3. Parent Observer</strong>
          <span>Observes genuine live status and verified vehicle location</span>
        </div>
      </section>

      {/* 4. CORRIDOR PARTICIPATING INSTITUTIONS */}
      <section className="landing-detail" style={{ maxWidth: '1000px', margin: '40px auto' }}>
        <div>
          <span className="section-label">Institutional Corridor Coverage</span>
          <h3>Connecting North Coastal Andhra Campuses</h3>
        </div>
        <p>
          Configured for premier institutions along the Vizianagaram – Thagarapuvalasa – Visakhapatnam belt, including MVGR College of Engineering, ANITS Sangivalasa, Gayatri Vidya Parishad, GITAM University, and DPS Anandapuram.
        </p>
      </section>
    </div>
  );
}
