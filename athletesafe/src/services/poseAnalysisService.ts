// ============================================================
// AthleteSafe – Pose Analysis Service
// Calls FastAPI/MediaPipe backend. Falls back to simulation if unavailable.
// ============================================================
import type {
  PoseAnalysisResult, RiskLevel, RiskFactor,
  PoseKeypoint, PoseJointAngle, PoseSegment,
} from '../types';
import { poseApi } from './api';

const toRiskLevel = (s: string): RiskLevel =>
  ['low', 'moderate', 'high', 'critical'].includes(s) ? (s as RiskLevel) : 'moderate';

const mapFactor = (f: any): RiskFactor => ({
  name:        f.name,
  impact:      f.impact,
  impactLevel: (f.impact_level ?? f.impactLevel ?? 'medium') as 'high' | 'medium' | 'low',
  type:        f.type,
});

const fromApiResponse = (data: any, imageUrl: string, imageName: string): PoseAnalysisResult => ({
  id:               data.id ?? `pose-${Date.now()}`,
  imageUrl,
  imageName,
  analyzedAt:       data.created_at ?? new Date().toISOString(),
  sport:            data.sport,
  athleteName:      data.athlete_name,
  keypoints:        (data.keypoints ?? []) as PoseKeypoint[],
  jointAngles:      (data.joint_angles ?? []).map((j: any): PoseJointAngle => ({
    joint:       j.joint,
    angle:       j.angle,
    normalRange: j.normal_range ?? [0, 180],
    status:      j.status ?? 'normal',
    deviation:   j.deviation ?? 0,
  })),
  overallRiskScore:  data.risk_score,
  riskLevel:         toRiskLevel(data.risk_level),
  confidence:        data.confidence,
  segments:         (data.segments ?? []).map((s: any): PoseSegment => ({
    label:    s.label,
    finding:  s.finding,
    severity: s.severity ?? 'normal',
    details:  s.details ?? '',
  })),
  riskFactors:       (data.risk_factors ?? []).map(mapFactor),
  protectiveFactors: (data.protective_factors ?? []).map(mapFactor),
  recommendations:   data.recommendations ?? [],
  whatToMonitor:     data.what_to_monitor ?? [],
  summary:           data.summary ?? '',
  disclaimer:        data.disclaimer ?? 'Not a clinical assessment.',
  modelVersion:      data.model_version ?? 'MediaPipe-Pose-V2',
});

export const analyzePose = async (
  imageUrl: string,
  imageName: string,
  sport: string,
  athleteName: string,
  imageFile?: File,
): Promise<PoseAnalysisResult> => {
  if (imageFile) {
    try {
      const data = await poseApi.analyze(imageFile, sport, athleteName);
      return fromApiResponse(data, imageUrl, imageName);
    } catch (err) {
      console.warn('Pose API unavailable — using simulation fallback');
    }
  }
  return simulatePose(imageUrl, imageName, sport, athleteName);
};

