// ============================================================
// AthleteSafe – Core Type Definitions
// ============================================================

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface BiomechanicalData {
  kneeFlexionAngle: number;      // degrees
  kneeValgusAngle: number;       // degrees
  hipAngle: number;              // degrees
  ankleDorsiflexion: number;     // degrees
  strideSymmetry: number;        // %
  strideLength: number;          // cm
  groundContactTime: number;     // ms
  forceAsymmetry: number;        // %
}

export interface InjuryRecord {
  id: string;
  date: string;
  type: string;
  severity: 'minor' | 'moderate' | 'severe';
  bodyPart: string;
  daysOut: number;
  notes?: string;
}

export interface TrainingLoad {
  trainingDaysPerWeek: number;
  trainingDurationMinutes: number;
  rpe: number;                   // Rate of Perceived Exertion 1-10
  weeklyLoad: number;            // AU (arbitrary units)
  dailyLoads: { date: string; load: number }[];
}

export interface RecoveryData {
  sleepHours: number;
  sleepQuality: number;          // 1-10
  recoveryScore: number;         // 0-100
  restDays: number;
  muscleFatigue: number;         // 0-100
}

export interface Athlete {
  id: string;
  name: string;
  age: number;
  sport: string;
  position: string;
  height: number;                // cm
  weight: number;                // kg
  experience: number;            // years
  avatar?: string;
  riskScore: number;             // 0-100
  riskLevel: RiskLevel;
  previousRiskScore?: number;
  trainingLoad: TrainingLoad;
  recovery: RecoveryData;
  biomechanics: BiomechanicalData;
  injuryHistory: InjuryRecord[];
  lastAssessment: string;        // ISO date string
  riskTrend: { date: string; score: number }[];
  recommendations: string[];
}

export interface AssessmentInput {
  // Athlete Info
  age: number;
  sport: string;
  position: string;
  height: number;
  weight: number;
  experience: number;
  // Injury History
  previousInjuries: string;
  numberOfPreviousInjuries: number;
  daysSinceLastInjury: number;
  previousInjurySeverity: 'none' | 'minor' | 'moderate' | 'severe';
  // Training Load
  trainingDaysPerWeek: number;
  trainingDurationMinutes: number;
  rpe: number;
  weeklyTrainingLoad: number;
  // Recovery & Wellness
  sleepHours: number;
  sleepQuality: number;
  recoveryScore: number;
  restDays: number;
  muscleFatigue: number;
  // Biomechanical
  kneeFlexionAngle: number;
  kneeValgusAngle: number;
  hipAngle: number;
  ankleDorsiflexion: number;
  strideSymmetry: number;
  strideLength: number;
  groundContactTime: number;
  forceAsymmetry: number;
}

export interface RiskFactor {
  name: string;
  impact: number;                // positive = increases risk, negative = decreases
  impactLevel: 'high' | 'medium' | 'low';
  type: 'risk' | 'protective';
}

export interface PredictionResult {
  riskScore: number;
  riskLevel: RiskLevel;
  previousRiskScore?: number;
  riskChange?: number;
  riskFactors: RiskFactor[];
  protectiveFactors: RiskFactor[];
  whatToMonitor: string[];
  recommendations: string[];
  confidence?: number;
  modelVersion: string;
  disclaimer: string;
}

export interface AssessmentRecord {
  id: string;
  date: string;
  athleteId: string;
  athleteName: string;
  sport: string;
  riskScore: number;
  riskLevel: RiskLevel;
  trainingLoad: number;
  recovery: number;
  fatigue: number;
  notes?: string;
  result: PredictionResult;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

// ── Pose Analysis ────────────────────────────────────────────

export interface PoseKeypoint {
  name: string;
  x: number;         // 0–100 % of image width
  y: number;         // 0–100 % of image height
  confidence: number; // 0–1
}

export interface PoseJointAngle {
  joint: string;
  angle: number;
  normalRange: [number, number];
  status: 'normal' | 'caution' | 'risk';
  deviation: number;  // degrees outside normal range (0 if within)
}

export interface PoseSegment {
  label: string;           // e.g. "Left Knee"
  finding: string;         // short clinical finding
  severity: 'normal' | 'mild' | 'moderate' | 'severe';
  details: string;
}

export interface PoseAnalysisResult {
  id: string;
  imageUrl: string;
  imageName: string;
  analyzedAt: string;
  sport: string;
  athleteName: string;

  // Detected pose
  keypoints: PoseKeypoint[];
  jointAngles: PoseJointAngle[];

  // Risk output
  overallRiskScore: number;
  riskLevel: RiskLevel;
  confidence: number;

  // Body segments
  segments: PoseSegment[];

  // Derived risk factors
  riskFactors: RiskFactor[];
  protectiveFactors: RiskFactor[];

  // Recommendations
  recommendations: string[];
  whatToMonitor: string[];

  // Summary text
  summary: string;
  disclaimer: string;

  modelVersion: string;
}
