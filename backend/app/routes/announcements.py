from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_role
from app.db.database import get_db
from app.models.announcement import AnnouncementCategory
from app.models.user import User, UserRole
from app.schemas.announcement import AnnouncementCreate, AnnouncementResponse, AnnouncementUpdate
from app.services import announcement_service

router = APIRouter(prefix="/annonces", tags=["Annonces"])


@router.post("", response_model=AnnouncementResponse, status_code=status.HTTP_201_CREATED)
def creer_annonce(
    data: AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.TEACHER)),
):
    return announcement_service.create_announcement(db, data, current_user)


@router.get("", response_model=list[AnnouncementResponse])
def lister_annonces(
    categorie: AnnouncementCategory | None = Query(default=None),
    classe_id: int | None = Query(default=None),
    recherche: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return announcement_service.list_announcements(
        db, current_user, category=categorie, class_id=classe_id, search=recherche
    )


@router.get("/{announcement_id}", response_model=AnnouncementResponse)
def obtenir_annonce(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    announcement = announcement_service.get_announcement(db, announcement_id)
    announcement_service.ensure_can_view_announcement(announcement, current_user)
    return announcement


@router.put("/{announcement_id}", response_model=AnnouncementResponse)
def modifier_annonce(
    announcement_id: int,
    data: AnnouncementUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.TEACHER)),
):
    return announcement_service.update_announcement(db, announcement_id, data, current_user)


@router.delete("/{announcement_id}", status_code=status.HTTP_204_NO_CONTENT)
def supprimer_annonce(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.TEACHER)),
):
    announcement_service.delete_announcement(db, announcement_id, current_user)