// ── Sport-specific normal ranges (mirrors backend) ────────────
const SPORT_NORMAL_RANGES: Record<string, Record<string, [number, number]>> = {
  Football:   { 'Left Knee': [60,90],  'Right Knee': [60,90],  'Left Hip': [30,55],  'Right Hip': [30,55],  'Left Ankle': [15,30], 'Right Ankle': [15,30], 'Left Shoulder': [20,65], 'Right Shoulder': [20,65], 'Lumbar Spine': [10,25] },
  Basketball: { 'Left Knee': [55,85],  'Right Knee': [55,85],  'Left Hip': [30,50],  'Right Hip': [30,50],  'Left Ankle': [12,28], 'Right Ankle': [12,28], 'Left Shoulder': [20,70], 'Right Shoulder': [20,70], 'Lumbar Spine': [10,28] },
  Cricket:    { 'Left Knee': [60,90],  'Right Knee': [60,90],  'Left Hip': [35,55],  'Right Hip': [35,55],  'Left Ankle': [14,28], 'Right Ankle': [14,28], 'Left Shoulder': [15,60], 'Right Shoulder': [15,60], 'Lumbar Spine': [8,25]  },
  Athletics:  { 'Left Knee': [65,95],  'Right Knee': [65,95],  'Left Hip': [35,60],  'Right Hip': [35,60],  'Left Ankle': [18,32], 'Right Ankle': [18,32], 'Left Shoulder': [20,60], 'Right Shoulder': [20,60], 'Lumbar Spine': [8,22]  },
  Tennis:     { 'Left Knee': [60,88],  'Right Knee': [60,88],  'Left Hip': [30,52],  'Right Hip': [30,52],  'Left Ankle': [15,30], 'Right Ankle': [15,30], 'Left Shoulder': [15,55], 'Right Shoulder': [15,55], 'Lumbar Spine': [10,25] },
  Rugby:      { 'Left Knee': [55,82],  'Right Knee': [55,82],  'Left Hip': [28,50],  'Right Hip': [28,50],  'Left Ankle': [12,26], 'Right Ankle': [12,26], 'Left Shoulder': [18,65], 'Right Shoulder': [18,65], 'Lumbar Spine': [10,28] },
  Cycling:    { 'Left Knee': [68,100], 'Right Knee': [68,100], 'Left Hip': [38,62],  'Right Hip': [38,62],  'Left Ankle': [10,25], 'Right Ankle': [10,25], 'Left Shoulder': [20,60], 'Right Shoulder': [20,60], 'Lumbar Spine': [12,32] },
  Swimming:   { 'Left Knee': [60,90],  'Right Knee': [60,90],  'Left Hip': [30,55],  'Right Hip': [30,55],  'Left Ankle': [12,28], 'Right Ankle': [12,28], 'Left Shoulder': [10,50], 'Right Shoulder': [10,50], 'Lumbar Spine': [8,22]  },
  Default:    { 'Left Knee': [65,90],  'Right Knee': [65,90],  'Left Hip': [35,55],  'Right Hip': [35,55],  'Left Ankle': [15,30], 'Right Ankle': [15,30], 'Left Shoulder': [20,60], 'Right Shoulder': [20,60], 'Lumbar Spine': [10,30] },
};

