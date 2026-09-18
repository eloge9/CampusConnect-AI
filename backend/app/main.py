from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routes import (
    announcements,
    assignments,
    auth,
    classes,
    exams,
    schedules,
    subjects,
    teacher_assignments,
)

app = FastAPI(title=settings.app_name)

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


@app.get("/")
def root():
    return {"status": "ok", "app": settings.app_name, "environment": settings.environment}


@app.get("/sante")
def sante():
    return {"status": "ok", "app": settings.app_name, "environment": settings.environment}
