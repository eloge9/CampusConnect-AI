from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.teacher_assignment import TeacherAssignmentResponse


class AssignmentCreate(BaseModel):
    teacher_assignment_id: int
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    due_date: datetime


class AssignmentUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    due_date: datetime | None = None


class AssignmentResponse(BaseModel):
    id: int
    affectation: TeacherAssignmentResponse
    title: str
    description: str | None
    due_date: datetime
    created_by: int | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
