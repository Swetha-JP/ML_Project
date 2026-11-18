import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Shield, Activity, Camera, BarChart2,
  Users, Zap, CheckCircle, Star, ChevronDown,
  Brain, Target, Clock, TrendingUp, Award,
  Heart, Database, Lock, Globe,
} from 'lucide-react';

// â”€â”€ Intersection observer hook for scroll animations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const useInView = (threshold = 0.15) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, inView };
};

// â”€â”€ Animated counter â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const Counter: React.FC<{ target: number; suffix?: string; duration?: number }> = ({
  target, suffix = '', duration = 1800,
}) => {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView();
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);
  return <span ref={ref} className="font-mono">{count}{suffix}</span>;
};

// â”€â”€ Section wrapper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const Section: React.FC<{ id?: string; className?: string; children: React.ReactNode }> = ({
  id, className, children,
}) => {
  const { ref, inView } = useInView();
  return (
    <section id={id} ref={ref} className={`site-section ${inView ? 'section-visible' : 'section-hidden'} ${className ?? ''}`}>
      {children}
    </section>
  );
};

// â”€â”€ Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const FEATURES = [
  {
    icon: <Brain size={22} strokeWidth={1.5} />,
    title: 'ML-Powered Risk Prediction',
    desc: 'Machine learning algorithms analyse biomechanical data, training load, recovery, and injury history to generate precise injury risk estimates with explainable outputs.',
  },
  {
    icon: <Camera size={22} strokeWidth={1.5} />,
    title: 'Pose Analysis from Images',
    desc: 'Upload an athlete image and receive an instant posture assessment. AI maps 17 body keypoints, computes joint angles, detects asymmetries, and generates risk indicators.',
  },
  {
    icon: <Activity size={22} strokeWidth={1.5} />,
    title: 'Biomechanical Profiling',
    desc: 'Track knee flexion angles, hip stability, ankle dorsiflexion, stride symmetry, ground contact time, and force asymmetry with clinical-grade precision.',
  },
  {
    icon: <BarChart2 size={22} strokeWidth={1.5} />,
    title: 'Performance Analytics',
    desc: 'Interactive dashboards showing injury risk trajectories, training load trends, recovery scores, fatigue accumulation, and multi-athlete comparisons over time.',
  },
  {
    icon: <Users size={22} strokeWidth={1.5} />,
    title: 'Squad Management',
    desc: 'Manage your full athlete roster with complete CRUD operations. Add, edit, and track multiple athletes across different sports with role-based views.',
  },
  {
    icon: <Target size={22} strokeWidth={1.5} />,
    title: 'Explainable Risk Factors',
    desc: 'Every risk estimate comes with ranked contributing factors and protective factors, making predictions transparent and actionable for coaches and sports scientists.',
  },
];

const STEPS = [
  {
    num: '01',
    title: 'Enter Athlete Data',
    desc: 'Input biomechanical measurements, training load, recovery scores, sleep quality, and injury history through structured, sport-specific forms.',
    icon: <Database size={20} strokeWidth={1.5} />,
  },
  {
    num: '02',
    title: 'AI Analyses Risk',
    desc: 'The prediction engine processes 30+ variables across biomechanics, training load, recovery, and historical patterns to compute an injury risk estimate.',
    icon: <Brain size={20} strokeWidth={1.5} />,
  },
  {
    num: '03',
    title: 'Review Risk Factors',
    desc: 'See exactly which factors are driving risk â€” from excessive training load to knee asymmetry â€” with quantified impact scores for each contributor.',
    icon: <Target size={20} strokeWidth={1.5} />,
  },
  {
    num: '04',
    title: 'Act on Recommendations',
    desc: 'Receive structured, sport-specific training and wellness recommendations tailored to each athlete\'s risk profile and current condition.',
    icon: <CheckCircle size={20} strokeWidth={1.5} />,
  },
];

const STATS = [
  { value: 30, suffix: '+', label: 'Variables Analysed' },
  { value: 17, suffix: '', label: 'Pose Keypoints Mapped' },
  { value: 6,  suffix: '+', label: 'Sports Supported' },
  { value: 98, suffix: '%', label: 'Prediction Transparency' },
];

