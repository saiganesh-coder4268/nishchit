import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import DriverLogin from './pages/DriverLogin';
import ParentLogin from './pages/ParentLogin';
import DriverDashboard from './pages/DriverDashboard';
import ParentDashboard from './pages/ParentDashboard';
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
    return <Navigate to={allowedRole === 'driver' ? '/driver/login' : '/parent/login'} replace />;
  }
  if (allowedRole && currentUser.role !== allowedRole) {
    return <Navigate to={currentUser.role === 'driver' ? '/driver/dashboard' : '/parent/dashboard'} replace />;
  }
  return children;
}

function AppContent() {
  const { currentUser, quickDemoLogin, logout, loading } = useAuth();
  const navigate = useNavigate();

  const handleQuickLogin = (role) => {
    quickDemoLogin(role);
    if (role === 'driver') {
      navigate('/driver/dashboard');
    } else {
      navigate('/parent/dashboard');
    }
  };

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
            element={<LandingPage onQuickLogin={handleQuickLogin} />}
          />
          <Route
            path="/driver/login"
            element={<DriverLogin />}
          />
          <Route
            path="/parent/login"
            element={<ParentLogin />}
          />
          <Route
            path="/driver/dashboard"
            element={
              <ProtectedRoute allowedRole="driver" currentUser={currentUser} loading={loading}>
                <DriverDashboard currentUser={currentUser} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/dashboard"
            element={
              <ProtectedRoute allowedRole="parent" currentUser={currentUser} loading={loading}>
                <ParentDashboard currentUser={currentUser} />
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


