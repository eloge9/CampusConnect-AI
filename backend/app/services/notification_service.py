from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.notification import Notification, NotificationType
from app.models.user import User, UserRole


def get_student_ids_for_class(db: Session, class_id: int | None) -> list[int]:
    """class_id=None -> tous les étudiants (utilisé pour les annonces globales)."""
    query = db.query(User.id).filter(User.role == UserRole.STUDENT)
    if class_id is not None:
        query = query.filter(User.class_id == class_id)
    return [row[0] for row in query.all()]


def notify_users(
    db: Session,
    user_ids: list[int],
    notif_type: NotificationType,
    title: str,
    message: str,
    reference_type: str | None = None,
    reference_id: int | None = None,
) -> list[Notification]:
    notifications = [
        Notification(
            user_id=user_id,
            type=notif_type,
            title=title,
            message=message,
            reference_type=reference_type,
            reference_id=reference_id,
        )
        for user_id in set(user_ids)
    ]
    if not notifications:
        return []

    db.add_all(notifications)
    db.commit()
    for notification in notifications:
        db.refresh(notification)
    return notifications


def get_notification(db: Session, notification_id: int) -> Notification:
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if notification is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification introuvable.")
    return notification


def ensure_owner(notification: Notification, current_user: User) -> None:
    if current_user.role == UserRole.ADMIN or notification.user_id == current_user.id:
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN, detail="Vous n'avez pas accès à cette notification."
    )


def list_notifications(
    db: Session, current_user: User, unread_only: bool | None = None
) -> list[Notification]:
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    if unread_only:
        query = query.filter(Notification.is_read.is_(False))
    return query.order_by(Notification.created_at.desc()).all()


def mark_as_read(db: Session, notification_id: int, current_user: User) -> Notification:
    notification = get_notification(db, notification_id)
    ensure_owner(notification, current_user)
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification


def mark_all_as_read(db: Session, current_user: User) -> int:
    count = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id, Notification.is_read.is_(False))
        .update({"is_read": True})
    )
    db.commit()
    return count
