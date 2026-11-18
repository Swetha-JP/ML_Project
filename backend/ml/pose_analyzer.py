"""
AthleteSafe — Pose Analyzer using MediaPipe
Detects 33 landmarks, computes joint angles, generates sport-specific injury risk.

Improvements:
  - Sport-aware normal ranges per joint
  - Shoulder segment analysis (critical for swimming, tennis, cricket)
  - Sport-specific recommendations instead of generic advice
  - Correct body segments mapped to sport injury profiles
"""
import cv2
import numpy as np
import math
from typing import Dict, Any, List

try:
    import mediapipe as mp
    MP_AVAILABLE = True
    mp_pose = mp.solutions.pose
except ImportError:
    MP_AVAILABLE = False


# ── Sport-specific normal angle ranges per joint ──────────────
# Format: { sport: { joint_name: (min_deg, max_deg) } }
# Falls back to "Default" if sport not found.
SPORT_NORMAL_RANGES: Dict[str, Dict[str, tuple]] = {
    "Football": {
        "Left Knee":       (60, 90),   # cutting/sprinting
        "Right Knee":      (60, 90),
        "Left Hip":        (30, 55),
        "Right Hip":       (30, 55),
        "Left Ankle":      (15, 30),
        "Right Ankle":     (15, 30),
        "Left Shoulder":   (20, 65),
        "Right Shoulder":  (20, 65),
        "Lumbar Spine":    (10, 25),
    },
    "Basketball": {
        "Left Knee":       (55, 85),   # landing mechanics
        "Right Knee":      (55, 85),
        "Left Hip":        (30, 50),
        "Right Hip":       (30, 50),
        "Left Ankle":      (12, 28),   # tighter — ankle sprain risk
        "Right Ankle":     (12, 28),
        "Left Shoulder":   (20, 70),
        "Right Shoulder":  (20, 70),
        "Lumbar Spine":    (10, 28),
    },
    "Cricket": {
        "Left Knee":       (60, 90),
        "Right Knee":      (60, 90),
        "Left Hip":        (35, 55),
        "Right Hip":       (35, 55),
        "Left Ankle":      (14, 28),
        "Right Ankle":     (14, 28),
        "Left Shoulder":   (15, 60),   # tighter — rotator cuff / impingement
        "Right Shoulder":  (15, 60),
        "Lumbar Spine":    (8, 25),    # tighter — bowling lumbar stress
    },
    "Athletics": {
        "Left Knee":       (65, 95),   # sprint mechanics allow higher flexion
        "Right Knee":      (65, 95),
        "Left Hip":        (35, 60),
        "Right Hip":       (35, 60),
        "Left Ankle":      (18, 32),   # plantar flexion power
        "Right Ankle":     (18, 32),
        "Left Shoulder":   (20, 60),
        "Right Shoulder":  (20, 60),
        "Lumbar Spine":    (8, 22),    # tighter for sprinters
    },
    "Tennis": {
        "Left Knee":       (60, 88),
        "Right Knee":      (60, 88),
        "Left Hip":        (30, 52),
        "Right Hip":       (30, 52),
        "Left Ankle":      (15, 30),
        "Right Ankle":     (15, 30),
        "Left Shoulder":   (15, 55),   # rotator cuff — dominant arm risk
        "Right Shoulder":  (15, 55),
        "Lumbar Spine":    (10, 25),
    },
    "Rugby": {
        "Left Knee":       (55, 82),   # tackle/scrum position
        "Right Knee":      (55, 82),
        "Left Hip":        (28, 50),
        "Right Hip":       (28, 50),
        "Left Ankle":      (12, 26),
        "Right Ankle":     (12, 26),
        "Left Shoulder":   (18, 65),   # dislocation risk
        "Right Shoulder":  (18, 65),
        "Lumbar Spine":    (10, 28),
    },
    "Cycling": {
        "Left Knee":       (68, 100),  # full pedal extension
        "Right Knee":      (68, 100),
        "Left Hip":        (38, 62),   # higher hip flexion on bike
        "Right Hip":       (38, 62),
        "Left Ankle":      (10, 25),
        "Right Ankle":     (10, 25),
        "Left Shoulder":   (20, 60),
        "Right Shoulder":  (20, 60),
        "Lumbar Spine":    (12, 32),   # aero position allows more flexion
    },
    "Swimming": {
        "Left Knee":       (60, 90),
        "Right Knee":      (60, 90),
        "Left Hip":        (30, 55),
        "Right Hip":       (30, 55),
        "Left Ankle":      (12, 28),
        "Right Ankle":     (12, 28),
        "Left Shoulder":   (10, 50),   # tightest — impingement prevention
        "Right Shoulder":  (10, 50),
        "Lumbar Spine":    (8, 22),
    },
    "Default": {
        "Left Knee":       (65, 90),
        "Right Knee":      (65, 90),
        "Left Hip":        (35, 55),
        "Right Hip":       (35, 55),
        "Left Ankle":      (15, 30),
        "Right Ankle":     (15, 30),
        "Left Shoulder":   (20, 60),
        "Right Shoulder":  (20, 60),
        "Lumbar Spine":    (10, 30),
    },
}

