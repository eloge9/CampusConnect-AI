from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.lost_found_item import LostFoundItem
from app.models.potential_match import MatchStatus, PotentialMatch
from app.models.user import User, UserRole


def get_match(db: Session, match_id: int) -> PotentialMatch:
    match = db.query(PotentialMatch).filter(PotentialMatch.id == match_id).first()
    if match is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Correspondance introuvable.")
    return match


def _is_party_to_match(match: PotentialMatch, current_user: User) -> bool:
    return current_user.id in (match.lost_item.user_id, match.found_item.user_id)


def ensure_can_view_match(match: PotentialMatch, current_user: User) -> None:
    if current_user.role == UserRole.ADMIN or _is_party_to_match(match, current_user):
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN, detail="Vous n'avez pas accès à cette correspondance."
    )


def list_matches_for_item(db: Session, item_id: int, current_user: User) -> list[PotentialMatch]:
    item = db.query(LostFoundItem).filter(LostFoundItem.id == item_id).first()
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Objet introuvable.")
    if current_user.role != UserRole.ADMIN and item.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous ne pouvez consulter que les correspondances de vos propres objets.",
        )

    return (
        db.query(PotentialMatch)
        .filter(or_(PotentialMatch.lost_item_id == item_id, PotentialMatch.found_item_id == item_id))
        .order_by(PotentialMatch.similarity_score.desc())
        .all()
    )


def list_matches_for_user(db: Session, current_user: User) -> list[PotentialMatch]:
    return (
        db.query(PotentialMatch)
        .filter(
            or_(
                PotentialMatch.lost_item.has(LostFoundItem.user_id == current_user.id),
                PotentialMatch.found_item.has(LostFoundItem.user_id == current_user.id),
            )
        )
        .order_by(PotentialMatch.similarity_score.desc())
        .all()
    )


def update_match_status(
    db: Session, match_id: int, new_status: MatchStatus, current_user: User
) -> PotentialMatch:
    match = get_match(db, match_id)
    if current_user.role != UserRole.ADMIN and not _is_party_to_match(match, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous ne pouvez traiter que les correspondances liées à vos propres objets.",
        )

    match.status = new_status
    db.commit()
    db.refresh(match)
    return match
