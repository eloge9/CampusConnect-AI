from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.user import User, UserRole
from app.schemas.user import UserAdminUpdate


def get_user(db: Session, user_id: int) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur introuvable.")
    return user


def list_users(
    db: Session,
    role: UserRole | None = None,
    is_active: bool | None = None,
    search: str | None = None,
) -> list[User]:
    query = db.query(User)

    if role is not None:
        query = query.filter(User.role == role)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    if search:
        like = f"%{search}%"
        query = query.filter(
            or_(User.first_name.ilike(like), User.last_name.ilike(like), User.email.ilike(like))
        )

    return query.order_by(User.last_name, User.first_name).all()


def update_user(db: Session, user_id: int, data: UserAdminUpdate, current_user: User) -> User:
    user = get_user(db, user_id)
    updates = data.model_dump(exclude_unset=True)

    if user.id == current_user.id:
        if "role" in updates and updates["role"] != user.role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vous ne pouvez pas modifier votre propre rôle.",
            )
        if updates.get("is_active") is False:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vous ne pouvez pas désactiver votre propre compte.",
            )

    for field, value in updates.items():
        setattr(user, field, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Seul un étudiant peut être associé à une classe.",
        )
    db.refresh(user)
    return user
