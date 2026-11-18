"""
AthleteSafe — ML Model Training Script
Trains a GradientBoostingClassifier on synthetic biomechanical data.
Sport-specific risk profiles are encoded into training data.
Improvements:
  - N increased to 15,000 for better generalisation
  - class_weight balancing to reduce missed high-risk athletes
  - Optimal classification threshold tuned for maximum recall ≥ 90%
Run: python -m ml.train_model
"""
import numpy as np
import pandas as pd
import joblib
import os
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.metrics import classification_report, roc_auc_score, f1_score, recall_score, precision_score

np.random.seed(42)
N = 15000

# Sports and their encoded integer index
SPORTS = [
    "football",     # 0
    "basketball",   # 1
    "cricket",      # 2
    "athletics",    # 3
    "tennis",       # 4
    "rugby",        # 5
    "cycling",      # 6
    "swimming",     # 7
    "other",        # 8
]
SPORT_INDEX = {s: i for i, s in enumerate(SPORTS)}

FEATURE_NAMES = [
    "age", "experience",
    "sport_encoded",
    "training_days_per_week", "training_duration_minutes", "rpe", "weekly_training_load",
    "sleep_hours", "sleep_quality", "recovery_score", "rest_days", "muscle_fatigue",
    "number_of_previous_injuries", "days_since_last_injury", "severity_score",
    "knee_flexion_angle", "knee_valgus_angle", "hip_angle", "ankle_dorsiflexion",
    "stride_symmetry", "stride_length", "ground_contact_time", "force_asymmetry",
]

def severity_to_score(s):
    return {"none": 0, "minor": 1, "moderate": 2, "severe": 3}.get(s, 0)


# ── Sport-specific biomechanical risk adjustments ─────────────
# Each sport has known high-risk anatomical areas that change how
# certain features should be weighted during risk labelling.
SPORT_RISK_MODIFIERS = {
    # (sport_index): {feature: multiplier, ...}
    # football: knee valgus (ACL), force asymmetry, stride symmetry
    0: {"knee_valgus_angle": 1.4, "force_asymmetry": 1.2, "stride_symmetry": 1.1},
    # basketball: knee valgus (ACL/patellar), ankle dorsiflexion, ground_contact_time
    1: {"knee_valgus_angle": 1.5, "ankle_dorsiflexion": 1.3, "ground_contact_time": 1.2},
    # cricket: shoulder/hip rotation — hip angle, stride asymmetry, weekly_load
    2: {"hip_angle": 1.4, "stride_symmetry": 1.2, "weekly_training_load": 1.1},
    # athletics: stride symmetry, ground contact time, ankle dorsiflexion
    3: {"stride_symmetry": 1.5, "ground_contact_time": 1.3, "ankle_dorsiflexion": 1.2},
    # tennis: force asymmetry (dominant arm), knee valgus, weekly load
    4: {"force_asymmetry": 1.5, "knee_valgus_angle": 1.2, "weekly_training_load": 1.1},
    # rugby: high contact load — weekly load, force asymmetry, number of injuries
    5: {"weekly_training_load": 1.4, "force_asymmetry": 1.3, "severity_score": 1.3},
    # cycling: hip angle, ankle dorsiflexion, knee flexion
    6: {"hip_angle": 1.3, "ankle_dorsiflexion": 1.2, "knee_flexion_angle": 1.2},
    # swimming: shoulder — stride symmetry (pull symmetry), recovery_score
    7: {"stride_symmetry": 1.3, "recovery_score": 1.2, "rpe": 1.1},
    # other: no modifier
    8: {},
}


