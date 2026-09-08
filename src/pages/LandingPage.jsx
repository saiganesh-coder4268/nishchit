import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, UserCheck, ShieldCheck, MapPin, Zap } from 'lucide-react';

export default function LandingPage({ onQuickLogin }) {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-badge">
          <ShieldCheck size={16} />
          <span>School Transport Visibility</span>
        </div>
        
        <h1 className="hero-brand">NISHCHIT</h1>
        
        <div className="hero-headings">
          <h2>Know when the bus starts.</h2>
          <h2>Know where it is.</h2>
        </div>
        
        <p className="hero-supporting">
          Real-time school bus tracking for parents — no student phone required.
        </p>

        {/* Primary Action Buttons */}
        <div className="hero-actions">
          <button
            onClick={() => navigate('/parent/login')}
            className="btn btn-primary btn-hero"
          >
            <UserCheck size={18} />
            Parent Login
          </button>
          
          <button
            onClick={() => navigate('/driver/login')}
            className="btn btn-secondary btn-hero"
          >
            <Bus size={18} />
            Driver Login
          </button>
        </div>

        {/* Instant Demo Shortcut Bar */}
        <div className="demo-login-bar">
          <span className="demo-bar-label">Demo Quick Access:</span>

          <button
            onClick={() => onQuickLogin('parent')}
            className="btn-demo-quick parent"
          >
            <UserCheck size={14} /> Instant Parent Demo (Aarav's Parent)
          </button>

          <button
            onClick={() => onQuickLogin('driver')}
            className="btn-demo-quick driver"
          >
            <Bus size={14} /> Instant Driver Demo (Rajesh Kumar)
          </button>
        </div>
      </section>

      <hr className="section-divider" />

      {/* Operational Highlights */}
      <section className="operational-summary">
        <div className="summary-grid">
          <div className="summary-item">
            <div className="summary-icon"><ShieldCheck size={20} /></div>
            <h3>Direct Driver Tracking</h3>
            <p>GPS streams directly from the driver's device once authorized. No student smartphone required.</p>
          </div>

          <div className="summary-item">
            <div className="summary-icon"><MapPin size={20} /></div>
            <h3>Real-Time Google Maps</h3>
            <p>Live marker updates without page refreshes. Immediate status visibility for delays & arrivals.</p>
          </div>

          <div className="summary-item">
            <div className="summary-icon"><Zap size={20} /></div>
            <h3>Safe Operational Status</h3>
            <p>One-tap quick status announcements allow drivers to update parents safely without typing while driving.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

