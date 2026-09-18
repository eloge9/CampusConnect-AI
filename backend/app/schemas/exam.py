from datetime import date, datetime, time

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.teacher_assignment import TeacherAssignmentResponse


class ExamCreate(BaseModel):
    teacher_assignment_id: int
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    room: str = Field(min_length=1, max_length=50)
    exam_date: date
    start_time: time
    end_time: time


class ExamUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    room: str | None = Field(default=None, min_length=1, max_length=50)
    exam_date: date | None = None
    start_time: time | None = None
    end_time: time | None = None


class ExamResponse(BaseModel):
    id: int
    affectation: TeacherAssignmentResponse
    title: str
    description: str | None
    room: str
    exam_date: date
    start_time: time
    end_time: time
    created_by: int | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
