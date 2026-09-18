from fastapi import FastAPI

from app.core.config import settings
from app.routes import announcements, auth, classes, subjects, teacher_assignments

app = FastAPI(title=settings.app_name)

app.include_router(auth.router)
app.include_router(classes.router)
app.include_router(subjects.router)
app.include_router(teacher_assignments.router)
app.include_router(announcements.router)


@app.get("/")
def root():
    return {"status": "ok", "app": settings.app_name, "environment": settings.environment}


@app.get("/sante")
def sante():
    return {"status": "ok", "app": settings.app_name, "environment": settings.environment}