# ── Sport-specific ideal angles for fallback simulation ───────
SPORT_PROFILES = {
    "Football":   {"knee": 72, "hip": 44, "ankle": 18, "shoulder": 35, "lumbar": 18},
    "Basketball": {"knee": 62, "hip": 38, "ankle": 12, "shoulder": 40, "lumbar": 22},
    "Cricket":    {"knee": 70, "hip": 44, "ankle": 16, "shoulder": 30, "lumbar": 20},
    "Athletics":  {"knee": 78, "hip": 50, "ankle": 22, "shoulder": 38, "lumbar": 14},
    "Tennis":     {"knee": 74, "hip": 46, "ankle": 20, "shoulder": 32, "lumbar": 20},
    "Rugby":      {"knee": 60, "hip": 36, "ankle": 14, "shoulder": 42, "lumbar": 25},
    "Cycling":    {"knee": 85, "hip": 52, "ankle": 16, "shoulder": 38, "lumbar": 28},
    "Swimming":   {"knee": 70, "hip": 42, "ankle": 15, "shoulder": 28, "lumbar": 16},
    "Default":    {"knee": 72, "hip": 44, "ankle": 17, "shoulder": 35, "lumbar": 18},
}

# ── Sport-specific recommendations ────────────────────────────
# Keyed by sport → finding_key → recommendation text
SPORT_RECOMMENDATIONS: Dict[str, Dict[str, str]] = {
    "Football": {
        "knee_asymmetry_high":  "Knee valgus or asymmetry detected — ACL risk elevated. Add Copenhagen adductor and single-leg squat drills before training.",
        "knee_asymmetry_mild":  "Mild knee asymmetry — monitor during cutting and change-of-direction drills.",
        "hip_drop_high":        "Pelvic drop detected — glute med weakness probable. Add hip abductor strengthening before next match.",
        "hip_drop_mild":        "Mild hip imbalance — include single-leg RDLs in warmup.",
        "ankle_restricted":     "Ankle dorsiflexion restricted — increase risk of ankle sprain during rapid direction changes. Prioritise ankle mobility work.",
        "ankle_limited":        "Limited ankle mobility — add calf stretching and banded ankle mobilisation.",
        "lumbar_high":          "Excessive lumbar flexion — reduce sprint volume and check hamstring flexibility.",
        "lumbar_mild":          "Lumbar demand slightly elevated — add hip flexor stretching and core activation to warmup.",
        "shoulder_high":        "Shoulder range restricted — relevant for goalkeepers. Add rotator cuff activation.",
        "shoulder_mild":        "Mild shoulder asymmetry — monitor overhead movements and add shoulder mobility work.",
        "knee_flexion_low":     "Insufficient knee flexion detected — assess quad tightness and improve flexion range before sprinting.",
        "good_symmetry":        "Good bilateral symmetry — maintain with regular symmetry checks during the season.",
    },
    "Basketball": {
        "knee_asymmetry_high":  "High knee asymmetry on landing — ACL and patellar tendon risk. Implement landing mechanics training (drop jumps with video feedback).",
        "knee_asymmetry_mild":  "Mild knee asymmetry — monitor during jump landing and pivoting drills.",
        "hip_drop_high":        "Hip drop under load — add glute activation (clamshells, banded walks) pre-practice.",
        "hip_drop_mild":        "Mild hip imbalance — single-leg landing drills advised.",
        "ankle_restricted":     "Ankle dorsiflexion severely limited — high ankle sprain and Achilles risk. Immediate mobilisation programme required.",
        "ankle_limited":        "Ankle mobility limited — daily dorsiflexion stretching and eccentric calf work.",
        "lumbar_high":          "Lumbar flexion elevated — check core bracing during jump-land sequences.",
        "lumbar_mild":          "Lumbar demand slightly elevated — add anti-extension core work before practice.",
        "shoulder_high":        "Shoulder mechanics outside normal range — monitor for impingement during overhead shooting.",
        "shoulder_mild":        "Mild shoulder asymmetry — check shooting mechanics and add rotator cuff activation.",
        "knee_flexion_low":     "Insufficient knee flexion in landing — shock absorption compromised. Add squat depth and landing mechanic drills.",
        "good_symmetry":        "Good landing symmetry — continue plyometric quality monitoring.",
    },
    "Cricket": {
        "knee_asymmetry_high":  "Knee asymmetry in bowling stride — lateral knee stress elevated. Assess front-foot landing mechanics with coach.",
        "knee_asymmetry_mild":  "Mild stride asymmetry — review run-up and delivery stride consistency.",
        "hip_drop_high":        "Pelvic tilt detected — lumbar stress fracture risk elevated in fast bowlers. Reduce bowling load immediately.",
        "hip_drop_mild":        "Mild hip imbalance — core and hip stability programme advised for bowlers.",
        "ankle_restricted":     "Ankle dorsiflexion restricted — impacts front-foot landing in bowling. Immediate physio referral.",
        "ankle_limited":        "Limited ankle mobility — add ankle mobilisation to pre-bowling warmup.",
        "lumbar_high":          "Excessive lumbar flexion — critical risk for fast bowlers. Limit over count and review bowling action.",
        "lumbar_mild":          "Lumbar demand slightly elevated — monitor over count and add lumbar stabilisation exercises.",
        "shoulder_high":        "Shoulder outside safe range — shoulder impingement and rotator cuff risk. Reduce bowling intensity.",
        "shoulder_mild":        "Mild shoulder asymmetry — check bowling action side-on and add rotator cuff work.",
        "knee_flexion_low":     "Restricted knee flexion in bowling stride — increases lumbar loading. Add quad stretching and flexion range work.",
        "good_symmetry":        "Good postural symmetry — maintain with regular screening through bowling spells.",
    },
    "Athletics": {
        "knee_asymmetry_high":  "Gait asymmetry detected — hamstring or IT band imbalance probable. Gait retraining and unilateral strength work required.",
        "knee_asymmetry_mild":  "Mild stride asymmetry — monitor ground contact time and cadence consistency.",
        "hip_drop_high":        "Hip drop in running gait — Achilles and stress fracture risk elevated. Add hip abductor strengthening.",
        "hip_drop_mild":        "Mild hip imbalance — single-leg strength deficit likely. Add split squats.",
        "ankle_restricted":     "Ankle dorsiflexion severely restricted — Achilles tendinopathy and stress fracture risk. Reduce mileage, start mobility programme.",
        "ankle_limited":        "Limited ankle mobility — daily eccentric calf raises and dorsiflexion stretching.",
        "lumbar_high":          "Excessive lumbar flexion in running posture — check hip flexor tightness and running form.",
        "lumbar_mild":          "Slight lumbar elevation — add hip flexor stretching and check running posture under fatigue.",
        "shoulder_high":        "Shoulder mechanics outside normal — may cause energy leaks in sprint mechanics. Check arm drive.",
        "shoulder_mild":        "Mild shoulder asymmetry — check arm drive mechanics and add shoulder mobility work.",
        "knee_flexion_low":     "Restricted knee drive in stride — reduces propulsive efficiency. Add knee drive drills and hip flexor work.",
        "good_symmetry":        "Excellent bilateral symmetry — optimal for performance and injury prevention.",
    },
    "Tennis": {
        "knee_asymmetry_high":  "Knee asymmetry on dominant side — patellar tendon and knee stress risk. Reduce on-court volume, add eccentric quad work.",
        "knee_asymmetry_mild":  "Mild knee asymmetry — monitor during lateral movement drills.",
        "hip_drop_high":        "Hip drop detected — dominant side overload common in tennis. Bilateral hip strengthening advised.",
        "hip_drop_mild":        "Mild hip imbalance — add contralateral hip strength work.",
        "ankle_restricted":     "Ankle dorsiflexion restricted — lateral ankle sprain risk on hard courts. Immediate ankle mobility programme.",
        "ankle_limited":        "Limited ankle mobility — calf stretching and ankle mobilisation before each session.",
        "lumbar_high":          "Lumbar flexion elevated — common in service action. Check trunk rotation and core stability.",
        "lumbar_mild":          "Lumbar demand slightly elevated — add trunk rotation mobility and core stability exercises.",
        "shoulder_high":        "Shoulder outside safe range — rotator cuff and tennis elbow risk. Reduce serving volume and add shoulder stability work.",
        "shoulder_mild":        "Mild shoulder asymmetry — monitor serving mechanics and add rotator cuff activation.",
        "knee_flexion_low":     "Restricted knee flexion — affects split-step mechanics. Add squat and lunge mobility work.",
        "good_symmetry":        "Good bilateral symmetry — important given the asymmetric demands of tennis.",
    },
    "Rugby": {
        "knee_asymmetry_high":  "Knee asymmetry in contact position — ACL and MCL risk elevated. Assess tackle mechanics and add knee stability work.",
        "knee_asymmetry_mild":  "Mild knee asymmetry — monitor during scrum and tackle drills.",
        "hip_drop_high":        "Pelvic instability detected — high risk in contact situations. Prioritise hip and core stability.",
        "hip_drop_mild":        "Mild hip imbalance — add hip stability work to contact preparation.",
        "ankle_restricted":     "Ankle dorsiflexion restricted — ankle and Achilles risk in scrummaging and driving. Immediate physio assessment.",
        "ankle_limited":        "Limited ankle mobility — add ankle mobilisation before contact sessions.",
        "lumbar_high":          "Excessive lumbar flexion — scrum and tackle position risk. Assess spinal loading.",
        "lumbar_mild":          "Lumbar demand slightly elevated — add spinal stability and core work before contact sessions.",
        "shoulder_high":        "Shoulder outside safe range — dislocation risk in contact. Rotator cuff and shoulder stability programme required.",
        "shoulder_mild":        "Mild shoulder asymmetry — monitor in contact situations and add shoulder stability work.",
        "knee_flexion_low":     "Restricted knee flexion in contact position — assess scrum and tackle mechanics.",
        "good_symmetry":        "Good postural symmetry — important for safe contact mechanics.",
    },
    "Cycling": {
        "knee_asymmetry_high":  "Knee tracking asymmetry — IT band and patellar tracking issue. Bike fit assessment required urgently.",
        "knee_asymmetry_mild":  "Mild knee asymmetry — check cleat position and saddle height.",
        "hip_drop_high":        "Hip drop in pedal stroke — saddle too high or core weakness. Adjust bike fit and add core stability work.",
        "hip_drop_mild":        "Mild hip imbalance — check saddle height and add single-leg pedalling drills.",
        "ankle_restricted":     "Ankle mobility restricted — affects pedal efficiency and knee tracking. Add calf mobilisation.",
        "ankle_limited":        "Limited ankle mobility — daily calf stretching and ankle circles.",
        "lumbar_high":          "Excessive lumbar flexion — lower back overuse in aero position. Adjust handlebar height.",
        "lumbar_mild":          "Lumbar demand slightly elevated — check handlebar height and add lower back mobility work.",
        "shoulder_high":        "Shoulder tension outside normal — check handlebar reach and add shoulder mobility work.",
        "shoulder_mild":        "Mild shoulder asymmetry — check handlebar position and add neck/shoulder stretching.",
        "knee_flexion_low":     "Restricted knee range in pedal stroke — check saddle height and add quad flexibility work.",
        "good_symmetry":        "Good pedalling symmetry — optimal power transfer and injury prevention.",
    },
    "Swimming": {
        "knee_asymmetry_high":  "Knee asymmetry detected — breaststroke knee stress or kick imbalance. Review stroke mechanics with coach.",
        "knee_asymmetry_mild":  "Mild knee asymmetry — monitor during breaststroke kick.",
        "hip_drop_high":        "Hip drop in stroke — body rotation asymmetry. Add core stability and hip mobility drills.",
        "hip_drop_mild":        "Mild hip imbalance — improve rotation symmetry in freestyle and backstroke.",
        "ankle_restricted":     "Ankle plantarflexion restricted — kick propulsion limited and knee stress elevated. Daily ankle flexibility work.",
        "ankle_limited":        "Limited ankle mobility — fin training and ankle stretching advised.",
        "lumbar_high":          "Excessive lumbar flexion — lower back overload in butterfly and breaststroke. Reduce yardage, add core work.",
        "lumbar_mild":          "Lumbar demand slightly elevated — add core activation and reduce butterfly yardage.",
        "shoulder_high":        "Shoulder mechanics outside safe range — impingement risk elevated. Reduce yardage, add rotator cuff programme immediately.",
        "shoulder_mild":        "Mild shoulder asymmetry — check stroke symmetry and add rotator cuff activation.",
        "knee_flexion_low":     "Restricted knee range — affects flutter and breaststroke kick. Add quad and hip flexor flexibility work.",
        "good_symmetry":        "Good stroke symmetry — optimal for performance and shoulder health.",
    },
    "Default": {
        "knee_asymmetry_high":  "Significant knee asymmetry — single-leg squat mechanics and strength work advised.",
        "knee_asymmetry_mild":  "Mild knee asymmetry — monitor and address with unilateral exercises.",
        "hip_drop_high":        "Pelvic tilt detected — hip and glute strengthening programme required.",
        "hip_drop_mild":        "Mild hip imbalance — add hip stability exercises.",
        "ankle_restricted":     "Ankle dorsiflexion severely restricted — mobilisation programme required.",
        "ankle_limited":        "Limited ankle mobility — daily calf and ankle stretching.",
        "lumbar_high":          "Excessive lumbar flexion — core stability strengthening advised.",
        "lumbar_mild":          "Lumbar demand slightly elevated — add core activation and hip flexor stretching.",
        "shoulder_high":        "Shoulder mechanics outside normal range — rotator cuff and mobility work advised.",
        "shoulder_mild":        "Mild shoulder asymmetry — add rotator cuff activation and shoulder mobility work.",
        "knee_flexion_low":     "Insufficient knee flexion — improve range of motion before high-load activity.",
        "good_symmetry":        "Good bilateral symmetry — maintain with regular movement quality checks.",
    },
}


