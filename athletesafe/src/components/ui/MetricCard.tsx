import React from 'react';
import clsx from 'clsx';

interface MetricCardProps {
  label:       string;
  value:       string | number;
  unit?:       string;
  status?:     'good' | 'warning' | 'danger' | 'neutral';
  statusLabel?: string;
  icon?:       React.ReactNode;
  className?:  string;
}

export function MetricCard({ label, value, unit, status = 'neutral', statusLabel, icon, className }: MetricCardProps) {
  return (
    <div className={clsx('metric-card', className)}>
      <div className="metric-card-header">
        <span className="metric-card-label">{label}</span>
        {icon && <span className="metric-card-icon">{icon}</span>}
      </div>
      <div className="metric-card-body">
        <span className="metric-value font-mono">{value}</span>
        {unit && <span className="metric-unit">{unit}</span>}
      </div>
      {statusLabel && (
        <div className={clsx('metric-status', `metric-status-${status}`)}>{statusLabel}</div>
      )}
    </div>
  );
}
