import React from 'react';
import type { RiskFactor as RiskFactorType } from '../../types';
import clsx from 'clsx';

const impactLabels = { high: 'HIGH IMPACT', medium: 'MEDIUM IMPACT', low: 'LOW IMPACT' };

export function RiskFactorItem({ factor }: { factor: RiskFactorType }) {
  const isRisk   = factor.type === 'risk';
  const absImpact = Math.abs(factor.impact);
  const barWidth  = Math.min(100, absImpact * 3.5);

  return (
    <div className="risk-factor-item">
      <div className="risk-factor-header">
        <span className="risk-factor-name">{factor.name}</span>
        <div className="risk-factor-meta">
          <span className={clsx('risk-factor-impact-label', `impact-${factor.impactLevel}`)}>
            {impactLabels[factor.impactLevel]}
          </span>
          <span className={clsx('risk-factor-pct font-mono', isRisk ? 'text-danger' : 'text-sage')}>
            {isRisk ? '+' : ''}{factor.impact}%
          </span>
        </div>
      </div>
      <div className="risk-factor-bar-track">
        <div className={clsx('risk-factor-bar-fill', isRisk ? 'risk-fill' : 'protective-fill')}
          style={{ width: `${barWidth}%` }} />
      </div>
    </div>
  );
}
