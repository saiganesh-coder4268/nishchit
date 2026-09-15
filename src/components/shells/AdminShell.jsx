import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NishchitLogo from '../NishchitLogo';
import {
  Building2, ShieldCheck, Bus, MapPin, Calendar,
  Radio, LogOut, Menu, X, CheckCircle2, AlertTriangle,
  Users, TrendingUp, Settings
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * AdminShell Component
 * 
 * Rebuilt to match Reference 2 (Bottom Workspace):
 * - Left Navigation Sidebar on Desktop
 * - Responsive Top Header with Greeting & Date
 * - Live Counters for Pending Applications & Active Fleet Trips
 */
export default function AdminShell({
  children,
  activeTab = 'overview',
  onTabChange,
  pendingCount = 0,
  activeTripsCount = 0,
  incidentsCount = 0
}) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: Building2 },
    { id: 'fleet', label: 'Live Tracking', icon: Radio, badge: activeTripsCount > 0 ? `${activeTripsCount} LIVE` : null, isLiveBadge: true },
    { id: 'buses', label: 'Buses', icon: Bus },
    { id: 'drivers', label: 'Drivers', icon: ShieldCheck, badge: pendingCount > 0 ? pendingCount : null },
    { id: 'routes', label: 'Routes', icon: MapPin },
    { id: 'schedules', label: 'Schedules', icon: Calendar },
    { id: 'incidents', label: 'Alerts & Incidents', icon: AlertTriangle, badge: incidentsCount > 0 ? incidentsCount : null }
  ];

  const handleSelectTab = (tabId) => {
    if (onTabChange) onTabChange(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <div className="nishchit-app-shell admin-shell-layout">
      {/* 1. DESKTOP LEFT SIDEBAR */}
      <aside className={`workspace-sidebar admin-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-top-branding">
          <Link to="/admin/dashboard" style={{ textDecoration: 'none' }} onClick={() => setMobileMenuOpen(false)}>
            <NishchitLogo variant="header" workspace="Admin Console" size={28} />
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
                  <span className={`nav-item-badge ${item.isLiveBadge ? 'live-green' : 'amber'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer Admin Profile */}
        <div className="sidebar-footer-profile">
          <div className="user-profile-card">
            <div className="profile-avatar-initials amber">
              AD
            </div>
            <div className="profile-user-info">
              <strong className="user-display-name">Admin</strong>
              <span className="user-role-label">Transport Admin · Desk</span>
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
      <header className="mobile-workspace-header admin-mobile-header">
        <button
          type="button"
          className="mobile-menu-trigger"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>

        <Link to="/admin/dashboard" style={{ textDecoration: 'none' }}>
          <NishchitLogo variant="compact" size={28} />
        </Link>

        <div className="mobile-header-right">
          <div className="admin-status-indicator-tag">
            <span className="live-dot" />
            <span>Operations Active</span>
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
        {/* Top Operational Bar (Reference 2 Bottom) */}
        <header className="workspace-top-bar admin-top-bar">
          <div className="workspace-greeting-group">
            <h1 className="greeting-title">
              Good {getGreetingTime()}, Admin!
            </h1>
            <p className="greeting-subtitle">
              Here's what's happening with your corridor transport today.
            </p>
          </div>

          <div className="workspace-top-meta">
            <div className="date-chip">
              <span>{getFormattedDate()}</span>
            </div>
            <div className="corridor-active-pill">
              <span className="live-dot" />
              <span>Corridor Central Desk</span>
            </div>
          </div>
        </header>

        <main className="workspace-content-body admin-content-body">
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
