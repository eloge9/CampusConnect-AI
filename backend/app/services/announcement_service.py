from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.announcement import Announcement, AnnouncementCategory
from app.models.school_class import Class
from app.models.user import User, UserRole
from app.schemas.announcement import AnnouncementCreate, AnnouncementUpdate
from app.services.teacher_assignment_service import is_teacher_assigned_to_class


def _get_class_or_404(db: Session, class_id: int) -> Class:
    classe = db.query(Class).filter(Class.id == class_id).first()
    if classe is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classe introuvable.")
    return classe


def _ensure_can_target_class(db: Session, current_user: User, class_id: int | None) -> None:
    if current_user.role == UserRole.ADMIN:
        return
    if current_user.role == UserRole.TEACHER:
        if class_id is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Seul un administrateur peut publier une annonce globale.",
            )
        if not is_teacher_assigned_to_class(db, current_user.id, class_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous ne pouvez publier que pour une classe qui vous est affectée.",
            )
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Action non autorisée.")


def get_announcement(db: Session, announcement_id: int) -> Announcement:
    announcement = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if announcement is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Annonce introuvable.")
    return announcement


def ensure_can_view_announcement(announcement: Announcement, current_user: User) -> None:
    if current_user.role in (UserRole.ADMIN, UserRole.TEACHER):
        return
    if announcement.class_id is not None and announcement.class_id != current_user.class_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Vous n'avez pas accès à cette annonce."
        )


def list_announcements(
    db: Session,
    current_user: User,
    category: AnnouncementCategory | None = None,
    class_id: int | None = None,
    search: str | None = None,
) -> list[Announcement]:
    query = db.query(Announcement)

    if current_user.role == UserRole.STUDENT:
        query = query.filter(
            or_(Announcement.class_id.is_(None), Announcement.class_id == current_user.class_id)
        )

    if category is not None:
        query = query.filter(Announcement.category == category)
    if class_id is not None:
        query = query.filter(Announcement.class_id == class_id)
    if search:
        like = f"%{search}%"
        query = query.filter(or_(Announcement.title.ilike(like), Announcement.content.ilike(like)))

    return query.order_by(Announcement.created_at.desc()).all()


def create_announcement(db: Session, data: AnnouncementCreate, current_user: User) -> Announcement:
    if data.class_id is not None:
        _get_class_or_404(db, data.class_id)
    _ensure_can_target_class(db, current_user, data.class_id)

    announcement = Announcement(
        title=data.title,
        content=data.content,
        category=data.category,
        class_id=data.class_id,
        author_id=current_user.id,
    )
    db.add(announcement)
    db.commit()
    db.refresh(announcement)
    return announcement


def ensure_can_edit_announcement(announcement: Announcement, current_user: User) -> None:
    if current_user.role == UserRole.ADMIN:
        return
    if current_user.role == UserRole.TEACHER and announcement.author_id == current_user.id:
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Vous ne pouvez modifier/supprimer que vos propres annonces.",
    )


def update_announcement(
    db: Session, announcement_id: int, data: AnnouncementUpdate, current_user: User
) -> Announcement:
    announcement = get_announcement(db, announcement_id)
    ensure_can_edit_announcement(announcement, current_user)

    updates = data.model_dump(exclude_unset=True)
    if "class_id" in updates:
        new_class_id = updates["class_id"]
        if new_class_id is not None:
            _get_class_or_404(db, new_class_id)
        _ensure_can_target_class(db, current_user, new_class_id)

    for field, value in updates.items():
        setattr(announcement, field, value)

    db.commit()
    db.refresh(announcement)
    return announcement


def delete_announcement(db: Session, announcement_id: int, current_user: User) -> None:
    announcement = get_announcement(db, announcement_id)
    ensure_can_edit_announcement(announcement, current_user)
    db.delete(announcement)
    db.commit()
