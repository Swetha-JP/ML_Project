import React from 'react';
import type { RiskLevel } from '../../types';
import clsx from 'clsx';

const levelConfig: Record<RiskLevel, { label: string; stroke: string }> = {
  low:      { label: 'LOW RISK',      stroke: '#8FA69A' },
  moderate: { label: 'MODERATE RISK', stroke: '#C8953A' },
  high:     { label: 'HIGH RISK',     stroke: '#B96545' },
  critical: { label: 'CRITICAL RISK', stroke: '#D94A4A' },
};

interface Props {
  score:         number;
  level:         RiskLevel;
  previousScore?: number;
  size?:         'sm' | 'lg';
}

export function RiskScore({ score, level, previousScore, size = 'lg' }: Props) {
  const { label, stroke } = levelConfig[level];
  const radius      = size === 'lg' ? 72 : 44;
  const strokeWidth = size === 'lg' ? 7 : 5;
  const circumference = 2 * Math.PI * radius;
  const dashOffset    = circumference - (score / 100) * circumference;
  const svgSize = (radius + strokeWidth) * 2 + 4;
  const center  = svgSize / 2;
  const change  = previousScore !== undefined ? score - previousScore : null;

  return (
    <div className={clsx('risk-score-container', size === 'sm' && 'risk-score-sm')}>
      <div className="risk-score-visual">
        <svg width={svgSize} height={svgSize} style={{ transform: 'rotate(-90deg)' }}
          aria-label={`Risk score: ${score}%`}>
          <circle cx={center} cy={center} r={radius} fill="none"
            stroke="rgba(89,98,103,0.2)" strokeWidth={strokeWidth} />
          <circle cx={center} cy={center} r={radius} fill="none"
            stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 1s ease' }} />
        </svg>
        <div className="risk-score-center">
          <span className={clsx('risk-score-value font-mono', `risk-color-${level}`)}>{score}%</span>
          <span className={clsx('risk-score-label', `risk-color-${level}`)}>{label}</span>
        </div>
      </div>
      {change !== null && (
        <div className="risk-score-change">
          <span className={clsx('risk-change-value font-mono', change > 0 ? 'text-danger' : 'text-sage')}>
            {change > 0 ? '+' : ''}{change}%
          </span>
          <span className="risk-change-label">from previous</span>
        </div>
      )}
    </div>
  );
}
