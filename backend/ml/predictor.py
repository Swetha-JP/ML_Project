"""
AthleteSafe — Injury Risk Predictor
Loads trained model, runs inference with sport-specific risk profiling.
"""
import joblib
import numpy as np
import os
from typing import Dict, Any

_pipeline      = None
_feature_names = None
_sports_list   = None
_threshold     = None


def _load_model():
    global _pipeline, _feature_names, _sports_list, _threshold
    if _pipeline is None:
        base          = os.path.dirname(__file__)
        model_path    = os.path.join(base, "models", "risk_model.pkl")
        feature_path  = os.path.join(base, "models", "feature_names.pkl")
        sports_path   = os.path.join(base, "models", "sports_list.pkl")
        threshold_path= os.path.join(base, "models", "threshold.pkl")
        if not os.path.exists(model_path):
            raise FileNotFoundError("Model not found. Run: python -m ml.train_model")
        _pipeline      = joblib.load(model_path)
        _feature_names = joblib.load(feature_path)
        _sports_list   = joblib.load(sports_path) if os.path.exists(sports_path) else [
            "football","basketball","cricket","athletics",
            "tennis","rugby","cycling","swimming","other",
        ]
        # Load tuned threshold — default 0.35 if not found (conservative for safety)
        _threshold = float(joblib.load(threshold_path)) if os.path.exists(threshold_path) else 0.35
    return _pipeline, _feature_names, _sports_list, _threshold


def severity_to_score(s: str) -> int:
    return {"none": 0, "minor": 1, "moderate": 2, "severe": 3}.get(s, 0)


def infer_risk_level(score: float) -> str:
    if score < 35: return "low"
    if score < 55: return "moderate"
    if score < 75: return "high"
    return "critical"


def encode_sport(sport_str: str, sports_list: list) -> int:
    """Normalise and encode sport string to integer index."""
    s = sport_str.lower().strip()
    for i, name in enumerate(sports_list):
        if name in s or s in name:
            return i
    return len(sports_list) - 1  # fallback → "other"


