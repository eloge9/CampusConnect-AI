from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.routes import (
    absences,
    announcements,
    assignments,
    auth,
    classes,
    exams,
    lost_found,
    notifications,
    potential_matches,
    schedules,
    subjects,
    teacher_assignments,
)

app = FastAPI(title=settings.app_name)

Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

origins = (
    ["*"]
    if settings.cors_allowed_origins.strip() == "*"
    else [origin.strip() for origin in settings.cors_allowed_origins.split(",")]
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(classes.router)
app.include_router(subjects.router)
app.include_router(teacher_assignments.router)
app.include_router(announcements.router)
app.include_router(schedules.router)
app.include_router(assignments.router)
app.include_router(exams.router)
app.include_router(absences.router)
app.include_router(lost_found.router)
app.include_router(potential_matches.router)
app.include_router(notifications.router)


@app.get("/")
def root():
    return {"status": "ok", "app": settings.app_name, "environment": settings.environment}


@app.get("/sante")
def sante():
    return {"status": "ok", "app": settings.app_name, "environment": settings.environment}
