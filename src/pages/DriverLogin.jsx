import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NishchitLogo from '../components/NishchitLogo';
import PostLoginTransition from '../components/PostLoginTransition';
import { Bus, AlertCircle, ArrowLeft } from 'lucide-react';
import { formatAuthError } from '../utils/authHelper';

export default function DriverLogin() {
  const { currentUser, loginWithGoogle, loginAsDriverDemo } = useAuth();
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);
  const [targetPath, setTargetPath] = useState('/driver/dashboard');

  useEffect(() => {
    if (currentUser && !showSuccess) {
      if (currentUser.role === 'driver') {
        const isApproved = (currentUser.verificationStatus || '').toLowerCase() === 'approved';
        navigate(isApproved ? '/driver/dashboard' : '/driver/onboarding', { replace: true });
      } else if (currentUser.role === 'parent') {
        navigate('/parent/dashboard', { replace: true });
      } else if (currentUser.role === 'admin' || currentUser.role === 'institution') {
        navigate('/institution/dashboard', { replace: true });
      }
    }
  }, [currentUser, navigate, showSuccess]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDemoDriverLogin = async (driverId = 'DRV-SURESH-REDDY') => {
    setError('');
    setLoading(true);
    try {
      await loginAsDriverDemo(driverId);
      setTargetPath('/driver/dashboard');
      setShowSuccess(true);
    } catch (err) {
      console.error('Driver demo sign-in error:', err);
      setError('Could not initialize driver session.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const user = await loginWithGoogle('driver');
      const isApproved = (user?.verificationStatus || '').toLowerCase() === 'approved';
      setTargetPath(isApproved ? '/driver/dashboard' : '/driver/onboarding');
      setShowSuccess(true);
    } catch (err) {
      console.error('Driver sign-in error:', err);
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  if (showSuccess) {
    return <PostLoginTransition onFinish={() => navigate(targetPath, { replace: true })} />;
  }

  return (
    <div className="auth-card">
      {/* Brand Header */}
      <div className="auth-card-top">
        <NishchitLogo variant="card" size={46} />
        
        <div className="auth-role-pill driver">
          <Bus size={14} />
          <span>Driver Operating Portal</span>
        </div>

        <h1 className="auth-heading">Driver Sign In</h1>
        <p className="auth-subheading">Access today's route duty cockpit, browse jobs, and transmit live GPS telemetry.</p>
      </div>

      {error && (
        <div className="auth-error-banner" role="alert">
          <AlertCircle size={16} className="auth-error-icon" />
          <span>{error}</span>
        </div>
      )}

      {/* Quick Verified Driver Access */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
          Quick Driver Access
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            type="button"
            onClick={() => handleDemoDriverLogin('DRV-SURESH-REDDY')}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: '12px',
              background: '#F0FDF4',
              border: '1.5px solid #86EFAC',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div>
              <strong style={{ display: 'block', fontSize: '0.88rem', color: '#14532D' }}>
                Suresh Reddy (Platform Verified)
              </strong>
              <span style={{ fontSize: '0.74rem', color: '#15803D' }}>
                Assigned: Bus AU01 • Route AU01 (Andhra University Corridor)
              </span>
            </div>
            <span style={{
              fontSize: '0.74rem',
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: '6px',
              background: '#16A34A',
              color: '#FFFFFF'
            }}>
              Enter Cockpit
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleDemoDriverLogin('DRV-APPALA-NAIDU')}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: '12px',
              background: '#F8FAFC',
              border: '1.5px solid #CBD5E1',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div>
              <strong style={{ display: 'block', fontSize: '0.88rem', color: '#0F172A' }}>
                K. Appala Naidu (Available for Hire)
              </strong>
              <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
                Independent Verified Driver • Visakhapatnam
              </span>
            </div>
            <span style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '6px',
              background: '#E2E8F0',
              color: '#334155'
            }}>
              Marketplace
            </span>
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', margin: '14px 0', gap: '8px', color: '#94a3b8', fontSize: '11px', fontWeight: 600 }}>
        <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
        <span>OR SIGN IN WITH GOOGLE</span>
        <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
      </div>

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

        <div className="auth-driver-register-note">
          <span>New independent driver? </span>
          <Link to="/driver/onboarding" className="auth-inline-link">
            Submit verification &amp; license
          </Link>
        </div>

        <div className="auth-back-row">
          <Link to="/" className="auth-back-link">
            <ArrowLeft size={14} />
            <span>Back to portal selection</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
