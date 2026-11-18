import React, { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import { ATHLETES } from '../data/athletes';
import { ChartCard } from '../components/ui/ChartCard';
import { RiskBadge } from '../components/ui/RiskBadge';
import { useApp } from '../context/AppContext';
import clsx from 'clsx';

const RISK_COLORS = {
  low: '#8FA69A',
  moderate: '#C8953A',
  high: '#B96545',
  critical: '#D94A4A',
};

const CustomTooltip: React.FC<{ active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="chart-tooltip-item">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-mono">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

export const Analytics: React.FC = () => {
  const { selectedAthlete } = useApp();
  const [compareIds, setCompareIds] = useState<string[]>([selectedAthlete.id, ATHLETES[1].id]);

  const toggleCompare = (id: string) => {
    setCompareIds((prev) =>
      prev.includes(id)
        ? prev.filter((i) => i !== id)
        : prev.length < 4 ? [...prev, id] : prev
    );
  };

  // Risk distribution data
  const riskDist = [
    { name: 'Low', value: ATHLETES.filter((a) => a.riskLevel === 'low').length, color: RISK_COLORS.low },
    { name: 'Moderate', value: ATHLETES.filter((a) => a.riskLevel === 'moderate').length, color: RISK_COLORS.moderate },
    { name: 'High', value: ATHLETES.filter((a) => a.riskLevel === 'high').length, color: RISK_COLORS.high },
    { name: 'Critical', value: ATHLETES.filter((a) => a.riskLevel === 'critical').length, color: RISK_COLORS.critical },
  ];

  // Comparison data for selected athletes
  const compareAthletes = ATHLETES.filter((a) => compareIds.includes(a.id));
  const comparisonData = [
    { metric: 'Risk Score', ...Object.fromEntries(compareAthletes.map((a) => [a.name.split(' ')[0], a.riskScore])) },
    { metric: 'Training Load', ...Object.fromEntries(compareAthletes.map((a) => [a.name.split(' ')[0], a.trainingLoad.weeklyLoad])) },
    { metric: 'Recovery', ...Object.fromEntries(compareAthletes.map((a) => [a.name.split(' ')[0], a.recovery.recoveryScore])) },
    { metric: 'Fatigue', ...Object.fromEntries(compareAthletes.map((a) => [a.name.split(' ')[0], a.recovery.muscleFatigue])) },
    { metric: 'Sleep (hrs)', ...Object.fromEntries(compareAthletes.map((a) => [a.name.split(' ')[0], a.recovery.sleepHours * 10])) },
  ];

  const COMPARE_COLORS = ['#B96545', '#8FA69A', '#C8953A', '#596267'];

  // Trend for selected athlete (full 30D)
  const a = selectedAthlete;

  // Build a recovery and fatigue trend from the 30-day risk trend
  const multiTrend = a.riskTrend.slice(-14).map((d, i) => ({
    date: d.date.slice(5),
    risk: d.score,
    recovery: Math.max(20, a.recovery.recoveryScore + (Math.sin(i / 2) * 15)),
    fatigue: Math.min(95, a.recovery.muscleFatigue + (Math.cos(i / 2) * 12)),
    load: a.trainingLoad.dailyLoads[i % 7]?.load ?? 70,
  }));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Performance Analytics</h1>
          <p className="page-subtitle">
            Trend analysis, load monitoring and athlete comparison.
          </p>
        </div>
      </div>

      {/* Top row: Risk trend + Distribution */}
      <div className="two-col-charts">
        <ChartCard
          title="Injury Risk Trend"
          subtitle={`${a.name} — 14-day risk trajectory`}
        >
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={multiTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(89,98,103,0.12)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#596267' }} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#596267', fontFamily: 'monospace' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="risk" name="Risk Score" stroke="#B96545" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Squad Risk Distribution" subtitle="Current risk level breakdown">
          <div className="pie-chart-wrapper">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie
                  data={riskDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {riskDist.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v} athletes`, '']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pie-legend">
              {riskDist.map((d) => (
                <div key={d.name} className="pie-legend-item">
                  <span className="pie-legend-dot" style={{ background: d.color }} />
                  <span className="pie-legend-label">{d.name}</span>
                  <span className="pie-legend-value font-mono">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Training load + Recovery/Fatigue */}
      <div className="two-col-charts">
        <ChartCard title="Training Load" subtitle="14-day load with fatigue overlay">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={multiTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(89,98,103,0.1)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#596267' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#596267', fontFamily: 'monospace' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="load" name="Training Load" fill="#B96545" opacity={0.8} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Recovery & Fatigue" subtitle="14-day trend">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={multiTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(89,98,103,0.1)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#596267' }} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#596267', fontFamily: 'monospace' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} iconType="line" />
              <Line type="monotone" dataKey="recovery" name="Recovery" stroke="#8FA69A" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="fatigue" name="Fatigue" stroke="#B96545" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Athlete comparison */}
      <ChartCard
        title="Athlete Comparison"
        subtitle="Select up to 4 athletes to compare key performance indicators"
        actions={
          <div className="compare-selector">
            {ATHLETES.map((a) => (
              <button
                key={a.id}
                className={clsx(
                  'compare-athlete-btn',
                  compareIds.includes(a.id) && 'compare-athlete-btn-active'
                )}
                onClick={() => toggleCompare(a.id)}
                title={a.name}
              >
                {a.name.charAt(0)}
              </button>
            ))}
          </div>
        }
      >
        <div className="compare-labels">
          {compareAthletes.map((a, i) => (
            <div key={a.id} className="compare-label-item">
              <span className="compare-label-dot" style={{ background: COMPARE_COLORS[i] }} />
              <span>{a.name}</span>
              <RiskBadge level={a.riskLevel} size="sm" />
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={comparisonData} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(89,98,103,0.12)" vertical={false} />
            <XAxis dataKey="metric" tick={{ fontSize: 11, fill: '#596267' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#596267', fontFamily: 'monospace' }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {compareAthletes.map((a, i) => (
              <Bar
                key={a.id}
                dataKey={a.name.split(' ')[0]}
                fill={COMPARE_COLORS[i]}
                opacity={0.85}
                radius={[2, 2, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
};
