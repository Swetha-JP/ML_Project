import React from 'react';
import clsx from 'clsx';

interface ChartCardProps {
  title:     string;
  subtitle?: string;
  children:  React.ReactNode;
  actions?:  React.ReactNode;
  className?: string;
}

export function ChartCard({ title, subtitle, children, actions, className }: ChartCardProps) {
  return (
    <div className={clsx('chart-card', className)}>
      <div className="chart-card-header">
        <div>
          <h3 className="chart-card-title">{title}</h3>
          {subtitle && <p className="chart-card-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="chart-card-actions">{actions}</div>}
      </div>
      <div className="chart-card-body">{children}</div>
    </div>
  );
}
