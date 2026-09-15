import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import StartupSplash from './components/StartupSplash';
import PublicShell from './components/shells/PublicShell';
import AuthShell from './components/shells/AuthShell';
import NishchitLogo from './components/NishchitLogo';

import LandingPage from './pages/LandingPage';
import DriverLogin from './pages/DriverLogin';
import DriverOnboarding from './pages/DriverOnboarding';
import DriverDashboard from './pages/DriverDashboard';
import DriverRoutePage from './pages/DriverRoutePage';
import DriverNotificationsPage from './pages/DriverNotificationsPage';
import DriverMessagesPage from './pages/DriverMessagesPage';
import DriverProfilePage from './pages/DriverProfilePage';

import ParentLogin from './pages/ParentLogin';
import ParentDashboard from './pages/ParentDashboard';
import ParentJourneyPage from './pages/ParentJourneyPage';
import ParentLiveLocationPage from './pages/ParentLiveLocationPage';
import ParentRoutePage from './pages/ParentRoutePage';
import ParentNotificationsPage from './pages/ParentNotificationsPage';
import ParentMessagesPage from './pages/ParentMessagesPage';
import ParentProfilePage from './pages/ParentProfilePage';

import InstitutionLogin from './pages/InstitutionLogin';
import InstitutionDashboard from './pages/InstitutionDashboard';
import PlatformAdminLogin from './pages/PlatformAdminLogin';
import PlatformAdminDashboard from './pages/PlatformAdminDashboard';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

import './App.css';

function ProtectedRoute({ children, allowedRole, currentUser, loading }) {
  if (loading) {
    return (
      <div
        className="flex-center"
        style={{
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px'
        }}
      >
        <NishchitLogo variant="compact" size={32} />
        <p style={{ color: '#667085', fontSize: '0.88rem', fontWeight: 600, letterSpacing: '0.01em' }}>
          Verifying secure session...
        </p>
      </div>
    );
  }
  if (!currentUser) {
    if (allowedRole === 'driver') return <Navigate to="/driver/login" replace />;
    if (allowedRole === 'platform_admin') return <Navigate to="/platform-admin/login" replace />;
    if (allowedRole === 'institution' || allowedRole === 'admin') return <Navigate to="/institution/login" replace />;
    return <Navigate to="/parent/login" replace />;
  }

  const isAllowed = Array.isArray(allowedRole)
    ? allowedRole.includes(currentUser.role)
    : currentUser.role === allowedRole;

  if (allowedRole && !isAllowed) {
    if (currentUser.role === 'driver') return <Navigate to="/driver/dashboard" replace />;
    if (currentUser.role === 'platform_admin') return <Navigate to="/platform-admin/dashboard" replace />;
    if (currentUser.role === 'institution' || currentUser.role === 'admin') return <Navigate to="/institution/dashboard" replace />;
    return <Navigate to="/parent/dashboard" replace />;
  }
  return children;
}

