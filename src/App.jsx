import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import DriverLogin from './pages/DriverLogin';
import DriverOnboarding from './pages/DriverOnboarding';
import DriverDashboard from './pages/DriverDashboard';
import ParentLogin from './pages/ParentLogin';
import ParentDashboard from './pages/ParentDashboard';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

import './App.css';

function ProtectedRoute({ children, allowedRole, currentUser, loading }) {
  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: 600 }}>Authenticating session...</p>
      </div>
    );
  }
  if (!currentUser) {
    if (allowedRole === 'driver') return <Navigate to="/driver/login" replace />;
    if (allowedRole === 'admin') return <Navigate to="/admin/login" replace />;
    return <Navigate to="/parent/login" replace />;
  }
  if (allowedRole && currentUser.role !== allowedRole) {
    if (currentUser.role === 'driver') return <Navigate to="/driver/dashboard" replace />;
    if (currentUser.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/parent/dashboard" replace />;
  }
  return children;
}

function AppContent() {
  const { currentUser, logout, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <Navbar currentUser={currentUser} onLogout={handleLogout} />
      <main className="main-content">
        <Routes>
          <Route
            path="/"
            element={<LandingPage />}
          />
          
          {/* DRIVER PORTAL */}
          <Route
            path="/driver/login"
            element={<DriverLogin />}
          />
          <Route
            path="/driver/onboarding"
            element={<DriverOnboarding />}
          />
          <Route
            path="/driver/dashboard"
            element={
              <ProtectedRoute allowedRole="driver" currentUser={currentUser} loading={loading}>
                <DriverDashboard currentUser={currentUser} />
              </ProtectedRoute>
            }
          />

          {/* PARENT PORTAL */}
          <Route
            path="/parent/login"
            element={<ParentLogin />}
          />
          <Route
            path="/parent/dashboard"
            element={
              <ProtectedRoute allowedRole="parent" currentUser={currentUser} loading={loading}>
                <ParentDashboard currentUser={currentUser} />
              </ProtectedRoute>
            }
          />

          {/* ADMIN PORTAL */}
          <Route
            path="/admin/login"
            element={<AdminLogin />}
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRole="admin" currentUser={currentUser} loading={loading}>
                <AdminDashboard currentUser={currentUser} />
              </ProtectedRoute>
            }
          />

          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </main>
      <Footer />
    </>
  );
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
