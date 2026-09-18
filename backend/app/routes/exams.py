from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_role
from app.db.database import get_db
from app.models.user import User, UserRole
from app.schemas.exam import ExamCreate, ExamResponse, ExamUpdate
from app.services import exam_service

router = APIRouter(prefix="/examens", tags=["Examens"])


@router.post("", response_model=ExamResponse, status_code=status.HTTP_201_CREATED)
def creer_examen(
    data: ExamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.TEACHER)),
):
    return exam_service.create_exam(db, data, current_user)


@router.get("", response_model=list[ExamResponse])
def lister_examens(
    classe_id: int | None = Query(default=None),
    matiere_id: int | None = Query(default=None),
    a_venir: bool | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return exam_service.list_exams(
        db, current_user, class_id=classe_id, subject_id=matiere_id, upcoming_only=a_venir
    )


@router.get("/{exam_id}", response_model=ExamResponse)
def obtenir_examen(
    exam_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    exam = exam_service.get_exam(db, exam_id)
    exam_service.ensure_can_view_exam(exam, current_user)
    return exam


@router.put("/{exam_id}", response_model=ExamResponse)
def modifier_examen(
    exam_id: int,
    data: ExamUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.TEACHER)),
):
    return exam_service.update_exam(db, exam_id, data, current_user)


@router.delete("/{exam_id}", status_code=status.HTTP_204_NO_CONTENT)
def supprimer_examen(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.TEACHER)),
):
    exam_service.delete_exam(db, exam_id, current_user)
