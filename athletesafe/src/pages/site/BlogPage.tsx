import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, User } from 'lucide-react';

const POSTS = [
  { slug: '1', title: 'Understanding Knee Valgus: Biomechanical Risk Indicators in Football', date: '2026-08-28', author: 'Dr. Sarah Mitchell', readTime: '7 min', category: 'Biomechanics', excerpt: 'Knee valgus collapse during dynamic movement is one of the strongest predictors of ACL injury risk. We explore the measurement methodology and intervention strategies.' },
  { slug: '2', title: 'Training Load Management: The Acute:Chronic Workload Ratio Explained', date: '2026-08-14', author: 'James Okafor', readTime: '5 min', category: 'Training Science', excerpt: 'The ACWR is a widely used metric in sports science. Here\'s how AthleteSafe models training load risk and what the research says about optimal ranges.' },
  { slug: '3', title: 'The Role of Sleep in Athlete Recovery and Injury Prevention', date: '2026-07-31', author: 'Priya Nair', readTime: '6 min', category: 'Recovery', excerpt: 'Sleep duration below 7 hours is significantly associated with increased injury incidence. We review the evidence and practical monitoring strategies.' },
  { slug: '4', title: 'Computer Vision in Sports Medicine: What Pose Estimation Can and Cannot Tell Us', date: '2026-07-18', author: 'Dr. Sarah Mitchell', readTime: '9 min', category: 'Technology', excerpt: 'Pose estimation from 2D images has exciting potential for screening — but it has important limitations practitioners need to understand.' },
  { slug: '5', title: 'Cricket Fast Bowlers: Managing Lumbar Stress in High-Volume Training', date: '2026-07-05', author: 'Priya Nair', readTime: '8 min', category: 'Sport-Specific', excerpt: 'Fast bowlers experience some of the highest spinal loads in sport. Evidence-based protocols for monitoring and managing lumbar stress across a training block.' },
  { slug: '6', title: 'Return to Sport Criteria: Moving Beyond Time-Based Decisions', date: '2026-06-22', author: 'James Okafor', readTime: '6 min', category: 'Rehabilitation', excerpt: 'Time-based return-to-sport protocols are increasingly being replaced by criteria-based approaches. Here\'s how objective data supports better decisions.' },
];

const CATEGORIES = ['All', 'Biomechanics', 'Training Science', 'Recovery', 'Technology', 'Sport-Specific', 'Rehabilitation'];

export const BlogPage: React.FC = () => {
  const [cat, setCat] = React.useState('All');
  const filtered = cat === 'All' ? POSTS : POSTS.filter(p => p.category === cat);

  return (
    <div className="site-page">
      <div className="site-page-hero">
        <div className="site-container">
          <div className="section-eyebrow">Blog</div>
          <h1 className="site-page-title">Sports Science Insights</h1>
          <p className="site-page-sub">Research, analysis and practical guidance from the AthleteSafe team.</p>
        </div>
      </div>

      <section className="site-section">
        <div className="site-container">
          {/* Category filter */}
          <div className="blog-categories">
            {CATEGORIES.map(c => (
              <button key={c} className={`blog-cat-btn ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>{c}</button>
            ))}
          </div>

          {/* Posts grid */}
          <div className="blog-grid">
            {filtered.map((post, i) => (
              <article key={post.slug} className={`blog-card ${i === 0 && cat === 'All' ? 'blog-card-featured' : ''}`}>
                <div className="blog-card-category">{post.category}</div>
                <h2 className="blog-card-title">{post.title}</h2>
                <p className="blog-card-excerpt">{post.excerpt}</p>
                <div className="blog-card-meta">
                  <div className="blog-meta-item"><User size={12} /><span>{post.author}</span></div>
                  <div className="blog-meta-item"><Clock size={12} /><span>{post.readTime} read</span></div>
                  <span className="font-mono blog-card-date">{new Date(post.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                <Link to={`/blog/${post.slug}`} className="blog-read-more">
                  Read article <ArrowRight size={13} />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