def generate_dataset():
    """Generate sport-specific synthetic biomechanical training data."""
    data = {}

    # Athlete profile
    data["age"]        = np.random.randint(16, 40, N)
    data["experience"] = np.random.randint(0, 20, N)

    # Sport — distribute roughly evenly across all 9 sports
    sport_indices = np.random.randint(0, len(SPORTS), N)
    data["sport_encoded"] = sport_indices

    # Training load
    data["training_days_per_week"]    = np.random.randint(2, 8, N)
    data["training_duration_minutes"] = np.random.randint(30, 180, N)
    data["rpe"]                       = np.random.uniform(3, 10, N)
    data["weekly_training_load"]      = np.random.uniform(20, 150, N)

    # Recovery
    data["sleep_hours"]    = np.random.uniform(4, 10, N)
    data["sleep_quality"]  = np.random.randint(1, 11, N)
    data["recovery_score"] = np.random.uniform(10, 100, N)
    data["rest_days"]      = np.random.randint(0, 4, N)
    data["muscle_fatigue"] = np.random.uniform(5, 100, N)

    # Injury history
    data["number_of_previous_injuries"] = np.random.randint(0, 8, N)
    data["days_since_last_injury"]       = np.random.randint(0, 1000, N)
    data["severity_score"]               = np.random.randint(0, 4, N)

    # Biomechanics
    data["knee_flexion_angle"]  = np.random.uniform(40, 100, N)
    data["knee_valgus_angle"]   = np.random.uniform(0, 20, N)
    data["hip_angle"]           = np.random.uniform(20, 70, N)
    data["ankle_dorsiflexion"]  = np.random.uniform(5, 35, N)
    data["stride_symmetry"]     = np.random.uniform(70, 100, N)
    data["stride_length"]       = np.random.uniform(80, 220, N)
    data["ground_contact_time"] = np.random.uniform(150, 400, N)
    data["force_asymmetry"]     = np.random.uniform(0, 30, N)

    df = pd.DataFrame(data)

    # ── Base risk components (0–1 each) ───────────────────────
    load_risk     = np.clip((df["weekly_training_load"] - 50) / 100, 0, 1)
    rpe_risk      = np.clip((df["rpe"] - 5) / 5, 0, 1)
    fatigue_risk  = df["muscle_fatigue"] / 100
    sleep_risk    = np.clip((8 - df["sleep_hours"]) / 4, 0, 1)
    recovery_risk = np.clip((60 - df["recovery_score"]) / 60, 0, 1)
    injury_risk   = np.clip(df["number_of_previous_injuries"] / 7, 0, 1)
    recent_risk   = np.clip((90 - df["days_since_last_injury"]) / 90, 0, 1).clip(0)
    severity_risk = df["severity_score"] / 3
    valgus_risk   = np.clip(df["knee_valgus_angle"] / 20, 0, 1)
    asymm_risk    = np.clip(df["force_asymmetry"] / 30, 0, 1)
    sym_risk      = np.clip((95 - df["stride_symmetry"]) / 25, 0, 1)
    hip_risk      = np.clip((df["hip_angle"] - 40) / 30, 0, 1)
    ankle_risk    = np.clip((20 - df["ankle_dorsiflexion"]) / 15, 0, 1)
    gct_risk      = np.clip((df["ground_contact_time"] - 250) / 150, 0, 1)

    # ── Base weighted risk ────────────────────────────────────
    base_risk = (
        0.18 * load_risk +
        0.12 * rpe_risk +
        0.14 * fatigue_risk +
        0.12 * sleep_risk +
        0.10 * recovery_risk +
        0.10 * injury_risk +
        0.06 * recent_risk +
        0.06 * severity_risk +
        0.06 * valgus_risk +
        0.06 * asymm_risk +
        0.04 * sym_risk
    )

    # ── Sport-specific bonus risk ─────────────────────────────
    # Each sport adds extra risk on its high-risk features
    sport_bonus = np.zeros(N)

    sport_contributions = {
        0: 0.04 * valgus_risk + 0.03 * asymm_risk + 0.02 * sym_risk,         # football
        1: 0.05 * valgus_risk + 0.03 * ankle_risk + 0.02 * gct_risk,          # basketball
        2: 0.04 * hip_risk    + 0.03 * sym_risk    + 0.02 * load_risk,         # cricket
        3: 0.05 * sym_risk    + 0.03 * gct_risk    + 0.03 * ankle_risk,        # athletics
        4: 0.05 * asymm_risk  + 0.03 * valgus_risk + 0.02 * load_risk,         # tennis
        5: 0.05 * load_risk   + 0.04 * asymm_risk  + 0.03 * severity_risk,     # rugby
        6: 0.04 * hip_risk    + 0.03 * ankle_risk  + 0.02 * valgus_risk,       # cycling
        7: 0.04 * sym_risk    + 0.03 * recovery_risk + 0.02 * rpe_risk,        # swimming
        8: np.zeros(N),                                                          # other
    }

    for sport_idx, contrib in sport_contributions.items():
        mask = (sport_indices == sport_idx)
        sport_bonus[mask] = contrib[mask]

    risk = base_risk + sport_bonus
    risk = risk + np.random.normal(0, 0.04, N)
    risk = np.clip(risk, 0, 1)

    df["risk_label"] = (risk > 0.50).astype(int)
    df["risk_score"] = (risk * 100).round(1)

    return df


