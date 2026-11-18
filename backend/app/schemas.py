from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any, Dict
from datetime import datetime

# ── Auth ─────────────────────────────────────────────────────
class UserCreate(BaseModel):
    name:         str
    email:        EmailStr
    password:     str = Field(min_length=8)
    role:         str = "coach"
    organisation: str = ""

class UserLogin(BaseModel):
    email:    EmailStr
    password: str

class UserOut(BaseModel):
    id:           str
    name:         str
    email:        str
    role:         str
    organisation: str
    created_at:   datetime
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user:         UserOut

# ── Athlete ───────────────────────────────────────────────────
class AthleteCreate(BaseModel):
    name:         str
    age:          int
    sport:        str
    position:     str
    height:       float
    weight:       float
    experience:   int
    risk_score:   float = 0
    risk_level:   str = "low"
    training_load: Dict[str, Any] = {}
    recovery:      Dict[str, Any] = {}
    biomechanics:  Dict[str, Any] = {}
    injury_history: List[Any] = []
    recommendations: List[str] = []

class AthleteUpdate(AthleteCreate):
    pass

class AthleteOut(BaseModel):
    id:                 str
    name:               str
    age:                int
    sport:              str
    position:           str
    height:             float
    weight:             float
    experience:         int
    risk_score:         float
    risk_level:         str
    previous_risk_score: Optional[float]
    last_assessment:    Optional[datetime]
    training_load:      Dict[str, Any]
    recovery:           Dict[str, Any]
    biomechanics:       Dict[str, Any]
    injury_history:     List[Any]
    risk_trend:         List[Any]
    recommendations:    List[str]
    created_at:         datetime
    class Config:
        from_attributes = True

# ── Assessment ────────────────────────────────────────────────
class AssessmentInput(BaseModel):
    athlete_id:   Optional[str] = None
    # Athlete info
    age:          int
    sport:        str
    position:     str
    height:       float
    weight:       float
    experience:   int
    # Injury history
    previous_injuries:         str = ""
    number_of_previous_injuries: int = 0
    days_since_last_injury:    int = 365
    previous_injury_severity:  str = "none"
    # Training load
    training_days_per_week:    int
    training_duration_minutes: int
    rpe:                       float
    weekly_training_load:      float
    # Recovery
    sleep_hours:    float
    sleep_quality:  int
    recovery_score: float
    rest_days:      int
    muscle_fatigue: float
    # Biomechanics
    knee_flexion_angle:   float
    knee_valgus_angle:    float
    hip_angle:            float
    ankle_dorsiflexion:   float
    stride_symmetry:      float
    stride_length:        float
    ground_contact_time:  float
    force_asymmetry:      float

class RiskFactor(BaseModel):
    name:         str
    impact:       float
    impact_level: str
    type:         str

class PredictionResult(BaseModel):
    risk_score:        float
    risk_level:        str
    previous_risk_score: Optional[float] = None
    risk_change:       Optional[float] = None
    risk_factors:      List[RiskFactor]
    protective_factors: List[RiskFactor]
    what_to_monitor:   List[str]
    recommendations:   List[str]
    confidence:        float
    model_version:     str
    disclaimer:        str

class AssessmentOut(BaseModel):
    id:           str
    athlete_id:   str
    created_at:   datetime
    risk_score:   float
    risk_level:   str
    training_load: float
    recovery:     float
    fatigue:      float
    result:       Dict[str, Any]
    class Config:
        from_attributes = True

# ── Pose Analysis ─────────────────────────────────────────────
class PoseAnalysisOut(BaseModel):
    id:                 str
    athlete_name:       str
    sport:              str
    created_at:         datetime
    risk_score:         float
    risk_level:         str
    confidence:         float
    keypoints:          List[Any]
    joint_angles:       List[Any]
    segments:           List[Any]
    risk_factors:       List[Any]
    protective_factors: List[Any]
    recommendations:    List[str]
    summary:            str
    disclaimer:         str
    model_version:      str = "PoseNet-V1-MediaPipe"
    class Config:
        from_attributes = True
