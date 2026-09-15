import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NishchitLogo from '../components/NishchitLogo';
import PostLoginTransition from '../components/PostLoginTransition';
import { Building2, AlertCircle, ArrowLeft, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import { REGISTERED_INSTITUTIONS } from '../data/regionData';

export default function InstitutionLogin() {
  const { currentUser, loginAsInstitutionDemo, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (currentUser && !showSuccess) {
      if (currentUser.role === 'institution' || currentUser.role === 'admin') {
        navigate('/institution/dashboard', { replace: true });
      } else if (currentUser.role === 'platform_admin') {
        navigate('/platform-admin/dashboard', { replace: true });
      } else if (currentUser.role === 'driver') {
        navigate('/driver/dashboard', { replace: true });
      } else if (currentUser.role === 'parent') {
        navigate('/parent/dashboard', { replace: true });
      }
    }
  }, [currentUser, navigate, showSuccess]);

  const [selectedInstId, setSelectedInstId] = useState('INST-AU');
  const [institutionIdInput, setInstitutionIdInput] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDemoLogin = async (instId) => {
    setError('');
    setLoading(true);
    try {
      await loginAsInstitutionDemo(instId || selectedInstId);
      setShowSuccess(true);
    } catch (err) {
      console.error('Institution demo login error:', err);
      setError('Could not initialize institution session.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle('institution');
      setShowSuccess(true);
    } catch (err) {
      console.error('Google institution login error:', err);
      setError('Google authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!institutionIdInput.trim() || !password.trim()) {
      setError('Please enter institution code and desk password.');
      return;
    }
    setLoading(true);
    try {
      // Find matching institution or default
      const matched = REGISTERED_INSTITUTIONS.find(
        i => i.id.toLowerCase().includes(institutionIdInput.trim().toLowerCase()) ||
             i.shortName.toLowerCase().includes(institutionIdInput.trim().toLowerCase())
      );
      await loginAsInstitutionDemo(matched ? matched.id : 'INST-AU');
      setShowSuccess(true);
    } catch (err) {
      setError('Authentication failed. Please verify institution credentials.');
    } finally {
      setLoading(false);
    }
  };

  if (showSuccess) {
    return <PostLoginTransition onFinish={() => navigate('/institution/dashboard', { replace: true })} />;
  }

  return (
    <div className="auth-card">
      {/* Brand Header */}
      <div className="auth-card-top">
        <NishchitLogo variant="card" size={46} />
        
        <div className="auth-role-pill admin">
          <Building2 size={14} />
          <span>Institution Transport Desk</span>
        </div>

        <h1 className="auth-heading">Institution Portal</h1>
        <p className="auth-subheading">Manage your school or college fleet, hire drivers, and track operations.</p>
      </div>

      {error && (
        <div className="auth-error-banner" role="alert">
          <AlertCircle size={16} className="auth-error-icon" />
          <span>{error}</span>
        </div>
      )}

      {/* Quick Verified Institution Switcher */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
          Select Educational Institution
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {REGISTERED_INSTITUTIONS.slice(0, 3).map((inst) => (
            <button
              key={inst.id}
              type="button"
              onClick={() => {
                setSelectedInstId(inst.id);
                handleDemoLogin(inst.id);
              }}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '12px',
                background: selectedInstId === inst.id ? '#FFFBEB' : '#F8FAFC',
                border: `1.5px solid ${selectedInstId === inst.id ? '#F59E0B' : '#E2E8F0'}`,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
            >
              <div>
                <strong style={{ display: 'block', fontSize: '0.88rem', color: '#0F172A' }}>
                  {inst.name}
                </strong>
                <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
                  {inst.campus || inst.district} • {inst.busesCount || 15} Buses
                </span>
              </div>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: selectedInstId === inst.id ? '#F59E0B' : '#E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF'
              }}>
                <ArrowRight size={14} />
              </div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', margin: '14px 0', gap: '8px', color: '#94a3b8', fontSize: '11px', fontWeight: 600 }}>
        <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
        <span>OR SIGN IN WITH DESK CREDENTIALS</span>
        <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
      </div>

      <form onSubmit={handleCredentialsSubmit} className="auth-form" noValidate>
        <div className="auth-field-group">
          <label htmlFor="instCode">Institution Code / Desk ID</label>
          <input
            id="instCode"
            type="text"
            required
            placeholder="e.g. ABC-SCHOOL or admin123"
            value={institutionIdInput}
            onChange={(e) => setInstitutionIdInput(e.target.value)}
            className="auth-input"
          />
        </div>

        <div className="auth-field-group">
          <label htmlFor="instPass">Desk Password</label>
          <input
            id="instPass"
            type="password"
            required
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
          <span>{loading ? 'Accessing Desk...' : 'Access Transport Desk'}</span>
          <ArrowRight size={16} />
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
