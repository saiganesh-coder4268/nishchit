import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRight, ArrowLeft, Bus, Building2,
  Users, TrendingUp, Shield, CheckCircle2, ShieldCheck,
  AlertCircle, Clock, Check, LogOut, RefreshCw
} from 'lucide-react';
import NishchitLogo from '../components/NishchitLogo';
import {
  subscribeInstitutes,
  subscribeBuses,
  subscribeRoutes,
  submitDriverVerificationRequest,
  linkParentStudentTransport
} from '../services/transportService';
import { REGISTERED_INSTITUTIONS } from '../data/regionData';

export default function LandingPage({ initialPortal = null }) {
  const {
    currentUser,
    loginWithGoogle,
    loginAsDriverDemo,
    loginAsDemoParent,
    loginAsInstitutionDemo,
    loginAsPlatformAdmin,
    loginAsAdminHackathon,
    updateCurrentUserProfile,
    logout
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active portal view from prop or URL
  const resolvePortalFromPath = () => {
    if (initialPortal) return initialPortal;
    if (location.pathname.startsWith('/parent/login')) return 'parent';
    if (location.pathname.startsWith('/driver/login')) return 'driver';
    if (location.pathname.startsWith('/institution/login') || location.pathname.startsWith('/admin/login')) return 'admin';
    if (location.pathname.startsWith('/platform-admin/login')) return 'platform_admin';
    return null;
  };

  const [activePortal, setActivePortal] = useState(resolvePortalFromPath());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Firestore data for dynamic selectors
  const [institutesList, setInstitutesList] = useState(REGISTERED_INSTITUTIONS);
  const [busesList, setBusesList] = useState([]);
  const [routesList, setRoutesList] = useState([]);

  // Driver Registration Form State
  const [driverForm, setDriverForm] = useState({
    fullName: '',
    phone: '',
    licenceNumber: '',
    experienceYears: '5',
    institutionId: 'INST-AU'
  });

  // Parent Onboarding Form State
  const [parentForm, setParentForm] = useState({
    parentName: '',
    phone: '',
    studentName: '',
    studentRelationship: 'Parent',
    institutionId: 'INST-AU',
    routeId: '',
    busId: '',
    stopName: 'Siripuram Circle'
  });

  // Admin credentials state
  const [adminId, setAdminId] = useState('admin123');
  const [adminPassword, setAdminPassword] = useState('admin123');

  // Keep activePortal in sync when route changes
  useEffect(() => {
    setActivePortal(resolvePortalFromPath());
  }, [location.pathname, initialPortal]);

  // Subscribe to real Firestore institutes, buses, routes
  useEffect(() => {
    const unsubInst = subscribeInstitutes((insts) => {
      if (insts && insts.length > 0) setInstitutesList(insts);
    });
    const unsubBuses = subscribeBuses((buses) => {
      setBusesList(buses || []);
    });
    const unsubRoutes = subscribeRoutes((routes) => {
      setRoutesList(routes || []);
    });
    return () => {
      unsubInst();
      unsubBuses();
      unsubRoutes();
    };
  }, []);

  // Sync pre-filled user names if user logs in
  useEffect(() => {
    if (currentUser) {
      if (currentUser.displayName || currentUser.fullName || currentUser.name) {
        const name = currentUser.displayName || currentUser.fullName || currentUser.name;
        setDriverForm(prev => ({ ...prev, fullName: prev.fullName || name }));
        setParentForm(prev => ({ ...prev, parentName: prev.parentName || name }));
      }
    }
  }, [currentUser]);

  // If already authenticated and approved, handle workspace redirection
  useEffect(() => {
    if (currentUser && !loading) {
      if (currentUser.role === 'driver') {
        const isApproved = (currentUser.verificationStatus || '').toLowerCase() === 'approved';
        if (isApproved && !currentUser.needsDriverRegistration) {
          navigate('/driver/dashboard', { replace: true });
        }
      } else if (currentUser.role === 'parent') {
        if (!currentUser.needsStudentLink && currentUser.busId) {
          navigate('/parent/dashboard', { replace: true });
        }
      } else if (currentUser.role === 'admin' || currentUser.role === 'institution') {
        navigate('/institution/dashboard', { replace: true });
      } else if (currentUser.role === 'platform_admin') {
        navigate('/platform-admin/dashboard', { replace: true });
      }
    }
  }, [currentUser, loading, navigate]);

  const handleSelectPortal = (portalKey, path) => {
    setError('');
    setActivePortal(portalKey);
    navigate(path);
  };

  const handleBackToSelector = () => {
    setError('');
    setActivePortal(null);
    navigate('/');
  };

  // Google Sign-In for Parent
  const handleParentGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await loginWithGoogle('parent');
      if (res?.needsStudentLink || !res?.busId) {
        // Will display student setup form in the same persistent card
      } else {
        navigate('/parent/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Parent Google Sign-In Error:', err);
      setError(err.message || 'Google authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Demo Parent Login
  const handleDemoParentLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginAsDemoParent();
      navigate('/parent/dashboard', { replace: true });
    } catch (err) {
      console.error('Demo Parent Login Error:', err);
      setError('Could not initialize demo parent session.');
    } finally {
      setLoading(false);
    }
  };

  // Parent Onboarding Submission
  const handleSaveParentStudent = async (e) => {
    e.preventDefault();
    if (!parentForm.studentName.trim()) {
      setError('Please enter your student / child name.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const selectedInst = institutesList.find(i => i.id === parentForm.institutionId || i.instituteId === parentForm.institutionId) || institutesList[0];
      const instBuses = busesList.filter(b => (b.institutionId || b.instituteId) === selectedInst.id);
      const selectedBus = instBuses.find(b => b.id === parentForm.busId) || instBuses[0] || { id: 'BUS-AU01', busNumber: 'Bus AU01' };
      const instRoutes = routesList.filter(r => (r.institutionId || r.instituteId) === selectedInst.id);
      const selectedRoute = instRoutes.find(r => r.id === parentForm.routeId) || instRoutes[0] || { id: 'ROUTE-AU01', name: 'Route AU01' };

      await linkParentStudentTransport(currentUser.uid, {
        parentName: parentForm.parentName || currentUser.displayName || 'Parent',
        parentEmail: currentUser.email || '',
        phone: parentForm.phone || '',
        studentName: parentForm.studentName,
        studentRelationship: parentForm.studentRelationship,
        instituteId: selectedInst.id,
        instituteName: selectedInst.name,
        routeId: selectedRoute.id || selectedRoute.routeId || 'ROUTE-AU01',
        routeName: selectedRoute.name || selectedRoute.routeName || 'Route AU01',
        busId: selectedBus.id || selectedBus.busId || 'BUS-AU01',
        busNumber: selectedBus.busNumber || 'Bus AU01',
        stopName: parentForm.stopName || 'Siripuram Circle'
      });

      navigate('/parent/dashboard', { replace: true });
    } catch (err) {
      console.error('Parent Student Link Error:', err);
      setError(err.message || 'Failed to save student transport record.');
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In for Driver
  const handleDriverGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await loginWithGoogle('driver');
      const isApproved = (res?.verificationStatus || '').toLowerCase() === 'approved';
      if (isApproved && !res?.needsDriverRegistration) {
        navigate('/driver/dashboard', { replace: true });
      }
      // If needs registration or pending, component state updates automatically via currentUser
    } catch (err) {
      console.error('Driver Google Sign-In Error:', err);
      setError(err.message || 'Driver authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Demo Driver Login
  const handleDemoDriverLogin = async (driverId = 'DRV-SURESH-REDDY') => {
    setError('');
    setLoading(true);
    try {
      await loginAsDriverDemo(driverId);
      navigate('/driver/dashboard', { replace: true });
    } catch (err) {
      console.error('Demo Driver Login Error:', err);
      setError('Could not initialize demo driver session.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Driver Verification Request
  const handleSubmitDriverRegistration = async (e) => {
    e.preventDefault();
    if (!driverForm.fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!driverForm.phone.trim()) {
      setError('Please enter your mobile phone number.');
      return;
    }
    if (!driverForm.licenceNumber.trim()) {
      setError('Please enter your commercial driving license number.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const selectedInst = institutesList.find(i => i.id === driverForm.institutionId || i.instituteId === driverForm.institutionId) || institutesList[0];

      await submitDriverVerificationRequest({
        uid: currentUser.uid,
        name: driverForm.fullName,
        fullName: driverForm.fullName,
        email: currentUser.email || '',
        phone: driverForm.phone,
        licenceNumber: driverForm.licenceNumber,
        experienceYears: driverForm.experienceYears,
        institutionId: selectedInst.id,
        institutionName: selectedInst.name,
        status: 'pending'
      });

      await updateCurrentUserProfile({
        status: 'pending',
        verificationStatus: 'pending',
        needsDriverRegistration: false,
        name: driverForm.fullName,
        fullName: driverForm.fullName,
        phone: driverForm.phone,
        licenceNumber: driverForm.licenceNumber,
        experienceYears: driverForm.experienceYears,
        institutionId: selectedInst.id,
        institutionName: selectedInst.name
      });
    } catch (err) {
      console.error('Driver Verification Submission Error:', err);
      setError(err.message || 'Failed to submit driver verification request.');
    } finally {
      setLoading(false);
    }
  };

  // Admin Login
  const handleAdminSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginAsAdminHackathon(adminId, adminPassword);
      navigate('/institution/dashboard', { replace: true });
    } catch (err) {
      console.error('Admin Login Error:', err);
      setError(err.message || 'Invalid administrator credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Demo Institution Login
  const handleDemoInstitutionLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginAsInstitutionDemo('INST-AU');
      navigate('/institution/dashboard', { replace: true });
    } catch (err) {
      console.error('Demo Institution Error:', err);
      setError('Could not initialize institution session.');
    } finally {
      setLoading(false);
    }
  };

  // Google SVG Icon Helper
  const renderGoogleIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  );

  return (
    <div className="nishchit-landing-view">
      <section className="landing-split-hero-container">
        {/* LEFT COLUMN: Static Campus Media Column & Trust Narrative */}
        <div className="hero-media-column">
          <div className="hero-media-top-brand">
            <NishchitLogo variant="header" size={40} />
            <div className="hero-brand-accent-line" />
          </div>

          <div className="hero-media-content">
            <h1 className="hero-media-title">
              More than
              <br />
              transport.
              <br />
              <span className="accent-blue-text">A safer tomorrow.</span>
            </h1>

            <div className="hero-media-divider">—</div>

            <p className="hero-media-description">
              Nishchit connects schools, drivers and families to make every journey safer, simpler and more transparent.
            </p>

            <div className="hero-media-divider">—</div>

            <div className="hero-pillars-row">
              <div className="hero-pillar-item">
                <Shield size={18} color="#334155" strokeWidth={2} />
                <span>Safer Students</span>
              </div>

              <div className="hero-pillar-item">
                <Users size={18} color="#334155" strokeWidth={2} />
                <span>Stronger Communities</span>
              </div>

              <div className="hero-pillar-item">
                <TrendingUp size={18} color="#334155" strokeWidth={2} />
                <span>Brighter Futures</span>
              </div>
            </div>
          </div>

          <div className="hero-bottom-glass-pill">
            <div className="pill-avatar-icon">
              <Users size={16} color="#38BDF8" />
            </div>
            <div className="pill-text">
              <strong>Children today.</strong>
              <span>A more certain tomorrow.</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Persistent Authentication Panel */}
        <div className="hero-portal-column">
          <div className="hero-ambient-top-right">
            <span>SCHOOLS</span>
            <span>PEOPLE</span>
            <span>PLACES</span>
            <span>CONNECTED</span>
            <span className="dash">—</span>
          </div>

          <div className="hero-ambient-bottom-right">
            <span className="dash">—</span>
            <span>A SAFER</span>
            <span>BRIGHTER</span>
            <span>TOMORROW</span>
          </div>

          {/* SINGLE PERSISTENT CARD: Only inner content transitions */}
          <div className="portal-selector-card">
            {/* Top Back Button (Only visible inside sub-views) */}
            {activePortal && (
              <button
                type="button"
                onClick={handleBackToSelector}
                className="portal-card-back-btn"
                aria-label="Back to portal selection"
              >
                <ArrowLeft size={15} />
                <span>Back to portal selection</span>
              </button>
            )}

            {/* Brand Logo inside Card */}
            <div className="portal-card-logo-wrap">
              <NishchitLogo variant="card" size={44} />
              <div className="portal-card-accent-bar" />
            </div>

            {/* Error Message Banner */}
            {error && (
              <div className="portal-error-banner" role="alert">
                <AlertCircle size={17} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{error}</span>
              </div>
            )}

            {/* =========================================================
                VIEW 1: PORTAL SELECTOR (Default)
                ========================================================= */}
            {!activePortal && (
              <>
                <div className="portal-card-heading">
                  <h2>Welcome to Nishchit</h2>
                  <p>Choose your portal to continue</p>
                </div>

                <div className="portal-options-list">
                  {/* Choice 1: Parent / Guardian */}
                  <div
                    className="portal-option-card parent"
                    onClick={() => handleSelectPortal('parent', '/parent/login')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleSelectPortal('parent', '/parent/login')}
                  >
                    <div className="portal-option-icon blue">
                      <Users size={22} color="#2563EB" />
                    </div>
                    <div className="portal-option-details">
                      <h3>Parent / Guardian</h3>
                      <p>Track your child's bus journey</p>
                    </div>
                    <div className="portal-option-arrow">
                      <ArrowRight size={18} />
                    </div>
                  </div>

                  {/* Choice 2: Driver */}
                  <div
                    className="portal-option-card driver"
                    onClick={() => handleSelectPortal('driver', '/driver/login')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleSelectPortal('driver', '/driver/login')}
                  >
                    <div className="portal-option-icon green">
                      <Bus size={22} color="#059669" />
                    </div>
                    <div className="portal-option-details">
                      <h3>Driver</h3>
                      <p>Operate your assigned trip</p>
                    </div>
                    <div className="portal-option-arrow">
                      <ArrowRight size={18} />
                    </div>
                  </div>

                  {/* Choice 3: Transport Admin */}
                  <div
                    className="portal-option-card admin"
                    onClick={() => handleSelectPortal('admin', '/institution/login')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleSelectPortal('admin', '/institution/login')}
                  >
                    <div className="portal-option-icon amber">
                      <Building2 size={22} color="#D97706" />
                    </div>
                    <div className="portal-option-details">
                      <h3>Transport Admin</h3>
                      <p>Manage school &amp; college transport</p>
                    </div>
                    <div className="portal-option-arrow">
                      <ArrowRight size={18} />
                    </div>
                  </div>
                </div>

                <div className="portal-card-trust-footer">
                  <ShieldCheck size={16} color="#64748B" />
                  <span>Trusted journeys. Brighter futures.</span>
                </div>

                <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #F1F5F9', textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => handleSelectPortal('platform_admin', '/platform-admin/login')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#94A3B8',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'color 150ms ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#475569'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#94A3B8'}
                  >
                    <Shield size={13} color="currentColor" />
                    <span>Platform Operator &amp; Verification Console ›</span>
                  </button>
                </div>
              </>
            )}

            {/* =========================================================
                VIEW 2: PARENT AUTHENTICATION & STUDENT ONBOARDING
                ========================================================= */}
            {activePortal === 'parent' && (
              <>
                <div style={{ marginBottom: '14px' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    background: '#EFF6FF',
                    color: '#2563EB',
                    fontSize: '0.78rem',
                    fontWeight: 700
                  }}>
                    <Users size={13} />
                    <span>Parent / Guardian Portal</span>
                  </span>
                </div>

                {/* Sub-state: Signed in with Google, but needs student/transport linking */}
                {currentUser && currentUser.role === 'parent' && (currentUser.needsStudentLink || !currentUser.busId) ? (
                  <form onSubmit={handleSaveParentStudent}>
                    <div className="portal-card-heading">
                      <h2 style={{ fontSize: '1.25rem' }}>Link Child's Transport</h2>
                      <p style={{ fontSize: '0.82rem', marginBottom: '16px' }}>
                        Connect your account to an active school/college bus route.
                      </p>
                    </div>

                    <div className="portal-form-grid">
                      <div className="portal-field">
                        <label>Parent / Guardian Name</label>
                        <input
                          type="text"
                          required
                          value={parentForm.parentName}
                          onChange={(e) => setParentForm(prev => ({ ...prev, parentName: e.target.value }))}
                          placeholder="e.g. Priya Sharma"
                        />
                      </div>

                      <div className="portal-field">
                        <label>Student / Child Full Name</label>
                        <input
                          type="text"
                          required
                          value={parentForm.studentName}
                          onChange={(e) => setParentForm(prev => ({ ...prev, studentName: e.target.value }))}
                          placeholder="e.g. Aarav Sharma"
                        />
                      </div>

                      <div className="portal-field">
                        <label>Educational Institution</label>
                        <select
                          value={parentForm.institutionId}
                          onChange={(e) => setParentForm(prev => ({ ...prev, institutionId: e.target.value }))}
                        >
                          {institutesList.map(inst => (
                            <option key={inst.id || inst.instituteId} value={inst.id || inst.instituteId}>
                              {inst.name} ({inst.city || inst.district})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="portal-field">
                        <label>Designated Boarding Stop</label>
                        <input
                          type="text"
                          required
                          value={parentForm.stopName}
                          onChange={(e) => setParentForm(prev => ({ ...prev, stopName: e.target.value }))}
                          placeholder="e.g. Siripuram Circle"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="portal-submit-btn"
                    >
                      {loading ? 'Connecting Bus...' : 'Connect My Child\'s Bus'}
                    </button>
                  </form>
                ) : (
                  /* Standard Parent Sign-In with Google */
                  <>
                    <div className="portal-card-heading">
                      <h2>Parent Sign In</h2>
                      <p>Real-time fleet tracking, verified student transit, and safety alerts.</p>
                    </div>

                    <button
                      type="button"
                      onClick={handleParentGoogleSignIn}
                      disabled={loading}
                      className="google-auth-btn"
                    >
                      {renderGoogleIcon()}
                      <span>{loading ? 'Connecting to Google...' : 'Continue with Google'}</span>
                    </button>

                    <div className="portal-demo-divider">
                      <span>or test offline</span>
                    </div>

                    <div className="portal-demo-box">
                      <div className="portal-demo-title">🧪 Offline Evaluation Mode</div>
                      <button
                        type="button"
                        onClick={handleDemoParentLogin}
                        disabled={loading}
                        className="portal-demo-btn"
                      >
                        <span>Demo Parent: Priya Sharma (AU)</span>
                        <ArrowRight size={14} color="#64748B" />
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {/* =========================================================
                VIEW 3: DRIVER AUTHENTICATION & VERIFICATION PIPELINE
                ========================================================= */}
            {activePortal === 'driver' && (
              <>
                <div style={{ marginBottom: '14px' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    background: '#ECFDF5',
                    color: '#059669',
                    fontSize: '0.78rem',
                    fontWeight: 700
                  }}>
                    <Bus size={13} />
                    <span>Driver Operating Portal</span>
                  </span>
                </div>

                {/* Sub-state A: New driver needs commercial license registration */}
                {currentUser && currentUser.role === 'driver' && (currentUser.needsDriverRegistration || currentUser.status === 'unregistered') ? (
                  <form onSubmit={handleSubmitDriverRegistration}>
                    <div className="portal-card-heading">
                      <h2 style={{ fontSize: '1.25rem' }}>Driver Registration</h2>
                      <p style={{ fontSize: '0.82rem', marginBottom: '16px' }}>
                        Submit your commercial heavy license for administrator approval.
                      </p>
                    </div>

                    <div className="portal-form-grid">
                      <div className="portal-field">
                        <label>Full Name</label>
                        <input
                          type="text"
                          required
                          value={driverForm.fullName}
                          onChange={(e) => setDriverForm(prev => ({ ...prev, fullName: e.target.value }))}
                          placeholder="e.g. Suresh Reddy"
                        />
                      </div>

                      <div className="portal-field">
                        <label>Mobile Phone Number</label>
                        <input
                          type="tel"
                          required
                          value={driverForm.phone}
                          onChange={(e) => setDriverForm(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="e.g. +91 98480 12345"
                        />
                      </div>

                      <div className="portal-field">
                        <label>Commercial Driving License Number</label>
                        <input
                          type="text"
                          required
                          value={driverForm.licenceNumber}
                          onChange={(e) => setDriverForm(prev => ({ ...prev, licenceNumber: e.target.value }))}
                          placeholder="e.g. AP31 2020 0012345"
                        />
                      </div>

                      <div className="portal-field">
                        <label>Institution to Work With</label>
                        <select
                          value={driverForm.institutionId}
                          onChange={(e) => setDriverForm(prev => ({ ...prev, institutionId: e.target.value }))}
                        >
                          {institutesList.map(inst => (
                            <option key={inst.id || inst.instituteId} value={inst.id || inst.instituteId}>
                              {inst.name} ({inst.city || inst.district})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="portal-field">
                        <label>Years of Heavy Vehicle Experience</label>
                        <input
                          type="number"
                          min="1"
                          max="40"
                          value={driverForm.experienceYears}
                          onChange={(e) => setDriverForm(prev => ({ ...prev, experienceYears: e.target.value }))}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="portal-submit-btn"
                      style={{ background: '#059669' }}
                    >
                      {loading ? 'Submitting Application...' : 'Submit for Verification'}
                    </button>
                  </form>
                ) : currentUser && currentUser.role === 'driver' && (currentUser.status === 'pending' || currentUser.verificationStatus === 'pending') ? (
                  /* Sub-state B: Application pending review */
                  <div>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: '#FEF3C7',
                      color: '#D97706',
                      margin: '10px auto 14px'
                    }}>
                      <Clock size={26} />
                    </div>

                    <div className="portal-card-heading">
                      <h2 style={{ fontSize: '1.25rem' }}>Verification Submitted</h2>
                      <div style={{ margin: '8px 0' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          background: '#FEF3C7',
                          color: '#B45309',
                          fontWeight: 800,
                          fontSize: '0.78rem'
                        }}>
                          PENDING ADMIN REVIEW
                        </span>
                      </div>
                      <p style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.5 }}>
                        Your driving license and institute application have been submitted to the platform administrator. Access to the Driver Cockpit will be unlocked once approved.
                      </p>
                    </div>

                    <div style={{
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      textAlign: 'left',
                      fontSize: '0.82rem',
                      marginBottom: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}>
                      <div><strong>Driver:</strong> {currentUser.fullName || currentUser.name}</div>
                      <div><strong>License:</strong> {currentUser.licenceNumber || 'Under Review'}</div>
                      <div><strong>Institution:</strong> {currentUser.institutionName || 'Andhra University'}</div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="portal-demo-btn"
                        style={{ justifyContent: 'center', gap: '6px' }}
                      >
                        <RefreshCw size={14} />
                        <span>Refresh Status</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => logout()}
                        className="portal-demo-btn"
                        style={{ justifyContent: 'center', gap: '6px', color: '#DC2626' }}
                      >
                        <LogOut size={14} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                ) : currentUser && currentUser.role === 'driver' && currentUser.status === 'rejected' ? (
                  /* Sub-state C: Application rejected */
                  <div>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: '#FEE2E2',
                      color: '#DC2626',
                      margin: '10px auto 14px'
                    }}>
                      <AlertCircle size={26} />
                    </div>

                    <div className="portal-card-heading">
                      <h2 style={{ fontSize: '1.25rem' }}>Verification Not Approved</h2>
                      <div style={{ margin: '8px 0' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          background: '#FEE2E2',
                          color: '#DC2626',
                          fontWeight: 800,
                          fontSize: '0.78rem'
                        }}>
                          REJECTED
                        </span>
                      </div>
                      <p style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.5 }}>
                        Reason: {currentUser.rejectionReason || 'Commercial credentials could not be validated.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => updateCurrentUserProfile({ needsDriverRegistration: true, status: 'unregistered' })}
                      className="portal-submit-btn"
                    >
                      Re-apply with Correct Details
                    </button>
                  </div>
                ) : (
                  /* Standard Driver Sign-In with Google */
                  <>
                    <div className="portal-card-heading">
                      <h2>Driver Sign In</h2>
                      <p>Access your verified cockpit, assigned route, and live GPS telemetry.</p>
                    </div>

                    <button
                      type="button"
                      onClick={handleDriverGoogleSignIn}
                      disabled={loading}
                      className="google-auth-btn"
                    >
                      {renderGoogleIcon()}
                      <span>{loading ? 'Connecting to Google...' : 'Continue with Google'}</span>
                    </button>

                    <div className="portal-demo-divider">
                      <span>or test offline</span>
                    </div>

                    <div className="portal-demo-box">
                      <div className="portal-demo-title">🧪 Offline Evaluation Mode</div>
                      <button
                        type="button"
                        onClick={() => handleDemoDriverLogin('DRV-SURESH-REDDY')}
                        disabled={loading}
                        className="portal-demo-btn"
                      >
                        <span>Demo Cockpit: Suresh Reddy (Bus AU01)</span>
                        <ArrowRight size={14} color="#64748B" />
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {/* =========================================================
                VIEW 4: TRANSPORT ADMIN DESK (School/College Transport)
                ========================================================= */}
            {activePortal === 'admin' && (
              <>
                <div style={{ marginBottom: '14px' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    background: '#FEF3C7',
                    color: '#B45309',
                    fontSize: '0.78rem',
                    fontWeight: 700
                  }}>
                    <Building2 size={13} />
                    <span>Transport Admin Desk</span>
                  </span>
                </div>

                <div className="portal-card-heading">
                  <h2>Administrator Sign In</h2>
                  <p>Fleet dispatch, driver verification review, and corridor route control.</p>
                </div>

                <form onSubmit={handleAdminSignIn}>
                  <div className="portal-form-grid">
                    <div className="portal-field">
                      <label>Admin ID</label>
                      <input
                        type="text"
                        required
                        value={adminId}
                        onChange={(e) => setAdminId(e.target.value)}
                      />
                    </div>

                    <div className="portal-field">
                      <label>Password</label>
                      <input
                        type="password"
                        required
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="portal-submit-btn"
                    style={{ background: '#D97706' }}
                  >
                    {loading ? 'Authenticating...' : 'Enter Transport Desk'}
                  </button>
                </form>

                <div className="portal-demo-divider">
                  <span>or instant demo desk</span>
                </div>

                <div className="portal-demo-box">
                  <button
                    type="button"
                    onClick={handleDemoInstitutionLogin}
                    disabled={loading}
                    className="portal-demo-btn"
                  >
                    <span>🏫 Demo Desk: Andhra University</span>
                    <ArrowRight size={14} color="#64748B" />
                  </button>
                </div>
              </>
            )}

            {/* =========================================================
                VIEW 5: PLATFORM OPERATOR CONSOLE
                ========================================================= */}
            {activePortal === 'platform_admin' && (
              <>
                <div style={{ marginBottom: '14px' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    background: '#F1F5F9',
                    color: '#475569',
                    fontSize: '0.78rem',
                    fontWeight: 700
                  }}>
                    <Shield size={13} />
                    <span>Platform Operator Console</span>
                  </span>
                </div>

                <div className="portal-card-heading">
                  <h2>Platform Operator</h2>
                  <p>Corridor health auditing, driver licensing verification, and fleet telemetry.</p>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    setLoading(true);
                    try {
                      await loginAsPlatformAdmin();
                      navigate('/platform-admin/dashboard', { replace: true });
                    } catch (e) {
                      setError('Could not start platform admin session.');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="portal-submit-btn"
                  style={{ background: '#0F172A' }}
                >
                  {loading ? 'Authenticating...' : 'Enter Platform Operator Console'}
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* OPERATIONAL CORRIDOR OVERVIEW */}
      <section className="landing-section works-section">
        <div className="section-header-block">
          <span className="section-kicker">Operational Lifecycle</span>
          <h2>How Nishchit Works</h2>
          <p>One unified transportation lifecycle connecting three critical participants.</p>
        </div>

        <div className="lifecycle-grid">
          <div className="lifecycle-step-card">
            <div className="step-number-badge">1</div>
            <div className="step-icon-circle blue">
              <Building2 size={24} color="#2563EB" />
            </div>
            <h3>Transport Admin Configures</h3>
            <p>
              The transport desk verifies commercial driver credentials, manages corridor vehicles, maps official route stops, and assigns operating schedules.
            </p>
            <div className="step-footer-tag">Step 1 · Authorization</div>
          </div>

          <div className="lifecycle-step-card">
            <div className="step-number-badge">2</div>
            <div className="step-icon-circle green">
              <Bus size={24} color="#16A34A" />
            </div>
            <h3>Driver Operates the Trip</h3>
            <p>
              The verified driver logs into the mobile cockpit, inspects scheduled stops, and starts the trip. The driver's device streams real hardware GPS telemetry.
            </p>
            <div className="step-footer-tag">Step 2 · Operation</div>
          </div>

          <div className="lifecycle-step-card">
            <div className="step-number-badge">3</div>
            <div className="step-icon-circle blue">
              <Users size={24} color="#2563EB" />
            </div>
            <h3>Parent Observes with Certainty</h3>
            <p>
              Parents observe the authentic bus position on Google Maps with live ETA and freshness indicators. No student smartphone is ever required.
            </p>
            <div className="step-footer-tag">Step 3 · Reassurance</div>
          </div>
        </div>
      </section>

      {/* CORRIDOR COVERAGE */}
      <section className="landing-section corridor-section">
        <div className="corridor-content-layout">
          <div className="corridor-text-block">
            <span className="section-kicker">Active Operating Corridor</span>
            <h2>Vizianagaram — Thagarapuvalasa — Visakhapatnam</h2>
            <p>
              Nishchit is architected specifically for educational institutions across northern Andhra Pradesh, linking engineering colleges, universities, and residential schools.
            </p>

            <div className="corridor-campuses-list">
              <div className="campus-item">
                <CheckCircle2 size={18} color="#16A34A" />
                <span>Andhra University (Siripuram &amp; Uplands Campus)</span>
              </div>
              <div className="campus-item">
                <CheckCircle2 size={18} color="#16A34A" />
                <span>GITAM University (Rushikonda Campus)</span>
              </div>
              <div className="campus-item">
                <CheckCircle2 size={18} color="#16A34A" />
                <span>MVGR College of Engineering (Chintalavalasa)</span>
              </div>
            </div>
          </div>

          <div className="corridor-stats-card">
            <div className="stat-row">
              <div className="stat-box">
                <strong className="stat-number">65+ km</strong>
                <span className="stat-label">Corridor Highway Length</span>
              </div>
              <div className="stat-box">
                <strong className="stat-number">100%</strong>
                <span className="stat-label">Authentic Device GPS</span>
              </div>
            </div>
            <div className="stat-divider" />
            <div className="stat-row">
              <div className="stat-box">
                <strong className="stat-number">0</strong>
                <span className="stat-label">Simulated Coordinates</span>
              </div>
              <div className="stat-box">
                <strong className="stat-number">24/7</strong>
                <span className="stat-label">Safety Desk Reachability</span>
              </div>
            </div>
            <div className="stat-note">
              Dedicated institutional transit monitoring across NH16 &amp; SH39.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
