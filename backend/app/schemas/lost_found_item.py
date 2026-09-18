from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.lost_found_item import ItemStatus, ItemType
from app.schemas.announcement import AnnouncementAuthorResponse


class LostFoundItemCreate(BaseModel):
    item_type: ItemType
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1)
    category: str | None = Field(default=None, max_length=100)
    color: str | None = Field(default=None, max_length=50)
    location: str = Field(min_length=1, max_length=200)
    item_date: date


class LostFoundItemUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, min_length=1)
    category: str | None = Field(default=None, max_length=100)
    color: str | None = Field(default=None, max_length=50)
    location: str | None = Field(default=None, min_length=1, max_length=200)
    item_date: date | None = None
    status: ItemStatus | None = None


class LostFoundItemResponse(BaseModel):
    id: int
    reporter: AnnouncementAuthorResponse
    item_type: ItemType
    title: str
    description: str
    category: str | None
    color: str | None
    location: str
    item_date: date
    photo_path: str | None
    status: ItemStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
