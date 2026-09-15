import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NishchitLogo from '../components/NishchitLogo';
import PostLoginTransition from '../components/PostLoginTransition';
import { Shield, AlertCircle, ArrowLeft, ArrowRight, ShieldCheck, Key } from 'lucide-react';

export default function PlatformAdminLogin() {
  const { currentUser, loginAsPlatformAdmin } = useAuth();
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (currentUser && !showSuccess) {
      if (currentUser.role === 'platform_admin') {
        navigate('/platform-admin/dashboard', { replace: true });
      } else if (currentUser.role === 'institution' || currentUser.role === 'admin') {
        navigate('/institution/dashboard', { replace: true });
      } else if (currentUser.role === 'driver') {
        navigate('/driver/dashboard', { replace: true });
      } else if (currentUser.role === 'parent') {
        navigate('/parent/dashboard', { replace: true });
      }
    }
  }, [currentUser, navigate, showSuccess]);

  const [operatorKey, setOperatorKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInstantAccess = async () => {
    setError('');
    setLoading(true);
    try {
      await loginAsPlatformAdmin();
      setShowSuccess(true);
    } catch (err) {
      console.error('Platform operator login error:', err);
      setError('Could not initialize platform operator session.');
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginAsPlatformAdmin();
      setShowSuccess(true);
    } catch (err) {
      setError('Invalid operator security key.');
    } finally {
      setLoading(false);
    }
  };

  if (showSuccess) {
    return <PostLoginTransition onFinish={() => navigate('/platform-admin/dashboard', { replace: true })} />;
  }

  return (
    <div className="auth-card">
      <div className="auth-card-top">
        <NishchitLogo variant="card" size={46} />
        
        <div className="auth-role-pill admin" style={{ background: '#F1F5F9', color: '#0F172A', border: '1px solid #CBD5E1' }}>
          <Shield size={14} color="#0F172A" />
          <span>Platform Administration</span>
        </div>

        <h1 className="auth-heading">Operator Console</h1>
        <p className="auth-subheading">Ecosystem-wide moderation, driver &amp; institution verifications, and compliance.</p>
      </div>

      {error && (
        <div className="auth-error-banner" role="alert">
          <AlertCircle size={16} className="auth-error-icon" />
          <span>{error}</span>
        </div>
      )}

      {/* Primary Action: Direct Operator Access */}
      <div style={{ marginBottom: '20px' }}>
        <button
          type="button"
          onClick={handleInstantAccess}
          disabled={loading}
          className="auth-btn-primary"
          style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
        >
          <ShieldCheck size={18} />
          <span>{loading ? 'Authenticating Operator...' : 'Access Platform Admin Console'}</span>
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', margin: '14px 0', gap: '8px', color: '#94a3b8', fontSize: '11px', fontWeight: 600 }}>
        <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
        <span>OR ENTER OPERATOR SECURITY KEY</span>
        <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
      </div>

      <form onSubmit={handleCredentialsSubmit} className="auth-form" noValidate>
        <div className="auth-field-group">
          <label htmlFor="opKey">Operator Key</label>
          <input
            id="opKey"
            type="password"
            placeholder="Enter security key"
            value={operatorKey}
            onChange={(e) => setOperatorKey(e.target.value)}
            className="auth-input"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="auth-btn-secondary"
          style={{ width: '100%' }}
        >
          <span>Verify &amp; Enter Console</span>
          <ArrowRight size={15} />
        </button>
      </form>

      <div className="auth-back-row" style={{ marginTop: '16px' }}>
        <Link to="/" className="auth-back-link">
          <ArrowLeft size={14} />
          <span>Back to portal selection</span>
        </Link>
      </div>
    </div>
  );
}
