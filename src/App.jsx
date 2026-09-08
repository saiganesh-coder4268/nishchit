import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import DriverLogin from './pages/DriverLogin';
import ParentLogin from './pages/ParentLogin';
import DriverDashboard from './pages/DriverDashboard';
import ParentDashboard from './pages/ParentDashboard';
import './App.css';

function AppContent() {
  const { currentUser, quickDemoLogin, logout } = useAuth();
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
            element={<DriverDashboard currentUser={currentUser} />}
          />
          <Route
            path="/parent/dashboard"
            element={<ParentDashboard currentUser={currentUser} />}
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

