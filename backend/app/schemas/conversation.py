from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.announcement import AnnouncementAuthorResponse
from app.schemas.message import MessageResponse


class ConversationCreate(BaseModel):
    user_id: int


class ConversationResponse(BaseModel):
    id: int
    is_group: bool
    members: list[AnnouncementAuthorResponse]
    last_message: MessageResponse | None = None
    unread_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
