import React, { useState, useMemo } from 'react';
import { Search, Filter, ChevronUp, ChevronDown, X } from 'lucide-react';
import { ATHLETES } from '../data/athletes';
import type { Athlete, RiskLevel } from '../types';
import { RiskBadge } from '../components/ui/RiskBadge';
import { AthleteProfile } from '../components/AthleteProfile';
import { useApp } from '../context/AppContext';
import clsx from 'clsx';

type SortKey = 'riskScore' | 'name' | 'recovery' | 'trainingLoad' | 'fatigue';
type SortDir = 'asc' | 'desc';

const SPORTS = ['All Sports', 'Football', 'Basketball', 'Cricket', 'Athletics', 'Tennis'];
const RISK_LEVELS: { label: string; value: string }[] = [
  { label: 'All Risk Levels', value: 'all' },
  { label: 'Low', value: 'low' },
  { label: 'Moderate', value: 'moderate' },
  { label: 'High', value: 'high' },
  { label: 'Critical', value: 'critical' },
];

export const Athletes: React.FC = () => {
  const { setSelectedAthlete } = useApp();
  const [search, setSearch] = useState('');
  const [sport, setSport] = useState('All Sports');
  const [riskFilter, setRiskFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('riskScore');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [profileAthlete, setProfileAthlete] = useState<Athlete | null>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const filtered = useMemo(() => {
    let list = [...ATHLETES];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) => a.name.toLowerCase().includes(q) ||
          a.sport.toLowerCase().includes(q) ||
          a.position.toLowerCase().includes(q)
      );
    }
    if (sport !== 'All Sports') list = list.filter((a) => a.sport === sport);
    if (riskFilter !== 'all') list = list.filter((a) => a.riskLevel === riskFilter);

    list.sort((a, b) => {
      let av = 0, bv = 0;
      if (sortKey === 'riskScore') { av = a.riskScore; bv = b.riskScore; }
      else if (sortKey === 'recovery') { av = a.recovery.recoveryScore; bv = b.recovery.recoveryScore; }
      else if (sortKey === 'trainingLoad') { av = a.trainingLoad.weeklyLoad; bv = b.trainingLoad.weeklyLoad; }
      else if (sortKey === 'fatigue') { av = a.recovery.muscleFatigue; bv = b.recovery.muscleFatigue; }
      else { return sortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name); }
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return list;
  }, [search, sport, riskFilter, sortKey, sortDir]);

  const SortIcon: React.FC<{ col: SortKey }> = ({ col }) => {
    if (sortKey !== col) return <ChevronUp size={13} opacity={0.3} />;
    return sortDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />;
  };

  const riskLevelColor = (level: RiskLevel) => {
    const map: Record<RiskLevel, string> = {
      low: '#8FA69A', moderate: '#C8953A', high: '#B96545', critical: '#D94A4A',
    };
    return map[level];
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Athlete Directory</h1>
          <p className="page-subtitle">
            {ATHLETES.length} athletes · {filtered.length} shown
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-input-wrapper">
          <Search size={15} />
          <input
            className="search-input"
            placeholder="Search athletes, sports, positions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="search-clear">
              <X size={13} />
            </button>
          )}
        </div>
        <div className="filter-select-group">
          <Filter size={14} />
          <select
            className="filter-select"
            value={sport}
            onChange={(e) => setSport(e.target.value)}
          >
            {SPORTS.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select
            className="filter-select"
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
          >
            {RISK_LEVELS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th className="sortable" onClick={() => handleSort('name')}>
                Athlete <SortIcon col="name" />
              </th>
              <th>Sport / Position</th>
              <th className="sortable" onClick={() => handleSort('riskScore')}>
                Risk Score <SortIcon col="riskScore" />
              </th>
              <th>Risk Level</th>
              <th className="sortable" onClick={() => handleSort('recovery')}>
                Recovery <SortIcon col="recovery" />
              </th>
              <th className="sortable" onClick={() => handleSort('fatigue')}>
                Fatigue <SortIcon col="fatigue" />
              </th>
              <th className="sortable" onClick={() => handleSort('trainingLoad')}>
                Training Load <SortIcon col="trainingLoad" />
              </th>
              <th>Last Assessment</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="table-empty">
                  No athletes match the current filters.
                </td>
              </tr>
            ) : (
              filtered.map((a) => (
                <tr
                  key={a.id}
                  className="table-row-hover"
                  onClick={() => setProfileAthlete(a)}
                >
                  <td>
                    <div className="table-athlete-cell">
                      <div
                        className="table-avatar"
                        style={{ borderColor: riskLevelColor(a.riskLevel) }}
                      >
                        {a.name.charAt(0)}
                      </div>
                      <span className="table-athlete-name">{a.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="table-sport">{a.sport}</span>
                    <span className="table-position">{a.position}</span>
                  </td>
                  <td>
                    <span
                      className="font-mono table-risk-score"
                      style={{ color: riskLevelColor(a.riskLevel) }}
                    >
                      {a.riskScore}%
                    </span>
                  </td>
                  <td><RiskBadge level={a.riskLevel} size="sm" /></td>
                  <td>
                    <div className="table-bar-cell">
                      <span className={clsx(
                        'font-mono table-metric',
                        a.recovery.recoveryScore < 50 ? 'text-danger' : a.recovery.recoveryScore < 65 ? 'text-amber' : 'text-sage'
                      )}>
                        {a.recovery.recoveryScore}
                      </span>
                      <div className="table-mini-bar">
                        <div
                          className="table-mini-fill"
                          style={{
                            width: `${a.recovery.recoveryScore}%`,
                            background: a.recovery.recoveryScore >= 65 ? '#8FA69A' : a.recovery.recoveryScore >= 50 ? '#C8953A' : '#D94A4A',
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={clsx(
                      'font-mono table-metric',
                      a.recovery.muscleFatigue > 75 ? 'text-danger' : a.recovery.muscleFatigue > 60 ? 'text-amber' : 'text-sage'
                    )}>
                      {a.recovery.muscleFatigue}
                    </span>
                  </td>
                  <td>
                    <span className={clsx(
                      'font-mono table-metric',
                      a.trainingLoad.weeklyLoad > 80 ? 'text-danger' : a.trainingLoad.weeklyLoad > 65 ? 'text-amber' : ''
                    )}>
                      {a.trainingLoad.weeklyLoad}
                    </span>
                  </td>
                  <td className="table-date font-mono">
                    {new Date(a.lastAssessment).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setProfileAthlete(a);
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Profile panel */}
      {profileAthlete && (
        <AthleteProfile
          athlete={profileAthlete}
          onClose={() => setProfileAthlete(null)}
          onSelect={() => {
            setSelectedAthlete(profileAthlete);
            setProfileAthlete(null);
          }}
        />
      )}
    </div>
  );
};
