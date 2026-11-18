"""
AthleteSafe — FastAPI Backend Entry Point
"""
import os
import sys

# Ensure ml/ is importable
sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from app.config   import settings
from app.database import engine, Base
from app.routers  import auth_router, athletes_router, predict_router, pose_router


# ── Create all DB tables on startup ───────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(settings.MODEL_DIR,  exist_ok=True)
    print(f"\n{'='*50}")
    print(f"  AthleteSafe API v{settings.APP_VERSION}")
    print(f"  Environment : {settings.ENVIRONMENT}")
    print(f"  Database    : {settings.DATABASE_URL}")
    print(f"  Docs        : http://localhost:8000/docs")
    print(f"{'='*50}\n")
    yield


app = FastAPI(
    title="AthleteSafe API",
    description="Injury Risk Prediction Platform — Sports Performance Intelligence",
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS ───────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────
app.include_router(auth_router.router)
app.include_router(athletes_router.router)
app.include_router(predict_router.router)
app.include_router(pose_router.router)

# ── Serve uploaded images ──────────────────────────────────────
if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


# ── Health check ───────────────────────────────────────────────
@app.get("/health", tags=["health"])
def health():
    return {"status": "healthy", "version": settings.APP_VERSION}


@app.get("/", tags=["health"])
def root():
    return {
        "name":    settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs":    "/docs",
        "status":  "running",
    }
