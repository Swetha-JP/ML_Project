import React, { useState, useMemo } from 'react';
import { Search, Filter, Eye } from 'lucide-react';
import { ASSESSMENT_HISTORY } from '../data/assessmentHistory';
import type { AssessmentRecord } from '../types';
import { RiskBadge } from '../components/ui/RiskBadge';
import { RiskScore } from '../components/ui/RiskScore';
import { RiskFactorItem } from '../components/ui/RiskFactor';
import { Modal } from '../components/ui/Modal';
import clsx from 'clsx';

const ATHLETES_LIST = Array.from(new Set(ASSESSMENT_HISTORY.map((r) => r.athleteName)));
const RISK_LEVELS = ['all', 'low', 'moderate', 'high', 'critical'];

export const RiskHistory: React.FC = () => {
  const [search, setSearch] = useState('');
  const [athleteFilter, setAthleteFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [selectedRecord, setSelectedRecord] = useState<AssessmentRecord | null>(null);

  const filtered = useMemo(() => {
    let list = [...ASSESSMENT_HISTORY].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.athleteName.toLowerCase().includes(q) || r.sport.toLowerCase().includes(q));
    }
    if (athleteFilter !== 'all') list = list.filter((r) => r.athleteName === athleteFilter);
    if (riskFilter !== 'all') list = list.filter((r) => r.riskLevel === riskFilter);
    return list;
  }, [search, athleteFilter, riskFilter]);

  const riskScoreColor = (score: number) => {
    if (score < 35) return '#8FA69A';
    if (score < 55) return '#C8953A';
    if (score < 75) return '#B96545';
    return '#D94A4A';
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Risk History</h1>
          <p className="page-subtitle">
            Assessment records and injury risk trends over time.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-input-wrapper">
          <Search size={15} />
          <input
            className="search-input"
            placeholder="Search athlete or sport..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-select-group">
          <Filter size={14} />
          <select
            className="filter-select"
            value={athleteFilter}
            onChange={(e) => setAthleteFilter(e.target.value)}
          >
            <option value="all">All Athletes</option>
            {ATHLETES_LIST.map((n) => <option key={n}>{n}</option>)}
          </select>
          <select
            className="filter-select"
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
          >
            {RISK_LEVELS.map((r) => (
              <option key={r} value={r}>
                {r === 'all' ? 'All Risk Levels' : r.charAt(0).toUpperCase() + r.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Athlete</th>
              <th>Sport</th>
              <th>Risk Score</th>
              <th>Risk Level</th>
              <th>Training Load</th>
              <th>Recovery</th>
              <th>Fatigue</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="table-empty">No assessment records match the current filters.</td>
              </tr>
            ) : (
              filtered.map((rec) => (
                <tr
                  key={rec.id}
                  className="table-row-hover"
                  onClick={() => setSelectedRecord(rec)}
                >
                  <td className="font-mono table-date">
                    {new Date(rec.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    <div className="table-athlete-cell">
                      <div className="table-avatar-sm">{rec.athleteName.charAt(0)}</div>
                      <span>{rec.athleteName}</span>
                    </div>
                  </td>
                  <td className="table-sport">{rec.sport}</td>
                  <td>
                    <span
                      className="font-mono table-risk-score"
                      style={{ color: riskScoreColor(rec.riskScore) }}
                    >
                      {rec.riskScore}%
                    </span>
                  </td>
                  <td><RiskBadge level={rec.riskLevel} size="sm" /></td>
                  <td>
                    <span className={clsx(
                      'font-mono table-metric',
                      rec.trainingLoad > 80 ? 'text-danger' : rec.trainingLoad > 65 ? 'text-amber' : ''
                    )}>
                      {rec.trainingLoad}
                    </span>
                  </td>
                  <td>
                    <span className={clsx(
                      'font-mono table-metric',
                      rec.recovery < 50 ? 'text-danger' : rec.recovery < 65 ? 'text-amber' : 'text-sage'
                    )}>
                      {rec.recovery}
                    </span>
                  </td>
                  <td>
                    <span className={clsx(
                      'font-mono table-metric',
                      rec.fatigue > 75 ? 'text-danger' : rec.fatigue > 60 ? 'text-amber' : 'text-sage'
                    )}>
                      {rec.fatigue}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => { e.stopPropagation(); setSelectedRecord(rec); }}
                    >
                      <Eye size={13} /> View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Assessment Detail Modal */}
      <Modal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title="Assessment Record"
        size="lg"
      >
        {selectedRecord && (
          <div className="assessment-detail">
            <div className="assessment-detail-header">
              <div>
                <h3 className="assessment-detail-athlete">{selectedRecord.athleteName}</h3>
                <p className="assessment-detail-meta">
                  {selectedRecord.sport} ·{' '}
                  {new Date(selectedRecord.date).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              </div>
              <RiskBadge level={selectedRecord.riskLevel} />
            </div>

            <div className="assessment-detail-body">
              <div className="assessment-detail-score">
                <RiskScore
                  score={selectedRecord.riskScore}
                  level={selectedRecord.riskLevel}
                  previousScore={selectedRecord.result.previousRiskScore}
                  size="sm"
                />
              </div>

              <div className="assessment-detail-metrics">
                {[
                  { label: 'Training Load', value: selectedRecord.trainingLoad },
                  { label: 'Recovery Score', value: selectedRecord.recovery },
                  { label: 'Muscle Fatigue', value: selectedRecord.fatigue },
                ].map((m) => (
                  <div key={m.label} className="detail-metric">
                    <span className="detail-metric-label">{m.label}</span>
                    <span className="detail-metric-value font-mono">{m.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="assessment-detail-factors">
              <h4>Risk Factors</h4>
              {selectedRecord.result.riskFactors.map((f) => (
                <RiskFactorItem key={f.name} factor={f} />
              ))}
            </div>

            {selectedRecord.result.protectiveFactors.length > 0 && (
              <div className="assessment-detail-factors">
                <h4>Protective Factors</h4>
                {selectedRecord.result.protectiveFactors.map((f) => (
                  <RiskFactorItem key={f.name} factor={f} />
                ))}
              </div>
            )}

            <div className="result-disclaimer mt-4">
              <span>{selectedRecord.result.disclaimer}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
