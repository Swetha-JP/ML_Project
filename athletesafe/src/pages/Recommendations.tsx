import React, { useState } from 'react';
import {
  Zap, Heart, Activity, Moon, AlertCircle,
  ChevronDown, ChevronUp, AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import clsx from 'clsx';

type Priority = 'high' | 'medium' | 'low';

interface Recommendation {
  id: string;
  issue: string;
  impact: string;
  action: string;
  priority: Priority;
}

interface Category {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  items: Recommendation[];
}

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  high: { label: 'HIGH PRIORITY', className: 'priority-high' },
  medium: { label: 'MEDIUM PRIORITY', className: 'priority-medium' },
  low: { label: 'LOW PRIORITY', className: 'priority-low' },
};

const CATEGORIES: Category[] = [
  {
    id: 'load',
    label: 'Training Load Management',
    icon: <Zap size={16} />,
    description: 'Guidance for managing and optimising training workload.',
    items: [
      {
        id: 'l1',
        issue: 'Weekly load above personal baseline',
        impact: 'Elevated training load increases cumulative stress on musculoskeletal tissue.',
        action: 'Reduce weekly training load by 15–20% over the next training block. Re-assess after 7 days.',
        priority: 'high',
      },
      {
        id: 'l2',
        issue: 'High session RPE (≥8)',
        impact: 'Consistently high perceived exertion without adequate recovery increases injury risk indicators.',
        action: 'Alternate high-intensity sessions with moderate or technical sessions. Keep RPE ≤7 for at least 2 sessions per week.',
        priority: 'high',
      },
      {
        id: 'l3',
        issue: 'Training load spike detected',
        impact: 'Acute spikes in load relative to chronic baseline are associated with elevated strain risk.',
        action: 'Do not increase weekly load by more than 10% per week. Plan a deload week after any high-load block.',
        priority: 'medium',
      },
      {
        id: 'l4',
        issue: 'Insufficient rest days',
        impact: 'Training without adequate rest does not allow tissue adaptation and recovery.',
        action: 'Ensure a minimum of 2 complete rest or active recovery days per 7-day training cycle.',
        priority: 'medium',
      },
    ],
  },
  {
    id: 'recovery',
    label: 'Recovery Optimisation',
    icon: <Heart size={16} />,
    description: 'Suggestions for improving recovery quality and readiness.',
    items: [
      {
        id: 'r1',
        issue: 'Low recovery score (< 50)',
        impact: 'Poor recovery leaves the athlete in a compromised state for subsequent training sessions.',
        action: 'Implement structured post-session recovery protocols: cold water immersion, active cool-down, or massage therapy.',
        priority: 'high',
      },
      {
        id: 'r2',
        issue: 'Recovery score declining trend',
        impact: 'A declining recovery trend over multiple days indicates accumulated fatigue.',
        action: 'Introduce an additional active recovery session. Reduce training intensity for 48 hours.',
        priority: 'medium',
      },
      {
        id: 'r3',
        issue: 'Hydration and nutrition not monitored',
        impact: 'Suboptimal nutrition and hydration significantly impairs recovery and tissue repair.',
        action: 'Work with a sports nutritionist to ensure pre- and post-session nutrition and hydration protocols are followed.',
        priority: 'low',
      },
    ],
  },
  {
    id: 'fatigue',
    label: 'Fatigue Monitoring',
    icon: <Activity size={16} />,
    description: 'Monitoring and managing muscle fatigue accumulation.',
    items: [
      {
        id: 'f1',
        issue: 'Muscle fatigue > 70',
        impact: 'High muscle fatigue alters movement mechanics, increasing biomechanical injury risk.',
        action: 'Prioritise low-intensity active recovery. Avoid high-intensity plyometric or speed work until fatigue falls below 60.',
        priority: 'high',
      },
      {
        id: 'f2',
        issue: 'Fatigue accumulating across sessions',
        impact: 'Without intervention, fatigue accumulation leads to chronic overload.',
        action: 'Use wellness questionnaires or RPE tracking before each session. Adjust load based on daily readiness.',
        priority: 'medium',
      },
      {
        id: 'f3',
        issue: 'No fatigue monitoring protocol in place',
        impact: 'Without objective fatigue tracking, overtraining states may not be detected early.',
        action: 'Implement daily fatigue self-reporting (1–10 scale) and correlate with session load data.',
        priority: 'low',
      },
    ],
  },
  {
    id: 'sleep',
    label: 'Sleep & Rest',
    icon: <Moon size={16} />,
    description: 'Recommendations for maintaining adequate sleep and rest quality.',
    items: [
      {
        id: 's1',
        issue: 'Sleep duration < 7 hours',
        impact: 'Sleep deprivation impairs tissue repair, cognitive function, and reaction time — all of which affect injury risk.',
        action: 'Target 8–9 hours of sleep per night. Establish a consistent sleep/wake schedule, including rest days.',
        priority: 'high',
      },
      {
        id: 's2',
        issue: 'Poor sleep quality (score ≤ 5)',
        impact: 'Even adequate duration sleep may not provide sufficient restoration if quality is poor.',
        action: 'Reduce screen use 60 minutes before sleep. Maintain a cool, dark sleeping environment. Avoid caffeine after 14:00.',
        priority: 'medium',
      },
      {
        id: 's3',
        issue: 'Late evening training sessions',
        impact: 'Intensive exercise within 2 hours of sleep onset elevates cortisol and impairs sleep quality.',
        action: 'Schedule high-intensity sessions before 19:00. Consider yoga or stretching for evening sessions.',
        priority: 'low',
      },
    ],
  },
  {
    id: 'injury',
    label: 'Previous Injury Monitoring',
    icon: <AlertCircle size={16} />,
    description: 'Additional monitoring guidance for athletes with injury history.',
    items: [
      {
        id: 'i1',
        issue: 'Recent injury (< 90 days)',
        impact: 'Tissue remodelling is still occurring within 90 days of a significant injury, increasing re-injury risk.',
        action: 'Maintain close monitoring of the previously injured area. Follow graduated return-to-performance protocols.',
        priority: 'high',
      },
      {
        id: 'i2',
        issue: 'Moderate or severe previous injury',
        impact: 'Previous moderate/severe injuries can create compensatory movement patterns that stress adjacent structures.',
        action: 'Schedule a biomechanical movement assessment to identify asymmetries related to the previous injury site.',
        priority: 'high',
      },
      {
        id: 'i3',
        issue: 'Multiple previous injuries',
        impact: 'Athletes with multiple injuries have higher risk profiles and may need extended monitoring.',
        action: 'Increase assessment frequency to weekly during high-load periods. Maintain detailed load and wellness records.',
        priority: 'medium',
      },
    ],
  },
];

