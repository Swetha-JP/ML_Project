import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { RegisterData } from '../../context/AuthContext';

const ROLES: { value: RegisterData['role']; label: string; desc: string }[] = [
  { value: 'coach',     label: 'Performance Coach',   desc: 'Training & workload management' },
  { value: 'scientist', label: 'Sports Scientist',    desc: 'Biomechanics & data analysis' },
  { value: 'physio',    label: 'Physiotherapist',     desc: 'Injury management & rehab' },
  { value: 'admin',     label: 'Academy Director',    desc: 'Squad oversight & reporting' },
];

const PW_RULES = [
  { test: (p: string) => p.length >= 8,          label: 'At least 8 characters' },
  { test: (p: string) => /[A-Z]/.test(p),        label: 'One uppercase letter' },
  { test: (p: string) => /[0-9]/.test(p),        label: 'One number' },
];

export const RegisterPage: React.FC = () => {
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<RegisterData & { confirmPassword: string }>({
    name: '', email: '', password: '', confirmPassword: '',
    role: 'coach', organisation: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  const validateStep1 = () => {
    if (!form.name.trim()) return 'Please enter your full name.';
    if (!form.email.includes('@')) return 'Please enter a valid email address.';
    if (!form.organisation.trim()) return 'Please enter your organisation.';
    return '';
  };

  const validateStep2 = () => {
    if (form.password.length < 8) return 'Password must be at least 8 characters.';
    if (form.password !== form.confirmPassword) return 'Passwords do not match.';
    return '';
  };

  const nextStep = () => {
    const err = validateStep1();
    if (err) { setError(err); return; }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateStep2();
    if (err) { setError(err); return; }
    setError('');
    const res = await register({
      name: form.name, email: form.email,
      password: form.password, role: form.role,
      organisation: form.organisation,
    });
    if (res.success) navigate('/app', { replace: true });
    else setError(res.error ?? 'Registration failed.');
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
          <h1 className="auth-left-title">Start protecting<br/>your athletes.</h1>
          <p className="auth-left-sub">
            Create your AthleteSafe account and get access to the full suite of
            injury risk prediction, biomechanical analysis, and performance monitoring tools.
          </p>
          <div className="auth-feature-list">
            {[
              'Injury risk prediction with explainable factors',
              'Pose analysis from athlete images',
              'Full squad management & analytics',
              'Training load & recovery monitoring',
            ].map((f) => (
              <div key={f} className="auth-feature-item">
                <CheckCircle size={14} />
                <span>{f}</span>
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
            <div className="auth-steps-indicator">
              <div className={`auth-step-dot ${step >= 1 ? 'active' : ''}`}>1</div>
              <div className="auth-step-line" />
              <div className={`auth-step-dot ${step >= 2 ? 'active' : ''}`}>2</div>
            </div>
            <h2 className="auth-form-title">
              {step === 1 ? 'Create your account' : 'Set your password'}
            </h2>
            <p className="auth-form-sub">
              Already have an account?{' '}
              <Link to="/login" className="auth-link">Sign in</Link>
            </p>
          </div>

          {step === 1 ? (
            <form onSubmit={(e) => { e.preventDefault(); nextStep(); }} className="auth-form">
              <div className="form-field">
                <label className="form-label">Full Name</label>
                <input className="form-input" placeholder="Dr. Jane Smith" value={form.name}
                  onChange={e => set('name', e.target.value)} autoFocus />
              </div>
              <div className="form-field">
                <label className="form-label">Work Email</label>
                <input type="email" className="form-input" placeholder="you@organisation.com"
                  value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div className="form-field">
                <label className="form-label">Organisation</label>
                <input className="form-input" placeholder="Academy / Club / University / Clinic"
                  value={form.organisation} onChange={e => set('organisation', e.target.value)} />
              </div>
              <div className="form-field">
                <label className="form-label">Your Role</label>
                <div className="auth-role-grid">
                  {ROLES.map((r) => (
                    <label key={r.value} className={`auth-role-card ${form.role === r.value ? 'selected' : ''}`}>
                      <input type="radio" name="role" value={r.value} checked={form.role === r.value}
                        onChange={() => set('role', r.value)} />
                      <div className="auth-role-label">{r.label}</div>
                      <div className="auth-role-desc">{r.desc}</div>
                    </label>
                  ))}
                </div>
              </div>

              {error && <div className="auth-error"><AlertCircle size={14} /><span>{error}</span></div>}

              <button type="submit" className="btn btn-primary auth-submit-btn">
                Continue <ArrowRight size={15} />
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-field">
                <label className="form-label">Password</label>
                <div className="auth-pw-wrapper">
                  <input type={showPw ? 'text' : 'password'} className="form-input"
                    placeholder="Create a strong password" value={form.password}
                    onChange={e => set('password', e.target.value)} autoFocus />
                  <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <div className="auth-pw-rules">
                  {PW_RULES.map((r) => (
                    <div key={r.label} className={`auth-pw-rule ${r.test(form.password) ? 'met' : ''}`}>
                      <CheckCircle size={11} />
                      <span>{r.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="form-field">
                <label className="form-label">Confirm Password</label>
                <input type="password" className="form-input" placeholder="Repeat your password"
                  value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} />
              </div>

              {error && <div className="auth-error"><AlertCircle size={14} /><span>{error}</span></div>}

              <div className="auth-back-row">
                <button type="button" className="btn btn-ghost" onClick={() => { setStep(1); setError(''); }}>
                  Back
                </button>
                <button type="submit" className="btn btn-primary auth-submit-btn" style={{ flex: 1 }} disabled={isLoading}>
                  {isLoading ? <><span className="btn-spinner" /> Creating account...</> : <>Create Account <ArrowRight size={15} /></>}
                </button>
              </div>
            </form>
          )}

          <p className="auth-terms-note">
            By creating an account you agree to our{' '}
            <Link to="/terms" className="auth-link">Terms of Service</Link> and{' '}
            <Link to="/privacy" className="auth-link">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
};