# ── Sport-specific risk profiles ─────────────────────────────
# For each sport: primary injury sites, high-risk biomechanical
# feature names, load thresholds, and tailored recommendations.
SPORT_PROFILES = {
    "football": {
        "primary_injuries":  ["ACL tear", "hamstring strain", "ankle sprain"],
        "high_risk_features": ["knee_valgus_angle", "force_asymmetry", "stride_symmetry"],
        "thresholds": {
            "knee_valgus_angle":  8.0,   # > 8° elevates ACL risk
            "force_asymmetry":   12.0,   # > 12% lateral imbalance
            "stride_symmetry":   88.0,   # < 88% symmetry
        },
        "load_ceiling":  110,
        "biomech_bonus": lambda v, f, a, s, h, ankl, gct: 0.05 * v + 0.03 * f + 0.02 * s,
    },
    "basketball": {
        "primary_injuries":  ["ACL tear", "patellar tendinopathy", "ankle sprain"],
        "high_risk_features": ["knee_valgus_angle", "ankle_dorsiflexion", "ground_contact_time"],
        "thresholds": {
            "knee_valgus_angle":  7.0,
            "ankle_dorsiflexion": 12.0,  # < 12° restricted mobility
            "ground_contact_time": 300,  # > 300ms slow absorption
        },
        "load_ceiling":  100,
        "biomech_bonus": lambda v, f, a, s, h, ankl, gct: 0.05 * v + 0.04 * ankl + 0.02 * gct,
    },
    "cricket": {
        "primary_injuries":  ["lumbar stress fracture", "shoulder impingement", "hamstring strain"],
        "high_risk_features": ["hip_angle", "stride_symmetry", "weekly_training_load"],
        "thresholds": {
            "hip_angle":          55.0,  # > 55° hyper-flexion in bowling
            "stride_symmetry":    85.0,
            "weekly_training_load": 90,
        },
        "load_ceiling":  90,
        "biomech_bonus": lambda v, f, a, s, h, ankl, gct: 0.04 * h + 0.03 * s + 0.02 * v,
    },
    "athletics": {
        "primary_injuries":  ["hamstring tear", "stress fracture", "Achilles tendinopathy"],
        "high_risk_features": ["stride_symmetry", "ground_contact_time", "ankle_dorsiflexion"],
        "thresholds": {
            "stride_symmetry":    90.0,
            "ground_contact_time": 280,
            "ankle_dorsiflexion": 10.0,
        },
        "load_ceiling":  120,
        "biomech_bonus": lambda v, f, a, s, h, ankl, gct: 0.05 * s + 0.04 * gct + 0.03 * ankl,
    },
    "tennis": {
        "primary_injuries":  ["tennis elbow", "shoulder rotator cuff", "knee stress"],
        "high_risk_features": ["force_asymmetry", "knee_valgus_angle", "weekly_training_load"],
        "thresholds": {
            "force_asymmetry":   15.0,  # dominant-arm imbalance
            "knee_valgus_angle":  7.0,
            "weekly_training_load": 95,
        },
        "load_ceiling":  95,
        "biomech_bonus": lambda v, f, a, s, h, ankl, gct: 0.05 * f + 0.03 * v + 0.02 * a,
    },
    "rugby": {
        "primary_injuries":  ["concussion", "shoulder dislocation", "knee ligament tear"],
        "high_risk_features": ["weekly_training_load", "force_asymmetry", "severity_score"],
        "thresholds": {
            "weekly_training_load": 100,
            "force_asymmetry":    15.0,
            "severity_score":      2,   # moderate+ prior injury
        },
        "load_ceiling":  100,
        "biomech_bonus": lambda v, f, a, s, h, ankl, gct: 0.05 * a + 0.04 * f + 0.03 * v,
    },
    "cycling": {
        "primary_injuries":  ["knee overuse", "lower back pain", "IT band syndrome"],
        "high_risk_features": ["hip_angle", "ankle_dorsiflexion", "knee_flexion_angle"],
        "thresholds": {
            "hip_angle":          60.0,
            "ankle_dorsiflexion":  8.0,
            "knee_flexion_angle": 45.0,  # < 45° reduced flexion
        },
        "load_ceiling":  130,
        "biomech_bonus": lambda v, f, a, s, h, ankl, gct: 0.04 * h + 0.03 * ankl + 0.02 * v,
    },
    "swimming": {
        "primary_injuries":  ["shoulder impingement", "lower back strain", "knee breaststroke"],
        "high_risk_features": ["stride_symmetry", "recovery_score", "rpe"],
        "thresholds": {
            "stride_symmetry":    88.0,  # pull symmetry proxy
            "recovery_score":     55.0,  # < 55 poor recovery
            "rpe":                 8.0,
        },
        "load_ceiling":  120,
        "biomech_bonus": lambda v, f, a, s, h, ankl, gct: 0.04 * s + 0.03 * gct + 0.02 * v,
    },
    "other": {
        "primary_injuries":  ["general overuse", "muscle strain"],
        "high_risk_features": ["weekly_training_load", "muscle_fatigue", "recovery_score"],
        "thresholds": {},
        "load_ceiling":  110,
        "biomech_bonus": lambda v, f, a, s, h, ankl, gct: 0.0,
    },
}


def _get_sport_profile(sport_str: str) -> dict:
    s = sport_str.lower().strip()
    for key in SPORT_PROFILES:
        if key in s or s in key:
            return SPORT_PROFILES[key]
    return SPORT_PROFILES["other"]


