import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bus, UserCheck, ShieldCheck, LogOut, Navigation } from 'lucide-react';

export default function Navbar({ currentUser, onLogout }) {
  const navigate = useNavigate();

  const getRoleBadge = () => {
    if (!currentUser) return null;
    if (currentUser.role === 'driver') {
      return (
        <span className="navbar-role-pill driver">
          <Bus size={13} /> Driver Operator {currentUser.busNumber ? `(${currentUser.busNumber})` : ''}
        </span>
      );
    }
    if (currentUser.role === 'parent') {
      return (
        <span className="navbar-role-pill parent">
          <UserCheck size={13} /> Parent ({currentUser.studentName || 'Student'})
        </span>
      );
    }
    if (currentUser.role === 'admin') {
      return (
        <span className="navbar-role-pill admin">
          <ShieldCheck size={13} /> Transport Controller
        </span>
      );
    }
    return null;
  };

  const getDashboardPath = () => {
    if (!currentUser) return '/';
    if (currentUser.role === 'driver') {
      const isApproved = (currentUser.verificationStatus || '').toLowerCase() === 'approved';
      return isApproved ? '/driver/dashboard' : '/driver/onboarding';
    }
    if (currentUser.role === 'parent') return '/parent/dashboard';
    if (currentUser.role === 'admin') return '/admin/dashboard';
    return '/';
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        
        {/* Brand Logo */}
        <Link to="/" className="navbar-brand">
          <div className="brand-logo-circle">
            <Bus size={18} color="#ffffff" />
          </div>
          <div className="brand-text">
            <span className="brand-title">NISHCHIT</span>
            <span className="brand-sub">Corridor Transport</span>
          </div>
        </Link>

        {/* Center / Right Nav Items */}
        <div className="navbar-actions">
          {currentUser ? (
            <div className="navbar-user-strip">
              {getRoleBadge()}
              
              <Link to={getDashboardPath()} className="nav-dashboard-link">
                Dashboard
              </Link>

              <div className="user-profile-summary">
                <span className="user-display-name">{currentUser.name || currentUser.fullName || currentUser.email}</span>
              </div>

              <button
                onClick={onLogout}
                className="btn-navbar-logout"
                title="Sign Out"
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="navbar-auth-links">
              <Link to="/parent/login" className="btn-nav-login parent">
                <UserCheck size={14} /> Parent Sign In
              </Link>
              <Link to="/driver/login" className="btn-nav-login driver">
                <Bus size={14} /> Driver Sign In
              </Link>
              <Link to="/admin/login" className="btn-nav-login admin">
                <ShieldCheck size={14} /> Admin Desk
              </Link>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
