import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRight, Bus, Building2,
  Users, TrendingUp, Shield, CheckCircle2, ShieldCheck
} from 'lucide-react';
import NishchitLogo from '../components/NishchitLogo';

export default function LandingPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // If already authenticated, redirect to the corresponding workspace
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

  if (currentUser) return null;

  return (
    <div className="nishchit-landing-view">
      {/* =====================================================================
          PRIMARY SPLIT-HERO & PORTAL SELECTOR
          Pixel-faithful reproduction of Daylight Reference Composition
          ===================================================================== */}
      <section className="landing-split-hero-container">
        {/* LEFT COLUMN: Sunlit Campus & Optimistic Trust Messaging */}
        <div className="hero-media-column">
          {/* Top-Left Brand Logo with Accent Line */}
          <div className="hero-media-top-brand">
            <NishchitLogo variant="header" size={40} />
            <div className="hero-brand-accent-line" />
          </div>

          <div className="hero-media-content">
            <h1 className="hero-media-title">
              More than
              <br />
              transport.
              <br />
              <span className="accent-blue-text">A safer tomorrow.</span>
            </h1>

            <div className="hero-media-divider">—</div>

            <p className="hero-media-description">
              Nishchit connects schools, drivers and families to make every journey safer, simpler and more transparent.
            </p>

            <div className="hero-media-divider">—</div>

            {/* Three Trust Pillars */}
            <div className="hero-pillars-row">
              <div className="hero-pillar-item">
                <Shield size={18} color="#334155" strokeWidth={2} />
                <span>Safer Students</span>
              </div>

              <div className="hero-pillar-item">
                <Users size={18} color="#334155" strokeWidth={2} />
                <span>Stronger Communities</span>
              </div>

              <div className="hero-pillar-item">
                <TrendingUp size={18} color="#334155" strokeWidth={2} />
                <span>Brighter Futures</span>
              </div>
            </div>
          </div>

          {/* Bottom Floating Frosted Glass Pill */}
          <div className="hero-bottom-glass-pill">
            <div className="pill-avatar-icon">
              <Users size={16} color="#38BDF8" />
            </div>
            <div className="pill-text">
              <strong>Children today.</strong>
              <span>A more certain tomorrow.</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Portal Selector Card on Continuous Route Pattern */}
        <div className="hero-portal-column">
          {/* Ambient Route Pattern Typography */}
          <div className="hero-ambient-top-right">
            <span>SCHOOLS</span>
            <span>PEOPLE</span>
            <span>PLACES</span>
            <span>CONNECTED</span>
            <span className="dash">—</span>
          </div>

          <div className="hero-ambient-bottom-right">
            <span className="dash">—</span>
            <span>A SAFER</span>
            <span>BRIGHTER</span>
            <span>TOMORROW</span>
          </div>

          {/* Center Portal Selector Card */}
          <div className="portal-selector-card">
            {/* Top Logo Treatment with Accent Line */}
            <div className="portal-card-logo-wrap">
              <NishchitLogo variant="card" size={46} />
              <div className="portal-card-accent-bar" />
            </div>

            <div className="portal-card-heading">
              <h2>Welcome to Nishchit</h2>
              <p>Choose your portal to continue</p>
            </div>

            {/* The 3 Primary Platform Choices */}
            <div className="portal-options-list">
              {/* Choice 1: Parent / Guardian */}
              <div
                className="portal-option-card parent"
                onClick={() => navigate('/parent/login')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate('/parent/login')}
              >
                <div className="portal-option-icon blue">
                  <Users size={22} color="#2563EB" />
                </div>
                <div className="portal-option-details">
                  <h3>Parent / Guardian</h3>
                  <p>Track your child's bus journey</p>
                </div>
                <div className="portal-option-arrow">
                  <ArrowRight size={18} />
                </div>
              </div>

              {/* Choice 2: Driver */}
              <div
                className="portal-option-card driver"
                onClick={() => navigate('/driver/login')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate('/driver/login')}
              >
                <div className="portal-option-icon green">
                  <Bus size={22} color="#059669" />
                </div>
                <div className="portal-option-details">
                  <h3>Driver</h3>
                  <p>Operate your assigned trip</p>
                </div>
                <div className="portal-option-arrow">
                  <ArrowRight size={18} />
                </div>
              </div>

              {/* Choice 3: Transport Admin */}
              <div
                className="portal-option-card admin"
                onClick={() => navigate('/institution/login')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate('/institution/login')}
              >
                <div className="portal-option-icon amber">
                  <Building2 size={22} color="#D97706" />
                </div>
                <div className="portal-option-details">
                  <h3>Transport Admin</h3>
                  <p>Manage school &amp; college transport</p>
                </div>
                <div className="portal-option-arrow">
                  <ArrowRight size={18} />
                </div>
              </div>
            </div>

            {/* Bottom Card Footer Trust Mark */}
            <div className="portal-card-trust-footer">
              <ShieldCheck size={16} color="#64748B" />
              <span>Trusted journeys. Brighter futures.</span>
            </div>

            {/* Platform Operator Console Link */}
            <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #F1F5F9', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => navigate('/platform-admin/login')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'color 150ms ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#475569'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#94A3B8'}
              >
                <Shield size={13} color="currentColor" />
                <span>Platform Operator &amp; Verification Console ›</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          HOW NISHCHIT WORKS (Operational Corridor Overview)
          ===================================================================== */}
      <section className="landing-section works-section">
        <div className="section-header-block">
          <span className="section-kicker">Operational Lifecycle</span>
          <h2>How Nishchit Works</h2>
          <p>One unified transportation lifecycle connecting three critical participants.</p>
        </div>

        <div className="lifecycle-grid">
          <div className="lifecycle-step-card">
            <div className="step-number-badge">1</div>
            <div className="step-icon-circle blue">
              <Building2 size={24} color="#2563EB" />
            </div>
            <h3>Transport Admin Configures</h3>
            <p>
              The transport desk verifies commercial driver credentials, manages corridor vehicles, maps official route stops, and assigns operating schedules.
            </p>
            <div className="step-footer-tag">Step 1 · Authorization</div>
          </div>

          <div className="lifecycle-step-card">
            <div className="step-number-badge">2</div>
            <div className="step-icon-circle green">
              <Bus size={24} color="#16A34A" />
            </div>
            <h3>Driver Operates the Trip</h3>
            <p>
              The verified driver logs into the mobile cockpit, inspects scheduled stops, and starts the trip. The driver's device streams real hardware GPS telemetry.
            </p>
            <div className="step-footer-tag">Step 2 · Operation</div>
          </div>

          <div className="lifecycle-step-card">
            <div className="step-number-badge">3</div>
            <div className="step-icon-circle blue">
              <Users size={24} color="#2563EB" />
            </div>
            <h3>Parent Observes with Certainty</h3>
            <p>
              Parents observe the authentic bus position on Google Maps with live ETA and freshness indicators. No student smartphone is ever required.
            </p>
            <div className="step-footer-tag">Step 3 · Reassurance</div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          CORRIDOR COVERAGE & INSTITUTIONAL FOCUS
          ===================================================================== */}
      <section className="landing-section corridor-section">
        <div className="corridor-content-layout">
          <div className="corridor-text-block">
            <span className="section-kicker">Active Operating Corridor</span>
            <h2>Vizianagaram — Thagarapuvalasa — Visakhapatnam</h2>
            <p>
              Nishchit is architected specifically for educational institutions across northern Andhra Pradesh, linking engineering colleges, universities, and residential schools.
            </p>

            <div className="corridor-campuses-list">
              <div className="campus-item">
                <CheckCircle2 size={18} color="#16A34A" />
                <span>MVGR College of Engineering (Chintalavalasa)</span>
              </div>
              <div className="campus-item">
                <CheckCircle2 size={18} color="#16A34A" />
                <span>JNTU-GV University College of Engineering</span>
              </div>
              <div className="campus-item">
                <CheckCircle2 size={18} color="#16A34A" />
                <span>Lendi Institute of Engineering &amp; Technology</span>
              </div>
              <div className="campus-item">
                <CheckCircle2 size={18} color="#16A34A" />
                <span>Raghu Educational Institutions (Dakamarri)</span>
              </div>
              <div className="campus-item">
                <CheckCircle2 size={18} color="#16A34A" />
                <span>Gayatri Vidya Parishad &amp; GITAM Corridor</span>
              </div>
            </div>
          </div>

          <div className="corridor-stats-card">
            <div className="stat-row">
              <div className="stat-box">
                <strong className="stat-number">65+ km</strong>
                <span className="stat-label">Corridor Highway Length</span>
              </div>
              <div className="stat-box">
                <strong className="stat-number">100%</strong>
                <span className="stat-label">Authentic Device GPS</span>
              </div>
            </div>
            <div className="stat-divider" />
            <div className="stat-row">
              <div className="stat-box">
                <strong className="stat-number">0</strong>
                <span className="stat-label">Simulated Coordinates</span>
              </div>
              <div className="stat-box">
                <strong className="stat-number">24/7</strong>
                <span className="stat-label">Safety Desk Reachability</span>
              </div>
            </div>
            <div className="stat-note">
              Dedicated institutional transit monitoring across NH16 &amp; SH39.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
