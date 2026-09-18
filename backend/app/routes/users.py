from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import require_role
from app.db.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserAdminUpdate, UserResponse
from app.services import user_admin_service

router = APIRouter(prefix="/utilisateurs", tags=["Utilisateurs"])


@router.get("", response_model=list[UserResponse])
def lister_utilisateurs(
    role: UserRole | None = Query(default=None),
    actif: bool | None = Query(default=None),
    recherche: str | None = Query(default=None),
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN)),
):
    return user_admin_service.list_users(db, role=role, is_active=actif, search=recherche)


@router.get("/{user_id}", response_model=UserResponse)
def obtenir_utilisateur(
    user_id: int, db: Session = Depends(get_db), _: User = Depends(require_role(UserRole.ADMIN))
):
    return user_admin_service.get_user(db, user_id)


@router.put("/{user_id}", response_model=UserResponse)
def modifier_utilisateur(
    user_id: int,
    data: UserAdminUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    return user_admin_service.update_user(db, user_id, data, current_user)
