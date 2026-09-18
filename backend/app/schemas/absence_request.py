from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.absence_request import AbsenceStatus
from app.schemas.schedule import ScheduleResponse


class AbsenceRequestCreate(BaseModel):
    schedule_id: int
    reason: str = Field(min_length=1)


class AbsenceRequestUpdate(BaseModel):
    reason: str | None = Field(default=None, min_length=1)
    status: AbsenceStatus | None = None
    review_comment: str | None = None


class AbsenceRequestResponse(BaseModel):
    id: int
    student_id: int
    schedule: ScheduleResponse
    reason: str
    justificatif_path: str | None
    status: AbsenceStatus
    reviewed_by: int | None
    reviewed_at: datetime | None
    review_comment: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
