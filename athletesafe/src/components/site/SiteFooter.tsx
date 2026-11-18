import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Mail, Twitter, Linkedin, Github, ArrowRight } from 'lucide-react';

const LINKS = {
  Platform: [
    { label: 'Dashboard',          to: '/app' },
    { label: 'Risk Assessment',    to: '/app/assessment' },
    { label: 'Pose Analysis',      to: '/app/pose' },
    { label: 'Athlete Management', to: '/app/manage' },
    { label: 'Analytics',          to: '/app/analytics' },
  ],
  Company: [
    { label: 'About',   to: '/about' },
    { label: 'Blog',    to: '/blog' },
    { label: 'Contact', to: '/contact' },
  ],
  Resources: [
    { label: 'API Docs',   to: '/contact' },
    { label: 'Research',   to: '/blog' },
    { label: 'Case Studies', to: '/blog' },
  ],
  Legal: [
    { label: 'Privacy Policy',   to: '/privacy' },
    { label: 'Terms of Service', to: '/terms' },
  ],
};

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-newsletter">
        <div className="footer-newsletter-inner">
          <div>
            <h3 className="footer-newsletter-title">Stay ahead of injuries</h3>
            <p className="footer-newsletter-sub">Sports science insights and product updates.</p>
          </div>
          <form className="footer-newsletter-form" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="Enter your email" className="footer-email-input" aria-label="Email" />
            <button type="submit" className="btn-site-primary">Subscribe <ArrowRight size={14} /></button>
          </form>
        </div>
      </div>

      <div className="footer-main">
        <div className="footer-brand-col">
          <div className="site-logo">
            <div className="site-logo-icon"><Shield size={18} strokeWidth={1.8} /></div>
            <div className="site-logo-text">
              <span className="site-logo-name">ATHLETESAFE</span>
              <span className="site-logo-tag">PERFORMANCE INTELLIGENCE</span>
            </div>
          </div>
          <p className="footer-brand-desc">
            Sports performance and injury-risk assessment platform built by practitioners for practitioners.
          </p>
          <div className="footer-socials">
            <a href="#" className="footer-social-btn" aria-label="Twitter"><Twitter size={16} /></a>
            <a href="#" className="footer-social-btn" aria-label="LinkedIn"><Linkedin size={16} /></a>
            <a href="#" className="footer-social-btn" aria-label="GitHub"><Github size={16} /></a>
            <a href="mailto:hello@athletesafe.io" className="footer-social-btn" aria-label="Email"><Mail size={16} /></a>
          </div>
        </div>
        {Object.entries(LINKS).map(([section, links]) => (
          <div key={section} className="footer-link-col">
            <h4 className="footer-link-heading">{section}</h4>
            <ul className="footer-link-list">
              {links.map((l) => (
                <li key={l.label}><Link to={l.to} className="footer-link">{l.label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-inner">
          <span className="footer-copy">© {new Date().getFullYear()} AthleteSafe. All rights reserved.</span>
          <span className="footer-disclaimer">Not a medical diagnostic system — decision-support only.</span>
          <div className="footer-bottom-links">
            <Link to="/privacy" className="footer-bottom-link">Privacy</Link>
            <Link to="/terms"   className="footer-bottom-link">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
