// ============================================================
// AthleteSafe – Athlete Management (Full CRUD)
// ============================================================

import React, { useState, useMemo } from 'react';
import {
  Plus, Search, Filter, Pencil, Trash2, ChevronUp,
  ChevronDown, X, AlertTriangle, UserCheck, Eye,
} from 'lucide-react';
import type { Athlete, RiskLevel } from '../types';
import { useApp } from '../context/AppContext';
import { RiskBadge } from '../components/ui/RiskBadge';
import { AthleteProfile } from '../components/AthleteProfile';
import { Modal } from '../components/ui/Modal';
import clsx from 'clsx';

// ── helpers ──────────────────────────────────────────────────
const SPORTS = ['Football', 'Basketball', 'Cricket', 'Athletics', 'Tennis', 'Rugby', 'Cycling', 'Swimming', 'Other'];
const POSITIONS = ['Forward', 'Midfielder', 'Defender', 'Goalkeeper', 'Point Guard', 'Sprinter', 'Long Distance', 'Singles', 'Fast Bowler', 'Batsman', 'Other'];
const RISK_LEVELS: { label: string; value: string }[] = [
  { label: 'All Levels', value: 'all' },
  { label: 'Low', value: 'low' },
  { label: 'Moderate', value: 'moderate' },
  { label: 'High', value: 'high' },
  { label: 'Critical', value: 'critical' },
];

const riskColor = (level: RiskLevel) => {
  const m: Record<RiskLevel, string> = { low: '#8FA69A', moderate: '#C8953A', high: '#B96545', critical: '#D94A4A' };
  return m[level];
};

const inferRiskLevel = (score: number): RiskLevel => {
  if (score < 35) return 'low';
  if (score < 55) return 'moderate';
  if (score < 75) return 'high';
  return 'critical';
};

// ── blank athlete template ────────────────────────────────────
const blankAthlete = (): Omit<Athlete, 'id'> => ({
  name: '',
  age: 22,
  sport: 'Football',
  position: 'Midfielder',
  height: 175,
  weight: 72,
  experience: 4,
  riskScore: 40,
  riskLevel: 'moderate',
  previousRiskScore: undefined,
  lastAssessment: new Date().toISOString().split('T')[0],
  trainingLoad: {
    trainingDaysPerWeek: 5,
    trainingDurationMinutes: 90,
    rpe: 7,
    weeklyLoad: 65,
    dailyLoads: [],
  },
  recovery: {
    sleepHours: 7.5,
    sleepQuality: 7,
    recoveryScore: 65,
    restDays: 2,
    muscleFatigue: 45,
  },
  biomechanics: {
    kneeFlexionAngle: 72,
    kneeValgusAngle: 5,
    hipAngle: 44,
    ankleDorsiflexion: 17,
    strideSymmetry: 93,
    strideLength: 155,
    groundContactTime: 260,
    forceAsymmetry: 6,
  },
  injuryHistory: [],
  riskTrend: [],
  recommendations: [],
});

// ── Form field component ──────────────────────────────────────
const FF: React.FC<{ label: string; unit?: string; children: React.ReactNode; half?: boolean }> = ({
  label, unit, children, half,
}) => (
  <div className={clsx('form-field', half && 'form-field-half')}>
    <label className="form-label">
      {label}
      {unit && <span className="form-unit">{unit}</span>}
    </label>
    {children}
  </div>
);

// ── Athlete form modal (Create / Edit) ────────────────────────
interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initial?: Athlete | null;
  onSave: (data: Omit<Athlete, 'id'> & { id?: string }) => void;
}

