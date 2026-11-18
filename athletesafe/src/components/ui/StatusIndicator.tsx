import React from 'react';
import clsx from 'clsx';

interface Props {
  status: 'good' | 'warning' | 'danger' | 'neutral';
  label:  string;
  size?:  'sm' | 'md';
}

export function StatusIndicator({ status, label, size = 'md' }: Props) {
  return (
    <span className={clsx('status-indicator', `status-${status}`, size === 'sm' && 'status-sm')}>
      <span className="status-dot" />
      {label}
    </span>
  );
}
