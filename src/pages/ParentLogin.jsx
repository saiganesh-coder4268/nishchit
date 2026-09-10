import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserCheck, AlertCircle, Building2, MapPin, Bus, ArrowRight } from 'lucide-react';
import { REGISTERED_INSTITUTIONS, INITIAL_VEHICLES } from '../data/regionData';
import { formatAuthError } from '../utils/authHelper';

export default function ParentLogin() {
  const { currentUser, loginWithGoogle, updateCurrentUserProfile } = useAuth();
  const navigate = useNavigate();

  // If user is already logged in as parent and has student data, go to dashboard
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'parent') {
        const hasStudentInfo = currentUser.studentName || currentUser.childName;
        if (hasStudentInfo) {
          navigate('/parent/dashboard', { replace: true });
        }
      } else if (currentUser.role === 'driver') {
        navigate('/driver/dashboard', { replace: true });
      } else if (currentUser.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      }
    }
  }, [currentUser, navigate]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // First-time onboarding / student association state
  const isAwaitingStudentDetails = currentUser && currentUser.role === 'parent' && !currentUser.studentName && !currentUser.childName;
  const [parentName, setParentName] = useState(currentUser?.fullName || currentUser?.name || '');
  const [studentName, setStudentName] = useState('');
  const [studentRollNo, setStudentRollNo] = useState('');
  const [institutionId, setInstitutionId] = useState('INST-MVGR');
  const [stopName, setStopName] = useState('Mayuri Junction / Balaji Nagar');
  const [assignedBusId, setAssignedBusId] = useState('BUS-24');

  useEffect(() => {
    if (currentUser?.fullName || currentUser?.name) {
      setParentName(currentUser.fullName || currentUser.name);
    }
  }, [currentUser]);

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const user = await loginWithGoogle('parent');
      if (user?.studentName || user?.childName) {
        navigate('/parent/dashboard');
      }
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteStudentSetup = async (e) => {
    e.preventDefault();
    if (!studentName.trim() || !studentRollNo.trim()) {
      setError('Please provide student name and roll/ID number.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const inst = REGISTERED_INSTITUTIONS.find(i => i.id === institutionId) || REGISTERED_INSTITUTIONS[0];
      const selectedBus = INITIAL_VEHICLES.find(b => b.id === assignedBusId) || INITIAL_VEHICLES[0];

      await updateCurrentUserProfile({
        name: parentName || currentUser?.name || 'Parent',
        fullName: parentName || currentUser?.name || 'Parent',
        studentName: studentName.trim(),
        childName: studentName.trim(),
        studentRollNo: studentRollNo.trim(),
        institutionId,
        institutionName: inst.name,
        stopName: stopName.trim(),
        busId: selectedBus.id,
        busNumber: selectedBus.busNumber,
        routeId: selectedBus.routeId,
        routeName: selectedBus.routeName,
        role: 'parent',
        status: 'active',
        verificationStatus: 'approved'
      });

      navigate('/parent/dashboard');
    } catch (err) {
      console.error('Student setup error:', err);
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        
        <div className="portal-badge-banner parent">
          <UserCheck size={18} />
          <span>PARENT &amp; GUARDIAN PORTAL</span>
        </div>

        {/* If user just signed in with Google and needs to link child */}
        {isAwaitingStudentDetails ? (
          <div>
            <div className="auth-header">
              <h1>Link Your Child</h1>
              <p>Associate your account with your student's school/college bus run.</p>
            </div>

            {error && (
              <div className="auth-error-banner">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCompleteStudentSetup} className="auth-form">
              <div className="form-group">
                <label>Parent / Guardian Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suresh Varma"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Student / Child Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarav Varma"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Student ID / Roll Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 22331A0589"
                    value={studentRollNo}
                    onChange={(e) => setStudentRollNo(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Educational Institution</label>
                <select value={institutionId} onChange={(e) => setInstitutionId(e.target.value)}>
                  {REGISTERED_INSTITUTIONS.map(inst => (
                    <option key={inst.id} value={inst.id}>{inst.name} ({inst.district})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Assigned Boarding Stop</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mayuri Junction / Balaji Nagar"
                  value={stopName}
                  onChange={(e) => setStopName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Assigned Corridor Bus</label>
                <select value={assignedBusId} onChange={(e) => setAssignedBusId(e.target.value)}>
                  {INITIAL_VEHICLES.map(v => (
                    <option key={v.id} value={v.id}>{v.busNumber} — {v.routeName}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-full btn-hero"
              >
                {loading ? 'Saving Profile...' : 'Complete Setup & Enter Live Tracking'} <ArrowRight size={16} />
              </button>
            </form>
          </div>
        ) : (
          /* Standard Parent Google Sign-In */
          <div>
            <div className="auth-header">
              <h1>Parent Sign In</h1>
              <p>Real-time school &amp; college bus tracking for parents.</p>
            </div>

            {error && (
              <div className="auth-error-banner">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="auth-google-box" style={{ padding: '16px 0 8px 0' }}>
              <p style={{ color: '#667085', fontSize: '0.92rem', marginBottom: '20px', lineHeight: '1.5' }}>
                Sign in securely with your verified Google account to view real-time vehicle status, route stops, and driver location.
              </p>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="btn btn-google btn-full"
                style={{ height: '48px', fontSize: '1rem', fontWeight: 600 }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" className="google-icon">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                {loading ? 'Connecting with Google...' : 'Continue with Google'}
              </button>
            </div>

            <div className="auth-feature-notes" style={{ marginTop: '24px', padding: '16px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.82rem', color: '#475569' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Bus size={15} color="#2563EB" />
                <strong style={{ color: '#0F172A' }}>Honest Transportation Tracking</strong>
              </div>
              <p style={{ margin: 0, lineHeight: 1.4 }}>
                Nishchit streams only real driver device location during active trips. No simulated movement or invented arrival times.
              </p>
            </div>
          </div>
        )}

        <div className="portal-switcher-footer">
          <span>Looking for another portal?</span>
          <div className="switcher-links">
            <Link to="/driver/login">Driver Portal</Link>
            <span>•</span>
            <Link to="/admin/login">Admin Transport Desk</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
