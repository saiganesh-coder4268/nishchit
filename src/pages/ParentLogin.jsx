import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle } from 'lucide-react';

export default function ParentLogin() {
  const { currentUser, loginWithCredentials, signupWithCredentials, quickDemoLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'parent') {
        navigate('/parent/dashboard', { replace: true });
      } else {
        navigate('/driver/dashboard', { replace: true });
      }
    }
  }, [currentUser, navigate]);

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signupWithCredentials(email, password, 'parent', {
          name,
          studentName,
          studentClass,
          busId: 'BUS24',
          routeId: 'ROUTE04'
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

  const handleDemoLogin = () => {
    quickDemoLogin('parent');
    navigate('/parent/dashboard');
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-brand-badge">NISHCHIT</div>

        <div className="auth-header">
          <h1>{isSignUp ? 'Parent Registration' : 'Parent Sign In'}</h1>
          <p>Track your child's bus in real time.</p>
        </div>

        {/* Quick Demo Shortcut */}
        <div className="auth-demo-box">
          <div className="demo-box-content">
            <span className="demo-badge">Demo Shortcut</span>
            <strong>Parent: Aarav's Parent</strong>
          </div>

          <button
            type="button"
            onClick={handleDemoLogin}
            className="btn btn-outline btn-sm"
          >
            Instant Demo Login
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
                <label>Parent Name</label>
                <input
                  type="text"
                  required
                  placeholder="Parent Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Student Name</label>
                <input
                  type="text"
                  required
                  placeholder="Child's Full Name"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Student Class</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Class 8-A"
                  value={studentClass}
                  onChange={(e) => setStudentClass(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Email</label>
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
            {loading ? 'Signing In...' : isSignUp ? 'Create Parent Account' : 'Sign In'}
          </button>
        </form>

        <div className="auth-toggle-footer">
          {isSignUp ? (
            <p>
              Already have an account?{' '}
              <button type="button" onClick={() => setIsSignUp(false)} className="btn-link">
                Sign In
              </button>
            </p>
          ) : (
            <p>
              New parent?{' '}
              <button type="button" onClick={() => setIsSignUp(true)} className="btn-link">
                Create Account
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

