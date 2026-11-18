import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/app';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    const res = await login(email, password);
    if (res.success) navigate(from, { replace: true });
    else setError(res.error ?? 'Login failed.');
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-brand-logo"><Shield size={22} strokeWidth={1.8} /></div>
          <div>
            <div className="auth-brand-name">ATHLETESAFE</div>
            <div className="auth-brand-tag">PERFORMANCE INTELLIGENCE</div>
          </div>
        </div>
        <div className="auth-left-content">
          <h1 className="auth-left-title">Injury prevention<br/>starts with data.</h1>
          <p className="auth-left-sub">
            Join sports science teams using AthleteSafe to predict, monitor and prevent
            athlete injuries with precision biomechanical analytics.
          </p>
          <div className="auth-left-stats">
            {[
              { val: '30+', label: 'Variables analysed' },
              { val: '17', label: 'Pose keypoints' },
              { val: '6+', label: 'Sports supported' },
            ].map((s) => (
              <div key={s.label} className="auth-stat">
                <span className="auth-stat-val font-mono">{s.val}</span>
                <span className="auth-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="auth-left-footer">
          <span>© {new Date().getFullYear()} AthleteSafe · Decision-support, not medical diagnosis.</span>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-card">
          <div className="auth-form-header">
            <h2 className="auth-form-title">Sign in to your account</h2>
            <p className="auth-form-sub">
              New to AthleteSafe?{' '}
              <Link to="/register" className="auth-link">Create an account</Link>
            </p>
          </div>

          {/* Demo hint */}
          <div className="auth-demo-hint">
            <AlertCircle size={13} />
            <span><strong>Demo:</strong> sarah@athletesafe.io / demo1234</span>
          </div>

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="form-field">
              <label className="form-label">Email address</label>
              <input
                type="email"
                className="form-input"
                placeholder="you@organisation.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="form-field">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Password</span>
                <Link to="/forgot-password" className="auth-link" tabIndex={-1}>Forgot password?</Link>
              </label>
              <div className="auth-pw-wrapper">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)} aria-label="Toggle password">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="auth-error">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="btn btn-primary auth-submit-btn" disabled={isLoading}>
              {isLoading
                ? <><span className="btn-spinner" /> Signing in...</>
                : <>Sign In <ArrowRight size={15} /></>
              }
            </button>
          </form>

          <div className="auth-divider"><span>or continue with</span></div>

          <div className="auth-social-btns">
            <button className="auth-social-btn" onClick={() => setError('Social login not available in V1 prototype.')}>
              <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Google
            </button>
            <button className="auth-social-btn" onClick={() => setError('Social login not available in V1 prototype.')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              LinkedIn
            </button>
          </div>

          <p className="auth-terms-note">
            By signing in you agree to our{' '}
            <Link to="/terms" className="auth-link">Terms of Service</Link> and{' '}
            <Link to="/privacy" className="auth-link">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
};
