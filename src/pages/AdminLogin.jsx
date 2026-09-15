import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NishchitLogo from '../components/NishchitLogo';
import PostLoginTransition from '../components/PostLoginTransition';
import { Building2, AlertCircle, ArrowLeft } from 'lucide-react';

export default function AdminLogin() {
  const { currentUser, loginAsAdminHackathon } = useAuth();
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (currentUser && !showSuccess) {
      if (currentUser.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (currentUser.role === 'driver') {
        navigate('/driver/dashboard', { replace: true });
      } else if (currentUser.role === 'parent') {
        navigate('/parent/dashboard', { replace: true });
      }
    }
  }, [currentUser, navigate, showSuccess]);

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
      await loginAsAdminHackathon(cleanId, cleanPass);
      setShowSuccess(true);
    } catch (err) {
      setError('Incorrect administrator ID or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (showSuccess) {
    return <PostLoginTransition onFinish={() => navigate('/admin/dashboard', { replace: true })} />;
  }

  return (
    <div className="auth-card">
      {/* Brand Header */}
      <div className="auth-card-top">
        <NishchitLogo variant="card" size={46} />
        
        <div className="auth-role-pill admin">
          <Building2 size={14} />
          <span>Transport Admin</span>
        </div>

        <h1 className="auth-heading">Transport Admin</h1>
        <p className="auth-subheading">Sign in to manage school &amp; college transport.</p>
      </div>

      {error && (
        <div className="auth-error-banner" role="alert">
          <AlertCircle size={16} className="auth-error-icon" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <div className="auth-field-group">
          <label htmlFor="adminId">Administrator ID</label>
          <input
            id="adminId"
            type="text"
            required
            autoComplete="username"
            placeholder="Enter admin ID"
            value={adminId}
            onChange={(e) => setAdminId(e.target.value)}
            className="auth-input"
            autoFocus
          />
        </div>

        <div className="auth-field-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="auth-btn-primary"
        >
          {loading ? 'Verifying credentials...' : 'Sign in'}
        </button>

        <div className="auth-back-row">
          <Link to="/" className="auth-back-link">
            <ArrowLeft size={14} />
            <span>Back to portal selection</span>
          </Link>
        </div>
      </form>
    </div>
  );
}
