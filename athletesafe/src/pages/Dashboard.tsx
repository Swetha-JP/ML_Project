import React, { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Zap, Moon, Activity, Heart,
  ArrowRight, AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RiskScore } from '../components/ui/RiskScore';
import { RiskBadge } from '../components/ui/RiskBadge';
import { MetricCard } from '../components/ui/MetricCard';
import { ChartCard } from '../components/ui/ChartCard';
import { RiskFactorItem } from '../components/ui/RiskFactor';
import { useNavigate } from 'react-router-dom';

const TIME_RANGES = ['7D', '30D'] as const;
type TimeRange = typeof TIME_RANGES[number];

const CustomTooltip: React.FC<{ active?: boolean; payload?: { value: number; name: string }[]; label?: string }> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="chart-tooltip-item">
          <span>{p.name}</span>
          <span className="font-mono">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const { selectedAthlete } = useApp();
  const [timeRange, setTimeRange] = useState<TimeRange>('7D');
  const navigate = useNavigate();

  const a = selectedAthlete;

  // Slice trend data based on time range
  const trendData = timeRange === '7D'
    ? a.riskTrend.slice(-7)
    : a.riskTrend;

  const avgRisk = Math.round(
    a.riskTrend.reduce((sum, d) => sum + d.score, 0) / a.riskTrend.length
  );

  // Recovery/fatigue chart data (derived from mock)
  const recoveryData = a.trainingLoad.dailyLoads.map((d, i) => ({
    date: d.date.slice(5),
    recovery: Math.max(20, a.recovery.recoveryScore + (Math.random() - 0.5) * 20 - i * 2),
    fatigue: Math.min(95, a.recovery.muscleFatigue + (Math.random() - 0.5) * 18 + i),
  }));

  // Determine metric statuses
  const loadStatus = a.trainingLoad.weeklyLoad >= 80 ? 'danger' : a.trainingLoad.weeklyLoad >= 65 ? 'warning' : 'good';
  const recoveryStatus = a.recovery.recoveryScore <= 50 ? 'danger' : a.recovery.recoveryScore <= 65 ? 'warning' : 'good';
  const fatigueStatus = a.recovery.muscleFatigue >= 75 ? 'danger' : a.recovery.muscleFatigue >= 60 ? 'warning' : 'good';
  const sleepStatus = a.recovery.sleepHours < 6.5 ? 'danger' : a.recovery.sleepHours < 7.5 ? 'warning' : 'good';

  const riskFactors = [
    { name: 'Training Load', impact: 18, impactLevel: 'high' as const, type: 'risk' as const },
    { name: 'Muscle Fatigue', impact: 14, impactLevel: 'high' as const, type: 'risk' as const },
    { name: 'Previous Injury', impact: 11, impactLevel: 'medium' as const, type: 'risk' as const },
    { name: 'Poor Recovery', impact: 9, impactLevel: 'medium' as const, type: 'risk' as const },
    { name: 'Sleep Deficit', impact: 7, impactLevel: 'medium' as const, type: 'risk' as const },
    { name: 'Good Recovery Trend', impact: -6, impactLevel: 'low' as const, type: 'protective' as const },
  ];

  const riskChange = a.riskScore - (a.previousRiskScore ?? a.riskScore);

  return (
    <div className="page">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Performance Overview</h1>
          <p className="page-subtitle">
            Monitor injury risk, workload, recovery and athlete readiness.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/assessment')}
        >
          New Assessment <ArrowRight size={15} />
        </button>
      </div>

      {/* Athlete strip */}
      <div className="athlete-strip">
        <div className="athlete-strip-avatar">{a.name.charAt(0)}</div>
        <div>
          <div className="athlete-strip-name">{a.name}</div>
          <div className="athlete-strip-meta">
            {a.sport} • {a.position}
          </div>
        </div>
        <div className="athlete-strip-badge">
          <RiskBadge level={a.riskLevel} />
        </div>
        <div className="athlete-strip-date">
          <span className="label-xs">LATEST ASSESSMENT</span>
          <span className="value-sm font-mono">
            {new Date(a.lastAssessment).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* Main grid */}
      <div className="dashboard-grid">
        {/* Risk Hero */}
        <div className="dashboard-risk-hero">
          <div className="section-label">CURRENT INJURY RISK ESTIMATE</div>
          <RiskScore
            score={a.riskScore}
            level={a.riskLevel}
            previousScore={a.previousRiskScore}
          />
          {riskChange !== 0 && (
            <div className="risk-hero-note">
              <span className={riskChange > 0 ? 'text-danger' : 'text-sage'}>
                {riskChange > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              </span>
              <span>
                {riskChange > 0
                  ? 'Risk indicators have increased compared with the previous assessment.'
                  : 'Risk indicators have improved compared with the previous assessment.'}
              </span>
            </div>
          )}
          <div className="risk-prev-row">
            <div>
              <span className="label-xs">PREVIOUS</span>
              <span className="font-mono value-sm">{a.previousRiskScore ?? '—'}%</span>
            </div>
            <div>
              <span className="label-xs">AVG (30D)</span>
              <span className="font-mono value-sm">{avgRisk}%</span>
            </div>
          </div>
        </div>

        {/* Performance Snapshot */}
        <div className="dashboard-metrics">
          <div className="section-label">PERFORMANCE SNAPSHOT</div>
          <div className="metrics-grid">
            <MetricCard
              label="Training Load"
              value={a.trainingLoad.weeklyLoad}
              unit="AU"
              status={loadStatus}
              statusLabel={loadStatus === 'danger' ? 'HIGH' : loadStatus === 'warning' ? 'ELEVATED' : 'NORMAL'}
              icon={<Zap size={15} />}
            />
            <MetricCard
              label="Recovery Score"
              value={a.recovery.recoveryScore}
              unit="/100"
              status={recoveryStatus}
              statusLabel={recoveryStatus === 'danger' ? 'LOW' : recoveryStatus === 'warning' ? 'MODERATE' : 'GOOD'}
              icon={<Heart size={15} />}
            />
            <MetricCard
              label="Muscle Fatigue"
              value={a.recovery.muscleFatigue}
              unit="/100"
              status={fatigueStatus}
              statusLabel={fatigueStatus === 'danger' ? 'HIGH' : fatigueStatus === 'warning' ? 'ELEVATED' : 'LOW'}
              icon={<Activity size={15} />}
            />
            <MetricCard
              label="Sleep"
              value={a.recovery.sleepHours}
              unit="hrs"
              status={sleepStatus}
              statusLabel={sleepStatus === 'danger' ? 'BELOW TARGET' : sleepStatus === 'warning' ? 'MARGINAL' : 'ON TARGET'}
              icon={<Moon size={15} />}
            />
          </div>
        </div>
      </div>

      {/* Risk Trajectory Chart */}
      <ChartCard
        title="Injury Risk Trajectory"
        subtitle="Risk score trend over time — previous assessments and current estimate"
        actions={
          <div className="chart-range-btns">
            {TIME_RANGES.map((r) => (
              <button
                key={r}
                className={`chart-range-btn ${timeRange === r ? 'active' : ''}`}
                onClick={() => setTimeRange(r)}
              >
                {r}
              </button>
            ))}
          </div>
        }
      >
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={trendData} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(89,98,103,0.15)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#596267', fontFamily: 'inherit' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: '#596267', fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={avgRisk} stroke="#596267" strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: `Avg ${avgRisk}%`, fill: '#596267', fontSize: 10 }} />
            <ReferenceLine y={75} stroke="#D94A4A" strokeDasharray="4 4" strokeOpacity={0.3} />
            <Line
              type="monotone"
              dataKey="score"
              name="Risk Score"
              stroke="#B96545"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#B96545' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Training Load + Recovery charts side by side */}
      <div className="two-col-charts">
        <ChartCard
          title="Training Load"
          subtitle="Daily load with baseline reference"
        >
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={a.trainingLoad.dailyLoads}
              margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(89,98,103,0.12)" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => v.slice(5)}
                tick={{ fontSize: 10, fill: '#596267' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#596267', fontFamily: 'monospace' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={70} stroke="#596267" strokeDasharray="3 3" label={{ value: 'Baseline', fill: '#596267', fontSize: 10 }} />
              <Bar dataKey="load" name="Daily Load" fill="#B96545" radius={[2, 2, 0, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Recovery & Fatigue"
          subtitle="7-day trend comparison"
        >
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={recoveryData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(89,98,103,0.12)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#596267' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: '#596267', fontFamily: 'monospace' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                iconType="line"
              />
              <Line
                type="monotone"
                dataKey="recovery"
                name="Recovery"
                stroke="#8FA69A"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="fatigue"
                name="Fatigue"
                stroke="#B96545"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Risk Factors */}
      <div className="two-col-charts">
        <ChartCard
          title="Risk Drivers"
          subtitle="What's driving the current risk estimate"
        >
          <div className="risk-factors-list">
            {riskFactors
              .filter((f) => f.type === 'risk')
              .map((f) => (
                <RiskFactorItem key={f.name} factor={f} />
              ))}
          </div>
        </ChartCard>

        <div className="right-col-stack">
          {/* Protective Factors */}
          <ChartCard title="Protective Factors" subtitle="Factors reducing overall risk">
            <div className="risk-factors-list">
              {riskFactors
                .filter((f) => f.type === 'protective')
                .map((f) => (
                  <RiskFactorItem key={f.name} factor={f} />
                ))}
            </div>
          </ChartCard>

          {/* Recommendations preview */}
          <ChartCard title="Recommended Actions" subtitle="Training and wellness guidance">
            <ul className="recommendation-preview-list">
              {a.recommendations.slice(0, 4).map((rec, i) => (
                <li key={i} className="recommendation-preview-item">
                  <span className="rec-bullet" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
            <button
              className="btn btn-ghost btn-sm mt-4"
              onClick={() => navigate('/recommendations')}
            >
              View all recommendations <ArrowRight size={13} />
            </button>
            <div className="disclaimer-note">
              <AlertTriangle size={12} />
              <span>
                Training and wellness decision-support only. Not a medical diagnostic system.
              </span>
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
};
