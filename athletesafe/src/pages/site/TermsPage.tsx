import React from 'react';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="legal-section">
    <h2 className="legal-section-title">{title}</h2>
    {children}
  </div>
);

export const TermsPage: React.FC = () => (
  <div className="site-page">
    <div className="site-page-hero">
      <div className="site-container">
        <div className="section-eyebrow">Legal</div>
        <h1 className="site-page-title">Terms of Service</h1>
        <p className="site-page-sub">Last updated: 1 September 2026</p>
      </div>
    </div>
    <section className="site-section">
      <div className="site-container legal-container">
        <Section title="1. Acceptance of Terms">
          <p>By accessing or using the AthleteSafe platform, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, you must not use the platform.</p>
        </Section>
        <Section title="2. Description of Service">
          <p>AthleteSafe is a sports performance and decision-support platform providing injury risk estimates, biomechanical analysis, training load monitoring and related analytics. It is not a medical diagnostic tool and does not provide clinical advice.</p>
        </Section>
        <Section title="3. Important Medical Disclaimer">
          <p><strong>AthleteSafe is not a medical device and does not constitute medical advice, diagnosis or treatment.</strong> All risk estimates, scores and recommendations are decision-support indicators for trained sports professionals only. You must not use AthleteSafe as a substitute for professional medical assessment, physiotherapy consultation, or clinical diagnosis. Always consult qualified healthcare professionals for medical decisions affecting athlete welfare.</p>
        </Section>
        <Section title="4. User Accounts">
          <p>You are responsible for maintaining the confidentiality of your account credentials. You must notify us immediately of any unauthorised access. You are responsible for all activity that occurs under your account. You must not share credentials or allow others to use your account.</p>
        </Section>
        <Section title="5. Athlete Data">
          <p>You are responsible for ensuring you have appropriate consent from athletes whose data you enter into AthleteSafe. You must comply with applicable data protection laws (including UK GDPR) when processing athlete personal data. AthleteSafe processes this data as a data processor on your behalf.</p>
        </Section>
        <Section title="6. Acceptable Use">
          <p>You may not use AthleteSafe to:</p>
          <ul>
            <li>Make clinical diagnostic decisions without appropriate professional oversight.</li>
            <li>Process data of minors without appropriate guardian consent.</li>
            <li>Reverse engineer, copy or redistribute any part of the platform.</li>
            <li>Attempt to access systems or data beyond your authorised scope.</li>
          </ul>
        </Section>
        <Section title="7. Intellectual Property">
          <p>All platform software, design, algorithms and content are the intellectual property of AthleteSafe Ltd. Your athlete and organisational data remains your property. We do not claim ownership of data you enter.</p>
        </Section>
        <Section title="8. Limitation of Liability">
          <p>To the maximum extent permitted by law, AthleteSafe shall not be liable for any indirect, incidental, special or consequential damages arising from your use of the platform, including any decisions made based on risk estimates or recommendations provided.</p>
        </Section>
        <Section title="9. Termination">
          <p>We reserve the right to suspend or terminate accounts that violate these terms. You may close your account at any time. Upon termination, your data will be retained for 30 days then deleted.</p>
        </Section>
        <Section title="10. Governing Law">
          <p>These terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>
        </Section>
        <Section title="11. Contact">
          <p>For legal enquiries: <a href="mailto:legal@athletesafe.io" className="auth-link">legal@athletesafe.io</a></p>
        </Section>
      </div>
    </section>
  </div>
);