const AthleteFormModal: React.FC<FormModalProps> = ({ isOpen, onClose, initial, onSave }) => {
  const isEdit = !!initial;

  const [form, setForm] = useState<Omit<Athlete, 'id'>>(() =>
    initial ? {
      name: initial.name,
      age: initial.age,
      sport: initial.sport,
      position: initial.position,
      height: initial.height,
      weight: initial.weight,
      experience: initial.experience,
      riskScore: initial.riskScore,
      riskLevel: initial.riskLevel,
      previousRiskScore: initial.previousRiskScore,
      lastAssessment: initial.lastAssessment,
      trainingLoad: { ...initial.trainingLoad },
      recovery: { ...initial.recovery },
      biomechanics: { ...initial.biomechanics },
      injuryHistory: initial.injuryHistory,
      riskTrend: initial.riskTrend,
      recommendations: initial.recommendations,
    } : blankAthlete()
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof typeof form>(key: K, val: typeof form[K]) =>
    setForm((p) => ({ ...p, [key]: val }));

  const setTL = (key: string, val: number) =>
    setForm((p) => ({ ...p, trainingLoad: { ...p.trainingLoad, [key]: val } }));

  const setRec = (key: string, val: number) =>
    setForm((p) => ({ ...p, recovery: { ...p.recovery, [key]: val } }));

  const setBio = (key: string, val: number) =>
    setForm((p) => ({ ...p, biomechanics: { ...p.biomechanics, [key]: val } }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required.';
    if (form.age < 14 || form.age > 60) e.age = 'Age must be 14–60.';
    if (form.riskScore < 0 || form.riskScore > 100) e.riskScore = 'Risk score must be 0–100.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const riskLevel = inferRiskLevel(form.riskScore);
    const payload = { ...form, riskLevel };
    if (isEdit && initial) onSave({ ...payload, id: initial.id });
    else onSave(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit — ${initial?.name}` : 'Add New Athlete'}
      size="xl"
    >
      <div className="athlete-form-modal">

        {/* ── Section 01: Basic Info ── */}
        <div className="crud-form-section">
          <div className="crud-section-title">
            <span className="crud-section-num">01</span> Basic Information
          </div>
          <div className="form-grid-3">
            <FF label="Full Name">
              <input
                className={clsx('form-input', errors.name && 'form-input-error')}
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. Alex Morgan"
              />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </FF>
            <FF label="Sport">
              <select className="form-select" value={form.sport}
                onChange={(e) => set('sport', e.target.value)}>
                {SPORTS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </FF>
            <FF label="Position">
              <select className="form-select" value={form.position}
                onChange={(e) => set('position', e.target.value)}>
                {POSITIONS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </FF>
            <FF label="Age" unit="years">
              <input type="number" className={clsx('form-input', errors.age && 'form-input-error')}
                value={form.age} min={14} max={60}
                onChange={(e) => set('age', +e.target.value)} />
              {errors.age && <span className="form-error">{errors.age}</span>}
            </FF>
            <FF label="Height" unit="cm">
              <input type="number" className="form-input" value={form.height} min={140} max={220}
                onChange={(e) => set('height', +e.target.value)} />
            </FF>
            <FF label="Weight" unit="kg">
              <input type="number" className="form-input" value={form.weight} min={40} max={160}
                onChange={(e) => set('weight', +e.target.value)} />
            </FF>
            <FF label="Experience" unit="years">
              <input type="number" className="form-input" value={form.experience} min={0} max={30}
                onChange={(e) => set('experience', +e.target.value)} />
            </FF>
            <FF label="Risk Score" unit="0–100">
              <input type="number" className={clsx('form-input font-mono', errors.riskScore && 'form-input-error')}
                value={form.riskScore} min={0} max={100}
                onChange={(e) => set('riskScore', +e.target.value)} />
              {errors.riskScore && <span className="form-error">{errors.riskScore}</span>}
            </FF>
            <FF label="Last Assessment">
              <input type="date" className="form-input"
                value={form.lastAssessment}
                onChange={(e) => set('lastAssessment', e.target.value)} />
            </FF>
          </div>
        </div>

        {/* ── Section 02: Training Load ── */}
        <div className="crud-form-section">
          <div className="crud-section-title">
            <span className="crud-section-num">02</span> Training Load
          </div>
          <div className="form-grid-3">
            <FF label="Days/Week">
              <input type="number" className="form-input" value={form.trainingLoad.trainingDaysPerWeek}
                min={1} max={7} onChange={(e) => setTL('trainingDaysPerWeek', +e.target.value)} />
            </FF>
            <FF label="Session Duration" unit="min">
              <input type="number" className="form-input" value={form.trainingLoad.trainingDurationMinutes}
                min={20} max={300} onChange={(e) => setTL('trainingDurationMinutes', +e.target.value)} />
            </FF>
            <FF label="RPE" unit="1–10">
              <input type="number" className="form-input font-mono" value={form.trainingLoad.rpe}
                min={1} max={10} step={0.1} onChange={(e) => setTL('rpe', +e.target.value)} />
            </FF>
            <FF label="Weekly Load" unit="AU">
              <input type="number" className="form-input font-mono" value={form.trainingLoad.weeklyLoad}
                min={0} max={200} onChange={(e) => setTL('weeklyLoad', +e.target.value)} />
            </FF>
          </div>
        </div>

        {/* ── Section 03: Recovery & Wellness ── */}
        <div className="crud-form-section">
          <div className="crud-section-title">
            <span className="crud-section-num">03</span> Recovery & Wellness
          </div>
          <div className="form-grid-3">
            <FF label="Sleep" unit="hrs">
              <input type="number" className="form-input" value={form.recovery.sleepHours}
                min={3} max={12} step={0.5} onChange={(e) => setRec('sleepHours', +e.target.value)} />
            </FF>
            <FF label="Sleep Quality" unit="1–10">
              <input type="number" className="form-input" value={form.recovery.sleepQuality}
                min={1} max={10} onChange={(e) => setRec('sleepQuality', +e.target.value)} />
            </FF>
            <FF label="Recovery Score" unit="/100">
              <input type="number" className="form-input font-mono" value={form.recovery.recoveryScore}
                min={0} max={100} onChange={(e) => setRec('recoveryScore', +e.target.value)} />
            </FF>
            <FF label="Rest Days/Week">
              <input type="number" className="form-input" value={form.recovery.restDays}
                min={0} max={7} onChange={(e) => setRec('restDays', +e.target.value)} />
            </FF>
            <FF label="Muscle Fatigue" unit="/100">
              <input type="number" className="form-input font-mono" value={form.recovery.muscleFatigue}
                min={0} max={100} onChange={(e) => setRec('muscleFatigue', +e.target.value)} />
            </FF>
          </div>
        </div>

        {/* ── Section 04: Biomechanics ── */}
        <div className="crud-form-section">
          <div className="crud-section-title">
            <span className="crud-section-num">04</span> Biomechanical Data
          </div>
          <div className="form-grid-4">
            <FF label="Knee Flexion" unit="°">
              <input type="number" className="form-input font-mono" value={form.biomechanics.kneeFlexionAngle}
                min={0} max={180} onChange={(e) => setBio('kneeFlexionAngle', +e.target.value)} />
            </FF>
            <FF label="Knee Valgus" unit="°">
              <input type="number" className="form-input font-mono" value={form.biomechanics.kneeValgusAngle}
                min={0} max={30} step={0.1} onChange={(e) => setBio('kneeValgusAngle', +e.target.value)} />
            </FF>
            <FF label="Hip Angle" unit="°">
              <input type="number" className="form-input font-mono" value={form.biomechanics.hipAngle}
                min={0} max={120} onChange={(e) => setBio('hipAngle', +e.target.value)} />
            </FF>
            <FF label="Ankle Dorsiflexion" unit="°">
              <input type="number" className="form-input font-mono" value={form.biomechanics.ankleDorsiflexion}
                min={0} max={50} onChange={(e) => setBio('ankleDorsiflexion', +e.target.value)} />
            </FF>
            <FF label="Stride Symmetry" unit="%">
              <input type="number" className="form-input font-mono" value={form.biomechanics.strideSymmetry}
                min={50} max={100} step={0.1} onChange={(e) => setBio('strideSymmetry', +e.target.value)} />
            </FF>
            <FF label="Stride Length" unit="cm">
              <input type="number" className="form-input font-mono" value={form.biomechanics.strideLength}
                min={50} max={300} onChange={(e) => setBio('strideLength', +e.target.value)} />
            </FF>
            <FF label="Ground Contact" unit="ms">
              <input type="number" className="form-input font-mono" value={form.biomechanics.groundContactTime}
                min={100} max={500} onChange={(e) => setBio('groundContactTime', +e.target.value)} />
            </FF>
            <FF label="Force Asymmetry" unit="%">
              <input type="number" className="form-input font-mono" value={form.biomechanics.forceAsymmetry}
                min={0} max={50} step={0.1} onChange={(e) => setBio('forceAsymmetry', +e.target.value)} />
            </FF>
          </div>
        </div>

        {/* Risk preview */}
        <div className="crud-risk-preview">
          <span className="crud-risk-preview-label">Inferred risk level:</span>
          <RiskBadge level={inferRiskLevel(form.riskScore)} />
          <span className="font-mono crud-risk-score" style={{ color: riskColor(inferRiskLevel(form.riskScore)) }}>
            {form.riskScore}%
          </span>
        </div>

        {/* Actions */}
        <div className="crud-modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>
            {isEdit ? 'Save Changes' : 'Add Athlete'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ── Delete confirm modal ──────────────────────────────────────
interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  athlete: Athlete | null;
  onConfirm: () => void;
}
const DeleteModal: React.FC<DeleteModalProps> = ({ isOpen, onClose, athlete, onConfirm }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Remove Athlete" size="sm">
    <div className="delete-confirm">
      <div className="delete-confirm-icon">
        <AlertTriangle size={24} />
      </div>
      <p className="delete-confirm-text">
        Are you sure you want to remove <strong>{athlete?.name}</strong> from the system?
        This action cannot be undone.
      </p>
      <div className="crud-modal-actions">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-danger" onClick={onConfirm}>Remove Athlete</button>
      </div>
    </div>
  </Modal>
);

// ── Main page ─────────────────────────────────────────────────
type SortKey = 'name' | 'riskScore' | 'recovery' | 'trainingLoad' | 'fatigue';
type SortDir = 'asc' | 'desc';

export const AthleteManagement: React.FC = () => {
  const { athletes, addAthlete, updateAthlete, deleteAthlete, setSelectedAthlete, addToast } = useApp();

  const [search, setSearch] = useState('');
  const [sportFilter, setSportFilter] = useState('All Sports');
  const [riskFilter, setRiskFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('riskScore');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Athlete | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Athlete | null>(null);
  const [viewTarget, setViewTarget] = useState<Athlete | null>(null);

  // Derived sport list from current athletes
  const sportList = useMemo(() => {
    const s = new Set(athletes.map((a) => a.sport));
    return ['All Sports', ...Array.from(s).sort()];
  }, [athletes]);

  const filtered = useMemo(() => {
    let list = [...athletes];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) => a.name.toLowerCase().includes(q) ||
          a.sport.toLowerCase().includes(q) ||
          a.position.toLowerCase().includes(q)
      );
    }
    if (sportFilter !== 'All Sports') list = list.filter((a) => a.sport === sportFilter);
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
  }, [athletes, search, sportFilter, riskFilter, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortIcon: React.FC<{ col: SortKey }> = ({ col }) => {
    if (sortKey !== col) return <ChevronUp size={12} opacity={0.3} />;
    return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  // ── CRUD handlers ─────────────────────────────────────────
  const handleCreate = (data: Omit<Athlete, 'id'> & { id?: string }) => {
    const newAthlete: Athlete = {
      ...data,
      id: `ath-${Date.now()}`,
      riskTrend: [{ date: new Date().toISOString().split('T')[0], score: data.riskScore }],
      recommendations: data.recommendations.length
        ? data.recommendations
        : ['Monitor training load and recovery metrics regularly.'],
    };
    addAthlete(newAthlete);
    setCreateOpen(false);
    addToast({ type: 'success', message: `${newAthlete.name} added to the system.` });
  };

  const handleUpdate = (data: Omit<Athlete, 'id'> & { id?: string }) => {
    if (!data.id) return;
    updateAthlete(data.id, data);
    setEditTarget(null);
    addToast({ type: 'success', message: `${data.name} updated successfully.` });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteAthlete(deleteTarget.id);
    addToast({ type: 'info', message: `${deleteTarget.name} removed from the system.` });
    setDeleteTarget(null);
  };

  const handleSetActive = (athlete: Athlete) => {
    setSelectedAthlete(athlete);
    addToast({ type: 'success', message: `${athlete.name} set as active athlete.` });
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Athlete Management</h1>
          <p className="page-subtitle">
            {athletes.length} athletes registered · {filtered.length} shown
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
          <Plus size={15} /> Add Athlete
        </button>
      </div>

      {/* Stats strip */}
      <div className="crud-stats-strip">
        {(
          [
            { label: 'Total Athletes', value: athletes.length, color: 'var(--graphite)' },
            { label: 'Low Risk', value: athletes.filter((a) => a.riskLevel === 'low').length, color: 'var(--sage)' },
            { label: 'Moderate', value: athletes.filter((a) => a.riskLevel === 'moderate').length, color: 'var(--amber)' },
            { label: 'High Risk', value: athletes.filter((a) => a.riskLevel === 'high').length, color: 'var(--copper)' },
            { label: 'Critical', value: athletes.filter((a) => a.riskLevel === 'critical').length, color: 'var(--red)' },
          ] as { label: string; value: number; color: string }[]
        ).map((s) => (
          <div key={s.label} className="crud-stat">
            <span className="crud-stat-value font-mono" style={{ color: s.color }}>{s.value}</span>
            <span className="crud-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-input-wrapper">
          <Search size={15} />
          <input
            className="search-input"
            placeholder="Search name, sport, position..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch('')}>
              <X size={13} />
            </button>
          )}
        </div>
        <div className="filter-select-group">
          <Filter size={14} />
          <select className="filter-select" value={sportFilter}
            onChange={(e) => setSportFilter(e.target.value)}>
            {sportList.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select className="filter-select" value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}>
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
                Risk <SortIcon col="riskScore" />
              </th>
              <th className="sortable" onClick={() => handleSort('recovery')}>
                Recovery <SortIcon col="recovery" />
              </th>
              <th className="sortable" onClick={() => handleSort('fatigue')}>
                Fatigue <SortIcon col="fatigue" />
              </th>
              <th className="sortable" onClick={() => handleSort('trainingLoad')}>
                Load <SortIcon col="trainingLoad" />
              </th>
              <th>Last Assessed</th>
              <th style={{ width: 160 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="table-empty">
                  No athletes match the current filters.
                  {search && (
                    <button className="btn btn-ghost btn-sm" style={{ marginLeft: 12 }}
                      onClick={() => setSearch('')}>
                      Clear search
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              filtered.map((athlete) => (
                <tr key={athlete.id} className="table-row-hover"
                  onClick={() => setViewTarget(athlete)}>
                  <td>
                    <div className="table-athlete-cell">
                      <div
                        className="table-avatar"
                        style={{ borderColor: riskColor(athlete.riskLevel) }}
                      >
                        {athlete.name.charAt(0)}
                      </div>
                      <div>
                        <div className="table-athlete-name">{athlete.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--slate-light)' }}>
                          {athlete.age} yrs · {athlete.experience}y exp
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="table-sport">{athlete.sport}</span>
                    <span className="table-position">{athlete.position}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="font-mono table-risk-score"
                        style={{ color: riskColor(athlete.riskLevel) }}>
                        {athlete.riskScore}%
                      </span>
                      <RiskBadge level={athlete.riskLevel} size="sm" />
                    </div>
                  </td>
                  <td>
                    <span className={clsx('font-mono table-metric',
                      athlete.recovery.recoveryScore < 50 ? 'text-danger'
                        : athlete.recovery.recoveryScore < 65 ? 'text-amber' : 'text-sage')}>
                      {athlete.recovery.recoveryScore}
                    </span>
                  </td>
                  <td>
                    <span className={clsx('font-mono table-metric',
                      athlete.recovery.muscleFatigue > 75 ? 'text-danger'
                        : athlete.recovery.muscleFatigue > 60 ? 'text-amber' : 'text-sage')}>
                      {athlete.recovery.muscleFatigue}
                    </span>
                  </td>
                  <td>
                    <span className={clsx('font-mono table-metric',
                      athlete.trainingLoad.weeklyLoad > 80 ? 'text-danger'
                        : athlete.trainingLoad.weeklyLoad > 65 ? 'text-amber' : '')}>
                      {athlete.trainingLoad.weeklyLoad}
                    </span>
                  </td>
                  <td className="table-date font-mono">
                    {new Date(athlete.lastAssessment).toLocaleDateString('en-GB', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </td>
                  <td>
                    <div className="crud-action-btns" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="crud-action-btn crud-action-view"
                        title="View profile"
                        onClick={() => setViewTarget(athlete)}
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        className="crud-action-btn crud-action-active"
                        title="Set as active athlete"
                        onClick={() => handleSetActive(athlete)}
                      >
                        <UserCheck size={13} />
                      </button>
                      <button
                        className="crud-action-btn crud-action-edit"
                        title="Edit athlete"
                        onClick={() => setEditTarget(athlete)}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        className="crud-action-btn crud-action-delete"
                        title="Remove athlete"
                        onClick={() => setDeleteTarget(athlete)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <AthleteFormModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSave={handleCreate}
      />
      <AthleteFormModal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        initial={editTarget}
        onSave={handleUpdate}
      />
      <DeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        athlete={deleteTarget}
        onConfirm={handleDelete}
      />
      {viewTarget && (
        <AthleteProfile
          athlete={viewTarget}
          onClose={() => setViewTarget(null)}
          onSelect={() => {
            handleSetActive(viewTarget);
            setViewTarget(null);
          }}
        />
      )}
    </div>
  );
};
