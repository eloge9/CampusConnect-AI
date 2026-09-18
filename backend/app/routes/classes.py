from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_role
from app.db.database import get_db
from app.models.user import UserRole
from app.schemas.school_class import ClassCreate, ClassResponse, ClassUpdate
from app.services import class_service

router = APIRouter(prefix="/classes", tags=["Classes"])


@router.post("", response_model=ClassResponse, status_code=status.HTTP_201_CREATED)
def creer_classe(
    data: ClassCreate, db: Session = Depends(get_db), _=Depends(require_role(UserRole.ADMIN))
):
    return class_service.create_class(db, data)


@router.get("", response_model=list[ClassResponse])
def lister_classes(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return class_service.list_classes(db)


@router.get("/{class_id}", response_model=ClassResponse)
def obtenir_classe(class_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return class_service.get_class(db, class_id)


@router.put("/{class_id}", response_model=ClassResponse)
def modifier_classe(
    class_id: int,
    data: ClassUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_role(UserRole.ADMIN)),
):
    return class_service.update_class(db, class_id, data)


@router.delete("/{class_id}", status_code=status.HTTP_204_NO_CONTENT)
def supprimer_classe(
    class_id: int, db: Session = Depends(get_db), _=Depends(require_role(UserRole.ADMIN))
):
    class_service.delete_class(db, class_id)
