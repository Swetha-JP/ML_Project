from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user
from ml.predictor import predict
from typing import List

router = APIRouter(prefix="/api/predict", tags=["prediction"])


@router.post("", response_model=schemas.PredictionResult)
def run_prediction(
    input_data: schemas.AssessmentInput,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    try:
        result = predict(input_data.model_dump())
    except FileNotFoundError:
        raise HTTPException(
            status_code=503,
            detail="ML model not found. Run: python -m ml.train_model"
        )

    # Save assessment record
    fatigue = input_data.muscle_fatigue
    assessment = models.Assessment(
        owner_id=current_user.id,
        athlete_id=input_data.athlete_id or "standalone",
        risk_score=result["risk_score"],
        risk_level=result["risk_level"],
        training_load=input_data.weekly_training_load,
        recovery=input_data.recovery_score,
        fatigue=fatigue,
        input_data=input_data.model_dump(),
        result=result,
    )
    db.add(assessment)

    # Update athlete risk if athlete_id provided
    if input_data.athlete_id:
        athlete = db.query(models.Athlete).filter(
            models.Athlete.id == input_data.athlete_id,
            models.Athlete.owner_id == current_user.id,
        ).first()
        if athlete:
            athlete.previous_risk_score = athlete.risk_score
            athlete.risk_score          = result["risk_score"]
            athlete.risk_level          = result["risk_level"]
            athlete.last_assessment     = datetime.utcnow()
            # Append to risk trend
            trend = list(athlete.risk_trend or [])
            trend.append({"date": datetime.utcnow().strftime("%Y-%m-%d"), "score": result["risk_score"]})
            athlete.risk_trend = trend[-30:]  # keep last 30 entries
            athlete.recommendations = result["recommendations"]

    db.commit()
    return result


@router.get("/history", response_model=List[schemas.AssessmentOut])
def get_assessment_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return (
        db.query(models.Assessment)
        .filter(models.Assessment.owner_id == current_user.id)
        .order_by(models.Assessment.created_at.desc())
        .limit(100)
        .all()
    )
