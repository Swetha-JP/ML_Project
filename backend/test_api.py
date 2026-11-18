"""
AthleteSafe — Full API Test Suite
Run: python test_api.py
"""
import requests
import sys
import json

BASE = "http://localhost:8000"
PASS = []
FAIL = []

def check(name, condition, detail=""):
    if condition:
        PASS.append(name)
        print(f"  ✓  {name}")
    else:
        FAIL.append(name)
        print(f"  ✗  {name}  {detail}")

def run():
    print("\n" + "="*55)
    print("  AthleteSafe — API Test Suite")
    print("="*55)

    # ── 1. Health ──────────────────────────────────────────
    print("\n[1] Health Check")
    r = requests.get(f"{BASE}/health")
    check("GET /health → 200",         r.status_code == 200)
    check("Health status is healthy",  r.json().get("status") == "healthy")

    # ── 2. Register ────────────────────────────────────────
    print("\n[2] Auth — Register")
    payload = {"name": "API Tester", "email": "apitester@demo.com",
               "password": "Test1234", "role": "scientist", "organisation": "Test Lab"}
    r = requests.post(f"{BASE}/api/auth/register", json=payload)
    # May already exist — both 201 and 400 acceptable
    if r.status_code == 201:
        token = r.json()["access_token"]
        check("POST /api/auth/register → 201", True)
        check("Returns JWT token",             bool(token))
        check("Returns user object",           "user" in r.json())
    else:
        check("POST /api/auth/register (already exists)", r.status_code == 400,
              f"got {r.status_code}")

    # ── 3. Login ───────────────────────────────────────────
    print("\n[3] Auth — Login")
    r = requests.post(f"{BASE}/api/auth/login",
                      json={"email": "apitester@demo.com", "password": "Test1234"})
    check("POST /api/auth/login → 200", r.status_code == 200)
    token = r.json().get("access_token", "")
    check("JWT token returned",         bool(token))
    headers = {"Authorization": f"Bearer {token}"}

    # ── 4. Get current user ────────────────────────────────
    print("\n[4] Auth — Get Me")
    r = requests.get(f"{BASE}/api/auth/me", headers=headers)
    check("GET /api/auth/me → 200",     r.status_code == 200)
    check("User email matches",         r.json().get("email") == "apitester@demo.com")

    # ── 5. Create Athlete ──────────────────────────────────
    print("\n[5] Athletes — Create")
    athlete_payload = {
        "name": "Test Athlete", "age": 24, "sport": "Football",
        "position": "Midfielder", "height": 178.0, "weight": 74.0,
        "experience": 6, "risk_score": 55.0, "risk_level": "moderate",
        "training_load": {"trainingDaysPerWeek": 5, "trainingDurationMinutes": 90,
                          "rpe": 7.0, "weeklyLoad": 68, "dailyLoads": []},
        "recovery": {"sleepHours": 7.0, "sleepQuality": 6, "recoveryScore": 62,
                     "restDays": 2, "muscleFatigue": 55},
        "biomechanics": {"kneeFlexionAngle": 72, "kneeValgusAngle": 6.0,
                         "hipAngle": 44, "ankleDorsiflexion": 17,
                         "strideSymmetry": 92, "strideLength": 155,
                         "groundContactTime": 265, "forceAsymmetry": 8.0},
        "injury_history": [], "recommendations": [],
    }
    r = requests.post(f"{BASE}/api/athletes", json=athlete_payload, headers=headers)
    check("POST /api/athletes → 201",   r.status_code == 201)
    athlete_id = r.json().get("id", "")
    check("Athlete ID returned",        bool(athlete_id))
    check("Risk trend populated",       len(r.json().get("risk_trend", [])) > 0)

    # ── 6. List Athletes ───────────────────────────────────
    print("\n[6] Athletes — List")
    r = requests.get(f"{BASE}/api/athletes", headers=headers)
    check("GET /api/athletes → 200",    r.status_code == 200)
    check("Returns array",              isinstance(r.json(), list))
    check("Contains created athlete",   any(a["id"] == athlete_id for a in r.json()))

    # ── 7. Update Athlete ──────────────────────────────────
    print("\n[7] Athletes — Update")
    athlete_payload["risk_score"] = 68.0
    athlete_payload["risk_level"] = "high"
    r = requests.put(f"{BASE}/api/athletes/{athlete_id}",
                     json=athlete_payload, headers=headers)
    check("PUT /api/athletes/{id} → 200", r.status_code == 200)
    check("Risk score updated",           r.json().get("risk_score") == 68.0)

    # ── 8. ML Prediction ──────────────────────────────────
    print("\n[8] Prediction — High Risk")
    high_risk = {
        "athlete_id": athlete_id,
        "age": 26, "sport": "Football", "position": "Midfielder",
        "height": 178, "weight": 74, "experience": 8,
        "previous_injuries": "Hamstring strain",
        "number_of_previous_injuries": 2, "days_since_last_injury": 45,
        "previous_injury_severity": "moderate",
        "training_days_per_week": 6, "training_duration_minutes": 105,
        "rpe": 8.2, "weekly_training_load": 84,
        "sleep_hours": 5.8, "sleep_quality": 5,
        "recovery_score": 48, "rest_days": 1, "muscle_fatigue": 76,
        "knee_flexion_angle": 68, "knee_valgus_angle": 9.2,
        "hip_angle": 42, "ankle_dorsiflexion": 14,
        "stride_symmetry": 88, "stride_length": 142,
        "ground_contact_time": 285, "force_asymmetry": 12.4,
    }
    r = requests.post(f"{BASE}/api/predict", json=high_risk, headers=headers)
    check("POST /api/predict → 200",        r.status_code == 200)
    result = r.json()
    check("Risk score > 50",                result.get("risk_score", 0) > 50,
          f"got {result.get('risk_score')}")
    check("Risk level is high/critical",    result.get("risk_level") in ["high", "critical"],
          f"got {result.get('risk_level')}")
    check("Risk factors returned",          len(result.get("risk_factors", [])) > 0)
    check("Recommendations returned",       len(result.get("recommendations", [])) > 0)
    check("Model version present",          bool(result.get("model_version")))
    print(f"      Risk: {result.get('risk_score')}% [{result.get('risk_level').upper()}]"
          f"  conf={result.get('confidence')}")

    print("\n[9] Prediction — Low Risk")
    low_risk = {
        "age": 28, "sport": "Tennis", "position": "Singles",
        "height": 180, "weight": 77, "experience": 12,
        "previous_injuries": "",
        "number_of_previous_injuries": 0, "days_since_last_injury": 999,
        "previous_injury_severity": "none",
        "training_days_per_week": 5, "training_duration_minutes": 95,
        "rpe": 5.9, "weekly_training_load": 54,
        "sleep_hours": 8.1, "sleep_quality": 8,
        "recovery_score": 82, "rest_days": 2, "muscle_fatigue": 31,
        "knee_flexion_angle": 78, "knee_valgus_angle": 3.4,
        "hip_angle": 51, "ankle_dorsiflexion": 22,
        "stride_symmetry": 97, "stride_length": 168,
        "ground_contact_time": 228, "force_asymmetry": 4.1,
    }
    r = requests.post(f"{BASE}/api/predict", json=low_risk, headers=headers)
    result2 = r.json()
    check("POST /api/predict → 200",        r.status_code == 200)
    check("Risk score < 40",                result2.get("risk_score", 100) < 40,
          f"got {result2.get('risk_score')}")
    check("Risk level is low/moderate",     result2.get("risk_level") in ["low", "moderate"],
          f"got {result2.get('risk_level')}")
    print(f"      Risk: {result2.get('risk_score')}% [{result2.get('risk_level').upper()}]"
          f"  conf={result2.get('confidence')}")

    # ── 10. Assessment History ─────────────────────────────
    print("\n[10] Assessment History")
    r = requests.get(f"{BASE}/api/predict/history", headers=headers)
    check("GET /api/predict/history → 200", r.status_code == 200)
    check("History contains assessment",    len(r.json()) > 0)

    # ── 11. Delete Athlete ─────────────────────────────────
    print("\n[11] Athletes — Delete")
    r = requests.delete(f"{BASE}/api/athletes/{athlete_id}", headers=headers)
    check("DELETE /api/athletes/{id} → 204", r.status_code == 204)
    r2 = requests.get(f"{BASE}/api/athletes/{athlete_id}", headers=headers)
    check("Athlete no longer retrievable",   r2.status_code == 404)

    # ── 12. Unauthorised access ────────────────────────────
    print("\n[12] Security — Unauthorised")
    r = requests.get(f"{BASE}/api/athletes", timeout=5)
    check("No token → 401 Unauthorised",    r.status_code == 401)
    r = requests.post(f"{BASE}/api/predict", json=high_risk, timeout=5)
    check("Predict without token → 401",    r.status_code == 401)

    # ── Summary ────────────────────────────────────────────
    total = len(PASS) + len(FAIL)
    print(f"\n{'='*55}")
    print(f"  Results: {len(PASS)}/{total} passed")
    if FAIL:
        print(f"  Failed : {', '.join(FAIL)}")
    print(f"{'='*55}\n")
    return len(FAIL) == 0


if __name__ == "__main__":
    try:
        ok = run()
        sys.exit(0 if ok else 1)
    except Exception as e:
        print(f"\nERROR: {e}")
        print("Is the backend running? python -m uvicorn main:app --port 8000")
        sys.exit(1)
