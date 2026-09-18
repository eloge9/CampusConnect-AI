from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.potential_match import PotentialMatchResponse, PotentialMatchUpdate
from app.services import potential_match_service

router = APIRouter(prefix="/correspondances", tags=["Correspondances"])


@router.get("/{match_id}", response_model=PotentialMatchResponse)
def obtenir_correspondance(
    match_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    match = potential_match_service.get_match(db, match_id)
    potential_match_service.ensure_can_view_match(match, current_user)
    return match


@router.put("/{match_id}", response_model=PotentialMatchResponse)
def traiter_correspondance(
    match_id: int,
    data: PotentialMatchUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return potential_match_service.update_match_status(db, match_id, data.status, current_user)
