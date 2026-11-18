import React from 'react';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="legal-section">
    <h2 className="legal-section-title">{title}</h2>
    {children}
  </div>
);

export const PrivacyPage: React.FC = () => (
  <div className="site-page">
    <div className="site-page-hero">
      <div className="site-container">
        <div className="section-eyebrow">Legal</div>
        <h1 className="site-page-title">Privacy Policy</h1>
        <p className="site-page-sub">Last updated: 1 September 2026</p>
      </div>
    </div>
    <section className="site-section">
      <div className="site-container legal-container">
        <Section title="1. Introduction">
          <p>AthleteSafe ("we", "us", "our") is committed to protecting the personal data of our users. This Privacy Policy explains how we collect, use, store and share your information when you use the AthleteSafe platform.</p>
        </Section>
        <Section title="2. Data We Collect">
          <p>We collect the following categories of data:</p>
          <ul>
            <li><strong>Account data:</strong> Name, email address, organisation, role.</li>
            <li><strong>Athlete data:</strong> Biomechanical measurements, training load, recovery metrics, injury history entered by users.</li>
            <li><strong>Usage data:</strong> Pages visited, features used, session duration.</li>
            <li><strong>Technical data:</strong> IP address, browser type, device information.</li>
          </ul>
        </Section>
        <Section title="3. How We Use Your Data">
          <p>We use your data to:</p>
          <ul>
            <li>Provide and improve the AthleteSafe platform.</li>
            <li>Generate injury risk assessments and analytics.</li>
            <li>Send account-related communications.</li>
            <li>Comply with legal obligations.</li>
          </ul>
        </Section>
        <Section title="4. Data Storage and Security">
          <p>Athlete and user data is stored on UK-based servers. We implement industry-standard security measures including encryption at rest and in transit, access controls, and regular security audits. V1 prototype data is stored in browser local storage only — no data is transmitted to external servers.</p>
        </Section>
        <Section title="5. Data Sharing">
          <p>We do not sell your personal data. We may share data with:</p>
          <ul>
            <li>Service providers who process data on our behalf (hosting, analytics).</li>
            <li>Law enforcement when required by applicable law.</li>
          </ul>
        </Section>
        <Section title="6. Your Rights (GDPR)">
          <p>Under UK GDPR you have the right to: access your data, rectify inaccurate data, erase your data, restrict processing, data portability, and object to processing. To exercise these rights, contact us at privacy@athletesafe.io.</p>
        </Section>
        <Section title="7. Medical Disclaimer">
          <p>AthleteSafe is a decision-support platform and does not constitute medical advice, diagnosis or treatment. Risk estimates are statistical indicators only. Always consult qualified medical and physiotherapy professionals for clinical decisions.</p>
        </Section>
        <Section title="8. Contact">
          <p>For privacy-related enquiries: <a href="mailto:privacy@athletesafe.io" className="auth-link">privacy@athletesafe.io</a></p>
        </Section>
      </div>
    </section>
  </div>
);
