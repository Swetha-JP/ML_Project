from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from .database import Base

def gen_id():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    id            = Column(String, primary_key=True, default=gen_id)
    name          = Column(String, nullable=False)
    email         = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    role          = Column(String, default="coach")        # coach|scientist|physio|admin
    organisation  = Column(String, default="")
    is_active     = Column(Boolean, default=True)
    created_at    = Column(DateTime, default=datetime.utcnow)

    athletes      = relationship("Athlete", back_populates="owner", cascade="all, delete-orphan")
    assessments   = relationship("Assessment", back_populates="owner", cascade="all, delete-orphan")


class Athlete(Base):
    __tablename__ = "athletes"
    id            = Column(String, primary_key=True, default=gen_id)
    owner_id      = Column(String, ForeignKey("users.id"), nullable=False)
    name          = Column(String, nullable=False)
    age           = Column(Integer)
    sport         = Column(String)
    position      = Column(String)
    height        = Column(Float)
    weight        = Column(Float)
    experience    = Column(Integer)
    risk_score    = Column(Float, default=0)
    risk_level    = Column(String, default="low")
    previous_risk_score = Column(Float, nullable=True)
    last_assessment = Column(DateTime, nullable=True)
    created_at    = Column(DateTime, default=datetime.utcnow)
    updated_at    = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Nested JSON data
    training_load = Column(JSON, default=dict)
    recovery      = Column(JSON, default=dict)
    biomechanics  = Column(JSON, default=dict)
    injury_history = Column(JSON, default=list)
    risk_trend    = Column(JSON, default=list)
    recommendations = Column(JSON, default=list)

    owner         = relationship("User", back_populates="athletes")
    assessments   = relationship("Assessment", back_populates="athlete", cascade="all, delete-orphan")


class Assessment(Base):
    __tablename__ = "assessments"
    id            = Column(String, primary_key=True, default=gen_id)
    owner_id      = Column(String, ForeignKey("users.id"), nullable=False)
    athlete_id    = Column(String, ForeignKey("athletes.id"), nullable=False)
    created_at    = Column(DateTime, default=datetime.utcnow)

    risk_score    = Column(Float)
    risk_level    = Column(String)
    training_load = Column(Float)
    recovery      = Column(Float)
    fatigue       = Column(Float)

    input_data    = Column(JSON)   # raw assessment inputs
    result        = Column(JSON)   # full prediction result

    owner         = relationship("User", back_populates="assessments")
    athlete       = relationship("Athlete", back_populates="assessments")


class PoseAnalysis(Base):
    __tablename__ = "pose_analyses"
    id            = Column(String, primary_key=True, default=gen_id)
    owner_id      = Column(String, ForeignKey("users.id"), nullable=False)
    athlete_name  = Column(String)
    sport         = Column(String)
    image_path    = Column(String)
    created_at    = Column(DateTime, default=datetime.utcnow)

    risk_score    = Column(Float)
    risk_level    = Column(String)
    confidence    = Column(Float)
    keypoints     = Column(JSON)
    joint_angles  = Column(JSON)
    segments      = Column(JSON)
    risk_factors  = Column(JSON)
    protective_factors = Column(JSON)
    recommendations = Column(JSON)
    summary       = Column(Text)
