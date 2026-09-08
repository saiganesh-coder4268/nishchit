import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, Smartphone, Zap, MapPin, MessageSquare, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';

export default function LandingPage({ onQuickLogin }) {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-badge">
          <ShieldCheck size={16} color="#2563eb" />
          <span>Real-time Transport Visibility Platform</span>
        </div>
        
        <h1 className="hero-title">
          NISHCHIT
        </h1>
        
        <p className="hero-tagline">
          "Know when the bus starts. Know where it is."
        </p>
        
        <p className="hero-subtitle">
          Live school & college bus visibility for parents — without needing a phone in the student's hands.
        </p>

        {/* Quick Demo Instant Access Bar */}
        <div className="demo-login-bar">
          <span className="demo-bar-label">⚡ Hackathon Instant Demo:</span>
          <button
            onClick={() => onQuickLogin('driver')}
            className="btn-demo-quick driver"
          >
            <Bus size={16} /> Instant Driver Demo (Rajesh Kumar)
          </button>
          <button
            onClick={() => onQuickLogin('parent')}
            className="btn-demo-quick parent"
          >
            <UserCheck size={16} /> Instant Parent Demo (Aarav's Parent)
          </button>
        </div>
      </section>

      {/* Role Selection Section */}
      <section className="roles-section">
        <div className="roles-grid">
          {/* Driver Card */}
          <div className="role-card driver-role">
            <div className="role-icon-wrapper driver">
              <Bus size={36} />
            </div>
            <div className="role-badge driver">Verified Driver Access</div>
            <h2 className="role-title">🚌 DRIVER PORTAL</h2>
            <p className="role-desc">
              Start a trip · Share live location · Broadcast status updates to parents
            </p>
            <ul className="role-features">
              <li><Zap size={16} /> One-tap trip activation</li>
              <li><MapPin size={16} /> Browser GPS tracking</li>
              <li><MessageSquare size={16} /> Safe quick status messages</li>
            </ul>
            <button
              onClick={() => navigate('/driver/login')}
              className="btn btn-primary btn-full"
            >
              DRIVER LOGIN <ArrowRight size={18} />
            </button>
          </div>

          {/* Parent Card */}
          <div className="role-card parent-role">
            <div className="role-icon-wrapper parent">
              <UserCheck size={36} />
            </div>
            <div className="role-badge parent">Parent Live View</div>
            <h2 className="role-title">👨‍👩‍👧 PARENT PORTAL</h2>
            <p className="role-desc">
              Check bus status · Track live on map · Contact bus driver directly
            </p>
            <ul className="role-features">
              <li><Smartphone size={16} /> Zero student phone requirement</li>
              <li><MapPin size={16} /> Realtime Leaflet live map</li>
              <li><MessageSquare size={16} /> Direct driver communication</li>
            </ul>
            <button
              onClick={() => navigate('/parent/login')}
              className="btn btn-success btn-full"
            >
              PARENT LOGIN <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* Benefits Highlights Section */}
      <section className="benefits-section">
        <h3 className="section-title">The Nishchit Certainty Advantage</h3>
        <div className="benefits-grid">
          <div className="benefit-card">
            <div className="benefit-icon">📱</div>
            <h4>No Student Phone Required</h4>
            <p>Students don't need smartphones or cellular plans. Tracking connects driver to parents directly.</p>
          </div>

          <div className="benefit-card">
            <div className="benefit-icon">⚡</div>
            <h4>One-Tap Activation</h4>
            <p>Drivers start location broadcasting with a single button tap before leaving school grounds.</p>
          </div>

          <div className="benefit-card">
            <div className="benefit-icon">📍</div>
            <h4>Live Map Tracking</h4>
            <p>Real-time updates powered by Leaflet and OpenStreetMap showing precise bus markers.</p>
          </div>

          <div className="benefit-card">
            <div className="benefit-icon">💬</div>
            <h4>Direct Communication</h4>
            <p>Instant alerts for traffic delays or temporary stops without unsafe phone calls while driving.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
