import React from 'react';
import { Link } from 'react-router-dom';
import NishchitLogo from '../NishchitLogo';
import { ArrowLeft, Shield, Users, TrendingUp } from 'lucide-react';

/**
 * AuthShell (Shell B: Dedicated Authentication Shell)
 * 
 * Recreates the exact compositional relationship of the primary visual reference:
 * - LEFT: Educational campus environment with brand narrative & trust pillars
 * - RIGHT: Carefully composed authentication card on the authentic route pattern
 * - STRICTLY NO global header with Parent / Driver / Admin buttons
 * - Responsive at 360px, 390px, 412px, 1280px, 1440px, 1920px
 */
export default function AuthShell({ children, roleTitle = '' }) {
  return (
    <div className="nishchit-split-auth-shell">
      {/* =========================================================
          LEFT COLUMN: Campus Environment & Trust Narrative
          Matches Primary Reference Composition
          ========================================================= */}
      <div className="auth-media-column">
        <div className="auth-media-top-brand">
          <Link to="/" style={{ textDecoration: 'none' }} aria-label="Nishchit — Home">
            <NishchitLogo variant="header" size={38} />
          </Link>
          <div className="auth-brand-accent-line" />
        </div>

        <div className="auth-media-content">
          <h1 className="auth-media-title">
            More than
            <br />
            transport.
            <br />
            <span className="accent-blue-text">A safer tomorrow.</span>
          </h1>

          <div className="auth-media-divider">—</div>

          <p className="auth-media-description">
            Nishchit connects schools, drivers and families to make every journey safer, simpler and more transparent across the educational corridor.
          </p>

          <div className="auth-media-divider">—</div>

          {/* Three Trust Pillars */}
          <div className="auth-pillars-row">
            <div className="auth-pillar-item">
              <Shield size={18} color="#334155" strokeWidth={2} />
              <span>Safer Students</span>
            </div>

            <div className="auth-pillar-item">
              <Users size={18} color="#334155" strokeWidth={2} />
              <span>Stronger Communities</span>
            </div>

            <div className="auth-pillar-item">
              <TrendingUp size={18} color="#334155" strokeWidth={2} />
              <span>Brighter Futures</span>
            </div>
          </div>
        </div>

        {/* Bottom Floating Frosted Glass Pill */}
        <div className="auth-bottom-glass-pill">
          <div className="pill-avatar-icon">
            <Users size={16} color="#38BDF8" />
          </div>
          <div className="pill-text">
            <strong>Children today.</strong>
            <span>A more certain tomorrow.</span>
          </div>
        </div>
      </div>

      {/* =========================================================
          RIGHT COLUMN: Dedicated Authentication Panel
          on Nishchit Route-Pattern Identity
          ========================================================= */}
      <div className="auth-panel-column">
        {/* Ambient Route Pattern Typography */}
        <div className="auth-ambient-top-right">
          <span>SCHOOLS</span>
          <span>PEOPLE</span>
          <span>PLACES</span>
          <span>CONNECTED</span>
          <span className="dash">—</span>
        </div>

        <div className="auth-ambient-bottom-right">
          <span className="dash">—</span>
          <span>A SAFER</span>
          <span>BRIGHTER</span>
          <span>TOMORROW</span>
        </div>

        {/* Minimal top navigation inside the panel: ONLY Back to portal selection */}
        <div className="auth-panel-topbar">
          <Link to="/" className="auth-back-action-link" aria-label="Back to portal selection">
            <ArrowLeft size={15} />
            <span>Back to portal selection</span>
          </Link>
        </div>

        {/* Centered Authentication Card */}
        <div className="auth-panel-card-container">
          {children}
        </div>
      </div>
    </div>
  );
}
