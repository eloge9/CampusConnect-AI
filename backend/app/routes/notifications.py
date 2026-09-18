from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.notification import NotificationResponse
from app.services import notification_service

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=list[NotificationResponse])
def lister_notifications(
    non_lues: bool | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return notification_service.list_notifications(db, current_user, unread_only=non_lues)


@router.post("/lire-tout")
def marquer_tout_comme_lu(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    count = notification_service.mark_all_as_read(db, current_user)
    return {"marquees": count}


@router.get("/{notification_id}", response_model=NotificationResponse)
def obtenir_notification(
    notification_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    notification = notification_service.get_notification(db, notification_id)
    notification_service.ensure_owner(notification, current_user)
    return notification


@router.post("/{notification_id}/lire", response_model=NotificationResponse)
def marquer_comme_lue(
    notification_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return notification_service.mark_as_read(db, notification_id, current_user)