def predict(input_data: Dict[str, Any]) -> Dict[str, Any]:
    pipeline, feature_names, sports_list, threshold = _load_model()

    sport_str     = input_data.get("sport", "other")
    sport_encoded = float(encode_sport(sport_str, sports_list))
    sport_profile = _get_sport_profile(sport_str)

    features = [
        float(input_data.get("age", 25)),
        float(input_data.get("experience", 5)),
        sport_encoded,
        float(input_data.get("training_days_per_week", 5)),
        float(input_data.get("training_duration_minutes", 90)),
        float(input_data.get("rpe", 7)),
        float(input_data.get("weekly_training_load", 70)),
        float(input_data.get("sleep_hours", 7)),
        float(input_data.get("sleep_quality", 7)),
        float(input_data.get("recovery_score", 65)),
        float(input_data.get("rest_days", 2)),
        float(input_data.get("muscle_fatigue", 50)),
        float(input_data.get("number_of_previous_injuries", 0)),
        float(input_data.get("days_since_last_injury", 365)),
        float(severity_to_score(input_data.get("previous_injury_severity", "none"))),
        float(input_data.get("knee_flexion_angle", 72)),
        float(input_data.get("knee_valgus_angle", 5)),
        float(input_data.get("hip_angle", 44)),
        float(input_data.get("ankle_dorsiflexion", 17)),
        float(input_data.get("stride_symmetry", 93)),
        float(input_data.get("stride_length", 155)),
        float(input_data.get("ground_contact_time", 265)),
        float(input_data.get("force_asymmetry", 7)),
    ]

    import pandas as pd
    X_df        = pd.DataFrame([features], columns=feature_names)
    probability = float(pipeline.predict_proba(X_df)[0][1])

    # Use tuned threshold (loaded from threshold.pkl) instead of default 0.5
    # Lower threshold = higher recall = fewer missed high-risk athletes
    ml_high_risk = probability >= threshold

    # ── Extract raw values ────────────────────────────────────
    wload   = float(input_data.get("weekly_training_load", 50))
    fatigue = float(input_data.get("muscle_fatigue", 50))
    sleep   = float(input_data.get("sleep_hours", 7.5))
    recov   = float(input_data.get("recovery_score", 65))
    rpe     = float(input_data.get("rpe", 6))
    n_inj   = float(input_data.get("number_of_previous_injuries", 0))
    days    = float(input_data.get("days_since_last_injury", 365))
    sev     = float(severity_to_score(input_data.get("previous_injury_severity", "none")))
    valgus  = float(input_data.get("knee_valgus_angle", 5))
    asymm   = float(input_data.get("force_asymmetry", 7))
    hip     = float(input_data.get("hip_angle", 44))
    ankl    = float(input_data.get("ankle_dorsiflexion", 17))
    gct     = float(input_data.get("ground_contact_time", 265))
    sym     = float(input_data.get("stride_symmetry", 93))
    kflex   = float(input_data.get("knee_flexion_angle", 72))

    # ── Normalised risk components ────────────────────────────
    load_risk     = min(1, max(0, (wload  - 50) / 100))
    rpe_risk      = min(1, max(0, (rpe    - 5)  / 5))
    fatigue_risk  = fatigue / 100
    sleep_risk    = min(1, max(0, (8 - sleep) / 4))
    recovery_risk = min(1, max(0, (60 - recov) / 60))
    injury_risk   = min(1, n_inj / 7)
    recent_risk   = min(1, max(0, (90 - days) / 90))
    severity_risk = sev / 3
    valgus_risk   = min(1, valgus / 20)
    asymm_risk    = min(1, asymm / 30)
    sym_risk      = min(1, max(0, (95 - sym) / 25))
    hip_risk      = min(1, max(0, (hip  - 40) / 30))
    ankle_risk    = min(1, max(0, (20 - ankl) / 15))
    gct_risk      = min(1, max(0, (gct  - 250) / 150))

    # ── Base rule score ───────────────────────────────────────
    rule_score = (
        min(28, max(0, (wload  - 50) / 100 * 28)) +
        min(20, fatigue / 100 * 20) +
        min(18, max(0, (8 - sleep) / 4 * 18)) +
        min(14, max(0, (60 - recov) / 60 * 14)) +
        min(12, max(0, (rpe - 5) / 5 * 12)) +
        min(12, n_inj * 4) +
        min(8,  max(0, (90 - days) / 90 * 8)) +
        min(6,  sev * 2) +
        min(6,  max(0, (valgus - 5) * 0.6)) +
        min(5,  asymm * 0.25)
    )

    # ── Sport-specific biomechanical bonus ────────────────────
    sport_bonus = sport_profile["biomech_bonus"](
        valgus_risk, fatigue_risk, asymm_risk,
        sym_risk, hip_risk, ankle_risk, gct_risk,
    ) * 100  # scale to same 0–100 range as rule_score

    # Check sport-specific threshold breaches
    thresholds     = sport_profile["thresholds"]
    threshold_hits = 0
    threshold_msgs = []

    if "knee_valgus_angle" in thresholds and valgus > thresholds["knee_valgus_angle"]:
        threshold_hits += 1
        threshold_msgs.append(f"Knee valgus angle ({valgus:.1f}°) exceeds safe threshold for {sport_str}")
    if "force_asymmetry" in thresholds and asymm > thresholds["force_asymmetry"]:
        threshold_hits += 1
        threshold_msgs.append(f"Force asymmetry ({asymm:.1f}%) above safe limit for {sport_str}")
    if "stride_symmetry" in thresholds and sym < thresholds["stride_symmetry"]:
        threshold_hits += 1
        threshold_msgs.append(f"Stride symmetry ({sym:.1f}%) below safe threshold for {sport_str}")
    if "ankle_dorsiflexion" in thresholds and ankl < thresholds["ankle_dorsiflexion"]:
        threshold_hits += 1
        threshold_msgs.append(f"Ankle dorsiflexion ({ankl:.1f}°) restricted for {sport_str}")
    if "ground_contact_time" in thresholds and gct > thresholds["ground_contact_time"]:
        threshold_hits += 1
        threshold_msgs.append(f"Ground contact time ({gct:.0f}ms) elevated for {sport_str}")
    if "hip_angle" in thresholds and hip > thresholds["hip_angle"]:
        threshold_hits += 1
        threshold_msgs.append(f"Hip angle ({hip:.1f}°) in high-risk range for {sport_str}")
    if "weekly_training_load" in thresholds and wload > thresholds["weekly_training_load"]:
        threshold_hits += 1
        threshold_msgs.append(f"Training load ({wload:.0f}) above recommended ceiling for {sport_str}")
    if "recovery_score" in thresholds and recov < thresholds["recovery_score"]:
        threshold_hits += 1
        threshold_msgs.append(f"Recovery score ({recov:.0f}) critically low for {sport_str} demands")
    if "rpe" in thresholds and rpe > thresholds["rpe"]:
        threshold_hits += 1
        threshold_msgs.append(f"RPE ({rpe:.1f}) high for {sport_str} training volume")
    if "severity_score" in thresholds and sev >= thresholds["severity_score"]:
        threshold_hits += 1
        threshold_msgs.append(f"Prior injury severity elevated for contact-sport demands")
    if "knee_flexion_angle" in thresholds and kflex < thresholds["knee_flexion_angle"]:
        threshold_hits += 1
        threshold_msgs.append(f"Knee flexion ({kflex:.1f}°) restricted — relevant for {sport_str}")

    # ── Combine scores ────────────────────────────────────────
    rule_score = min(95, max(5, rule_score + sport_bonus))

    elevated_count = sum([
        1 if wload > 75 else 0,
        1 if fatigue > 70 else 0,
        1 if sleep < 6.5 else 0,
        1 if recov < 50 else 0,
        1 if rpe > 7.5 else 0,
        1 if n_inj >= 2 else 0,
    ])

    ml_score = min(95, max(5, probability * 85 + 10))
    # If the tuned threshold flags high-risk, apply a score floor of 50
    if ml_high_risk:
        ml_score = max(ml_score, 50.0)
    blend    = round(0.75 * rule_score + 0.25 * ml_score, 1)

    if elevated_count >= 3:
        blend = max(blend, 55.0)
    if elevated_count >= 4:
        blend = max(blend, 65.0)
    # Sport threshold breaches add a floor
    if threshold_hits >= 2:
        blend = max(blend, 50.0)
    if threshold_hits >= 3:
        blend = max(blend, 60.0)

    risk_score = round(min(95, max(5, blend)), 1)
    risk_level = infer_risk_level(risk_score)
    confidence = round(min(0.95, 0.72 + probability * 0.23), 2)

    # ── Feature attribution ───────────────────────────────────
    model        = pipeline.named_steps["model"]
    scaler       = pipeline.named_steps["scaler"]
    importances  = model.feature_importances_
    X_scaled     = scaler.transform(X_df)[0]
    attributions = importances * np.abs(X_scaled)
    total_attr   = attributions.sum() or 1.0

    FEATURE_LABELS = {
        "weekly_training_load":        "Training Load",
        "muscle_fatigue":              "Muscle Fatigue",
        "number_of_previous_injuries": "Previous Injury Count",
        "recovery_score":              "Poor Recovery",
        "sleep_hours":                 "Sleep Deficit",
        "rpe":                         "High Perceived Exertion",
        "knee_valgus_angle":           "Knee Valgus Angle",
        "force_asymmetry":             "Force Asymmetry",
        "days_since_last_injury":      "Recent Injury History",
        "severity_score":              "Injury Severity",
        "stride_symmetry":             "Reduced Stride Symmetry",
        "ankle_dorsiflexion":          "Limited Ankle Mobility",
        "hip_angle":                   "Hip Angle",
        "ground_contact_time":         "Ground Contact Time",
        "sport_encoded":               f"{sport_str.title()} Sport Profile",
    }

    risk_factors       = []
    protective_factors = []

    for i, fname in enumerate(feature_names):
        if fname not in FEATURE_LABELS:
            continue
        label  = FEATURE_LABELS[fname]
        impact = round((attributions[i] / total_attr) * risk_score * 0.7, 1)
        level  = "high" if impact > 10 else "medium" if impact > 4 else "low"

        is_protective = False
        val = features[i]

        if fname == "recovery_score"    and val > 70:  is_protective = True
        elif fname == "sleep_hours"     and val >= 8:  is_protective = True
        elif fname == "stride_symmetry" and val >= 93: is_protective = True
        elif fname == "sport_encoded":
            # Sport profile shown as context, not risk
            continue

        if is_protective and impact > 1:
            protective_factors.append({
                "name":         label.replace("Poor ", "Good ").replace("Deficit", "Adequate").replace("Reduced ", "Strong "),
                "impact":       -round(impact, 1),
                "impact_level": level,
                "type":         "protective",
            })
        elif not is_protective and impact > 1.5:
            risk_factors.append({
                "name":         label,
                "impact":       impact,
                "impact_level": level,
                "type":         "risk",
            })

    # Add sport-specific threshold breach factors
    for msg in threshold_msgs:
        risk_factors.append({
            "name":         msg,
            "impact":       round(6 + threshold_hits * 1.5, 1),
            "impact_level": "high" if threshold_hits >= 2 else "medium",
            "type":         "risk",
        })

    risk_factors       = sorted(risk_factors,       key=lambda x: -x["impact"])[:7]
    protective_factors = sorted(protective_factors, key=lambda x: x["impact"])[:4]

    # ── What to monitor (generic + sport-specific) ────────────
    what_to_monitor = []
    if wload > sport_profile["load_ceiling"] * 0.85:
        what_to_monitor.append(f"Training load — approaching {sport_str.title()} ceiling")
    elif wload > 70:
        what_to_monitor.append("Training intensity and weekly load")
    if fatigue > 65:
        what_to_monitor.append("Muscle fatigue accumulation")
    if sleep < 7:
        what_to_monitor.append("Sleep duration and quality")
    if recov < 55:
        what_to_monitor.append("Recovery score trends")
    if n_inj > 0:
        what_to_monitor.append("Previously injured areas")

    # Sport-specific monitoring
    high_risk_feats = sport_profile["high_risk_features"]
    sport_monitor_map = {
        "knee_valgus_angle":   f"Knee alignment during {sport_str.title()} movements",
        "force_asymmetry":     "Left/right force asymmetry",
        "stride_symmetry":     "Stride symmetry and gait balance",
        "ankle_dorsiflexion":  "Ankle mobility",
        "ground_contact_time": "Ground contact time",
        "hip_angle":           "Hip flexion and rotation angles",
        "weekly_training_load": f"Weekly load relative to {sport_str.title()} demands",
        "recovery_score":      "Recovery between sessions",
        "rpe":                 "Session perceived exertion",
        "severity_score":      "Injury recurrence risk in contact situations",
    }
    for feat in high_risk_feats:
        if feat in sport_monitor_map and sport_monitor_map[feat] not in what_to_monitor:
            what_to_monitor.append(sport_monitor_map[feat])

    if not what_to_monitor:
        what_to_monitor = ["Continue current monitoring protocols"]

    # ── Recommendations (generic + sport-specific) ────────────
    recommendations = []
    primary = sport_profile["primary_injuries"]

    if risk_score >= 75:
        recommendations.append(
            f"Critical risk — immediate workload reduction required. "
            f"{sport_str.title()} athletes at this level face elevated {primary[0]} risk."
        )
        recommendations.append("Mandatory rest day before next high-intensity session.")
    elif risk_score >= 55:
        recommendations.append(
            f"Reduce training intensity by 15–20%. "
            f"Watch for early signs of {primary[0]} in {sport_str.title()}."
        )

    if sleep < 7:
        recommendations.append("Prioritise sleep — target 8+ hours per night.")
    if recov < 55:
        recommendations.append("Implement recovery protocols: ice bath, massage, or active recovery.")
    if fatigue > 70:
        recommendations.append("Monitor fatigue markers daily and adjust session loads accordingly.")
    if n_inj > 1:
        recommendations.append(f"Apply extra monitoring to previously injured areas ({primary[0]} site).")

    # Sport-specific biomechanical recommendations
    sport_recs = {
        "football": [
            ("knee_valgus_angle",  8.0,  ">", "Add knee-valgus corrective drills (Copenhagen adductor, single-leg squats) to reduce ACL risk."),
            ("force_asymmetry",   12.0,  ">", "Address left/right force imbalance with unilateral strength work."),
        ],
        "basketball": [
            ("knee_valgus_angle",  7.0,  ">", "Landing mechanics training to reduce patellar and ACL stress during jump landings."),
            ("ankle_dorsiflexion",12.0,  "<", "Improve ankle mobility with daily dorsiflexion stretching and calf eccentric work."),
        ],
        "cricket": [
            ("hip_angle",         55.0,  ">", "Bowler hip load is elevated — monitor lumbar spine and reduce over-bowling."),
            ("stride_symmetry",   85.0,  "<", "Asymmetric stride in bowling action — review with biomechanist."),
        ],
        "athletics": [
            ("stride_symmetry",   90.0,  "<", "Gait asymmetry detected — assess for underlying hip/hamstring imbalance."),
            ("ankle_dorsiflexion",10.0,  "<", "Limited ankle dorsiflexion elevates Achilles load — prioritise ankle mobility."),
        ],
        "tennis": [
            ("force_asymmetry",   15.0,  ">", "High arm/leg asymmetry — increase contralateral strength work to reduce elbow/shoulder overuse."),
        ],
        "rugby": [
            ("weekly_training_load", 100, ">", "High contact-sport load — ensure full recovery between sessions; monitor collision impact."),
            ("severity_score",    2.0,  ">=","Prior moderate/severe injury in contact sport — apply graduated return-to-play protocol."),
        ],
        "cycling": [
            ("hip_angle",         60.0,  ">", "Check bike fit — high hip angle may cause lower back and IT band overuse."),
            ("ankle_dorsiflexion", 8.0,  "<", "Limited ankle mobility causes compensatory knee stress — address with stretching."),
        ],
        "swimming": [
            ("stride_symmetry",   88.0,  "<", "Pull asymmetry detected — review stroke mechanics to reduce shoulder impingement risk."),
            ("recovery_score",    55.0,  "<", "Swimming volume demands higher recovery — consider active recovery swim sessions."),
        ],
    }

    sport_key = sport_str.lower().strip()
    for feat, thresh, op, rec in sport_recs.get(sport_key, []):
        val_map = {
            "knee_valgus_angle": valgus, "force_asymmetry": asymm,
            "ankle_dorsiflexion": ankl, "stride_symmetry": sym,
            "hip_angle": hip, "weekly_training_load": wload,
            "recovery_score": recov, "severity_score": sev,
        }
        val = val_map.get(feat, 0)
        triggered = (op == ">" and val > thresh) or \
                    (op == "<" and val < thresh) or \
                    (op == ">=" and val >= thresh)
        if triggered and rec not in recommendations:
            recommendations.append(rec)

    if not recommendations:
        recommendations.append(
            f"Athlete is in good condition for {sport_str.title()} — maintain current programme."
        )

    return {
        "risk_score":         risk_score,
        "risk_level":         risk_level,
        "confidence":         confidence,
        "sport":              sport_str,
        "sport_risk_profile": {
            "primary_injuries":   primary,
            "high_risk_features": high_risk_feats,
            "threshold_breaches": threshold_hits,
        },
        "risk_factors":       risk_factors,
        "protective_factors": protective_factors,
        "what_to_monitor":    what_to_monitor,
        "recommendations":    recommendations,
        "model_version":      "GradientBoost-SportV2",
        "disclaimer":         "AthleteSafe provides training and wellness decision-support insights. It is not a medical diagnostic system.",
    }
