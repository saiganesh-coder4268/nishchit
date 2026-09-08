import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import DriverLogin from './pages/DriverLogin';
import ParentLogin from './pages/ParentLogin';
import DriverDashboard from './pages/DriverDashboard';
import ParentDashboard from './pages/ParentDashboard';
import './App.css';

function AppContent() {
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  const handleQuickLogin = (role) => {
    if (role === 'driver') {
      const demoDriver = {
        uid: 'demo-driver-1',
        name: 'Rajesh Kumar',
        email: 'driver@nishchit.app',
        role: 'driver',
        driverId: 'DRV001',
        busId: 'BUS24',
        routeId: 'ROUTE04',
        verificationStatus: 'VERIFIED',
      };
      setCurrentUser(demoDriver);
      navigate('/driver/dashboard');
    } else {
      const demoParent = {
        uid: 'demo-parent-1',
        name: 'Demo Parent',
        email: 'parent@nishchit.app',
        role: 'parent',
        studentName: 'Aarav',
        studentClass: 'Class 8-A',
        busId: 'BUS24',
        routeId: 'ROUTE04',
      };
      setCurrentUser(demoParent);
      navigate('/parent/dashboard');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
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
            element={<DriverLogin onQuickLogin={() => handleQuickLogin('driver')} />}
          />
          <Route
            path="/parent/login"
            element={<ParentLogin onQuickLogin={() => handleQuickLogin('parent')} />}
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
      <AppContent />
    </Router>
  );
}
