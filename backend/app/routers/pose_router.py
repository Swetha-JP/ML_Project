from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user
from ..config import settings
from ml.pose_analyzer import analyze_image
import os, uuid, aiofiles
from typing import List

router = APIRouter(prefix="/api/pose", tags=["pose"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}


@router.post("/analyze", response_model=schemas.PoseAnalysisOut, status_code=201)
async def analyze_pose(
    file:         UploadFile = File(...),
    sport:        str = Form("Football"),
    athlete_name: str = Form("Unknown"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Validate file type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG or WebP images are accepted.")

    # Validate file size
    image_bytes = await file.read()
    if len(image_bytes) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"Image must be under {settings.MAX_UPLOAD_SIZE_MB} MB.")

    # Save image
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    filename  = f"{uuid.uuid4()}{os.path.splitext(file.filename or '.jpg')[1]}"
    file_path = os.path.join(settings.UPLOAD_DIR, filename)
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(image_bytes)

    # Run analysis
    result = analyze_image(image_bytes, sport, athlete_name)

    # Persist
    record = models.PoseAnalysis(
        owner_id          = current_user.id,
        athlete_name      = athlete_name,
        sport             = sport,
        image_path        = file_path,
        risk_score        = result["risk_score"],
        risk_level        = result["risk_level"],
        confidence        = result["confidence"],
        keypoints         = result["keypoints"],
        joint_angles      = result["joint_angles"],
        segments          = result["segments"],
        risk_factors      = result["risk_factors"],
        protective_factors= result["protective_factors"],
        recommendations   = result["recommendations"],
        summary           = result["summary"],
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        **result,
        "id":         record.id,
        "created_at": record.created_at,
        "disclaimer": result["disclaimer"],
        "model_version": result["model_version"],
    }


@router.get("/history", response_model=List[schemas.PoseAnalysisOut])
def get_pose_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    records = (
        db.query(models.PoseAnalysis)
        .filter(models.PoseAnalysis.owner_id == current_user.id)
        .order_by(models.PoseAnalysis.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id":                r.id,
            "athlete_name":      r.athlete_name,
            "sport":             r.sport,
            "created_at":        r.created_at,
            "risk_score":        r.risk_score,
            "risk_level":        r.risk_level,
            "confidence":        r.confidence,
            "keypoints":         r.keypoints or [],
            "joint_angles":      r.joint_angles or [],
            "segments":          r.segments or [],
            "risk_factors":      r.risk_factors or [],
            "protective_factors": r.protective_factors or [],
            "recommendations":   r.recommendations or [],
            "summary":           r.summary or "",
            "disclaimer":        "Not a clinical assessment.",
            "model_version":     "MediaPipe-Pose-V1",
        }
        for r in records
    ]
