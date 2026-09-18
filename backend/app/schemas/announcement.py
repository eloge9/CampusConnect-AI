from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.announcement import AnnouncementCategory
from app.models.user import UserRole
from app.schemas.school_class import ClassResponse


class AnnouncementCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1)
    category: AnnouncementCategory
    class_id: int | None = None


class AnnouncementUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    content: str | None = Field(default=None, min_length=1)
    category: AnnouncementCategory | None = None
    class_id: int | None = None


class AnnouncementAuthorResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    role: UserRole

    model_config = ConfigDict(from_attributes=True)


class AnnouncementResponse(BaseModel):
    id: int
    title: str
    content: str
    category: AnnouncementCategory
    author: AnnouncementAuthorResponse
    classe: ClassResponse | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
