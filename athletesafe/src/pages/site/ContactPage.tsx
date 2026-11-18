import React, { useState } from 'react';
import { Mail, MapPin, Phone, ArrowRight, CheckCircle } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', org: '', role: 'Sports Scientist', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="site-page">
      <div className="site-page-hero">
        <div className="site-container">
          <div className="section-eyebrow">Contact</div>
          <h1 className="site-page-title">Get in touch</h1>
          <p className="site-page-sub">
            Questions about AthleteSafe, partnerships, or enterprise plans? We'd love to hear from you.
          </p>
        </div>
      </div>

      <section className="site-section">
        <div className="site-container contact-page-grid">
          {/* Info */}
          <div className="contact-info-col">
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--graphite)', marginBottom: 20 }}>Contact Information</h2>
            {[
              { icon: <Mail size={18} />, label: 'Email', val: 'hello@athletesafe.io' },
              { icon: <Phone size={18} />, label: 'Phone', val: '+44 20 7946 0958' },
              { icon: <MapPin size={18} />, label: 'Office', val: 'London, United Kingdom' },
            ].map((c) => (
              <div key={c.label} className="contact-info-item">
                <div className="contact-info-icon">{c.icon}</div>
                <div>
                  <div className="contact-info-label">{c.label}</div>
                  <div className="contact-info-val">{c.val}</div>
                </div>
              </div>
            ))}

            <div style={{ marginTop: 32, padding: 20, background: 'var(--ivory)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--ivory-60)' }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--graphite)', marginBottom: 8 }}>Response Times</h4>
              <p style={{ fontSize: 12.5, color: 'var(--slate)', lineHeight: 1.7 }}>
                General enquiries: within 24 hours<br />
                Enterprise sales: within 4 hours<br />
                Technical support: within 2 hours
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="contact-form-col">
            {sent ? (
              <div className="contact-success">
                <div className="contact-success-icon"><CheckCircle size={36} /></div>
                <h3>Message sent!</h3>
                <p>Thank you for reaching out. We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="auth-form">
                <div className="contact-form-row">
                  <div className="form-field">
                    <label className="form-label">Full Name</label>
                    <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Dr. Jane Smith" required />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-input" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="jane@academy.com" required />
                  </div>
                </div>
                <div className="form-field">
                  <label className="form-label">Organisation</label>
                  <input className="form-input" value={form.org} onChange={e => setForm(p => ({ ...p, org: e.target.value }))} placeholder="Academy / Club / University..." />
                </div>
                <div className="form-field">
                  <label className="form-label">Role</label>
                  <select className="form-select" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                    {['Sports Scientist', 'Physiotherapist', 'Performance Coach', 'Academy Director', 'Researcher', 'Other'].map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Message</label>
                  <textarea className="form-textarea" rows={5} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="Tell us about your team and what you're looking to achieve..." required />
                </div>
                <button type="submit" className="btn-site-primary contact-submit">
                  Send Message <ArrowRight size={14} />
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