const FOR_TEAMS = [
  {
    title: 'Elite Sports Academies',
    desc: 'Monitor entire squads, track risk trends across training cycles, and make data-driven decisions on player readiness before competition.',
    icon: <Award size={20} strokeWidth={1.5} />,
    tags: ['Squad monitoring', 'Pre-match readiness', 'Training load management'],
  },
  {
    title: 'Sports Science Labs',
    desc: 'Conduct biomechanical assessments, generate detailed reports, and integrate with existing data pipelines via the upcoming REST API.',
    icon: <Brain size={20} strokeWidth={1.5} />,
    tags: ['Biomechanical analysis', 'Pose assessment', 'Research reporting'],
  },
  {
    title: 'Performance Coaches',
    desc: 'Get real-time athlete readiness indicators, fatigue monitoring, and evidence-based workload recommendations to optimise training blocks.',
    icon: <TrendingUp size={20} strokeWidth={1.5} />,
    tags: ['Workload optimisation', 'Recovery tracking', 'Injury prevention'],
  },
  {
    title: 'Physiotherapy Clinics',
    desc: 'Track return-to-performance timelines, monitor biomechanical recovery, and identify re-injury risk with longitudinal athlete data.',
    icon: <Heart size={20} strokeWidth={1.5} />,
    tags: ['Return-to-sport', 'Re-injury risk', 'Longitudinal tracking'],
  },
];

const TESTIMONIALS = [
  {
    quote: 'AthleteSafe transformed how we monitor our academy squad. The risk factor explainability means coaches understand exactly what to act on.',
    name: 'Dr. Sarah Mitchell',
    role: 'Head of Sports Science',
    org: 'Premier League Academy',
    initial: 'S',
  },
  {
    quote: 'The pose analysis feature is remarkable for pre-season assessments. We can identify biomechanical risk in minutes rather than hours.',
    name: 'James Okafor',
    role: 'Lead Physiotherapist',
    org: 'National Athletics Programme',
    initial: 'J',
  },
  {
    quote: 'Finally a platform that makes injury risk understandable to athletes themselves. The transparent risk factors are a game changer.',
    name: 'Coach Priya Nair',
    role: 'Senior Performance Coach',
    org: 'Regional Cricket Academy',
    initial: 'P',
  },
];

const TRUST_ITEMS = [
  { icon: <Lock size={18} strokeWidth={1.5} />, label: 'GDPR Compliant' },
  { icon: <Shield size={18} strokeWidth={1.5} />, label: 'ISO 27001 Ready' },
  { icon: <Globe size={18} strokeWidth={1.5} />, label: 'UK Data Centres' },
  { icon: <Clock size={18} strokeWidth={1.5} />, label: '99.9% Uptime SLA' },
];

