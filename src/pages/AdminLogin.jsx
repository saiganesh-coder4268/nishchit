import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, AlertCircle, Lock, Sparkles, Building2 } from 'lucide-react';
import { formatAuthError } from '../utils/authHelper';

export default function AdminLogin() {
  const { currentUser, loginWithCredentials, signupWithCredentials } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (currentUser.role === 'driver') {
        navigate('/driver/dashboard', { replace: true });
      } else if (currentUser.role === 'parent') {
        navigate('/parent/dashboard', { replace: true });
      }
    }
  }, [currentUser, navigate]);

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminName, setAdminName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signupWithCredentials(email, password, 'admin', {
          name: adminName || 'Transport Administrator',
          fullName: adminName || 'Transport Administrator',
          role: 'admin',
          status: 'active',
          verificationStatus: 'approved'
        });
      } else {
        await loginWithCredentials(email, password, 'admin');
      }
      navigate('/admin/dashboard');
    } catch (err) {
      console.error(err);
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        
        <div className="portal-badge-banner admin">
          <ShieldCheck size={18} />
          <span>TRANSPORT CONTROLLER & ADMIN DESK</span>
        </div>

        <div className="auth-header">
          <h1>{isSignUp ? 'Register Transport Controller' : 'Transport Authority Sign In'}</h1>
          <p>Corridor Fleet Control, Driver Approvals & Route Management</p>
        </div>

        {error && (
          <div className="auth-error-banner">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {isSignUp && (
            <div className="form-group">
              <label>Administrator / Officer Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Transport Controller"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label>Admin Work Email</label>
            <input
              type="email"
              required
              placeholder="admin@nishchit.app"
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
            {loading ? 'Verifying Credentials...' : isSignUp ? 'Create Admin Profile' : 'Sign In as Transport Administrator'}
          </button>
        </form>

        <div className="auth-toggle-footer">
          {isSignUp ? (
            <p>
              Already an administrator?{' '}
              <button type="button" onClick={() => setIsSignUp(false)} className="btn-link">
                Sign In
              </button>
            </p>
          ) : (
            <p>
              Setting up new institution admin?{' '}
              <button type="button" onClick={() => setIsSignUp(true)} className="btn-link">
                Create Admin Account
              </button>
            </p>
          )}
        </div>

        <div className="auth-footer-notice">
          <Lock size={14} />
          <span>Authorized institution and corridor transport personnel only.</span>
        </div>

        <div className="portal-switcher-footer">
          <span>Looking for another portal?</span>
          <div className="switcher-links">
            <Link to="/parent/login">Parent Portal</Link>
            <span>•</span>
            <Link to="/driver/login">Driver Portal</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