// ── Sport-specific recommendations (mirrors backend) ──────────
const SPORT_RECS: Record<string, Record<string, string>> = {
  Football:   { knee_high: 'ACL risk elevated — add Copenhagen adductor and single-leg squat drills before training.', knee_mild: 'Monitor knee alignment during cutting and direction-change drills.', hip_high: 'Pelvic drop detected — glute med weakness probable. Add hip abductor strengthening.', hip_mild: 'Mild hip imbalance — include single-leg RDLs in warmup.', ankle_res: 'Ankle dorsiflexion restricted — ankle sprain risk on rapid direction changes. Prioritise ankle mobility work.', ankle_lim: 'Limited ankle mobility — add calf stretching and banded ankle mobilisation.', lumbar: 'Excessive lumbar flexion — reduce sprint volume and check hamstring flexibility.', shoulder: 'Shoulder range restricted — add rotator cuff activation (relevant for goalkeepers).', symmetry: 'Good bilateral symmetry — maintain with regular symmetry checks during season.' },
  Basketball: { knee_high: 'High knee asymmetry on landing — ACL and patellar tendon risk. Implement landing mechanics training.', knee_mild: 'Mild knee asymmetry — monitor during jump landing and pivoting drills.', hip_high: 'Hip drop under load — add glute activation (clamshells, banded walks) pre-practice.', hip_mild: 'Mild hip imbalance — single-leg landing drills advised.', ankle_res: 'Ankle dorsiflexion severely limited — high ankle sprain and Achilles risk. Immediate mobilisation programme required.', ankle_lim: 'Ankle mobility limited — daily dorsiflexion stretching and eccentric calf work.', lumbar: 'Lumbar flexion elevated — check core bracing during jump-land sequences.', shoulder: 'Shoulder mechanics outside normal — monitor for impingement during overhead shooting.', symmetry: 'Good landing symmetry — continue plyometric quality monitoring.' },
  Cricket:    { knee_high: 'Knee asymmetry in bowling stride — lateral knee stress elevated. Assess front-foot landing mechanics with coach.', knee_mild: 'Mild stride asymmetry — review run-up and delivery stride consistency.', hip_high: 'Pelvic tilt detected — lumbar stress fracture risk elevated in fast bowlers. Reduce bowling load immediately.', hip_mild: 'Mild hip imbalance — core and hip stability programme advised for bowlers.', ankle_res: 'Ankle dorsiflexion restricted — impacts front-foot landing in bowling. Immediate physio referral.', ankle_lim: 'Limited ankle mobility — add ankle mobilisation to pre-bowling warmup.', lumbar: 'Excessive lumbar flexion — critical risk for fast bowlers. Limit over count and review bowling action.', shoulder: 'Shoulder outside safe range — shoulder impingement and rotator cuff risk. Reduce bowling intensity.', symmetry: 'Good postural symmetry — maintain with regular screening through bowling spells.' },
  Athletics:  { knee_high: 'Gait asymmetry detected — hamstring or IT band imbalance probable. Gait retraining and unilateral strength work required.', knee_mild: 'Mild stride asymmetry — monitor ground contact time and cadence consistency.', hip_high: 'Hip drop in running gait — Achilles and stress fracture risk elevated. Add hip abductor strengthening.', hip_mild: 'Mild hip imbalance — single-leg strength deficit likely. Add split squats.', ankle_res: 'Ankle dorsiflexion severely restricted — Achilles tendinopathy and stress fracture risk. Reduce mileage immediately.', ankle_lim: 'Limited ankle mobility — daily eccentric calf raises and dorsiflexion stretching.', lumbar: 'Excessive lumbar flexion in running posture — check hip flexor tightness and running form.', shoulder: 'Shoulder mechanics outside normal — energy leaks in sprint mechanics. Check arm drive.', symmetry: 'Excellent bilateral symmetry — optimal for performance and injury prevention.' },
  Tennis:     { knee_high: 'Knee asymmetry on dominant side — patellar tendon and knee stress risk. Reduce on-court volume, add eccentric quad work.', knee_mild: 'Mild knee asymmetry — monitor during lateral movement drills.', hip_high: 'Hip drop detected — dominant side overload common in tennis. Bilateral hip strengthening advised.', hip_mild: 'Mild hip imbalance — add contralateral hip strength work.', ankle_res: 'Ankle dorsiflexion restricted — lateral ankle sprain risk on hard courts. Immediate ankle mobility programme.', ankle_lim: 'Limited ankle mobility — calf stretching and ankle mobilisation before each session.', lumbar: 'Lumbar flexion elevated — common in service action. Check trunk rotation and core stability.', shoulder: 'Shoulder outside safe range — rotator cuff and tennis elbow risk. Reduce serving volume and add shoulder stability work.', symmetry: 'Good bilateral symmetry — important given the asymmetric demands of tennis.' },
  Rugby:      { knee_high: 'Knee asymmetry in contact position — ACL and MCL risk elevated. Assess tackle mechanics and add knee stability work.', knee_mild: 'Mild knee asymmetry — monitor during scrum and tackle drills.', hip_high: 'Pelvic instability detected — high risk in contact situations. Prioritise hip and core stability.', hip_mild: 'Mild hip imbalance — add hip stability work to contact preparation.', ankle_res: 'Ankle dorsiflexion restricted — ankle and Achilles risk in scrummaging. Immediate physio assessment.', ankle_lim: 'Limited ankle mobility — add ankle mobilisation before contact sessions.', lumbar: 'Excessive lumbar flexion — scrum and tackle position risk. Assess spinal loading.', shoulder: 'Shoulder outside safe range — dislocation risk in contact. Rotator cuff and shoulder stability programme required.', symmetry: 'Good postural symmetry — important for safe contact mechanics.' },
  Cycling:    { knee_high: 'Knee tracking asymmetry — IT band and patellar tracking issue. Bike fit assessment required urgently.', knee_mild: 'Mild knee asymmetry — check cleat position and saddle height.', hip_high: 'Hip drop in pedal stroke — saddle too high or core weakness. Adjust bike fit and add core stability work.', hip_mild: 'Mild hip imbalance — check saddle height and add single-leg pedalling drills.', ankle_res: 'Ankle mobility restricted — affects pedal efficiency and knee tracking. Add calf mobilisation.', ankle_lim: 'Limited ankle mobility — daily calf stretching and ankle circles.', lumbar: 'Excessive lumbar flexion — lower back overuse in aero position. Adjust handlebar height.', shoulder: 'Shoulder tension outside normal — check handlebar reach and add shoulder mobility work.', symmetry: 'Good pedalling symmetry — optimal power transfer and injury prevention.' },
  Swimming:   { knee_high: 'Knee asymmetry detected — breaststroke knee stress or kick imbalance. Review stroke mechanics with coach.', knee_mild: 'Mild knee asymmetry — monitor during breaststroke kick.', hip_high: 'Hip drop in stroke — body rotation asymmetry. Add core stability and hip mobility drills.', hip_mild: 'Mild hip imbalance — improve rotation symmetry in freestyle and backstroke.', ankle_res: 'Ankle plantarflexion restricted — kick propulsion limited and knee stress elevated. Daily ankle flexibility work.', ankle_lim: 'Limited ankle mobility — fin training and ankle stretching advised.', lumbar: 'Excessive lumbar flexion — lower back overload in butterfly and breaststroke. Reduce yardage, add core work.', shoulder: 'Shoulder mechanics outside safe range — impingement risk elevated. Reduce yardage, add rotator cuff programme immediately.', symmetry: 'Good stroke symmetry — optimal for performance and shoulder health.' },
  Default:    { knee_high: 'Significant knee asymmetry — single-leg squat mechanics and strength work advised.', knee_mild: 'Mild knee asymmetry — monitor and address with unilateral exercises.', hip_high: 'Pelvic tilt detected — hip and glute strengthening programme required.', hip_mild: 'Mild hip imbalance — add hip stability exercises.', ankle_res: 'Ankle dorsiflexion severely restricted — mobilisation programme required.', ankle_lim: 'Limited ankle mobility — daily calf and ankle stretching.', lumbar: 'Excessive lumbar flexion — core stability strengthening advised.', shoulder: 'Shoulder mechanics outside normal range — rotator cuff and mobility work advised.', symmetry: 'Good bilateral symmetry — maintain with regular movement quality checks.' },
};

