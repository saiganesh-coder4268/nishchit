import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bus, UserCheck, ShieldCheck, LogOut, Navigation } from 'lucide-react';

export default function Navbar({ currentUser, onLogout }) {
  const navigate = useNavigate();

  const getWorkspaceTitle = () => {
    if (!currentUser) return 'Corridor Transport';
    if (currentUser.role === 'driver') return 'Driver Portal';
    if (currentUser.role === 'admin') return 'Transport Management';
    if (currentUser.role === 'parent') return 'Parent Portal';
    return 'Corridor Transport';
  };

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
          <UserCheck size={13} /> Parent ({currentUser.studentName || currentUser.childName || 'Student'})
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
    if (currentUser.role === 'driver') return '/driver/dashboard';
    if (currentUser.role === 'parent') return '/parent/dashboard';
    if (currentUser.role === 'admin') return '/admin/dashboard';
    return '/';
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        
        {/* Brand Logo: Routes to role dashboard when authenticated, or landing page when logged out */}
        <Link to={currentUser ? getDashboardPath() : "/"} className="navbar-brand">
          <div className="brand-logo-circle">
            <Bus size={18} color="#ffffff" />
          </div>
          <div className="brand-text">
            <span className="brand-title">NISHCHIT</span>
            <span className="brand-sub">{getWorkspaceTitle()}</span>
          </div>
        </Link>

        {/* Center / Right Nav Items */}
        <div className="navbar-actions">
          {currentUser ? (
            <div className="navbar-user-strip">
              {getRoleBadge()}
              
              {/* Role Specific Quick Navigation */}
              {currentUser.role === 'driver' && (
                <Link to="/driver/dashboard" className="nav-dashboard-link">
                  Today's Trip
                </Link>
              )}
              {currentUser.role === 'parent' && (
                <Link to="/parent/dashboard" className="nav-dashboard-link">
                  Track Bus
                </Link>
              )}
              {currentUser.role === 'admin' && (
                <Link to="/admin/dashboard" className="nav-dashboard-link">
                  Operations Console
                </Link>
              )}

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
