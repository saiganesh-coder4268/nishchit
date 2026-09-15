import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NishchitLogo from '../NishchitLogo';
import {
  Home, MapPin, Bell, UserCheck, Info, HelpCircle,
  LogOut, Menu, X, Phone, ShieldCheck, Bus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * ParentShell Component
 * 
 * Rebuilt to match Reference 2 (Top Workspace):
 * - Left Navigation Sidebar on Desktop
 * - Responsive Top Header with Greeting on Mobile
 * - Child identifier & direct emergency desk reachability
 */
export default function ParentShell({
  children,
  activeTab = 'home',
  onTabChange,
  unreadAlertsCount = 0
}) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const studentName = currentUser?.studentName || currentUser?.childName || 'Student';
  const parentName = currentUser?.fullName || currentUser?.name || 'Parent';

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'track', label: 'Track Bus', icon: MapPin },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadAlertsCount > 0 ? unreadAlertsCount : null },
    { id: 'child', label: 'My Child', icon: UserCheck },
    { id: 'transport', label: 'Transport Info', icon: Bus },
    { id: 'help', label: 'Help & Support', icon: HelpCircle }
  ];

  const handleSelectTab = (tabId) => {
    if (onTabChange) onTabChange(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <div className="nishchit-app-shell parent-shell-layout">
      {/* 1. DESKTOP LEFT SIDEBAR */}
      <aside className={`workspace-sidebar parent-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-top-branding">
          <Link to="/parent/dashboard" style={{ textDecoration: 'none' }} onClick={() => setMobileMenuOpen(false)}>
            <NishchitLogo variant="header" workspace="Parent Portal" size={28} />
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
                  <span className="nav-item-badge blue">{item.badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer User Profile */}
        <div className="sidebar-footer-profile">
          <div className="user-profile-card">
            <div className="profile-avatar-initials">
              {parentName.slice(0, 2).toUpperCase()}
            </div>
            <div className="profile-user-info">
              <strong className="user-display-name">{parentName}</strong>
              <span className="user-role-label">Parent · Child: {studentName}</span>
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
      <header className="mobile-workspace-header parent-mobile-header">
        <button
          type="button"
          className="mobile-menu-trigger"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>

        <Link to="/parent/dashboard" style={{ textDecoration: 'none' }}>
          <NishchitLogo variant="compact" size={28} />
        </Link>

        <div className="mobile-header-right">
          <div className="mobile-student-tag">
            <span>{currentUser?.studentName || currentUser?.childName || 'Parent'}</span>
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
        <header className="workspace-top-bar">
          <div className="workspace-greeting-group">
            <h1 className="greeting-title">
              Good {getGreetingTime()}, {parentName.split(' ')[0]}!
            </h1>
            <p className="greeting-subtitle">
              {currentUser?.studentName || currentUser?.childName
                ? `${currentUser.studentName || currentUser.childName}'s bus journey is tracked in real time.`
                : 'Discover and track campus corridor transit in real time.'}
            </p>
          </div>

          <div className="workspace-top-meta">
            <div className="date-chip">
              <span>{getFormattedDate()}</span>
            </div>
            <a
              href="tel:+918922241732"
              className="emergency-desk-chip"
              title="Call Transport Control Desk"
            >
              <Phone size={14} />
              <span>Transport Desk</span>
            </a>
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
