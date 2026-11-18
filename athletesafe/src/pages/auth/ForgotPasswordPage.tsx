import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowRight, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ForgotPasswordPage: React.FC = () => {
  const { forgotPassword, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) { setError('Please enter a valid email address.'); return; }
    setError('');
    const res = await forgotPassword(email);
    if (res.success) setSent(true);
    else setError(res.error ?? 'Something went wrong.');
  };

  return (
    <div className="auth-page auth-page-centered">
      <div className="auth-simple-card">
        <div className="auth-brand auth-brand-centered">
          <div className="auth-brand-logo"><Shield size={22} strokeWidth={1.8} /></div>
          <div>
            <div className="auth-brand-name">ATHLETESAFE</div>
            <div className="auth-brand-tag">PERFORMANCE INTELLIGENCE</div>
          </div>
        </div>

        {!sent ? (
          <>
            <h2 className="auth-form-title" style={{ textAlign: 'center', marginTop: 24 }}>Reset your password</h2>
            <p className="auth-form-sub" style={{ textAlign: 'center', marginBottom: 24 }}>
              Enter your email and we'll send you a reset link.
            </p>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-field">
                <label className="form-label">Email address</label>
                <input type="email" className="form-input" placeholder="you@organisation.com"
                  value={email} onChange={e => setEmail(e.target.value)} autoFocus />
              </div>

              {error && <div className="auth-error"><AlertCircle size={14} /><span>{error}</span></div>}

              <button type="submit" className="btn btn-primary auth-submit-btn" disabled={isLoading}>
                {isLoading ? <><span className="btn-spinner" /> Sending...</> : <>Send Reset Link <ArrowRight size={15} /></>}
              </button>
            </form>
          </>
        ) : (
          <div className="auth-success-state">
            <div className="auth-success-icon"><CheckCircle size={32} /></div>
            <h3>Check your email</h3>
            <p>We've sent a password reset link to <strong>{email}</strong>.</p>
            <p className="auth-success-note">
              (This is a V1 prototype — no real email is sent. Use demo credentials to sign in.)
            </p>
          </div>
        )}

        <div className="auth-back-link">
          <Link to="/login" className="auth-link">
            <ArrowLeft size={13} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
