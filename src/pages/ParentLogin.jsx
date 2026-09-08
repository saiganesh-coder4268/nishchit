import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserCheck, Mail, Lock, AlertCircle, ArrowRight, Smartphone } from 'lucide-react';

export default function ParentLogin() {
  const { loginWithCredentials, signupWithCredentials, quickDemoLogin } = useAuth();
  const navigate = useNavigate();

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
        <div className="auth-header parent">
          <div className="auth-icon parent">
            <UserCheck size={32} />
          </div>
          <h1>Parent Portal Login</h1>
          <p>Live Bus Visibility & Direct Driver Connection</p>
        </div>

        {/* Demo Shortcut Card */}
        <div className="auth-demo-box parent">
          <div className="demo-box-content">
            <span className="demo-badge parent">Hackathon Demo Access</span>
            <strong>Student: Aarav (Class 8-A)</strong>
            <span className="demo-sub">Bus 24 · Route 04</span>
          </div>
          <button
            type="button"
            onClick={handleDemoLogin}
            className="btn btn-success btn-sm"
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
                <label>Parent Full Name</label>
                <div className="input-icon-wrapper">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Demo Parent"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Student Name</label>
                <div className="input-icon-wrapper">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarav"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Student Class / Year</label>
                <div className="input-icon-wrapper">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Class 8-A"
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value)}
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
                placeholder="parent@nishchit.app"
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
            className="btn btn-success btn-full"
          >
            {loading ? 'Authenticating...' : isSignUp ? 'CREATE PARENT ACCOUNT' : 'LOGIN TO PARENT DASHBOARD'}
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
              New parent?{' '}
              <button type="button" onClick={() => setIsSignUp(true)} className="btn-link">
                Register Parent Account
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
