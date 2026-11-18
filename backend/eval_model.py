"""
Full model evaluation — per-sport accuracy, confusion matrix,
cross-validation, and feature importance.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

import numpy as np
import joblib
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report,
    matthews_corrcoef, balanced_accuracy_score,
)
from sklearn.model_selection import StratifiedKFold, cross_val_score
from ml.train_model import generate_dataset, FEATURE_NAMES, SPORTS

# ── Load model ────────────────────────────────────────────────
pipeline = joblib.load("ml/models/risk_model.pkl")

# ── Generate fresh held-out test set (different seed) ────────
np.random.seed(99)
from ml.train_model import N
import ml.train_model as tm
_orig_seed = 99
np.random.seed(99)
df_test = generate_dataset()

X_all = df_test[FEATURE_NAMES]
y_all = df_test["risk_label"]

y_pred  = pipeline.predict(X_all)
y_proba = pipeline.predict_proba(X_all)[:, 1]

print("=" * 55)
print("  AthleteSafe — Model Accuracy Report")
print("=" * 55)

# ── Overall metrics ───────────────────────────────────────────
acc      = accuracy_score(y_all, y_pred)
bal_acc  = balanced_accuracy_score(y_all, y_pred)
prec     = precision_score(y_all, y_pred)
rec      = recall_score(y_all, y_pred)
f1       = f1_score(y_all, y_pred)
roc      = roc_auc_score(y_all, y_proba)
mcc      = matthews_corrcoef(y_all, y_pred)

print(f"\n── Overall (n={len(y_all)}) ──────────────────────────")
print(f"  Accuracy          : {acc:.4f}  ({acc*100:.1f}%)")
print(f"  Balanced Accuracy : {bal_acc:.4f}  ({bal_acc*100:.1f}%)")
print(f"  Precision         : {prec:.4f}")
print(f"  Recall            : {rec:.4f}")
print(f"  F1 Score          : {f1:.4f}")
print(f"  ROC-AUC           : {roc:.4f}")
print(f"  Matthews CC       : {mcc:.4f}  (1=perfect, 0=random)")

# ── Confusion matrix ──────────────────────────────────────────
cm = confusion_matrix(y_all, y_pred)
tn, fp, fn, tp = cm.ravel()
print(f"\n── Confusion Matrix ──────────────────────────────")
print(f"                   Predicted Low  Predicted High")
print(f"  Actual Low     :     {tn:>5}            {fp:>5}")
print(f"  Actual High    :     {fn:>5}            {tp:>5}")
print(f"\n  True Positives  (correctly caught high-risk)  : {tp}")
print(f"  False Negatives (missed high-risk athletes)   : {fn}  ← most important to minimise")
print(f"  False Positives (over-flagged low-risk)       : {fp}")
print(f"  True Negatives  (correctly cleared low-risk)  : {tn}")

# ── Per-sport accuracy ────────────────────────────────────────
print(f"\n── Per-Sport Accuracy ────────────────────────────")
print(f"  {'Sport':<14} {'N':>5}  {'Acc':>6}  {'F1':>6}  {'ROC-AUC':>8}  {'FN%':>6}")
print(f"  {'-'*58}")
for idx, sport in enumerate(SPORTS):
    mask = df_test["sport_encoded"] == idx
    if mask.sum() < 10:
        continue
    ys_true  = y_all[mask]
    ys_pred  = y_pred[mask]
    ys_proba = y_proba[mask]
    s_acc    = accuracy_score(ys_true, ys_pred)
    s_f1     = f1_score(ys_true, ys_pred, zero_division=0)
    try:
        s_roc = roc_auc_score(ys_true, ys_proba)
    except Exception:
        s_roc = float("nan")
    # False negative rate among actual high-risk athletes
    actual_high = (ys_true == 1).sum()
    missed      = ((ys_true == 1) & (ys_pred == 0)).sum()
    fn_rate     = missed / actual_high if actual_high > 0 else 0
    print(f"  {sport:<14} {mask.sum():>5}  {s_acc:>6.3f}  {s_f1:>6.3f}  {s_roc:>8.4f}  {fn_rate:>5.1%}")

# ── 5-fold cross-validation ───────────────────────────────────
print(f"\n── 5-Fold Cross-Validation ───────────────────────")
np.random.seed(42)
df_cv = generate_dataset()
X_cv  = df_cv[FEATURE_NAMES]
y_cv  = df_cv["risk_label"]

for metric in ["accuracy", "f1", "roc_auc"]:
    scores = cross_val_score(pipeline, X_cv, y_cv, cv=StratifiedKFold(5), scoring=metric, n_jobs=-1)
    print(f"  {metric:<12} : {scores.mean():.4f} ± {scores.std():.4f}  (folds: {[round(s,3) for s in scores]})")

# ── Feature importance ────────────────────────────────────────
print(f"\n── Top Feature Importances ───────────────────────")
model       = pipeline.named_steps["model"]
importances = model.feature_importances_
ranked      = sorted(zip(FEATURE_NAMES, importances), key=lambda x: -x[1])
for fname, imp in ranked[:12]:
    bar = "█" * int(imp * 300)
    print(f"  {fname:<35} {imp:.4f}  {bar}")

print("\n" + "=" * 55)
