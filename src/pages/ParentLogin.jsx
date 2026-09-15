import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NishchitLogo from '../components/NishchitLogo';
import PostLoginTransition from '../components/PostLoginTransition';
import { Users, AlertCircle, ArrowRight, ShieldCheck, ArrowLeft } from 'lucide-react';
import { REGISTERED_INSTITUTIONS, INITIAL_VEHICLES } from '../data/regionData';
import { subscribeBuses, saveStudentAssociation } from '../services/transportService';
import { formatAuthError } from '../utils/authHelper';

export default function ParentLogin() {
  const { currentUser, loginWithGoogle, loginAsDemoParent, updateCurrentUserProfile } = useAuth();
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);

  // If already authenticated, navigate to dashboard
  useEffect(() => {
    if (currentUser && !showSuccess) {
      if (currentUser.role === 'parent') {
        navigate('/parent/dashboard', { replace: true });
      } else if (currentUser.role === 'driver') {
        navigate('/driver/dashboard', { replace: true });
      } else if (currentUser.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      }
    }
  }, [currentUser, navigate, showSuccess]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fleetList, setFleetList] = useState([]);

  // First-time optional onboarding
  const isAwaitingStudentDetails = currentUser && currentUser.role === 'parent' && !currentUser.studentName && !currentUser.childName;
  const [parentName, setParentName] = useState(currentUser?.fullName || currentUser?.name || '');
  const [studentName, setStudentName] = useState('');
  const [studentRollNo, setStudentRollNo] = useState('');
  const [institutionId, setInstitutionId] = useState('INST-GITAM');
  const [stopName, setStopName] = useState('MVP Colony');
  const [assignedBusId, setAssignedBusId] = useState('');

  useEffect(() => {
    const unsub = subscribeBuses((buses) => {
      setFleetList(buses);
      if (buses.length > 0 && !assignedBusId) {
        setAssignedBusId(buses[0].id);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (currentUser?.fullName || currentUser?.name) {
      setParentName(currentUser.fullName || currentUser.name);
    }
  }, [currentUser]);

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle('parent');
      setShowSuccess(true);
    } catch (err) {
      console.error('Parent sign-in error:', err);
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoParentSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      if (loginAsDemoParent) {
        await loginAsDemoParent();
      }
      setShowSuccess(true);
    } catch (err) {
      console.error('Demo parent login error:', err);
      setError('Could not start demo parent session.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteStudentSetup = async (e) => {
    e.preventDefault();
    if (!studentName.trim() || !studentRollNo.trim()) {
      setError('Please enter student name and roll or ID number.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const inst = REGISTERED_INSTITUTIONS.find(i => i.id === institutionId) || REGISTERED_INSTITUTIONS[0];
      const availableBuses = fleetList.length > 0 ? fleetList : INITIAL_VEHICLES;
      const selectedBus = availableBuses.find(b => b.id === assignedBusId) || null;

      await updateCurrentUserProfile({
        name: parentName || currentUser?.name || 'Parent',
        fullName: parentName || currentUser?.name || 'Parent',
        studentName: studentName.trim(),
        childName: studentName.trim(),
        studentRollNo: studentRollNo.trim(),
        institutionId,
        institutionName: inst?.name || 'Institution',
        stopName: stopName.trim(),
        busId: selectedBus ? (selectedBus.id || selectedBus.busId || null) : null,
        busNumber: selectedBus ? (selectedBus.busNumber || selectedBus.number || null) : null,
        routeId: selectedBus ? (selectedBus.routeId || null) : null,
        routeName: selectedBus ? (selectedBus.routeName || selectedBus.route || null) : null,
        role: 'parent',
        status: 'active',
        verificationStatus: 'approved'
      });

      if (currentUser?.uid) {
        await saveStudentAssociation({
          parentId: currentUser.uid,
          parentEmail: currentUser.email,
          parentName: parentName || currentUser.name || 'Parent',
          name: studentName.trim(),
          rollNo: studentRollNo.trim(),
          institutionId,
          institutionName: inst?.name || 'Institution',
          stopName: stopName.trim(),
          busId: selectedBus ? (selectedBus.id || selectedBus.busId || null) : null,
          routeId: selectedBus ? (selectedBus.routeId || null) : null
        });
      }

      setShowSuccess(true);
    } catch (err) {
      console.error('Student setup error:', err);
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  if (showSuccess) {
    return <PostLoginTransition onFinish={() => navigate('/parent/dashboard', { replace: true })} />;
  }

  return (
    <div className="auth-card">
      {/* Brand Header */}
      <div className="auth-card-top">
        <NishchitLogo variant="card" size={46} />
        
        <div className="auth-role-pill parent">
          <Users size={14} />
          <span>Parent / Guardian</span>
        </div>

        <h1 className="auth-heading">
          {isAwaitingStudentDetails ? 'Link your child' : 'Welcome back.'}
        </h1>
        <p className="auth-subheading">
          {isAwaitingStudentDetails
            ? "Connect your student's school or college bus route."
            : "Sign in to view your child's bus journey."}
        </p>
      </div>

      {error && (
        <div className="auth-error-banner" role="alert">
          <AlertCircle size={16} className="auth-error-icon" />
          <span>{error}</span>
        </div>
      )}

      {isAwaitingStudentDetails ? (
        /* Student Association Form */
        <form onSubmit={handleCompleteStudentSetup} className="auth-form" noValidate>
          <div className="auth-field-group">
            <label htmlFor="parentName">Parent / Guardian Full Name</label>
            <input
              id="parentName"
              type="text"
              required
              autoComplete="name"
              placeholder="e.g. Suresh Varma"
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              className="auth-input"
            />
          </div>

          <div className="auth-field-row">
            <div className="auth-field-group">
              <label htmlFor="studentName">Student Full Name</label>
              <input
                id="studentName"
                type="text"
                required
                placeholder="e.g. Aarav Varma"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="auth-input"
              />
            </div>

            <div className="auth-field-group">
              <label htmlFor="studentRollNo">Roll or ID Number</label>
              <input
                id="studentRollNo"
                type="text"
                required
                placeholder="e.g. 22331A0589"
                value={studentRollNo}
                onChange={(e) => setStudentRollNo(e.target.value)}
                className="auth-input"
              />
            </div>
          </div>

          <div className="auth-field-group">
            <label htmlFor="institutionId">Educational Institution</label>
            <select
              id="institutionId"
              value={institutionId}
              onChange={(e) => setInstitutionId(e.target.value)}
              className="auth-select"
            >
              {REGISTERED_INSTITUTIONS.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name} ({inst.district})
                </option>
              ))}
            </select>
          </div>

          <div className="auth-field-group">
            <label htmlFor="stopName">Designated Boarding Stop</label>
            <input
              id="stopName"
              type="text"
              required
              placeholder="e.g. Mayuri Junction / Balaji Nagar"
              value={stopName}
              onChange={(e) => setStopName(e.target.value)}
              className="auth-input"
            />
          </div>

          <div className="auth-field-group">
            <label htmlFor="assignedBusId">Assigned Corridor Bus</label>
            <select
              id="assignedBusId"
              value={assignedBusId}
              onChange={(e) => setAssignedBusId(e.target.value)}
              className="auth-select"
            >
              {(fleetList.length > 0 ? fleetList : INITIAL_VEHICLES).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.busNumber || v.number || v.id} — {v.routeName || v.route || 'Route'}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="auth-btn-primary"
          >
            {loading ? 'Saving student link...' : 'Complete Setup & View Bus'}
            <ArrowRight size={16} />
          </button>
        </form>
      ) : (
        /* Standard Google Authentication */
        <div className="auth-action-section">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="auth-btn-google"
            aria-label="Continue with Google"
          >
            {loading ? (
              <div className="auth-spinner" aria-hidden="true" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" className="google-icon" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            )}
            <span>{loading ? 'Connecting to Google...' : 'Continue with Google'}</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', margin: '14px 0', gap: '8px', color: '#94a3b8', fontSize: '11px', fontWeight: 600 }}>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            <span>OR INSTANT DEMO</span>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          </div>

          <button
            type="button"
            onClick={handleDemoParentSignIn}
            disabled={loading}
            className="auth-btn-secondary"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '11px 16px',
              borderRadius: '10px',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              color: '#1e293b',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <ShieldCheck size={16} color="#0284c7" />
            <span>Demo: Explore GITAM → MVP Colony Journey</span>
          </button>

          <p className="auth-supporting-text">
            Your account only shows transport information connected to your child.
          </p>

          <div className="auth-back-row">
            <Link to="/" className="auth-back-link">
              <ArrowLeft size={14} />
              <span>Back to portal selection</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
