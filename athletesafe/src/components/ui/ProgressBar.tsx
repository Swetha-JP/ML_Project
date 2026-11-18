import React from 'react';
import clsx from 'clsx';

interface ProgressBarProps {
  value:      number;
  max?:       number;
  color?:     'sage' | 'copper' | 'amber' | 'red' | 'slate';
  size?:      'sm' | 'md';
  showValue?: boolean;
  label?:     string;
  className?: string;
}

const colorMap = { sage: 'bg-sage', copper: 'bg-copper', amber: 'bg-amber', red: 'bg-red', slate: 'bg-slate-400' };

export function ProgressBar({ value, max = 100, color = 'copper', size = 'md', showValue = false, label, className }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={clsx('progress-bar-wrapper', className)}>
      {(label || showValue) && (
        <div className="progress-bar-meta">
          {label && <span className="progress-bar-label">{label}</span>}
          {showValue && <span className="progress-bar-value font-mono">{Math.round(pct)}%</span>}
        </div>
      )}
      <div className={clsx('progress-track', size === 'sm' && 'progress-track-sm')}>
        <div className={clsx('progress-fill', colorMap[color])} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
