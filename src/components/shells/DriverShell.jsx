import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NishchitLogo from '../NishchitLogo';
import {
  Bus, Users, MapPin, Bell, MessageSquare, HelpCircle,
  LogOut, Menu, X, Radio, CheckCircle2, ShieldCheck, User,
  Sparkles, Mail, Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * DriverShell Component
 * 
 * Rebuilt to match Reference 2 (Middle Workspace):
 * - Left Navigation Sidebar on Desktop
 * - Responsive Top Header with Greeting on Mobile
 * - High-touch targets for mobile driver cockpit operation
 */
export default function DriverShell({
  children,
  activeTab = 'trip',
  onTabChange,
  unreadCount = 0,
  isGpsActive = false
}) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const displayName = currentUser?.fullName || currentUser?.name || 'Verified Driver';
  const assignedBus = currentUser?.busNumber || currentUser?.assignedBusNumber || (currentUser?.busId ? `Bus ${currentUser.busId.replace(/^BUS-/, '')}` : null) || (currentUser?.assignedBusId ? `Bus ${currentUser.assignedBusId.replace(/^BUS-/, '')}` : null) || 'Bus 12';

  const navItems = [
    { id: 'trip', label: "Today's Duty", icon: Bus },
    { id: 'jobs', label: 'Find Opportunities', icon: Sparkles },
    { id: 'applications', label: 'Applications & Invites', icon: Mail, badge: unreadCount > 0 ? unreadCount : null },
    { id: 'profile', label: 'Professional Profile', icon: User },
    { id: 'history', label: 'Trip History', icon: Clock }
  ];

  const handleSelectTab = (tabId) => {
    if (onTabChange) {
      onTabChange(tabId);
    } else {
      if (tabId === 'trip') navigate('/driver/dashboard');
      else if (tabId === 'jobs') navigate('/driver/dashboard');
      else if (tabId === 'applications') navigate('/driver/notifications');
      else if (tabId === 'profile') navigate('/driver/profile');
      else if (tabId === 'history') navigate('/driver/dashboard');
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="nishchit-app-shell driver-shell-layout">
      {/* 1. DESKTOP LEFT SIDEBAR */}
      <aside className={`workspace-sidebar driver-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-top-branding">
          <Link to="/driver/dashboard" style={{ textDecoration: 'none' }} onClick={() => setMobileMenuOpen(false)}>
            <NishchitLogo variant="header" workspace="Driver Portal" size={28} />
          </Link>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav-menu">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleSelectTab(item.id)}
              >
                <div className="nav-item-icon-label">
                  <Icon size={18} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="nav-item-badge green">{item.badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer Driver Profile */}
        <div className="sidebar-footer-profile">
          <div className="user-profile-card">
            <div className="profile-avatar-initials green">
              {displayName.slice(0, 2).toUpperCase()}
            </div>
            <div className="profile-user-info">
              <strong className="user-display-name">{displayName}</strong>
              <span className="user-role-label">Operator · {assignedBus}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="sidebar-signout-btn"
            title="Sign out of Nishchit"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 2. MOBILE TOP BAR */}
      <header className="mobile-workspace-header driver-mobile-header">
        <button
          type="button"
          className="mobile-menu-trigger"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>

        <Link to="/driver/dashboard" style={{ textDecoration: 'none' }}>
          <NishchitLogo variant="compact" size={28} />
        </Link>

        <div className="mobile-header-right">
          <div className="mobile-bus-pill">
            <span>{assignedBus}</span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mobile-logout-btn"
            title="Sign Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* 3. MAIN WORKSPACE CONTENT */}
      <div className="workspace-main-viewport">
        {/* Top Operational Bar */}
        <header className="workspace-top-bar driver-top-bar">
          <div className="workspace-greeting-group">
            <h1 className="greeting-title">
              Good {getGreetingTime()}, {displayName.split(' ')[0]}!
            </h1>
            <p className="greeting-subtitle">
              Drive safe. Assigned to {assignedBus} for today's corridor transit.
            </p>
          </div>

          <div className="workspace-top-meta">
            <div className="date-chip">
              <span>{getFormattedDate()}</span>
            </div>
            <div className={`gps-telemetry-chip ${isGpsActive ? 'active' : ''}`}>
              <Radio size={14} className={isGpsActive ? 'pulse-icon' : ''} />
              <span>{isGpsActive ? 'Hardware GPS Streaming' : 'GPS Standby'}</span>
            </div>
          </div>
        </header>

        <main className="workspace-content-body">
          {children}
        </main>
      </div>
    </div>
  );
}

function getGreetingTime() {
  const hr = new Date().getHours();
  if (hr < 12) return 'morning';
  if (hr < 17) return 'afternoon';
  return 'evening';
}

function getFormattedDate() {
  const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
  return new Date().toLocaleDateString('en-IN', options);
}
