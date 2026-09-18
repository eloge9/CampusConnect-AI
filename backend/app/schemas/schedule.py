from datetime import date, datetime, time

from pydantic import BaseModel, ConfigDict, Field

from app.models.schedule import ScheduleStatus
from app.schemas.teacher_assignment import TeacherAssignmentResponse


class ScheduleCreate(BaseModel):
    teacher_assignment_id: int
    room: str = Field(min_length=1, max_length=50)
    session_date: date
    start_time: time
    end_time: time


class ScheduleUpdate(BaseModel):
    room: str | None = Field(default=None, min_length=1, max_length=50)
    session_date: date | None = None
    start_time: time | None = None
    end_time: time | None = None
    status: ScheduleStatus | None = None


class ScheduleResponse(BaseModel):
    id: int
    affectation: TeacherAssignmentResponse
    room: str
    session_date: date
    start_time: time
    end_time: time
    status: ScheduleStatus
    created_by: int | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
