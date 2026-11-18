import React, { useState } from 'react';
import {
  User, AlertCircle, Zap, Heart, Activity,
  ArrowRight, CheckCircle, AlertTriangle, Info,
} from 'lucide-react';
import { simulatePrediction } from '../services/predictionService';
import type { AssessmentInput, PredictionResult } from '../types';
import { RiskScore } from '../components/ui/RiskScore';
import { RiskBadge } from '../components/ui/RiskBadge';
import { RiskFactorItem } from '../components/ui/RiskFactor';
import { useApp } from '../context/AppContext';

const SPORTS = ['Football', 'Basketball', 'Cricket', 'Athletics', 'Tennis', 'Rugby', 'Cycling', 'Swimming', 'Other'];
const POSITIONS = ['Forward', 'Midfielder', 'Defender', 'Goalkeeper', 'Point Guard', 'Sprinter', 'Long Distance', 'Singles', 'Fast Bowler', 'Batsman', 'Other'];

const defaultInput: AssessmentInput = {
  age: 24,
  sport: 'Football',
  position: 'Midfielder',
  height: 178,
  weight: 74,
  experience: 6,
  previousInjuries: '',
  numberOfPreviousInjuries: 1,
  daysSinceLastInjury: 120,
  previousInjurySeverity: 'moderate',
  trainingDaysPerWeek: 5,
  trainingDurationMinutes: 90,
  rpe: 7,
  weeklyTrainingLoad: 70,
  sleepHours: 7,
  sleepQuality: 6,
  recoveryScore: 60,
  restDays: 2,
  muscleFatigue: 55,
  kneeFlexionAngle: 72,
  kneeValgusAngle: 6,
  hipAngle: 44,
  ankleDorsiflexion: 17,
  strideSymmetry: 92,
  strideLength: 155,
  groundContactTime: 265,
  forceAsymmetry: 8,
};

const SECTIONS = [
  { id: 'info', num: '01', label: 'Athlete Information', icon: User },
  { id: 'injury', num: '02', label: 'Injury History', icon: AlertCircle },
  { id: 'load', num: '03', label: 'Training Load', icon: Zap },
  { id: 'recovery', num: '04', label: 'Recovery & Wellness', icon: Heart },
  { id: 'biomech', num: '05', label: 'Biomechanical Data', icon: Activity },
];

const Field: React.FC<{
  label: string;
  unit?: string;
  children: React.ReactNode;
}> = ({ label, unit, children }) => (
  <div className="form-field">
    <label className="form-label">
      {label}
      {unit && <span className="form-unit">{unit}</span>}
    </label>
    {children}
  </div>
);

