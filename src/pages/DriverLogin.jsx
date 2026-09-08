import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bus, Lock, Mail, User, AlertCircle, ArrowRight } from 'lucide-react';

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
          verificationStatus: 'PENDING' // New driver registrations require institution review
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
        <div className="auth-header driver">
          <div className="auth-icon driver">
            <Bus size={32} />
          </div>
          <h1>Driver Portal Login</h1>
          <p>School Transport Live GPS & Communications</p>
        </div>

        {/* Demo Shortcut Card */}
        <div className="auth-demo-box">
          <div className="demo-box-content">
            <span className="demo-badge">Instant Demo Access</span>
            <strong>Driver: Rajesh Kumar</strong>
            <span className="demo-sub">Bus 24 · Route 04 · Verified ✓</span>
          </div>

          <button
            type="button"
            onClick={handleDemoLogin}
            className="btn btn-primary btn-sm"
          >
            One-Tap Demo Login
          </button>
        </div>

        {error && (
          <div className="auth-error-banner">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {isSignUp && (
            <>
              <div className="form-group">
                <label>Full Name</label>
                <div className="input-icon-wrapper">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Mobile Number</label>
                <div className="input-icon-wrapper">
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Driving Licence Number</label>
                <div className="input-icon-wrapper">
                  <input
                    type="text"
                    required
                    placeholder="DL-1420110012345"
                    value={licenceNumber}
                    onChange={(e) => setLicenceNumber(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <div className="input-icon-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                required
                placeholder="driver@nishchit.app"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-icon-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-full"
          >
            {loading ? 'Authenticating...' : isSignUp ? 'CREATE DRIVER ACCOUNT' : 'LOGIN TO DRIVER DASHBOARD'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="auth-toggle-footer">
          {isSignUp ? (
            <p>
              Already registered?{' '}
              <button type="button" onClick={() => setIsSignUp(false)} className="btn-link">
                Log In Here
              </button>
            </p>
          ) : (
            <p>
              New driver?{' '}
              <button type="button" onClick={() => setIsSignUp(true)} className="btn-link">
                Create Driver Account
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