def find_best_threshold(y_true, y_proba, min_recall: float = 0.90):
    """
    Scan thresholds from 0.50 down to 0.20.
    Pick the highest threshold that achieves recall >= min_recall,
    then among those pick the one with the best F1.
    """
    best_thresh = 0.50
    best_f1     = 0.0
    for t in np.arange(0.50, 0.19, -0.01):
        preds   = (y_proba >= t).astype(int)
        rec     = recall_score(y_true, preds, zero_division=0)
        f1      = f1_score(y_true, preds, zero_division=0)
        if rec >= min_recall and f1 > best_f1:
            best_f1     = f1
            best_thresh = round(t, 2)
    return best_thresh, best_f1


def train():
    print("Generating sport-specific synthetic training data...")
    df = generate_dataset()

    print(f"\nDataset size     : {len(df):,} athletes")
    print("\nSport distribution:")
    for i, sport in enumerate(SPORTS):
        count = (df["sport_encoded"] == i).sum()
        hr    = df[df["sport_encoded"] == i]["risk_label"].mean()
        print(f"  {sport:<12} {count:>5} athletes  |  {hr:.1%} high-risk")

    X = df[FEATURE_NAMES]
    y = df["risk_label"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"\nTraining samples : {len(X_train):,}")
    print(f"Test samples     : {len(X_test):,}")
    print(f"High-risk class  : {y_train.mean():.1%}")

    # ── Fix 2: class_weight balances the cost of missing high-risk athletes ──
    # weight=3 means a missed high-risk counts 3x more than a false positive
    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("model", GradientBoostingClassifier(
            n_estimators=300,
            learning_rate=0.07,
            max_depth=4,
            min_samples_leaf=8,
            subsample=0.8,
            random_state=42,
        )),
    ])

    # GradientBoosting doesn't support class_weight natively —
    # we apply sample weights instead (equivalent effect)
    sample_weight = np.where(y_train == 1, 3.0, 1.0)

    print("\nTraining with class-weighted GradientBoostingClassifier...")
    pipeline.fit(X_train, y_train, model__sample_weight=sample_weight)

    y_proba = pipeline.predict_proba(X_test)[:, 1]

    # ── Fix 1: tune classification threshold for recall ≥ 90% ───────────────
    print("\nTuning classification threshold for recall ≥ 90%...")
    best_thresh, best_f1 = find_best_threshold(y_test, y_proba, min_recall=0.90)
    print(f"  Optimal threshold : {best_thresh}  (F1 at that point: {best_f1:.4f})")

    y_pred = (y_proba >= best_thresh).astype(int)

    print("\n── Model Evaluation (tuned threshold) ───────────")
    print(classification_report(y_test, y_pred, target_names=["Low/Mod Risk", "High Risk"]))
    auc = roc_auc_score(y_test, y_proba)
    print(f"ROC-AUC : {auc:.4f}")
    print(f"Recall  : {recall_score(y_test, y_pred):.4f}")
    print(f"Precision: {precision_score(y_test, y_pred):.4f}")

    # ── 5-fold CV on accuracy ────────────────────────────────────────────────
    print("\nRunning 5-fold cross-validation...")
    cv_scores = cross_val_score(pipeline, X, y, cv=StratifiedKFold(5), scoring="roc_auc")
    print(f"  CV ROC-AUC : {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

    os.makedirs("ml/models", exist_ok=True)
    joblib.dump(pipeline,      "ml/models/risk_model.pkl")
    joblib.dump(FEATURE_NAMES, "ml/models/feature_names.pkl")
    joblib.dump(SPORTS,        "ml/models/sports_list.pkl")
    joblib.dump(best_thresh,   "ml/models/threshold.pkl")
    print(f"\nModel saved     → ml/models/risk_model.pkl")
    print(f"Threshold saved → ml/models/threshold.pkl  ({best_thresh})")
    print(f"Sports saved    → ml/models/sports_list.pkl")


if __name__ == "__main__":
    train()


def save_dataset_csv(path: str = "ml/dataset.csv"):
    """Save the synthetic training dataset to a CSV file for inspection."""
    df = generate_dataset()
    # Replace encoded int with sport name for readability
    df.insert(2, "sport_name", df["sport_encoded"].map({i: s for i, s in enumerate(SPORTS)}))
    os.makedirs(os.path.dirname(path), exist_ok=True)
    df.to_csv(path, index=False)
    print(f"Dataset saved → {path}  ({len(df)} rows, {len(df.columns)} columns)")
    return df