export const RiskAssessment: React.FC = () => {
  const { addToast } = useApp();
  const [form, setForm] = useState<AssessmentInput>(defaultInput);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<PredictionResult | null>(null);

  const set = (key: keyof AssessmentInput, value: string | number) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const LOADING_STEPS = [
    'Analysing biomechanical profile...',
    'Evaluating training load indicators...',
    'Processing recovery and wellness data...',
    'Assessing injury history patterns...',
    'Generating risk estimate...',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setLoadingStep(0);

    // Animate loading steps
    let step = 0;
    const stepInterval = setInterval(() => {
      step++;
      if (step < LOADING_STEPS.length) setLoadingStep(step);
      else clearInterval(stepInterval);
    }, 420);

    try {
      const prediction = await simulatePrediction(form);
      clearInterval(stepInterval);
      setResult(prediction);
      addToast({ type: 'success', message: 'Risk assessment completed.' });
      // Scroll to result
      setTimeout(() => {
        document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch {
      addToast({ type: 'error', message: 'Assessment failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Risk Assessment</h1>
          <p className="page-subtitle">
            Enter athlete data to generate a V1 injury risk estimate.
          </p>
        </div>
        <div className="assessment-badge">
          <Info size={13} />
          <span>V1 Prototype — Simulated Results</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="assessment-form">
        {/* Section 01 — Athlete Info */}
        <div className="assessment-section">
          <div className="assessment-section-header">
            <span className="assessment-section-num">01</span>
            <User size={16} />
            <span>Athlete Information</span>
          </div>
          <div className="form-grid-3">
            <Field label="Age" unit="years">
              <input type="number" className="form-input" value={form.age}
                onChange={e => set('age', Number(e.target.value))} min={14} max={55} />
            </Field>
            <Field label="Sport">
              <select className="form-select" value={form.sport}
                onChange={e => set('sport', e.target.value)}>
                {SPORTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Position / Role">
              <select className="form-select" value={form.position}
                onChange={e => set('position', e.target.value)}>
                {POSITIONS.map(p => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Height" unit="cm">
              <input type="number" className="form-input" value={form.height}
                onChange={e => set('height', Number(e.target.value))} min={140} max={220} />
            </Field>
            <Field label="Weight" unit="kg">
              <input type="number" className="form-input" value={form.weight}
                onChange={e => set('weight', Number(e.target.value))} min={40} max={150} />
            </Field>
            <Field label="Experience" unit="years">
              <input type="number" className="form-input" value={form.experience}
                onChange={e => set('experience', Number(e.target.value))} min={0} max={30} />
            </Field>
          </div>
        </div>

        {/* Section 02 — Injury History */}
        <div className="assessment-section">
          <div className="assessment-section-header">
            <span className="assessment-section-num">02</span>
            <AlertCircle size={16} />
            <span>Injury History</span>
          </div>
          <div className="form-grid-2">
            <Field label="Previous Injury Description">
              <input type="text" className="form-input" value={form.previousInjuries}
                placeholder="e.g. Hamstring strain, ankle sprain"
                onChange={e => set('previousInjuries', e.target.value)} />
            </Field>
            <Field label="Number of Previous Injuries">
              <input type="number" className="form-input" value={form.numberOfPreviousInjuries}
                onChange={e => set('numberOfPreviousInjuries', Number(e.target.value))} min={0} max={20} />
            </Field>
            <Field label="Days Since Last Injury" unit="days">
              <input type="number" className="form-input" value={form.daysSinceLastInjury}
                onChange={e => set('daysSinceLastInjury', Number(e.target.value))} min={0} />
            </Field>
            <Field label="Previous Injury Severity">
              <select className="form-select" value={form.previousInjurySeverity}
                onChange={e => set('previousInjurySeverity', e.target.value as AssessmentInput['previousInjurySeverity'])}>
                <option value="none">None</option>
                <option value="minor">Minor</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
              </select>
            </Field>
          </div>
        </div>

        {/* Section 03 — Training Load */}
        <div className="assessment-section">
          <div className="assessment-section-header">
            <span className="assessment-section-num">03</span>
            <Zap size={16} />
            <span>Training Load</span>
          </div>
          <div className="form-grid-2">
            <Field label="Training Days per Week">
              <input type="number" className="form-input" value={form.trainingDaysPerWeek}
                onChange={e => set('trainingDaysPerWeek', Number(e.target.value))} min={1} max={7} />
            </Field>
            <Field label="Session Duration" unit="min">
              <input type="number" className="form-input" value={form.trainingDurationMinutes}
                onChange={e => set('trainingDurationMinutes', Number(e.target.value))} min={20} max={300} />
            </Field>
            <Field label="Intensity / RPE" unit="1–10">
              <input type="number" className="form-input" value={form.rpe}
                onChange={e => set('rpe', Number(e.target.value))} min={1} max={10} step={0.1} />
            </Field>
            <Field label="Weekly Training Load" unit="AU">
              <input type="number" className="form-input" value={form.weeklyTrainingLoad}
                onChange={e => set('weeklyTrainingLoad', Number(e.target.value))} min={0} max={200} />
            </Field>
          </div>
        </div>

        {/* Section 04 — Recovery & Wellness */}
        <div className="assessment-section">
          <div className="assessment-section-header">
            <span className="assessment-section-num">04</span>
            <Heart size={16} />
            <span>Recovery & Wellness</span>
          </div>
          <div className="form-grid-3">
            <Field label="Sleep Duration" unit="hrs">
              <input type="number" className="form-input" value={form.sleepHours}
                onChange={e => set('sleepHours', Number(e.target.value))} min={3} max={12} step={0.5} />
            </Field>
            <Field label="Sleep Quality" unit="1–10">
              <input type="number" className="form-input" value={form.sleepQuality}
                onChange={e => set('sleepQuality', Number(e.target.value))} min={1} max={10} />
            </Field>
            <Field label="Recovery Score" unit="/100">
              <input type="number" className="form-input" value={form.recoveryScore}
                onChange={e => set('recoveryScore', Number(e.target.value))} min={0} max={100} />
            </Field>
            <Field label="Rest Days per Week">
              <input type="number" className="form-input" value={form.restDays}
                onChange={e => set('restDays', Number(e.target.value))} min={0} max={7} />
            </Field>
            <Field label="Muscle Fatigue" unit="/100">
              <input type="number" className="form-input" value={form.muscleFatigue}
                onChange={e => set('muscleFatigue', Number(e.target.value))} min={0} max={100} />
            </Field>
          </div>
        </div>

        {/* Section 05 — Biomechanical Data */}
        <div className="assessment-section">
          <div className="assessment-section-header">
            <span className="assessment-section-num">05</span>
            <Activity size={16} />
            <span>Biomechanical Data</span>
          </div>
          <div className="form-grid-4">
            <Field label="Knee Flexion Angle" unit="°">
              <input type="number" className="form-input font-mono" value={form.kneeFlexionAngle}
                onChange={e => set('kneeFlexionAngle', Number(e.target.value))} min={0} max={180} />
            </Field>
            <Field label="Knee Valgus Angle" unit="°">
              <input type="number" className="form-input font-mono" value={form.kneeValgusAngle}
                onChange={e => set('kneeValgusAngle', Number(e.target.value))} min={0} max={30} step={0.1} />
            </Field>
            <Field label="Hip Angle" unit="°">
              <input type="number" className="form-input font-mono" value={form.hipAngle}
                onChange={e => set('hipAngle', Number(e.target.value))} min={0} max={120} />
            </Field>
            <Field label="Ankle Dorsiflexion" unit="°">
              <input type="number" className="form-input font-mono" value={form.ankleDorsiflexion}
                onChange={e => set('ankleDorsiflexion', Number(e.target.value))} min={0} max={50} />
            </Field>
            <Field label="Stride Symmetry" unit="%">
              <input type="number" className="form-input font-mono" value={form.strideSymmetry}
                onChange={e => set('strideSymmetry', Number(e.target.value))} min={50} max={100} step={0.1} />
            </Field>
            <Field label="Stride Length" unit="cm">
              <input type="number" className="form-input font-mono" value={form.strideLength}
                onChange={e => set('strideLength', Number(e.target.value))} min={50} max={300} />
            </Field>
            <Field label="Ground Contact Time" unit="ms">
              <input type="number" className="form-input font-mono" value={form.groundContactTime}
                onChange={e => set('groundContactTime', Number(e.target.value))} min={100} max={500} />
            </Field>
            <Field label="Force Asymmetry" unit="%">
              <input type="number" className="form-input font-mono" value={form.forceAsymmetry}
                onChange={e => set('forceAsymmetry', Number(e.target.value))} min={0} max={50} step={0.1} />
            </Field>
          </div>
        </div>

        {/* Submit */}
        <div className="assessment-submit-row">
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="btn-spinner" />
                Analysing...
              </>
            ) : (
              <>
                ASSESS INJURY RISK
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Loading State */}
      {loading && (
        <div className="assessment-loading">
          <div className="loading-indicator">
            <div className="loading-spinner-ring" />
            <div className="loading-text">
              <p className="loading-main">Generating Risk Estimate</p>
              <p className="loading-step">{LOADING_STEPS[loadingStep]}</p>
            </div>
          </div>
          <div className="loading-steps">
            {LOADING_STEPS.map((step, i) => (
              <div key={step} className={`loading-step-item ${i <= loadingStep ? 'active' : ''}`}>
                {i < loadingStep ? <CheckCircle size={13} /> : <span className="step-dot" />}
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div id="result-section" className="assessment-result">
          <div className="result-header">
            <div className="result-header-left">
              <span className="result-tag">V1 PROTOTYPE PREDICTION</span>
              <h2 className="result-title">Injury Risk Estimate</h2>
            </div>
            <RiskBadge level={result.riskLevel} />
          </div>

          <div className="result-grid">
            {/* Score visual */}
            <div className="result-score-panel">
              <RiskScore
                score={result.riskScore}
                level={result.riskLevel}
                previousScore={result.previousRiskScore}
              />
              <div className="result-score-meta">
                {result.previousRiskScore && (
                  <>
                    <div className="result-meta-row">
                      <span>Previous Risk</span>
                      <span className="font-mono">{result.previousRiskScore}%</span>
                    </div>
                    <div className="result-meta-row">
                      <span>Current Risk</span>
                      <span className="font-mono">{result.riskScore}%</span>
                    </div>
                    <div className="result-meta-row">
                      <span>Change</span>
                      <span className={`font-mono ${(result.riskChange ?? 0) > 0 ? 'text-danger' : 'text-sage'}`}>
                        {(result.riskChange ?? 0) > 0 ? '+' : ''}{result.riskChange}%
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Factors */}
            <div className="result-factors-col">
              <div>
                <h4 className="result-section-title">Primary Contributors</h4>
                <div className="risk-factors-list">
                  {result.riskFactors.map((f) => (
                    <RiskFactorItem key={f.name} factor={f} />
                  ))}
                </div>
              </div>
              {result.protectiveFactors.length > 0 && (
                <div>
                  <h4 className="result-section-title">Protective Factors</h4>
                  <div className="risk-factors-list">
                    {result.protectiveFactors.map((f) => (
                      <RiskFactorItem key={f.name} factor={f} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right column */}
            <div className="result-right-col">
              <div>
                <h4 className="result-section-title">What to Monitor</h4>
                <ul className="what-to-monitor-list">
                  {result.whatToMonitor.map((item) => (
                    <li key={item}>
                      <Activity size={12} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="result-section-title">Recommended Actions</h4>
                <ul className="result-rec-list">
                  {result.recommendations.map((rec) => (
                    <li key={rec}>
                      <span className="rec-bullet" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="result-disclaimer">
            <AlertTriangle size={13} />
            <span>{result.disclaimer}</span>
          </div>
        </div>
      )}
    </div>
  );
};
