# Excluded Files Setup Guide

These files are **not included in the repository** for security and size reasons.  
You must create or generate them manually after cloning.

---

## 1. `backend/.env`

**Why excluded:** Contains secret keys and credentials.

Create the file at `backend/.env` with the following content:

```env
# ── AthleteSafe Backend Environment Variables ──────────────

# App
APP_NAME=AthleteSafe
APP_VERSION=1.0.0
DEBUG=true
ENVIRONMENT=development

# Security — CHANGE THIS in production!
SECRET_KEY=athletesafe-super-secret-key-change-in-production-2026
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Database
DATABASE_URL=sqlite:///./athletesafe.db

# CORS — frontend URLs
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# File uploads
MAX_UPLOAD_SIZE_MB=15
UPLOAD_DIR=./uploads

# ML Model
MODEL_DIR=./ml/models
```

---

## 2. `athletesafe/.env`

**Why excluded:** Contains frontend API URL configuration.

Create the file at `athletesafe/.env` with the following content:

```env
# Frontend environment — Vite reads VITE_ prefixed vars
VITE_API_URL=http://localhost:8000
```

---

## 3. `backend/ml/models/risk_model.pkl`

**Why excluded:** Large binary file (~478 KB). Binary model files are not suited for git version control.

Generate it by running the training script:

```bash
cd backend
python -m ml.train_model
```

This will:
- Generate 6,000 synthetic biomechanical training records
- Train a `GradientBoostingClassifier` with `StandardScaler` pipeline
- Save the model to `backend/ml/models/risk_model.pkl`
- Save feature names to `backend/ml/models/feature_names.pkl`

Expected output after training:
```
Training samples : 4800
Test samples     : 1200
High-risk class  : ~45%

── Model Evaluation ──────────────────────
ROC-AUC: 0.9520
Accuracy: ~91%

Model saved → ml/models/risk_model.pkl
```

---

## 4. `backend/ml/models/feature_names.pkl`

**Why excluded:** Generated alongside `risk_model.pkl`.

This file is automatically created when you run `python -m ml.train_model` (same step as above). No separate action needed.

It stores the list of 22 feature names the model expects:

```python
[
  "age", "experience",
  "training_days_per_week", "training_duration_minutes", "rpe", "weekly_training_load",
  "sleep_hours", "sleep_quality", "recovery_score", "rest_days", "muscle_fatigue",
  "number_of_previous_injuries", "days_since_last_injury", "severity_score",
  "knee_flexion_angle", "knee_valgus_angle", "hip_angle", "ankle_dorsiflexion",
  "stride_symmetry", "stride_length", "ground_contact_time", "force_asymmetry"
]
```

---

## Quick Setup (after cloning)

```bash
# 1. Create backend .env
cp backend/.env.example backend/.env   # or create manually

# 2. Create frontend .env
echo "VITE_API_URL=http://localhost:8000" > athletesafe/.env

# 3. Install backend dependencies
cd backend
pip install -r requirements.txt

# 4. Train the ML model
python -m ml.train_model

# 5. Install frontend dependencies
cd ../athletesafe
npm install

# 6. Start both servers
cd ..
.\start.ps1
```

---

## Summary

| File | Location | How to get it |
|---|---|---|
| `risk_model.pkl` | `backend/ml/models/` | Run `python -m ml.train_model` |
| `feature_names.pkl` | `backend/ml/models/` | Run `python -m ml.train_model` |
| `.env` (backend) | `backend/` | Create manually from template above |
| `.env` (frontend) | `athletesafe/` | Create manually from template above |
