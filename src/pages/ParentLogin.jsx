import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserCheck, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { REGISTERED_INSTITUTIONS } from '../data/regionData';

export default function ParentLogin() {
  const { currentUser, loginWithCredentials, loginWithGoogle, signupWithCredentials, quickDemoLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'parent') {
        navigate('/parent/dashboard', { replace: true });
      } else if (currentUser.role === 'driver') {
        navigate('/driver/dashboard', { replace: true });
      } else if (currentUser.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      }
    }
  }, [currentUser, navigate]);

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [parentName, setParentName] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentRollNo, setStudentRollNo] = useState('');
  const [institutionId, setInstitutionId] = useState('INST-MVGR');
  const [stopName, setStopName] = useState('Mayuri Junction / Balaji Nagar');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        const inst = REGISTERED_INSTITUTIONS.find(i => i.id === institutionId) || REGISTERED_INSTITUTIONS[0];
        await signupWithCredentials(email, password, 'parent', {
          name: parentName,
          studentName,
          studentRollNo,
          institutionId,
          institutionName: inst.name,
          busId: 'BUS-24',
          routeId: 'ROUTE-VZ04',
          stopName
        });
      } else {
        await loginWithCredentials(email, password, 'parent');
      }
      navigate('/parent/dashboard');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle('parent');
      navigate('/parent/dashboard');
    } catch (err) {
      setError(err.message || 'Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    quickDemoLogin('parent');
    navigate('/parent/dashboard');
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        
        <div className="portal-badge-banner parent">
          <UserCheck size={18} />
          <span>PARENT & GUARDIAN PORTAL</span>
        </div>

        <div className="auth-header">
          <h1>{isSignUp ? 'Parent Account Registration' : 'Parent Sign In'}</h1>
          <p>Real-time school & college bus tracking for parents.</p>
        </div>

        {/* Demo Fast-Track Box */}
        <div className="auth-demo-box">
          <div className="demo-box-content">
            <span className="demo-badge">Demo Access</span>
            <strong>Parent: Suresh Varma (Aarav • Bus 24)</strong>
          </div>

          <button
            type="button"
            onClick={handleDemoLogin}
            className="btn btn-outline btn-sm"
          >
            Instant Demo Access <ArrowRight size={14} />
          </button>
        </div>

        {error && (
          <div className="auth-error-banner">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {isSignUp && (
            <>
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
                  <label>Student Roll / ID Number</label>
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
            </>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              required
              placeholder="parent@nishchit.app"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-full"
          >
            {loading ? 'Authenticating...' : isSignUp ? 'Create Parent Account' : 'Sign In to Live Tracking'}
          </button>
        </form>

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="btn btn-google btn-full"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" className="google-icon">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          Continue with Google
        </button>

        <div className="auth-toggle-footer">
          {isSignUp ? (
            <p>
              Already registered?{' '}
              <button type="button" onClick={() => setIsSignUp(false)} className="btn-link">
                Sign In
              </button>
            </p>
          ) : (
            <p>
              New parent on the network?{' '}
              <button type="button" onClick={() => setIsSignUp(true)} className="btn-link">
                Register Student & Parent Profile
              </button>
            </p>
          )}
        </div>

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
