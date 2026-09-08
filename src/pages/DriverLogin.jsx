import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle } from 'lucide-react';

export default function DriverLogin() {
  const { currentUser, loginWithCredentials, signupWithCredentials, quickDemoLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'driver') {
        navigate('/driver/dashboard', { replace: true });
      } else {
        navigate('/parent/dashboard', { replace: true });
      }
    }
  }, [currentUser, navigate]);

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [licenceNumber, setLicenceNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signupWithCredentials(email, password, 'driver', {
          name,
          phone,
          licenceNumber,
          driverId: 'DRV-' + Math.floor(1000 + Math.random() * 9000),
          busId: 'BUS24',
          routeId: 'ROUTE04',
          verificationStatus: 'PENDING'
        });
      } else {
        await loginWithCredentials(email, password, 'driver');
      }
      navigate('/driver/dashboard');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    quickDemoLogin('driver');
    navigate('/driver/dashboard');
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-brand-badge">NISHCHIT</div>

        <div className="auth-header">
          <h1>{isSignUp ? 'Driver Registration' : 'Driver Sign In'}</h1>
          <p>Access your assigned bus and trip controls.</p>
        </div>

        {/* Quick Demo Shortcut */}
        <div className="auth-demo-box">
          <div className="demo-box-content">
            <span className="demo-badge">Demo Shortcut</span>
            <strong>Driver: Rajesh Kumar</strong>
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
                <label>Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Mobile Number</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Licence Number</label>
                <input
                  type="text"
                  required
                  placeholder="DL-1420110012345"
                  value={licenceNumber}
                  onChange={(e) => setLicenceNumber(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              required
              placeholder="driver@nishchit.app"
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
            {loading ? 'Signing In...' : isSignUp ? 'Create Driver Account' : 'Sign In'}
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
              New driver?{' '}
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

