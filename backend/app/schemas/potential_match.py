from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.potential_match import MatchStatus
from app.schemas.lost_found_item import LostFoundItemResponse


class PotentialMatchUpdate(BaseModel):
    status: MatchStatus


class PotentialMatchResponse(BaseModel):
    id: int
    lost_item: LostFoundItemResponse
    found_item: LostFoundItemResponse
    similarity_score: float
    status: MatchStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
