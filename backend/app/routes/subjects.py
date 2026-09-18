from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_role
from app.db.database import get_db
from app.models.user import UserRole
from app.schemas.subject import SubjectCreate, SubjectResponse, SubjectUpdate
from app.services import subject_service

router = APIRouter(prefix="/matieres", tags=["Matières"])


@router.post("", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
def creer_matiere(
    data: SubjectCreate, db: Session = Depends(get_db), _=Depends(require_role(UserRole.ADMIN))
):
    return subject_service.create_subject(db, data)


@router.get("", response_model=list[SubjectResponse])
def lister_matieres(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return subject_service.list_subjects(db)


@router.get("/{subject_id}", response_model=SubjectResponse)
def obtenir_matiere(subject_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return subject_service.get_subject(db, subject_id)


@router.put("/{subject_id}", response_model=SubjectResponse)
def modifier_matiere(
    subject_id: int,
    data: SubjectUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_role(UserRole.ADMIN)),
):
    return subject_service.update_subject(db, subject_id, data)


@router.delete("/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
def supprimer_matiere(
    subject_id: int, db: Session = Depends(get_db), _=Depends(require_role(UserRole.ADMIN))
):
    subject_service.delete_subject(db, subject_id)