// ── Sport ideal angles for simulation ────────────────────────
const SPORT_PROFILES: Record<string, Record<string, number>> = {
  Football:   { knee: 72, hip: 44, ankle: 18, shoulder: 35, lumbar: 18 },
  Basketball: { knee: 62, hip: 38, ankle: 12, shoulder: 40, lumbar: 22 },
  Cricket:    { knee: 70, hip: 44, ankle: 16, shoulder: 30, lumbar: 20 },
  Athletics:  { knee: 78, hip: 50, ankle: 22, shoulder: 38, lumbar: 14 },
  Tennis:     { knee: 74, hip: 46, ankle: 20, shoulder: 32, lumbar: 20 },
  Rugby:      { knee: 60, hip: 36, ankle: 14, shoulder: 42, lumbar: 25 },
  Cycling:    { knee: 85, hip: 52, ankle: 16, shoulder: 38, lumbar: 28 },
  Swimming:   { knee: 70, hip: 42, ankle: 15, shoulder: 28, lumbar: 16 },
  Default:    { knee: 72, hip: 44, ankle: 17, shoulder: 35, lumbar: 18 },
};

const jitter = (base: number, range: number) =>
  parseFloat((base + (Math.random() - 0.5) * range * 2).toFixed(1));

const rand = (min: number, max: number) =>
  parseFloat((Math.random() * (max - min) + min).toFixed(1));

const getStatus = (angle: number, range: [number, number]) => {
  if (angle >= range[0] && angle <= range[1]) return { status: 'normal' as const, deviation: 0 };
  const dev = parseFloat((angle < range[0] ? range[0] - angle : angle - range[1]).toFixed(1));
  return { status: (dev > 12 ? 'risk' : 'caution') as 'risk' | 'caution', deviation: dev };
};