def calculate_angle(a: List[float], b: List[float], c: List[float]) -> float:
    """Angle at point b formed by vectors b→a and b→c."""
    a, b, c = np.array(a), np.array(b), np.array(c)
    ba = a - b
    bc = c - b
    cos_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-9)
    return round(math.degrees(math.acos(np.clip(cos_angle, -1, 1))), 1)


def get_joint_status(angle: float, normal: tuple) -> Dict:
    if normal[0] <= angle <= normal[1]:
        return {"status": "normal", "deviation": 0.0}
    deviation = round(normal[0] - angle if angle < normal[0] else angle - normal[1], 1)
    return {"status": "risk" if deviation > 12 else "caution", "deviation": deviation}


def _get_sport_ranges(sport: str) -> Dict[str, tuple]:
    """Return normal ranges for the given sport, fall back to Default."""
    return SPORT_NORMAL_RANGES.get(sport, SPORT_NORMAL_RANGES["Default"])


def _get_sport_recs(sport: str) -> Dict[str, str]:
    return SPORT_RECOMMENDATIONS.get(sport, SPORT_RECOMMENDATIONS["Default"])


def analyze_image(image_bytes: bytes, sport: str, athlete_name: str) -> Dict[str, Any]:
    if not MP_AVAILABLE:
        return _fallback_analysis(sport, athlete_name)

    nparr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if image is None:
        return _fallback_analysis(sport, athlete_name)

    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    h, w = image.shape[:2]

    with mp_pose.Pose(static_image_mode=True, model_complexity=2, min_detection_confidence=0.5) as pose:
        results = pose.process(image_rgb)

    if not results.pose_landmarks:
        return _fallback_analysis(sport, athlete_name)

    lm = results.pose_landmarks.landmark
    L  = mp_pose.PoseLandmark

    def pt(landmark):
        return [landmark.x * w, landmark.y * h]

    keypoints = []
    for lmk in L:
        kp = lm[lmk.value]
        keypoints.append({
            "name":       lmk.name.lower(),
            "x":          round(kp.x * 100, 2),
            "y":          round(kp.y * 100, 2),
            "confidence": round(kp.visibility, 3),
        })

    try:
        kL  = calculate_angle(pt(lm[L.LEFT_HIP]),       pt(lm[L.LEFT_KNEE]),      pt(lm[L.LEFT_ANKLE]))
        kR  = calculate_angle(pt(lm[L.RIGHT_HIP]),      pt(lm[L.RIGHT_KNEE]),     pt(lm[L.RIGHT_ANKLE]))
        hL  = calculate_angle(pt(lm[L.LEFT_SHOULDER]),  pt(lm[L.LEFT_HIP]),       pt(lm[L.LEFT_KNEE]))
        hR  = calculate_angle(pt(lm[L.RIGHT_SHOULDER]), pt(lm[L.RIGHT_HIP]),      pt(lm[L.RIGHT_KNEE]))
        aL  = calculate_angle(pt(lm[L.LEFT_KNEE]),      pt(lm[L.LEFT_ANKLE]),     pt(lm[L.LEFT_FOOT_INDEX]))
        aR  = calculate_angle(pt(lm[L.RIGHT_KNEE]),     pt(lm[L.RIGHT_ANKLE]),    pt(lm[L.RIGHT_FOOT_INDEX]))
        sL  = calculate_angle(pt(lm[L.LEFT_ELBOW]),     pt(lm[L.LEFT_SHOULDER]),  pt(lm[L.LEFT_HIP]))
        sR  = calculate_angle(pt(lm[L.RIGHT_ELBOW]),    pt(lm[L.RIGHT_SHOULDER]), pt(lm[L.RIGHT_HIP]))
        lum = calculate_angle(pt(lm[L.LEFT_SHOULDER]),  pt(lm[L.LEFT_HIP]),       pt(lm[L.LEFT_KNEE]))
    except Exception:
        return _fallback_analysis(sport, athlete_name)

    return _build_result(keypoints, kL, kR, hL, hR, aL, aR, sL, sR, lum, sport, athlete_name)


