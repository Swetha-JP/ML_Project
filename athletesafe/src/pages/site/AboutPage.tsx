import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Brain, Target, Heart, Users, Award, ArrowRight, CheckCircle } from 'lucide-react';

const TEAM = [
  { name: 'Dr. Sarah Mitchell', role: 'Co-Founder & Head of Sports Science', initials: 'SM', bg: '#B96545', bio: 'Former performance analyst at a Premier League club with a PhD in Biomechanics from Loughborough University.' },
  { name: 'James Okafor', role: 'Co-Founder & Lead Engineer', initials: 'JO', bg: '#1C2B3A', bio: 'Machine learning engineer with 8 years experience in sports technology and computer vision systems.' },
  { name: 'Priya Nair', role: 'Head of Physiotherapy Partnerships', initials: 'PN', bg: '#8FA69A', bio: 'Chartered physiotherapist and sports scientist with extensive experience in elite athlete rehabilitation.' },
  { name: 'Daniel Chen', role: 'Product & Design Lead', initials: 'DC', bg: '#596267', bio: 'Product designer focused on making complex sports data accessible and actionable for practitioners.' },
];

const VALUES = [
  { icon: <Brain size={20} strokeWidth={1.5} />, title: 'Science-First', desc: 'Every feature is grounded in peer-reviewed sports science and validated by practitioners in the field.' },
  { icon: <Target size={20} strokeWidth={1.5} />, title: 'Transparency', desc: 'We explain every risk estimate. No black boxes — coaches and scientists deserve to understand the why.' },
  { icon: <Heart size={20} strokeWidth={1.5} />, title: 'Athlete Welfare', desc: 'Technology in service of people. Our goal is healthier, longer athletic careers, not just numbers.' },
  { icon: <Shield size={20} strokeWidth={1.5} />, title: 'Responsible AI', desc: 'AthleteSafe is a decision-support tool, not a diagnosis. We enforce this distinction at every touchpoint.' },
];

export const AboutPage: React.FC = () => (
  <div className="site-page">
    {/* Hero */}
    <div className="site-page-hero">
      <div className="site-container">
        <div className="section-eyebrow">About AthleteSafe</div>
        <h1 className="site-page-title">Sports science meets<br />machine intelligence</h1>
        <p className="site-page-sub">
          We're a team of sports scientists, physiotherapists and engineers building the
          analytics platform we always wished existed.
        </p>
      </div>
    </div>

    {/* Mission */}
    <section className="site-section">
      <div className="site-container about-mission-grid">
        <div>
          <div className="section-eyebrow">Our Mission</div>
          <h2 className="section-title" style={{ textAlign: 'left' }}>Make advanced injury prevention accessible to every programme</h2>
          <p style={{ fontSize: 15, color: 'var(--slate)', lineHeight: 1.8, marginBottom: 16 }}>
            Top professional clubs have had access to elite sports science tools for years.
            AthleteSafe was founded to democratise that technology — making precision
            biomechanical analytics available to academies, universities, and performance
            clinics that don't have million-pound budgets.
          </p>
          <p style={{ fontSize: 15, color: 'var(--slate)', lineHeight: 1.8, marginBottom: 28 }}>
            Every feature is designed in close collaboration with the coaches, physiotherapists
            and scientists who use it daily. We build for practitioners, not for demo videos.
          </p>
          <Link to="/register" className="btn-site-primary">
            Join AthleteSafe <ArrowRight size={14} />
          </Link>
        </div>
        <div className="about-mission-stats">
          {[
            { val: '2024', label: 'Founded' },
            { val: '6+', label: 'Sports supported' },
            { val: '30+', label: 'Risk variables' },
            { val: '17', label: 'Pose keypoints' },
          ].map((s) => (
            <div key={s.label} className="about-mission-stat">
              <span className="font-mono" style={{ fontSize: 32, fontWeight: 800, color: 'var(--copper)' }}>{s.val}</span>
              <span style={{ fontSize: 12, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Values */}
    <section className="site-section" style={{ background: 'var(--ivory)' }}>
      <div className="site-container">
        <div className="section-header">
          <div className="section-eyebrow">Our Values</div>
          <h2 className="section-title">What guides everything we build</h2>
        </div>
        <div className="features-grid">
          {VALUES.map((v) => (
            <div key={v.title} className="feature-card">
              <div className="feature-icon">{v.icon}</div>
              <h3 className="feature-title">{v.title}</h3>
              <p className="feature-desc">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Team */}
    <section className="site-section">
      <div className="site-container">
        <div className="section-header">
          <div className="section-eyebrow">The Team</div>
          <h2 className="section-title">Built by practitioners<br />for practitioners</h2>
        </div>
        <div className="team-cards-grid">
          {TEAM.map((m) => (
            <div key={m.name} className="team-member-card">
              <div className="team-member-avatar" style={{ background: m.bg }}>{m.initials}</div>
              <h3 className="team-member-name">{m.name}</h3>
              <p className="team-member-role">{m.role}</p>
              <p className="team-member-bio">{m.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="site-section" style={{ background: 'var(--graphite)', color: 'white' }}>
      <div className="site-container" style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, color: 'white', marginBottom: 16, letterSpacing: '-0.03em' }}>
          Ready to join us?
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', marginBottom: 32 }}>
          Start your free trial today. No credit card required.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link to="/register" className="btn-hero-primary">Get Started <ArrowRight size={14} /></Link>
          <Link to="/contact" className="btn-hero-ghost">Contact Us</Link>
        </div>
      </div>
    </section>
  </div>
);
