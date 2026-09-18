from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.announcement import AnnouncementAuthorResponse


class MessageCreate(BaseModel):
    content: str = Field(min_length=1)


class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender: AnnouncementAuthorResponse
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