const RecCard: React.FC<{ rec: Recommendation }> = ({ rec }) => {
  const { label, className } = priorityConfig[rec.priority];
  return (
    <div className="rec-card">
      <div className="rec-card-header">
        <span className="rec-card-issue">{rec.issue}</span>
        <span className={clsx('rec-priority-badge', className)}>{label}</span>
      </div>
      <p className="rec-card-impact">
        <strong>Impact:</strong> {rec.impact}
      </p>
      <p className="rec-card-action">
        <strong>Suggested action:</strong> {rec.action}
      </p>
    </div>
  );
};

export const Recommendations: React.FC = () => {
  const { selectedAthlete } = useApp();
  const [open, setOpen] = useState<string[]>(['load', 'recovery']);

  const toggle = (id: string) =>
    setOpen((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Recommendations</h1>
          <p className="page-subtitle">
            Training and wellness guidance for {selectedAthlete.name}.
          </p>
        </div>
      </div>

      <div className="disclaimer-banner">
        <AlertTriangle size={15} />
        <span>
          AthleteSafe provides training and wellness decision-support insights.
          These recommendations are general guidance only and are not a substitute for
          professional medical or clinical advice.
        </span>
      </div>

      <div className="rec-categories">
        {CATEGORIES.map((cat) => {
          const isOpen = open.includes(cat.id);
          return (
            <div key={cat.id} className="rec-category">
              <button
                className="rec-category-header"
                onClick={() => toggle(cat.id)}
              >
                <div className="rec-category-header-left">
                  <span className="rec-category-icon">{cat.icon}</span>
                  <div>
                    <span className="rec-category-label">{cat.label}</span>
                    <span className="rec-category-desc">{cat.description}</span>
                  </div>
                </div>
                <div className="rec-category-header-right">
                  <span className="rec-count">{cat.items.length}</span>
                  {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </div>
              </button>
              {isOpen && (
                <div className="rec-items">
                  {cat.items.map((item) => (
                    <RecCard key={item.id} rec={item} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
