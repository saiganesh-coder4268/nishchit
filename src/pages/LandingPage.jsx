import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, UserCheck, ShieldCheck, MapPin, Zap, ArrowRight, CheckCircle2, Building2 } from 'lucide-react';

export default function LandingPage({ onQuickLogin }) {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-badge">
          <MapPin size={16} color="#2563eb" />
          <span>Active Pilot: Vizianagaram – Thagarapuvalasa – Visakhapatnam Educational Corridor</span>
        </div>
        
        <h1 className="hero-brand">NISHCHIT</h1>
        
        <div className="hero-headings">
          <h2>Know when the bus starts.</h2>
          <h2>Know where it is.</h2>
        </div>
        
        <p className="hero-supporting">
          Authoritative school & college transportation coordination platform for Andhra Pradesh. Direct driver device GPS tracking — no student smartphone required.
        </p>

        {/* 3 Portal Entry Cards */}
        <div className="portal-cards-grid">
          
          {/* Driver Card */}
          <div className="portal-action-card driver-card" onClick={() => navigate('/driver/login')}>
            <div className="card-top-icon"><Bus size={28} /></div>
            <h3>Driver Portal</h3>
            <p>Onboarding KYC, PIN code coverage check, shift schedule & live GPS trip dispatch.</p>
            <div className="card-action-link">
              <span>Driver Sign In / Register</span> <ArrowRight size={14} />
            </div>
          </div>

          {/* Parent Card */}
          <div className="portal-action-card parent-card" onClick={() => navigate('/parent/login')}>
            <div className="card-top-icon"><UserCheck size={28} /></div>
            <h3>Parent Portal</h3>
            <p>Real-time Google Maps bus tracking, live update timestamps & driver announcements.</p>
            <div className="card-action-link">
              <span>Parent Sign In / Register</span> <ArrowRight size={14} />
            </div>
          </div>

          {/* Admin Card */}
          <div className="portal-action-card admin-card" onClick={() => navigate('/admin/login')}>
            <div className="card-top-icon"><ShieldCheck size={28} /></div>
            <h3>Transport Admin</h3>
            <p>Corridor control room, driver verifications, fleet telemetry, routes & incident desk.</p>
            <div className="card-action-link">
              <span>Admin Desk Sign In</span> <ArrowRight size={14} />
            </div>
          </div>

        </div>

        {/* Instant Demo Shortcut Bar for Showcase / Judges */}
        <div className="demo-login-bar">
          <span className="demo-bar-label">Instant Hackathon Showcase:</span>

          <button
            onClick={() => onQuickLogin('driver')}
            className="btn-demo-quick driver"
          >
            <Bus size={14} /> Demo Driver (Rajesh • Bus 24)
          </button>

          <button
            onClick={() => onQuickLogin('parent')}
            className="btn-demo-quick parent"
          >
            <UserCheck size={14} /> Demo Parent (Aarav's Parent)
          </button>

          <button
            onClick={() => onQuickLogin('admin')}
            className="btn-demo-quick admin"
          >
            <ShieldCheck size={14} /> Demo Admin (Transport Officer)
          </button>
        </div>
      </section>

      <hr className="section-divider" />

      {/* Regional Operational Highlights */}
      <section className="operational-summary">
        <div className="section-header-center">
          <span className="section-tag">Purpose-Built Architecture</span>
          <h2>Differentiated Portals for Every Transport Stakeholder</h2>
        </div>

        <div className="summary-grid">
          <div className="summary-item">
            <div className="summary-icon"><Bus size={22} /></div>
            <h3>Driver = Operator</h3>
            <p>Mobile-first operational cockpit with PIN code territory validation, document verification, and a single one-tap START TRIP action.</p>
          </div>

          <div className="summary-item">
            <div className="summary-icon"><MapPin size={22} /></div>
            <h3>Parent = Observer</h3>
            <p>Absolute certainty with live Google Maps tracking streamed from the driver's device, last known update freshness, and route stops.</p>
          </div>

          <div className="summary-item">
            <div className="summary-icon"><ShieldCheck size={22} /></div>
            <h3>Admin = Controller</h3>
            <p>The single source of truth: verifies driver KYC, assigns fleet vehicles and routes, monitors real-time telemetry, and resolves incidents.</p>
          </div>
        </div>

        {/* Corridor Hubs Strip */}
        <div className="corridor-banner">
          <div className="corridor-banner-icon"><Building2 size={24} color="#2563eb" /></div>
          <div>
            <h4>Corridor Coverage & Integrated Campuses</h4>
            <p>Serving MVGR College (Vizianagaram), ANITS (Thagarapuvalasa), GVP (Madhurawada), GITAM (Rushikonda), DPS Anandapuram, and corridor schools along NH16.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
