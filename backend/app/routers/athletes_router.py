from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user

router = APIRouter(prefix="/api/athletes", tags=["athletes"])


@router.get("", response_model=List[schemas.AthleteOut])
def list_athletes(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return db.query(models.Athlete).filter(models.Athlete.owner_id == current_user.id).all()


@router.post("", response_model=schemas.AthleteOut, status_code=201)
def create_athlete(
    athlete_in: schemas.AthleteCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    athlete = models.Athlete(
        owner_id=current_user.id,
        risk_trend=[{"date": datetime.utcnow().strftime("%Y-%m-%d"), "score": athlete_in.risk_score}],
        **athlete_in.model_dump(),
    )
    db.add(athlete)
    db.commit()
    db.refresh(athlete)
    return athlete


@router.get("/{athlete_id}", response_model=schemas.AthleteOut)
def get_athlete(
    athlete_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    athlete = db.query(models.Athlete).filter(
        models.Athlete.id == athlete_id,
        models.Athlete.owner_id == current_user.id,
    ).first()
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")
    return athlete


@router.put("/{athlete_id}", response_model=schemas.AthleteOut)
def update_athlete(
    athlete_id: str,
    athlete_in: schemas.AthleteUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    athlete = db.query(models.Athlete).filter(
        models.Athlete.id == athlete_id,
        models.Athlete.owner_id == current_user.id,
    ).first()
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")

    for field, value in athlete_in.model_dump().items():
        setattr(athlete, field, value)
    db.commit()
    db.refresh(athlete)
    return athlete


@router.delete("/{athlete_id}", status_code=204)
def delete_athlete(
    athlete_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    athlete = db.query(models.Athlete).filter(
        models.Athlete.id == athlete_id,
        models.Athlete.owner_id == current_user.id,
    ).first()
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")
    db.delete(athlete)
    db.commit()
