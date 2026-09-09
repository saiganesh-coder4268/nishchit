import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, AlertCircle, ArrowRight, Building2, Lock } from 'lucide-react';

export default function AdminLogin() {
  const { currentUser, loginWithCredentials, quickDemoLogin } = useAuth();
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

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginWithCredentials(email, password, 'admin');
      navigate('/admin/dashboard');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please verify admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    quickDemoLogin('admin');
    navigate('/admin/dashboard');
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        
        <div className="portal-badge-banner admin">
          <ShieldCheck size={18} />
          <span>TRANSPORT CONTROLLER & ADMIN DESK</span>
        </div>

        <div className="auth-header">
          <h1>Transport Authority Sign In</h1>
          <p>Corridor Fleet Control, Driver Approvals & Route Management</p>
        </div>

        {/* Demo Fast-Track Box */}
        <div className="auth-demo-box">
          <div className="demo-box-content">
            <span className="demo-badge">Transport Officer Demo</span>
            <strong>K. Ramakrishna • Chief Transport Officer</strong>
          </div>

          <button
            type="button"
            onClick={handleDemoLogin}
            className="btn btn-outline btn-sm"
          >
            Instant Admin Access <ArrowRight size={14} />
          </button>
        </div>

        {error && (
          <div className="auth-error-banner">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
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
            {loading ? 'Verifying Credentials...' : 'Sign In as Transport Administrator'}
          </button>
        </form>

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
