from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.school_class import ClassResponse
from app.schemas.subject import SubjectResponse
from app.schemas.user import UserResponse


class TeacherAssignmentCreate(BaseModel):
    teacher_id: int
    class_id: int
    subject_id: int


class TeacherAssignmentUpdate(BaseModel):
    teacher_id: int | None = None
    class_id: int | None = None
    subject_id: int | None = None


class TeacherAssignmentResponse(BaseModel):
    id: int
    teacher: UserResponse
    classe: ClassResponse
    subject: SubjectResponse
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
