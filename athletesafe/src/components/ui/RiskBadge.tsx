import React from 'react';
import type { RiskLevel } from '../../types';
import clsx from 'clsx';

const config: Record<RiskLevel, { label: string; className: string }> = {
  low:      { label: 'LOW',      className: 'risk-badge-low' },
  moderate: { label: 'MODERATE', className: 'risk-badge-moderate' },
  high:     { label: 'HIGH',     className: 'risk-badge-high' },
  critical: { label: 'CRITICAL', className: 'risk-badge-critical' },
};

export function RiskBadge({ level, size = 'md' }: { level: RiskLevel; size?: 'sm' | 'md' }) {
  const { label, className } = config[level];
  return (
    <span className={clsx('risk-badge', className, size === 'sm' && 'risk-badge-sm')}>
      {label}
    </span>
  );
}
