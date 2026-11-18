// ============================================================
// AthleteSafe – Prediction Service
// Calls FastAPI backend. Falls back to simulation if unavailable.
// ============================================================
import type { AssessmentInput, PredictionResult, RiskLevel, RiskFactor } from '../types';
import { predictApi } from './api';

const getRiskLevel = (score: number): RiskLevel => {
  if (score < 35) return 'low';
  if (score < 55) return 'moderate';
  if (score < 75) return 'high';
  return 'critical';
};

// ── Map frontend AssessmentInput to backend snake_case ────────
const toApiPayload = (input: AssessmentInput) => ({
  age:                          input.age,
  sport:                        input.sport,
  position:                     input.position,
  height:                       input.height,
  weight:                       input.weight,
  experience:                   input.experience,
  previous_injuries:            input.previousInjuries,
  number_of_previous_injuries:  input.numberOfPreviousInjuries,
  days_since_last_injury:       input.daysSinceLastInjury,
  previous_injury_severity:     input.previousInjurySeverity,
  training_days_per_week:       input.trainingDaysPerWeek,
  training_duration_minutes:    input.trainingDurationMinutes,
  rpe:                          input.rpe,
  weekly_training_load:         input.weeklyTrainingLoad,
  sleep_hours:                  input.sleepHours,
  sleep_quality:                input.sleepQuality,
  recovery_score:               input.recoveryScore,
  rest_days:                    input.restDays,
  muscle_fatigue:               input.muscleFatigue,
  knee_flexion_angle:           input.kneeFlexionAngle,
  knee_valgus_angle:            input.kneeValgusAngle,
  hip_angle:                    input.hipAngle,
  ankle_dorsiflexion:           input.ankleDorsiflexion,
  stride_symmetry:              input.strideSymmetry,
  stride_length:                input.strideLength,
  ground_contact_time:          input.groundContactTime,
  force_asymmetry:              input.forceAsymmetry,
});

// ── Map backend response to frontend PredictionResult ────────
const fromApiResponse = (data: any): PredictionResult => ({
  riskScore:         data.risk_score,
  riskLevel:         data.risk_level as RiskLevel,
  previousRiskScore: data.previous_risk_score,
  riskChange:        data.risk_change,
  riskFactors:       (data.risk_factors ?? []).map((f: any): RiskFactor => ({
    name:        f.name,
    impact:      f.impact,
    impactLevel: f.impact_level,
    type:        f.type,
  })),
  protectiveFactors: (data.protective_factors ?? []).map((f: any): RiskFactor => ({
    name:        f.name,
    impact:      f.impact,
    impactLevel: f.impact_level,
    type:        f.type,
  })),
  whatToMonitor:  data.what_to_monitor ?? [],
  recommendations: data.recommendations ?? [],
  confidence:     data.confidence,
  modelVersion:   data.model_version ?? 'GradientBoost-V1',
  disclaimer:     data.disclaimer ?? 'AthleteSafe provides decision-support insights. Not a medical diagnostic system.',
});

// ── Main export ───────────────────────────────────────────────
export const simulatePrediction = async (input: AssessmentInput): Promise<PredictionResult> => {
  try {
    const data = await predictApi.predict(toApiPayload(input));
    return fromApiResponse(data);
  } catch {
    // Fallback to local rule-based if backend unreachable
    console.warn('Backend unavailable — using local prediction fallback');
    return localPredict(input);
  }
};

// ── Local fallback (keeps app usable without backend) ─────────
const localPredict = (input: AssessmentInput): PredictionResult => {
  let score = 20;
  const loadContrib     = Math.round(((input.weeklyTrainingLoad - 50) / 60) * 20);
  const fatigueContrib  = Math.round((input.muscleFatigue / 100) * 15);
  const sleepContrib    = Math.round(((7.5 - input.sleepHours) / 3) * 12);
  const recoveryContrib = Math.round(((60 - input.recoveryScore) / 60) * 10);
  const injuryContrib   = Math.round(input.numberOfPreviousInjuries * 5);
  const valgusContrib   = Math.round((input.kneeValgusAngle - 5) * 1.2);
  const asymContrib     = Math.round(input.forceAsymmetry * 0.8);

  score += Math.max(0, loadContrib) + fatigueContrib + Math.max(0, sleepContrib) +
           Math.max(0, recoveryContrib) + injuryContrib + Math.max(0, valgusContrib) +
           Math.max(0, asymContrib);
  score = Math.max(5, Math.min(95, score));

  const riskLevel = getRiskLevel(score);
  const riskFactors: RiskFactor[] = [];
  if (loadContrib > 3) riskFactors.push({ name: 'Training Load', impact: loadContrib, impactLevel: 'high', type: 'risk' });
  if (fatigueContrib > 5) riskFactors.push({ name: 'Muscle Fatigue', impact: fatigueContrib, impactLevel: 'high', type: 'risk' });
  if (sleepContrib > 3) riskFactors.push({ name: 'Sleep Deficit', impact: sleepContrib, impactLevel: 'medium', type: 'risk' });
  if (injuryContrib > 0) riskFactors.push({ name: 'Previous Injuries', impact: injuryContrib, impactLevel: 'medium', type: 'risk' });

  return {
    riskScore: Math.round(score), riskLevel,
    riskFactors, protectiveFactors: [],
    whatToMonitor: ['Training load', 'Recovery', 'Fatigue'],
    recommendations: ['Monitor workload carefully', 'Prioritise sleep and recovery'],
    confidence: 0.65, modelVersion: 'Local-Fallback-V1',
    disclaimer: 'Backend unavailable — using local estimation. Connect backend for ML predictions.',
  };
};
