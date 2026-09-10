import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, AlertCircle, Lock } from 'lucide-react';

/**
 * TEMPORARY HACKATHON ADMIN ACCESS
 * NOT FOR PRODUCTION
 * 
 * Hackathon credentials:
 * ID: admin123
 * PASSWORD: admin123
 * 
 * Public registration is disabled to enforce role isolation.
 */
export default function AdminLogin() {
  const { currentUser, loginAsAdminHackathon } = useAuth();
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

  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanId = (adminId || '').trim();
    const cleanPass = (password || '').trim();

    if (!cleanId || !cleanPass) {
      setError('Please enter both administrator ID and password.');
      return;
    }

    setLoading(true);

    try {
      // TEMPORARY HACKATHON ADMIN ACCESS - NOT FOR PRODUCTION
      await loginAsAdminHackathon(cleanId, cleanPass);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err?.message || 'Incorrect admin ID or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        
        <div className="portal-badge-banner admin">
          <ShieldCheck size={18} />
          <span>TRANSPORT CONTROLLER &amp; ADMIN DESK</span>
        </div>

        <div className="auth-header">
          <h1>Transport Authority Sign In</h1>
          <p>Corridor Fleet Control, Driver Approvals &amp; Route Scheduling</p>
        </div>

        {error && (
          <div className="auth-error-banner">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Administrator ID</label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. admin123"
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
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
            style={{ height: '46px', fontSize: '1rem', fontWeight: 600 }}
          >
            {loading ? 'Verifying Controller Credentials...' : 'Sign In to Transport Desk'}
          </button>
        </form>

        <div className="auth-footer-notice" style={{ marginTop: '20px', padding: '12px 16px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontSize: '0.82rem' }}>
          <Lock size={14} color="#64748B" />
          <span>Authorized institution and corridor transport personnel only. Public registration is restricted.</span>
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
