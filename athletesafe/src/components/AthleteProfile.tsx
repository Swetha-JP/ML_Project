import React, { useState } from 'react';
import { X, ExternalLink, Activity, Calendar, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Athlete } from '../types';
import { RiskBadge }     from './ui/RiskBadge';
import { RiskScore }     from './ui/RiskScore';
import { RiskFactorItem } from './ui/RiskFactor';
import clsx from 'clsx';

interface Props {
  athlete:  Athlete;
  onClose:  () => void;
  onSelect?: () => void;
}

function Tip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      <p className="chart-tooltip-item"><span>Risk</span><span className="font-mono">{payload[0].value}%</span></p>
    </div>
  );
}

function BioStat({ label, value, unit, normal }: { label: string; value: number; unit: string; normal?: [number, number] }) {
  const ok = !normal || (value >= normal[0] && value <= normal[1]);
  return (
    <div className="bio-stat">
      <span className="bio-stat-label">{label}</span>
      <span className={clsx('bio-stat-value font-mono', !ok && 'text-amber')}>
        {value}<span className="bio-stat-unit">{unit}</span>
      </span>
    </div>
  );
}

export function AthleteProfile({ athlete: a, onClose, onSelect }: Props) {
  const [expandedInj, setExpandedInj] = useState<string | null>(null);
  const change = a.previousRiskScore !== undefined ? a.riskScore - a.previousRiskScore : null;

  const riskFactors = [
    ...(a.trainingLoad.weeklyLoad > 75
      ? [{ name: 'Elevated Training Load', impact: Math.round((a.trainingLoad.weeklyLoad - 70) * 0.5), impactLevel: 'high' as const, type: 'risk' as const }] : []),
    ...(a.recovery.muscleFatigue > 65
      ? [{ name: 'Muscle Fatigue', impact: Math.round(a.recovery.muscleFatigue * 0.18), impactLevel: 'high' as const, type: 'risk' as const }] : []),
    ...(a.injuryHistory.length > 0
      ? [{ name: 'Previous Injury History', impact: a.injuryHistory.length * 5, impactLevel: 'medium' as const, type: 'risk' as const }] : []),
    ...(a.recovery.sleepHours < 7
      ? [{ name: 'Sleep Deficit', impact: Math.round((7.5 - a.recovery.sleepHours) * 4), impactLevel: 'medium' as const, type: 'risk' as const }] : []),
    ...(a.recovery.recoveryScore > 70
      ? [{ name: 'Good Recovery', impact: -5, impactLevel: 'low' as const, type: 'protective' as const }] : []),
  ];

  return (
    <div className="profile-overlay" onClick={onClose}>
      <div className="profile-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="profile-header">
          <div className="profile-header-info">
            <div className="profile-avatar">{a.name.charAt(0)}</div>
            <div>
              <h2 className="profile-name">{a.name}</h2>
              <p className="profile-meta">{a.sport} · {a.position} · Age {a.age}</p>
            </div>
          </div>
          <div className="profile-header-actions">
            <RiskBadge level={a.riskLevel} />
            {onSelect && (
              <button className="btn btn-primary btn-sm" onClick={onSelect}>
                <ExternalLink size={13} /> Set Active
              </button>
            )}
            <button className="btn-icon-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
          </div>
        </div>

        <div className="profile-body">
          {/* Stats */}
          <div className="profile-stats-row">
            {[
              { label: 'Height',     value: `${a.height} cm` },
              { label: 'Weight',     value: `${a.weight} kg` },
              { label: 'Experience', value: `${a.experience} yrs` },
              { label: 'Sleep',      value: `${a.recovery.sleepHours} hrs` },
              { label: 'RPE',        value: a.trainingLoad.rpe },
              { label: 'Assessed',   value: a.lastAssessment ? new Date(a.lastAssessment).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—' },
            ].map((s) => (
              <div key={s.label} className="profile-stat">
                <span className="profile-stat-label">{s.label}</span>
                <span className="profile-stat-value font-mono">{s.value}</span>
              </div>
            ))}
          </div>

          {/* Risk + Trend */}
          <div className="profile-grid">
            <div className="profile-card">
              <h4 className="profile-card-title">Current Risk</h4>
              <div className="profile-risk-center">
                <RiskScore score={a.riskScore} level={a.riskLevel} previousScore={a.previousRiskScore} size="sm" />
              </div>
              {change !== null && (
                <div className={clsx('profile-trend-pill', change > 0 ? 'trend-up' : 'trend-down')}>
                  {change > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {change > 0 ? '+' : ''}{change}% from previous
                </div>
              )}
            </div>

            <div className="profile-card profile-card-wide">
              <h4 className="profile-card-title">Risk Trend (30 Days)</h4>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={a.riskTrend.slice(-14)} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(89,98,103,0.12)" />
                  <XAxis dataKey="date" tickFormatter={(v) => v.slice(8)} tick={{ fontSize: 10, fill: '#596267' }} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#596267', fontFamily: 'monospace' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<Tip />} />
                  <Line type="monotone" dataKey="score" stroke="#B96545" strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Biomechanics */}
          <div className="profile-card">
            <h4 className="profile-card-title"><Activity size={14} /> Biomechanical Profile</h4>
            <div className="bio-stats-grid">
              <BioStat label="Knee Flexion"       value={a.biomechanics.kneeFlexionAngle}  unit="°"   normal={[65, 90]} />
              <BioStat label="Knee Valgus"        value={a.biomechanics.kneeValgusAngle}   unit="°"   normal={[0, 8]} />
              <BioStat label="Hip Angle"          value={a.biomechanics.hipAngle}          unit="°"   normal={[35, 55]} />
              <BioStat label="Ankle Dorsiflexion" value={a.biomechanics.ankleDorsiflexion} unit="°"   normal={[15, 30]} />
              <BioStat label="Stride Symmetry"    value={a.biomechanics.strideSymmetry}    unit="%"   normal={[90, 100]} />
              <BioStat label="Stride Length"      value={a.biomechanics.strideLength}      unit=" cm" />
              <BioStat label="Ground Contact"     value={a.biomechanics.groundContactTime} unit=" ms" normal={[220, 280]} />
              <BioStat label="Force Asymmetry"    value={a.biomechanics.forceAsymmetry}    unit="%"   normal={[0, 10]} />
            </div>
          </div>

          {/* Risk factors */}
          {riskFactors.length > 0 && (
            <div className="profile-card">
              <h4 className="profile-card-title">Risk Factors</h4>
              <div className="risk-factors-list">
                {riskFactors.map((f) => <RiskFactorItem key={f.name} factor={f} />)}
              </div>
            </div>
          )}

          {/* Injury history */}
          <div className="profile-card">
            <h4 className="profile-card-title"><Calendar size={14} /> Injury History</h4>
            {a.injuryHistory.length === 0 ? (
              <p className="empty-state-sm">No previous injuries on record.</p>
            ) : (
              <div className="injury-timeline">
                {a.injuryHistory.map((inj) => (
                  <div key={inj.id} className="injury-timeline-item">
                    <div className="injury-timeline-dot" />
                    <div className="injury-timeline-content">
                      <div className="injury-timeline-header">
                        <span className="injury-name">{inj.type}</span>
                        <span className={clsx('injury-severity-tag', `severity-${inj.severity}`)}>{inj.severity}</span>
                      </div>
                      <div className="injury-timeline-meta">
                        <span>{inj.bodyPart}</span>
                        <span className="font-mono">{new Date(inj.date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>
                        <span className="font-mono">{inj.daysOut}d out</span>
                      </div>
                      {inj.notes && <p className="injury-notes">{inj.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recommendations */}
          <div className="profile-card">
            <h4 className="profile-card-title">Current Recommendations</h4>
            {a.recommendations.length === 0 ? (
              <p className="empty-state-sm">No recommendations yet. Run an assessment to generate guidance.</p>
            ) : (
              <ul className="profile-rec-list">
                {a.recommendations.map((rec, i) => (
                  <li key={i}><span className="rec-bullet" /><span>{rec}</span></li>
                ))}
              </ul>
            )}
            <div className="disclaimer-note mt-3">
              <AlertTriangle size={11} />
              <span>Training and wellness decision-support only. Not a medical diagnostic system.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
