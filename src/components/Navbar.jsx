import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bus, User } from 'lucide-react';

export default function Navbar({ currentUser, onLogout }) {
  const location = useLocation();

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <div className="brand-icon">
            <Bus size={22} color="#ffffff" />
          </div>
          <div className="brand-text">
            <span className="brand-name">NISHCHIT</span>
            <span className="brand-tagline">Certainty Layer</span>
          </div>
        </Link>

        <nav className="navbar-nav">
          {currentUser ? (
            <div className="user-menu">
              <span className="user-badge">
                <User size={14} />
                {currentUser.name} ({currentUser.role.toUpperCase()})
              </span>
              <button onClick={onLogout} className="btn-logout">
                Logout
              </button>
            </div>
          ) : (
            <div className="nav-links">
              <Link
                to="/driver/login"
                className={`nav-link ${location.pathname.startsWith('/driver') ? 'active' : ''}`}
              >
                Driver Portal
              </Link>
              <Link
                to="/parent/login"
                className={`nav-link ${location.pathname.startsWith('/parent') ? 'active' : ''}`}
              >
                Parent Portal
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
