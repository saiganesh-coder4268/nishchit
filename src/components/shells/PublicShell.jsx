import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import NishchitLogo from '../NishchitLogo';

/**
 * PublicShell (Shell A: Public Experience)
 * 
 * Used strictly for:
 * - / (Public landing & portal selection)
 * 
 * Guarantees:
 * - Pure reference composition
 * - NO duplicate portal links in header
 * - Clean institutional branding and footer
 */
export default function PublicShell({ children }) {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <div className="nishchit-app-shell public-shell">
      <main className="public-shell-content">
        {children}
      </main>

      {isLanding && (
        <footer className="public-footer">
          <div className="public-footer-container">
            <div className="footer-top-row">
              <div className="footer-brand-column">
                <div style={{ background: '#FFFFFF', padding: '6px 14px', borderRadius: '10px', display: 'inline-flex', width: 'fit-content', marginBottom: '14px' }}>
                  <NishchitLogo variant="header" size={26} />
                </div>
                <p className="footer-tagline-text">
                  A calm, accountable connection between the people who manage transport, the drivers who operate it, and the families who depend on it.
                </p>
                <span className="corridor-coverage-badge">
                  Vizianagaram — Thagarapuvalasa — Visakhapatnam Education Corridor
                </span>
              </div>

              <div className="footer-links-grid">
                <div className="footer-link-group">
                  <strong>Access Portals</strong>
                  <Link to="/parent/login">Parent / Guardian</Link>
                  <Link to="/driver/login">Driver</Link>
                  <Link to="/admin/login">Transport Admin</Link>
                </div>

                <div className="footer-link-group">
                  <strong>Operational Standards</strong>
                  <span>Real Device GPS Streaming</span>
                  <span>Google Maps Integration</span>
                  <span>Zero Simulated Coordinates</span>
                  <span>Direct Safety Desk Contact</span>
                </div>
              </div>
            </div>

            <div className="footer-bottom-bar">
              <span>© {new Date().getFullYear()} NISHCHIT Platform. Certainty for every parent.</span>
              <span className="footer-sub-note">Built for educational institution transit safety and family peace of mind.</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