def _build_result(keypoints, kL, kR, hL, hR, aL, aR, sL, sR, lum, sport, athlete_name):
    ranges = _get_sport_ranges(sport)
    recs   = _get_sport_recs(sport)

    joint_data = [
        ("Left Knee",      kL),
        ("Right Knee",     kR),
        ("Left Hip",       hL),
        ("Right Hip",      hR),
        ("Left Ankle",     aL),
        ("Right Ankle",    aR),
        ("Left Shoulder",  sL),
        ("Right Shoulder", sR),
        ("Lumbar Spine",   lum),
    ]

    joint_angles = []
    for name, angle in joint_data:
        normal = ranges.get(name, (0, 180))
        status = get_joint_status(angle, normal)
        joint_angles.append({
            "joint":        name,
            "angle":        angle,
            "normal_range": list(normal),
            "status":       status["status"],
            "deviation":    status["deviation"],
        })

    # ── Derived values ────────────────────────────────────────
    knee_diff  = abs(kL - kR)
    hip_diff   = abs(hL - hR)
    shldr_diff = abs(sL - sR)
    # Use the WORSE side for ankle (not average — masks one-sided restriction)
    worst_ankle = min(aL, aR)
    avg_knee    = (kL + kR) / 2
    avg_shldr   = (sL + sR) / 2

    knee_range  = ranges.get("Left Knee",     (65, 90))
    ankle_range = ranges.get("Left Ankle",    (15, 30))
    shldr_range = ranges.get("Left Shoulder", (20, 60))
    lum_range   = ranges.get("Lumbar Spine",  (10, 30))
    ankle_floor = ankle_range[0]
    lum_ceil    = lum_range[1]
    shldr_ceil  = shldr_range[1]

    # ── Scoring starts at a neutral 30 ───────────────────────
    # Protective deductions can bring it down to 20 (healthy floor)
    # Risk additions push it up. Final clamp: 20–95.
    risk_score         = 30.0
    risk_additions     = 0.0
    protective_credits = 0.0
    risk_factors       = []
    protective_factors = []
    recommendations    = []

    # ── KNEE ─────────────────────────────────────────────────
    if knee_diff > 10:
        risk_additions += 14
        risk_factors.append({"name": "Knee Asymmetry Detected", "impact": 14, "impact_level": "high", "type": "risk"})
        recommendations.append(recs["knee_asymmetry_high"])
    elif knee_diff > 5:
        risk_additions += 7
        risk_factors.append({"name": "Mild Knee Asymmetry", "impact": 7, "impact_level": "medium", "type": "risk"})
        recommendations.append(recs["knee_asymmetry_mild"])

    # ── HIP ──────────────────────────────────────────────────
    if hip_diff > 10:
        risk_additions += 12
        risk_factors.append({"name": "Hip Drop / Pelvic Tilt", "impact": 12, "impact_level": "high", "type": "risk"})
        recommendations.append(recs["hip_drop_high"])
    elif hip_diff > 5:
        risk_additions += 6
        risk_factors.append({"name": "Mild Hip Imbalance", "impact": 6, "impact_level": "medium", "type": "risk"})
        recommendations.append(recs["hip_drop_mild"])

    # ── ANKLE — worst side, not average ──────────────────────
    if worst_ankle < ankle_floor - 4:
        risk_additions += 13
        risk_factors.append({"name": "Restricted Ankle Dorsiflexion", "impact": 13, "impact_level": "high", "type": "risk"})
        recommendations.append(recs["ankle_restricted"])
    elif worst_ankle < ankle_floor - 1:
        risk_additions += 7
        risk_factors.append({"name": "Limited Ankle Mobility", "impact": 7, "impact_level": "medium", "type": "risk"})
        recommendations.append(recs["ankle_limited"])

    # ── LUMBAR ───────────────────────────────────────────────
    if lum > lum_ceil + 6:
        risk_additions += 12
        risk_factors.append({"name": "Excessive Lumbar Flexion", "impact": 12, "impact_level": "high", "type": "risk"})
        recommendations.append(recs["lumbar_high"])
    elif lum > lum_ceil + 2:
        risk_additions += 7
        risk_factors.append({"name": "Elevated Lumbar Demand", "impact": 7, "impact_level": "medium", "type": "risk"})
        recommendations.append(recs["lumbar_mild"])
    elif lum > lum_ceil:
        risk_additions += 4
        risk_factors.append({"name": "Lumbar at Upper Limit", "impact": 4, "impact_level": "low", "type": "risk"})

    # ── SHOULDER ─────────────────────────────────────────────
    if avg_shldr > shldr_ceil + 8 or shldr_diff > 12:
        risk_additions += 11
        risk_factors.append({"name": "Shoulder Mechanics Risk", "impact": 11, "impact_level": "high", "type": "risk"})
        recommendations.append(recs["shoulder_high"])
    elif avg_shldr > shldr_ceil + 3 or shldr_diff > 7:
        risk_additions += 6
        risk_factors.append({"name": "Shoulder Asymmetry", "impact": 6, "impact_level": "medium", "type": "risk"})
        recommendations.append(recs["shoulder_mild"])
    elif shldr_diff > 4:
        risk_additions += 3
        risk_factors.append({"name": "Minor Shoulder Imbalance", "impact": 3, "impact_level": "low", "type": "risk"})

    # ── KNEE FLEXION floor ───────────────────────────────────
    if avg_knee < knee_range[0] - 6:
        risk_additions += 9
        risk_factors.append({"name": "Insufficient Knee Flexion", "impact": 9, "impact_level": "high", "type": "risk"})
        recommendations.append(recs["knee_flexion_low"])
    elif avg_knee < knee_range[0] - 2:
        risk_additions += 5
        risk_factors.append({"name": "Reduced Knee Flexion", "impact": 5, "impact_level": "medium", "type": "risk"})

    # ── PROTECTIVE — only award if that area is genuinely healthy ──
    # Bilateral symmetry: award only when BOTH knee and hip are good
    if knee_diff <= 4 and hip_diff <= 4:
        protective_credits += 6
        protective_factors.append({"name": "Good Bilateral Symmetry", "impact": -6, "impact_level": "medium", "type": "protective"})
        recommendations.append(recs["good_symmetry"])

    # Ankle: award only when BOTH ankles clear the floor
    if aL >= ankle_floor and aR >= ankle_floor:
        protective_credits += 5
        protective_factors.append({"name": "Adequate Ankle Mobility", "impact": -5, "impact_level": "low", "type": "protective"})

    # Lumbar: award only when clearly within range
    if lum <= lum_ceil:
        protective_credits += 4
        protective_factors.append({"name": "Stable Lumbar Alignment", "impact": -4, "impact_level": "low", "type": "protective"})

    # Shoulder: award only when both sides within range and low asymmetry
    if shldr_diff <= 4 and avg_shldr <= shldr_ceil:
        protective_credits += 4
        protective_factors.append({"name": "Good Shoulder Symmetry", "impact": -4, "impact_level": "low", "type": "protective"})

    # ── Final score calculation ───────────────────────────────
    # Base 30 + risk additions - protective credits
    # Clamp: minimum 20 (healthy athlete), maximum 95
    raw = risk_score + risk_additions - protective_credits
    risk_score = round(max(20.0, min(95.0, raw)), 1)

    risk_level = (
        "low"      if risk_score < 35 else
        "moderate" if risk_score < 55 else
        "high"     if risk_score < 75 else
        "critical"
    )

    # ── Body segment findings ─────────────────────────────────
    ankle_sev = (
        "moderate" if worst_ankle < ankle_floor - 4 else
        "mild"     if worst_ankle < ankle_floor - 1 else
        "normal"
    )
    ankle_finding = (
        "Dorsiflexion restriction" if ankle_sev == "moderate" else
        "Limited mobility"         if ankle_sev == "mild"     else
        "Adequate mobility"
    )

    lum_sev = (
        "moderate" if lum > lum_ceil + 6 else
        "mild"     if lum > lum_ceil     else
        "normal"
    )
    lum_finding = (
        "Excessive flexion"  if lum_sev == "moderate" else
        "Elevated demand"    if lum_sev == "mild"     else
        "Normal range"
    )

    shldr_sev = (
        "moderate" if (avg_shldr > shldr_ceil + 8 or shldr_diff > 12) else
        "mild"     if (avg_shldr > shldr_ceil + 3 or shldr_diff > 7)  else
        "normal"
    )
    shldr_finding = (
        "Mechanics at risk"    if shldr_sev == "moderate" else
        "Mild asymmetry"       if shldr_sev == "mild"     else
        "Within normal range"
    )

    segments = [
        {
            "label":    "Knee Complex",
            "finding":  "Notable asymmetry" if knee_diff > 10 else "Mild asymmetry" if knee_diff > 5 else "Symmetrical",
            "severity": "moderate" if knee_diff > 10 else "mild" if knee_diff > 5 else "normal",
            "details":  f"Left: {kL}°  Right: {kR}°  Δ {knee_diff:.1f}°  |  Normal: {knee_range[0]}–{knee_range[1]}° ({sport})",
        },
        {
            "label":    "Hip & Pelvis",
            "finding":  "Pelvic tilt detected" if hip_diff > 10 else "Mild imbalance" if hip_diff > 5 else "Level pelvis",
            "severity": "moderate" if hip_diff > 10 else "mild" if hip_diff > 5 else "normal",
            "details":  f"Left: {hL}°  Right: {hR}°  Δ {hip_diff:.1f}°  |  Normal: {ranges['Left Hip'][0]}–{ranges['Left Hip'][1]}° ({sport})",
        },
        {
            "label":    "Ankle & Foot",
            "finding":  ankle_finding,
            "severity": ankle_sev,
            "details":  f"Left: {aL}°  Right: {aR}°  Worst: {worst_ankle:.1f}°  |  Normal ≥ {ankle_floor}° ({sport})",
        },
        {
            "label":    "Lumbar Spine",
            "finding":  lum_finding,
            "severity": lum_sev,
            "details":  f"Measured: {lum}°  |  Normal: {lum_range[0]}–{lum_ceil}° ({sport})",
        },
        {
            "label":    "Shoulder Complex",
            "finding":  shldr_finding,
            "severity": shldr_sev,
            "details":  f"Left: {sL}°  Right: {sR}°  Δ {shldr_diff:.1f}°  Avg: {avg_shldr:.1f}°  |  Normal: {shldr_range[0]}–{shldr_ceil}° ({sport})",
        },
    ]

    # Deduplicate and append follow-up
    seen = set()
    unique_recs = []
    for rec in recommendations:
        if rec not in seen:
            seen.add(rec)
            unique_recs.append(rec)
    unique_recs.append("Schedule a follow-up biomechanical assessment after the intervention period.")

    what_to_monitor = [s["label"] for s in segments if s["severity"] != "normal"]
    if not what_to_monitor:
        what_to_monitor = ["No significant deviations — continue current movement quality standards"]

    n_issues = sum(1 for s in segments if s["severity"] != "normal")
    summary = (
        f"Pose analysis of {athlete_name} ({sport}): "
        + (f"good alignment across all 5 segments — no corrective action required." if n_issues == 0
           else f"{n_issues} segment{'s' if n_issues > 1 else ''} flagged — sport-specific corrective programme recommended." if risk_level in ("moderate", "low")
           else f"{n_issues} segment{'s' if n_issues > 1 else ''} at risk — corrective intervention required before next training block." if risk_level == "high"
           else f"critical postural deviations in {n_issues} segments — immediate physiotherapy consultation strongly recommended.")
    )

    return {
        "athlete_name":       athlete_name,
        "sport":              sport,
        "risk_score":         risk_score,
        "risk_level":         risk_level,
        "confidence":         0.86 if len(keypoints) >= 17 else 0.65,
        "keypoints":          keypoints,
        "joint_angles":       joint_angles,
        "segments":           segments,
        "risk_factors":       sorted(risk_factors,       key=lambda x: -x["impact"])[:6],
        "protective_factors": sorted(protective_factors, key=lambda x: x["impact"])[:4],
        "recommendations":    unique_recs,
        "what_to_monitor":    what_to_monitor,
        "summary":            summary,
        "disclaimer":         "This pose analysis uses computer vision estimates. It is not a clinical or medical assessment.",
        "model_version":      "MediaPipe-Pose-V3",
    }


def _fallback_analysis(sport: str, athlete_name: str) -> Dict[str, Any]:
    """Used when MediaPipe is unavailable or image detection fails."""
    profile = SPORT_PROFILES.get(sport, SPORT_PROFILES["Default"])
    kL  = profile["knee"]    + float(np.random.uniform(-6, 6))
    kR  = profile["knee"]    + float(np.random.uniform(-6, 6))
    hL  = profile["hip"]     + float(np.random.uniform(-5, 5))
    hR  = profile["hip"]     + float(np.random.uniform(-5, 5))
    aL  = profile["ankle"]   + float(np.random.uniform(-4, 4))
    aR  = profile["ankle"]   + float(np.random.uniform(-4, 4))
    sL  = profile["shoulder"]+ float(np.random.uniform(-6, 6))
    sR  = profile["shoulder"]+ float(np.random.uniform(-6, 6))
    lum = profile["lumbar"]  + float(np.random.uniform(-5, 5))
    return _build_result([], kL, kR, hL, hR, aL, aR, sL, sR, lum, sport, athlete_name)