function AppContent() {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  const getAuthenticatedHome = () => {
    if (!currentUser) {
      return (
        <PublicShell>
          <LandingPage />
        </PublicShell>
      );
    }
    if (currentUser.role === 'driver') {
      return <Navigate to="/driver/dashboard" replace />;
    }
    if (currentUser.role === 'platform_admin') {
      return <Navigate to="/platform-admin/dashboard" replace />;
    }
    if (currentUser.role === 'institution' || currentUser.role === 'admin') {
      return <Navigate to="/institution/dashboard" replace />;
    }
    return <Navigate to="/parent/dashboard" replace />;
  };

  return (
    <>
      {/* Brand Startup Transition: Only runs on public initial entry, never on authenticated refresh or auth routes */}
      {!currentUser && location.pathname === '/' && <StartupSplash />}

      <main className="main-content">
        <Routes>
          {/* =========================================================
              SHELL A — PUBLIC
              Used for / and portal selection
              ========================================================= */}
          <Route
            path="/"
            element={getAuthenticatedHome()}
          />
          
          {/* =========================================================
              SHELL B — AUTHENTICATION
              Role-specific landing and authentication portals
              ========================================================= */}
          <Route
            path="/parent/login"
            element={
              currentUser?.role === 'parent' ? (
                <Navigate to="/parent/dashboard" replace />
              ) : currentUser ? (
                getAuthenticatedHome()
              ) : (
                <AuthShell roleTitle="Parent / Guardian">
                  <ParentLogin />
                </AuthShell>
              )
            }
          />

          <Route
            path="/driver/login"
            element={
              currentUser?.role === 'driver' ? (
                <Navigate to="/driver/dashboard" replace />
              ) : currentUser ? (
                getAuthenticatedHome()
              ) : (
                <AuthShell roleTitle="Driver">
                  <DriverLogin />
                </AuthShell>
              )
            }
          />

          <Route
            path="/driver/onboarding"
            element={
              <ProtectedRoute allowedRole="driver" currentUser={currentUser} loading={loading}>
                <AuthShell roleTitle="Driver Onboarding">
                  <DriverOnboarding />
                </AuthShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/institution/login"
            element={
              currentUser?.role === 'institution' || currentUser?.role === 'admin' ? (
                <Navigate to="/institution/dashboard" replace />
              ) : currentUser ? (
                getAuthenticatedHome()
              ) : (
                <AuthShell roleTitle="Institution Transport Desk">
                  <InstitutionLogin />
                </AuthShell>
              )
            }
          />

          <Route
            path="/platform-admin/login"
            element={
              currentUser?.role === 'platform_admin' ? (
                <Navigate to="/platform-admin/dashboard" replace />
              ) : currentUser ? (
                getAuthenticatedHome()
              ) : (
                <AuthShell roleTitle="Platform Operator">
                  <PlatformAdminLogin />
                </AuthShell>
              )
            }
          />

          {/* Admin Login */}
          <Route
            path="/admin/login"
            element={
              currentUser?.role === 'admin' || currentUser?.role === 'institution' ? (
                <Navigate to="/admin/dashboard" replace />
              ) : currentUser ? (
                getAuthenticatedHome()
              ) : (
                <AuthShell roleTitle="Institution Transport Admin">
                  <AdminLogin />
                </AuthShell>
              )
            }
          />

          {/* =========================================================
              SHELL C — AUTHENTICATED APPLICATION
              Role-specific operating dashboards & companion pages
              ========================================================= */}

          {/* PARENT ROUTES */}
          <Route
            path="/parent/dashboard"
            element={
              <ProtectedRoute allowedRole="parent" currentUser={currentUser} loading={loading}>
                <ParentDashboard currentUser={currentUser} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/journey"
            element={
              <ProtectedRoute allowedRole="parent" currentUser={currentUser} loading={loading}>
                <ParentJourneyPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/live-location"
            element={
              <ProtectedRoute allowedRole="parent" currentUser={currentUser} loading={loading}>
                <ParentLiveLocationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/route"
            element={
              <ProtectedRoute allowedRole="parent" currentUser={currentUser} loading={loading}>
                <ParentRoutePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/notifications"
            element={
              <ProtectedRoute allowedRole="parent" currentUser={currentUser} loading={loading}>
                <ParentNotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/messages"
            element={
              <ProtectedRoute allowedRole="parent" currentUser={currentUser} loading={loading}>
                <ParentMessagesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/profile"
            element={
              <ProtectedRoute allowedRole="parent" currentUser={currentUser} loading={loading}>
                <ParentProfilePage />
              </ProtectedRoute>
            }
          />

          {/* DRIVER ROUTES */}
          <Route
            path="/driver/dashboard"
            element={
              <ProtectedRoute allowedRole="driver" currentUser={currentUser} loading={loading}>
                <DriverDashboard currentUser={currentUser} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/driver/route"
            element={
              <ProtectedRoute allowedRole="driver" currentUser={currentUser} loading={loading}>
                <DriverRoutePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/driver/notifications"
            element={
              <ProtectedRoute allowedRole="driver" currentUser={currentUser} loading={loading}>
                <DriverNotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/driver/messages"
            element={
              <ProtectedRoute allowedRole="driver" currentUser={currentUser} loading={loading}>
                <DriverMessagesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/driver/profile"
            element={
              <ProtectedRoute allowedRole="driver" currentUser={currentUser} loading={loading}>
                <DriverProfilePage />
              </ProtectedRoute>
            }
          />

          {/* ADMIN & INSTITUTION ROUTES */}
          {[
            '/admin/dashboard',
            '/admin/drivers',
            '/admin/vehicles',
            '/admin/routes',
            '/admin/schedules',
            '/admin/trips',
            '/admin/incidents',
            '/admin/history',
            '/admin/profile'
          ].map((path) => (
            <Route
              key={path}
              path={path}
              element={
                <ProtectedRoute allowedRole={['admin', 'institution']} currentUser={currentUser} loading={loading}>
                  <AdminDashboard currentUser={currentUser} />
                </ProtectedRoute>
              }
            />
          ))}

          {/* Institution Dashboard Backward Compatibility */}
          <Route
            path="/institution/dashboard"
            element={
              <ProtectedRoute allowedRole={['institution', 'admin']} currentUser={currentUser} loading={loading}>
                <InstitutionDashboard currentUser={currentUser} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/platform-admin/dashboard"
            element={
              <ProtectedRoute allowedRole="platform_admin" currentUser={currentUser} loading={loading}>
                <PlatformAdminDashboard currentUser={currentUser} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/logout"
            element={<LogoutHandler />}
          />

          {/* CATCH-ALL REDIRECT */}
          <Route
            path="*"
            element={currentUser ? getAuthenticatedHome() : <Navigate to="/" replace />}
          />
        </Routes>
      </main>
    </>
  );
}

function LogoutHandler() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  React.useEffect(() => {
    logout().then(() => {
      navigate('/', { replace: true });
    });
  }, [logout, navigate]);
  return null;
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}