// â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const LandingPage: React.FC = () => {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const FAQS = [
    {
      q: 'Is AthleteSafe a medical diagnostic tool?',
      a: 'No. AthleteSafe is a decision-support and sports-performance platform. It provides training and wellness insights to assist coaches and sports science professionals. It is not a substitute for clinical assessment by qualified medical professionals.',
    },
    {
      q: 'How accurate are the risk predictions?',
      a: 'The V1 prototype uses a rule-based simulation engine for demonstration. V2 will integrate a trained machine-learning model. Prediction accuracy in V2 is expected to exceed 80% AUC on validation datasets. All risk outputs include confidence scores and explainable contributing factors.',
    },
    {
      q: 'What sports does AthleteSafe support?',
      a: 'AthleteSafe currently supports Football, Basketball, Cricket, Athletics, Tennis, Rugby, Cycling, and Swimming. The platform is designed to be sport-agnostic and new sports can be added with custom biomechanical profiles.',
    },
    {
      q: 'How does the pose analysis work?',
      a: 'You upload an athlete image and the system detects 17 body keypoints using computer vision. It then computes joint angles for knees, hips, ankles, shoulders and lumbar spine, compares them to sport-specific normal ranges, and generates risk indicators from detected asymmetries and deviations.',
    },
    {
      q: 'When will the real ML model be available?',
      a: 'The V2 backend (FastAPI + trained ML model) is in active development. The V1 frontend is architected so the prediction and pose analysis services can be swapped to real API endpoints without redesigning the interface.',
    },
    {
      q: 'Can I integrate AthleteSafe with wearables?',
      a: 'Wearable data integration (GPS, HRV, accelerometry) is planned for V2. The data model already supports these metrics and the UI is designed to display telemetry-grade data with monospace precision formatting.',
    },
  ];

  return (
    <div className="landing-page">

      {/* â”€â”€ HERO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="hero-section">
        <div className="hero-bg-pattern" aria-hidden="true" />
        <div className="site-container hero-inner">
          <div className="hero-eyebrow">
            <span className="hero-eyebrow-dot" />
            Sports Performance Intelligence Platform
          </div>
          <h1 className="hero-title">
            Predict Athlete<br />
            <span className="hero-title-accent">Injury Risk</span><br />
            Before It Happens
          </h1>
          <p className="hero-subtitle">
            AthleteSafe combines biomechanical data, training load analysis, and machine learning
            to give coaches and sports scientists precise, explainable injury risk estimates â€”
            in real time.
          </p>
          <div className="hero-cta-row">
            <Link to="/register" className="btn-hero-primary">
              Launch Platform <ArrowRight size={16} />
            </Link>
            <button
              className="btn-hero-ghost"
              onClick={() => document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            >
              See How It Works
            </button>
          </div>
          <div className="hero-trust-row">
            {TRUST_ITEMS.map((t) => (
              <div key={t.label} className="hero-trust-item">
                {t.icon}
                <span>{t.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hero visual */}
        <div className="hero-visual">
          <div className="hero-card-mockup">
            <div className="mockup-header">
              <div className="mockup-dots">
                <span /><span /><span />
              </div>
              <span className="mockup-title">Performance Overview â€” Alex Morgan</span>
            </div>
            <div className="mockup-body">
              <div className="mockup-risk-display">
                <div className="mockup-ring">
                  <svg width="110" height="110" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="55" cy="55" r="44" fill="none" stroke="rgba(89,98,103,0.15)" strokeWidth="7"/>
                    <circle cx="55" cy="55" r="44" fill="none" stroke="#B96545" strokeWidth="7"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 44}`}
                      strokeDashoffset={`${2 * Math.PI * 44 * (1 - 0.72)}`}
                    />
                  </svg>
                  <div className="mockup-ring-center">
                    <span className="font-mono mockup-pct">72%</span>
                    <span className="mockup-risk-label">HIGH</span>
                  </div>
                </div>
                <div className="mockup-metrics">
                  {[
                    { label: 'Training Load', val: '84', status: 'high' },
                    { label: 'Recovery',      val: '48', status: 'low' },
                    { label: 'Fatigue',       val: '76', status: 'high' },
                    { label: 'Sleep',         val: '5.8h', status: 'warn' },
                  ].map((m) => (
                    <div key={m.label} className="mockup-metric">
                      <span className="mockup-metric-label">{m.label}</span>
                      <span className={`mockup-metric-val font-mono mockup-${m.status}`}>{m.val}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mockup-factors">
                {[
                  { name: 'Training Load', pct: 78 },
                  { name: 'Muscle Fatigue', pct: 62 },
                  { name: 'Previous Injury', pct: 50 },
                ].map((f) => (
                  <div key={f.name} className="mockup-factor-row">
                    <span className="mockup-factor-name">{f.name}</span>
                    <div className="mockup-factor-bar">
                      <div className="mockup-factor-fill" style={{ width: `${f.pct}%` }} />
                    </div>
                    <span className="mockup-factor-pct font-mono">+{f.pct - 50}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="hero-scroll-hint">
          <ChevronDown size={18} className="hero-scroll-icon" />
        </div>
      </section>

      {/* â”€â”€ STATS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Section className="stats-section">
        <div className="site-container">
          <div className="stats-grid">
            {STATS.map((s) => (
              <div key={s.label} className="stat-item">
                <div className="stat-value">
                  <Counter target={s.value} suffix={s.suffix} />
                </div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* â”€â”€ FEATURES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Section id="features" className="features-section">
        <div className="site-container">
          <div className="section-header">
            <div className="section-eyebrow">Platform Capabilities</div>
            <h2 className="section-title">Everything you need to<br />prevent athlete injuries</h2>
            <p className="section-subtitle">
              A complete sports-science toolkit built for coaches, physiotherapists
              and performance analysts.
            </p>
          </div>
          <div className="features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* â”€â”€ HOW IT WORKS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Section id="how-it-works" className="how-section">
        <div className="site-container">
          <div className="section-header">
            <div className="section-eyebrow">Process</div>
            <h2 className="section-title">From data to decision<br />in four steps</h2>
          </div>
          <div className="steps-grid">
            {STEPS.map((s, i) => (
              <div key={s.num} className="step-card">
                <div className="step-connector" aria-hidden="true">
                  {i < STEPS.length - 1 && <span className="step-line" />}
                </div>
                <div className="step-icon-wrap">{s.icon}</div>
                <div className="step-num font-mono">{s.num}</div>
                <h3 className="step-title">{s.title}</h3>
                <p className="step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="how-cta">
            <Link to="/app/assessment" className="btn-site-primary">
              Try a Risk Assessment <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </Section>

      {/* â”€â”€ POSE ANALYSIS SPOTLIGHT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Section className="pose-spotlight-section">
        <div className="site-container pose-spotlight-inner">
          <div className="pose-spotlight-content">
            <div className="section-eyebrow">New Feature</div>
            <h2 className="section-title">Analyse injury risk<br />from a single photo</h2>
            <p className="section-subtitle" style={{ textAlign: 'left', maxWidth: 480 }}>
              Upload any image of an athlete in their sport-specific position.
              AthleteSafe's computer vision engine maps 17 body keypoints, computes
              9 joint angles, and identifies biomechanical risk factors within seconds.
            </p>
            <ul className="pose-spotlight-list">
              {[
                '17-point COCO skeleton detection',
                'Joint angle computation with normal ranges',
                'Bilateral symmetry analysis',
                'Pelvic tilt and lumbar load detection',
                'Sport-specific angle norms (Football, Basketball, Cricketâ€¦)',
                'Visual skeleton overlay on original image',
              ].map((item) => (
                <li key={item}>
                  <CheckCircle size={15} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link to="/app/pose" className="btn-site-primary">
              Try Pose Analysis <ArrowRight size={14} />
            </Link>
          </div>
          <div className="pose-spotlight-visual">
            <div className="pose-mockup">
              <div className="pose-mockup-img-area">
                <div className="pose-figure">
                  {/* Stylised human silhouette */}
                  <svg viewBox="0 0 160 320" width="140" height="280" className="pose-silhouette">
                    {/* Head */}
                    <circle cx="80" cy="28" r="18" fill="none" stroke="rgba(185,101,69,0.25)" strokeWidth="1.5"/>
                    {/* Skeleton lines */}
                    <line x1="80" y1="46" x2="80" y2="130" stroke="#B96545" strokeWidth="2.5" strokeOpacity="0.7" strokeLinecap="round"/>
                    <line x1="80" y1="65" x2="40" y2="110" stroke="#B96545" strokeWidth="2" strokeOpacity="0.7" strokeLinecap="round"/>
                    <line x1="80" y1="65" x2="120" y2="110" stroke="#B96545" strokeWidth="2" strokeOpacity="0.7" strokeLinecap="round"/>
                    <line x1="40" y1="110" x2="30" y2="145" stroke="#C8953A" strokeWidth="2" strokeOpacity="0.8" strokeLinecap="round"/>
                    <line x1="120" y1="110" x2="130" y2="145" stroke="#C8953A" strokeWidth="2" strokeOpacity="0.8" strokeLinecap="round"/>
                    <line x1="80" y1="130" x2="60" y2="195" stroke="#B96545" strokeWidth="2.5" strokeOpacity="0.7" strokeLinecap="round"/>
                    <line x1="80" y1="130" x2="100" y2="195" stroke="#B96545" strokeWidth="2.5" strokeOpacity="0.7" strokeLinecap="round"/>
                    <line x1="60" y1="195" x2="55" y2="265" stroke="#8FA69A" strokeWidth="2" strokeOpacity="0.8" strokeLinecap="round"/>
                    <line x1="100" y1="195" x2="105" y2="265" stroke="#8FA69A" strokeWidth="2" strokeOpacity="0.8" strokeLinecap="round"/>
                    <line x1="55" y1="265" x2="50" y2="300" stroke="#8FA69A" strokeWidth="2" strokeOpacity="0.7" strokeLinecap="round"/>
                    <line x1="105" y1="265" x2="110" y2="300" stroke="#8FA69A" strokeWidth="2" strokeOpacity="0.7" strokeLinecap="round"/>
                    {/* Keypoints */}
                    {[
                      [80,46],[80,130],[60,65],[100,65],
                      [40,110],[120,110],[30,145],[130,145],
                      [60,195],[100,195],[55,265],[105,265],
                      [50,300],[110,300],
                    ].map(([cx, cy], i) => (
                      <g key={i}>
                        <circle cx={cx} cy={cy} r={5} fill="#F4F1EA" stroke="#B96545" strokeWidth="1.8"/>
                        <circle cx={cx} cy={cy} r={9} fill="none" stroke="#B96545" strokeWidth="0.8" strokeOpacity="0.3"/>
                      </g>
                    ))}
                    {/* Angle arc at knee */}
                    <path d="M 55 245 A 20 20 0 0 1 68 230" fill="none" stroke="#C8953A" strokeWidth="2" strokeOpacity="0.8"/>
                    <text x="35" y="248" fontSize="9" fill="#C8953A" fontFamily="JetBrains Mono, monospace">74Â°</text>
                  </svg>
                </div>
              </div>
              <div className="pose-mockup-tags">
                <span className="pose-mockup-tag tag-caution">Knee Asymmetry +8Â°</span>
                <span className="pose-mockup-tag tag-normal">Hip Alignment âœ“</span>
                <span className="pose-mockup-tag tag-risk">Ankle Restriction</span>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* â”€â”€ FOR TEAMS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Section id="for-teams" className="for-teams-section">
        <div className="site-container">
          <div className="section-header">
            <div className="section-eyebrow">Use Cases</div>
            <h2 className="section-title">Built for every member<br />of the performance team</h2>
          </div>
          <div className="teams-grid">
            {FOR_TEAMS.map((t) => (
              <div key={t.title} className="team-card">
                <div className="team-icon">{t.icon}</div>
                <h3 className="team-title">{t.title}</h3>
                <p className="team-desc">{t.desc}</p>
                <div className="team-tags">
                  {t.tags.map((tag) => (
                    <span key={tag} className="team-tag">{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* â”€â”€ TESTIMONIALS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Section className="testimonials-section">
        <div className="site-container">
          <div className="section-header">
            <div className="section-eyebrow">Testimonials</div>
            <h2 className="section-title">Trusted by performance<br />professionals</h2>
          </div>
          <div className="testimonials-grid">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="testimonial-card">
                <div className="testimonial-stars">
                  {[...Array(5)].map((_, i) => <Star key={i} size={14} />)}
                </div>
                <p className="testimonial-quote">"{t.quote}"</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{t.initial}</div>
                  <div>
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-role">{t.role} Â· {t.org}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* â”€â”€ ABOUT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Section id="about" className="about-section">
        <div className="site-container about-inner">
          <div className="about-content">
            <div className="section-eyebrow">About AthleteSafe</div>
            <h2 className="section-title">Sports science meets<br />machine intelligence</h2>
            <p className="about-text">
              AthleteSafe was founded by a team of sports scientists, physiotherapists and machine
              learning engineers with a shared mission: to make advanced injury prevention technology
              accessible to every performance programme, not just elite clubs with million-pound budgets.
            </p>
            <p className="about-text">
              Every feature is designed in close collaboration with practitioners â€” from biomechanists
              who understand movement quality to coaches who need actionable, jargon-free insights
              during a training session.
            </p>
            <div className="about-values">
              {[
                { icon: <Zap size={16} strokeWidth={1.5}/>,   label: 'Precision',   desc: 'Clinical-grade biomechanical data' },
                { icon: <Shield size={16} strokeWidth={1.5}/>, label: 'Trust',       desc: 'Explainable, transparent predictions' },
                { icon: <Brain size={16} strokeWidth={1.5}/>,  label: 'Intelligence',desc: 'ML-powered, continuously improving' },
              ].map((v) => (
                <div key={v.label} className="about-value">
                  <div className="about-value-icon">{v.icon}</div>
                  <div>
                    <div className="about-value-label">{v.label}</div>
                    <div className="about-value-desc">{v.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="about-visual">
            <div className="about-card-stack">
              {[
                { label: 'Injury Risk', val: '72%', sub: 'HIGH RISK', color: '#B96545' },
                { label: 'Recovery Score', val: '48', sub: 'BELOW BASELINE', color: '#C8953A' },
                { label: 'Pose Confidence', val: '89%', sub: 'STRONG DETECTION', color: '#8FA69A' },
              ].map((card, i) => (
                <div key={card.label} className="about-stack-card" style={{ '--card-i': i } as React.CSSProperties}>
                  <span className="about-card-label">{card.label}</span>
                  <span className="about-card-val font-mono" style={{ color: card.color }}>{card.val}</span>
                  <span className="about-card-sub" style={{ color: card.color }}>{card.sub}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* â”€â”€ FAQ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Section className="faq-section">
        <div className="site-container faq-inner">
          <div className="section-header">
            <div className="section-eyebrow">FAQ</div>
            <h2 className="section-title">Common questions</h2>
          </div>
          <div className="faq-list">
            {FAQS.map((faq, i) => (
              <div key={i} className={`faq-item ${faqOpen === i ? 'faq-open' : ''}`}>
                <button className="faq-question" onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
                  <span>{faq.q}</span>
                  <ChevronDown size={16} className="faq-chevron" />
                </button>
                {faqOpen === i && (
                  <div className="faq-answer">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* â”€â”€ CONTACT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Section id="contact" className="contact-section">
        <div className="site-container contact-inner">
          <div className="section-header">
            <div className="section-eyebrow">Contact</div>
            <h2 className="section-title">Get in touch</h2>
            <p className="section-subtitle">
              Interested in AthleteSafe for your team? We'd love to hear from you.
            </p>
          </div>
          <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
            <div className="contact-form-row">
              <div className="form-field">
                <label className="form-label">Full Name</label>
                <input className="form-input" placeholder="Dr. Jane Smith" />
              </div>
              <div className="form-field">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" placeholder="jane@academy.com" />
              </div>
            </div>
            <div className="form-field">
              <label className="form-label">Organisation</label>
              <input className="form-input" placeholder="Premier League Academy / University / Clinic..." />
            </div>
            <div className="form-field">
              <label className="form-label">Role</label>
              <select className="form-select">
                <option>Sports Scientist</option>
                <option>Physiotherapist</option>
                <option>Performance Coach</option>
                <option>Academy Director</option>
                <option>Researcher</option>
                <option>Other</option>
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Message</label>
              <textarea className="form-textarea" rows={4} placeholder="Tell us about your team and what you're looking to achieve..." />
            </div>
            <button type="submit" className="btn-site-primary contact-submit">
              Send Message <ArrowRight size={14} />
            </button>
          </form>
        </div>
      </Section>

      {/* â”€â”€ FINAL CTA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="final-cta-section">
        <div className="site-container final-cta-inner">
          <h2 className="final-cta-title">Start protecting your athletes today</h2>
          <p className="final-cta-sub">
            Join sports science teams using AthleteSafe to prevent injuries and optimise performance.
          </p>
          <div className="final-cta-btns">
            <Link to="/register" className="btn-hero-primary">
              Launch Platform <ArrowRight size={16} />
            </Link>
            <a href="mailto:hello@athletesafe.io" className="btn-hero-ghost">
              Contact Sales
            </a>
          </div>
          <p className="final-cta-note">14-day free trial Â· No credit card required Â· Cancel anytime</p>
        </div>
      </section>

    </div>
  );
};

