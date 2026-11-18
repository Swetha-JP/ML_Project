# AthleteSafe — Full Stack Application

**Injury Risk Prediction using Machine Learning on Biomechanical & Historical Data**

---

## Status — COMPLETE ✅

| Service   | URL                           | Status   |
|-----------|-------------------------------|----------|
| Frontend  | http://localhost:3000         | ✅ Running |
| API       | http://localhost:8000         | ✅ Running |
| API Docs  | http://localhost:8000/docs    | ✅ Running |
| ML Model  | GradientBoost ROC-AUC 0.952   | ✅ Trained |
| Database  | SQLite (athletesafe.db)       | ✅ Active  |
| Test Suite| 30/30 tests passing           | ✅ Passing |

---

## Quick Start

### Option A — Start script (recommended)
```powershell
.\start.ps1
```

### Option B — Manual
```powershell
# Terminal 1 — Backend
cd backend
python -m uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend
cd athletesafe
npm run dev
```

### Option C — Docker (production)
```bash
docker-compose up --build
```

---

## Architecture

```
ML kiro/
├── athletesafe/              # React 18 + TypeScript frontend
│   ├── src/
│   │   ├── pages/            # Landing, Auth, App dashboard pages
│   │   ├── components/       # Reusable UI components
│   │   ├── context/          # AuthContext (JWT) + AppContext (state)
│   │   ├── services/
│   │   │   ├── api.ts        # Axios-style fetch client
│   │   │   ├── predictionService.ts   # Calls /api/predict
│   │   │   └── poseAnalysisService.ts # Calls /api/pose/analyze
│   │   └── types/            # TypeScript definitions
│   ├── .env                  # VITE_API_URL=http://localhost:8000
│   └── Dockerfile
│
├── backend/                  # Python 3.13 + FastAPI
│   ├── main.py               # App entry point + CORS + routing
│   ├── app/
│   │   ├── auth.py           # JWT (python-jose) + bcrypt
│   │   ├── models.py         # SQLAlchemy ORM models
│   │   ├── schemas.py        # Pydantic request/response schemas
│   │   ├── config.py         # Settings from .env
│   │   ├── database.py       # SQLite session management
│   │   └── routers/
│   │       ├── auth_router.py      # /api/auth/*
│   │       ├── athletes_router.py  # /api/athletes/*
│   │       ├── predict_router.py   # /api/predict
│   │       └── pose_router.py      # /api/pose/*
│   ├── ml/
│   │   ├── train_model.py    # Trains GradientBoostingClassifier
│   │   ├── predictor.py      # Hybrid ML + domain-rule inference
│   │   ├── pose_analyzer.py  # MediaPipe skeleton + joint angles
│   │   └── models/           # risk_model.pkl + feature_names.pkl
│   ├── athletesafe.db        # SQLite database
│   ├── test_api.py           # 30-test API test suite
│   └── Dockerfile
│
├── docker-compose.yml        # Production deployment
└── start.ps1                 # Dev quick-start
```

---

## API Reference

| Method | Endpoint                   | Auth | Description                      |
|--------|----------------------------|------|----------------------------------|
| GET    | /health                    | —    | Health check                     |
| POST   | /api/auth/register         | —    | Register, returns JWT            |
| POST   | /api/auth/login            | —    | Login, returns JWT               |
| GET    | /api/auth/me               | ✅   | Current user profile             |
| GET    | /api/athletes              | ✅   | List user's athletes             |
| POST   | /api/athletes              | ✅   | Create athlete                   |
| GET    | /api/athletes/{id}         | ✅   | Get single athlete               |
| PUT    | /api/athletes/{id}         | ✅   | Update athlete                   |
| DELETE | /api/athletes/{id}         | ✅   | Delete athlete                   |
| POST   | /api/predict               | ✅   | Run ML injury risk prediction    |
| GET    | /api/predict/history       | ✅   | Assessment history               |
| POST   | /api/pose/analyze          | ✅   | Analyze pose from image upload   |
| GET    | /api/pose/history          | ✅   | Pose analysis history            |

Full interactive docs → **http://localhost:8000/docs**

---

## ML Model Details

| Property        | Value                                    |
|-----------------|------------------------------------------|
| Algorithm       | GradientBoostingClassifier (scikit-learn)|
| Training samples| 6,000 synthetic biomechanical records   |
| Features        | 22 (biomechanics + load + recovery)      |
| ROC-AUC         | 0.952                                    |
| High-risk F1    | 0.74                                     |
| Accuracy        | 91%                                      |
| Scoring method  | Hybrid: 75% domain rules + 25% ML prob  |
| Pose detection  | MediaPipe 33-point skeleton → 9 joints  |

---

## Frontend Pages

| Route           | Page                    |
|-----------------|-------------------------|
| /               | Landing page            |
| /about          | About + team            |
| /blog           | Sports science blog     |
| /contact        | Contact form            |
| /privacy        | Privacy policy          |
| /terms          | Terms of service        |
| /login          | Sign in                 |
| /register       | 2-step registration     |
| /forgot-password| Password reset          |
| /app            | Dashboard               |
| /app/assessment | Risk assessment form    |
| /app/pose       | Pose analysis           |
| /app/athletes   | Athlete directory       |
| /app/manage     | CRUD athlete management |
| /app/analytics  | Performance analytics   |
| /app/history    | Assessment history      |
| /app/recommendations | Recommendations    |

---

## Running Tests

```powershell
cd backend
python test_api.py
# Expected: 30/30 passed
```

---

## Environment Variables

**Backend** (`backend/.env`)
```
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///./athletesafe.db
CORS_ORIGINS=http://localhost:3000
ENVIRONMENT=development
DEBUG=true
```

**Frontend** (`athletesafe/.env`)
```
VITE_API_URL=http://localhost:8000
```

---

## Disclaimer

AthleteSafe is a decision-support platform. It is **not a medical diagnostic system**.
All risk estimates are statistical indicators to assist trained sports professionals.
Always consult qualified medical professionals for clinical decisions.