const simulatePose = (
  imageUrl: string, imageName: string, sport: string, athleteName: string,
): Promise<PoseAnalysisResult> =>
  new Promise(resolve => setTimeout(() => {
    const p     = SPORT_PROFILES[sport]  ?? SPORT_PROFILES.Default;
    const r     = SPORT_NORMAL_RANGES[sport] ?? SPORT_NORMAL_RANGES.Default;
    const recs  = SPORT_RECS[sport] ?? SPORT_RECS.Default;

    const kL  = jitter(p.knee,     8);
    const kR  = jitter(p.knee,     8);
    const hL  = jitter(p.hip,      6);
    const hR  = jitter(p.hip,      6);
    const aL  = jitter(p.ankle,    5);
    const aR  = jitter(p.ankle,    5);
    const sL  = jitter(p.shoulder, 7);
    const sR  = jitter(p.shoulder, 7);
    const lum = jitter(p.lumbar,   7);

    const jointData = [
      { joint: 'Left Knee',       angle: kL  },
      { joint: 'Right Knee',      angle: kR  },
      { joint: 'Left Hip',        angle: hL  },
      { joint: 'Right Hip',       angle: hR  },
      { joint: 'Left Ankle',      angle: aL  },
      { joint: 'Right Ankle',     angle: aR  },
      { joint: 'Left Shoulder',   angle: sL  },
      { joint: 'Right Shoulder',  angle: sR  },
      { joint: 'Lumbar Spine',    angle: lum },
    ];

    const jointAngles: PoseJointAngle[] = jointData.map(({ joint, angle }) => {
      const normal = r[joint] ?? [0, 180] as [number, number];
      const { status, deviation } = getStatus(angle, normal as [number, number]);
      return { joint, angle, normalRange: normal as [number, number], status, deviation };
    });

    let score = 20;
    const riskFactors: RiskFactor[]       = [];
    const protectiveFactors: RiskFactor[] = [];
    const recommendations: string[]       = [];

    const kDiff     = Math.abs(kL - kR);
    const hDiff     = Math.abs(hL - hR);
    const sDiff     = Math.abs(sL - sR);
    const avgAnkle  = (aL + aR) / 2;
    const avgShldr  = (sL + sR) / 2;
    const ankleFloor = r['Left Ankle'][0];
    const lumCeil    = r['Lumbar Spine'][1];
    const shldrCeil  = r['Left Shoulder'][1];

    // Knee
    if (kDiff > 10)      { score += 14; riskFactors.push({ name: 'Knee Asymmetry Detected', impact: 14, impactLevel: 'high', type: 'risk' }); recommendations.push(recs.knee_high); }
    else if (kDiff > 5)  { score += 6;  riskFactors.push({ name: 'Mild Knee Asymmetry',    impact:  6, impactLevel: 'medium', type: 'risk' }); recommendations.push(recs.knee_mild); }

    // Hip
    if (hDiff > 10)      { score += 12; riskFactors.push({ name: 'Hip Drop / Pelvic Tilt', impact: 12, impactLevel: 'high', type: 'risk' }); recommendations.push(recs.hip_high); }
    else if (hDiff > 5)  { score += 5;  riskFactors.push({ name: 'Mild Hip Imbalance',     impact:  5, impactLevel: 'medium', type: 'risk' }); recommendations.push(recs.hip_mild); }

    // Ankle (sport-aware floor)
    if (avgAnkle < ankleFloor - 3)      { score += 11; riskFactors.push({ name: 'Restricted Ankle Dorsiflexion', impact: 11, impactLevel: 'high', type: 'risk' }); recommendations.push(recs.ankle_res); }
    else if (avgAnkle < ankleFloor)     { score += 6;  riskFactors.push({ name: 'Limited Ankle Mobility',        impact:  6, impactLevel: 'medium', type: 'risk' }); recommendations.push(recs.ankle_lim); }

    // Lumbar (sport-aware ceiling)
    if (lum > lumCeil + 5)   { score += 10; riskFactors.push({ name: 'Excessive Lumbar Flexion', impact: 10, impactLevel: 'high', type: 'risk' }); recommendations.push(recs.lumbar); }
    else if (lum > lumCeil)  { score += 5;  riskFactors.push({ name: 'Elevated Lumbar Demand',   impact:  5, impactLevel: 'medium', type: 'risk' }); }

    // Shoulder (sport-aware ceiling)
    if (avgShldr > shldrCeil + 8 || sDiff > 12) { score += 10; riskFactors.push({ name: 'Shoulder Mechanics Risk', impact: 10, impactLevel: 'high', type: 'risk' }); recommendations.push(recs.shoulder); }
    else if (avgShldr > shldrCeil || sDiff > 7) { score += 5;  riskFactors.push({ name: 'Shoulder Asymmetry',      impact:  5, impactLevel: 'medium', type: 'risk' }); }

    // Protective
    if (kDiff <= 4 && hDiff <= 4) { score -= 6; protectiveFactors.push({ name: 'Good Bilateral Symmetry', impact: -6, impactLevel: 'medium', type: 'protective' }); recommendations.push(recs.symmetry); }
    if (avgAnkle >= ankleFloor)   { score -= 5; protectiveFactors.push({ name: 'Adequate Ankle Mobility', impact: -5, impactLevel: 'low',    type: 'protective' }); }
    if (lum <= lumCeil)           { score -= 4; protectiveFactors.push({ name: 'Stable Lumbar Alignment', impact: -4, impactLevel: 'low',    type: 'protective' }); }
    if (sDiff <= 5 && avgShldr <= shldrCeil) { score -= 4; protectiveFactors.push({ name: 'Good Shoulder Symmetry', impact: -4, impactLevel: 'low', type: 'protective' }); }

    score = Math.max(10, Math.min(92, score));
    const riskLevel = score < 35 ? 'low' : score < 55 ? 'moderate' : score < 75 ? 'high' : 'critical' as RiskLevel;

    const segments: PoseSegment[] = [
      { label: 'Knee Complex',      finding: kDiff > 10 ? 'Notable asymmetry' : kDiff > 5 ? 'Mild asymmetry' : 'Symmetrical',                                   severity: kDiff > 10 ? 'moderate' : kDiff > 5 ? 'mild' : 'normal',                   details: `L: ${kL}°  R: ${kR}°  Δ${kDiff.toFixed(1)}°  |  Normal: ${r['Left Knee'][0]}–${r['Left Knee'][1]}° (${sport})` },
      { label: 'Hip & Pelvis',      finding: hDiff > 10 ? 'Pelvic tilt'       : hDiff > 5 ? 'Mild imbalance' : 'Level',                                          severity: hDiff > 10 ? 'moderate' : hDiff > 5 ? 'mild' : 'normal',                   details: `L: ${hL}°  R: ${hR}°  Δ${hDiff.toFixed(1)}°  |  Normal: ${r['Left Hip'][0]}–${r['Left Hip'][1]}° (${sport})` },
      { label: 'Ankle & Foot',      finding: avgAnkle < ankleFloor-3 ? 'Dorsiflexion restriction' : avgAnkle < ankleFloor ? 'Limited mobility' : 'Adequate',    severity: avgAnkle < ankleFloor-3 ? 'moderate' : avgAnkle < ankleFloor ? 'mild' : 'normal', details: `L: ${aL}°  R: ${aR}°  Avg: ${avgAnkle.toFixed(1)}°  |  Normal: ${r['Left Ankle'][0]}–${r['Left Ankle'][1]}° (${sport})` },
      { label: 'Lumbar Spine',      finding: lum > lumCeil+5 ? 'Excessive flexion' : lum > lumCeil ? 'Elevated demand' : 'Normal range',                        severity: lum > lumCeil+5 ? 'moderate' : lum > lumCeil ? 'mild' : 'normal',           details: `${lum}°  |  Normal: ${r['Lumbar Spine'][0]}–${r['Lumbar Spine'][1]}° (${sport})` },
      { label: 'Shoulder Complex',  finding: (avgShldr > shldrCeil+8 || sDiff > 12) ? 'Mechanics at risk' : (avgShldr > shldrCeil || sDiff > 7) ? 'Mild asymmetry' : 'Within normal range', severity: (avgShldr > shldrCeil+8 || sDiff > 12) ? 'moderate' : (avgShldr > shldrCeil || sDiff > 7) ? 'mild' : 'normal', details: `L: ${sL}°  R: ${sR}°  Δ${sDiff.toFixed(1)}°  |  Normal: ${r['Left Shoulder'][0]}–${r['Left Shoulder'][1]}° (${sport})` },
    ];

    recommendations.push('Schedule a follow-up biomechanical assessment after the intervention period.');

    resolve({
      id: `pose-sim-${Date.now()}`, imageUrl, imageName,
      analyzedAt: new Date().toISOString(), sport, athleteName,
      keypoints: Array.from({ length: 17 }, (_, i) => ({
        name: `kp_${i}`, x: rand(20, 80), y: rand(5, 95), confidence: rand(0.82, 0.99),
      })),
      jointAngles,
      overallRiskScore: Math.round(score),
      riskLevel,
      confidence: rand(0.76, 0.92),
      segments,
      riskFactors:       riskFactors.sort((a, b) => b.impact - a.impact).slice(0, 6),
      protectiveFactors: protectiveFactors.slice(0, 4),
      recommendations,
      whatToMonitor: segments.filter(s => s.severity !== 'normal').map(s => s.label),
      summary: `Pose analysis of ${athleteName} (${sport}) — ${riskLevel} risk indicators detected.`,
      disclaimer: 'Simulated estimate — connect backend for real MediaPipe analysis.',
      modelVersion: 'Simulation-V2',
    });
  }, 2400));
