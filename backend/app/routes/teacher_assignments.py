from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_role
from app.db.database import get_db
from app.models.user import User, UserRole
from app.schemas.teacher_assignment import (
    TeacherAssignmentCreate,
    TeacherAssignmentResponse,
    TeacherAssignmentUpdate,
)
from app.services import teacher_assignment_service

router = APIRouter(prefix="/affectations-enseignants", tags=["Affectations enseignants"])


@router.post("", response_model=TeacherAssignmentResponse, status_code=status.HTTP_201_CREATED)
def creer_affectation(
    data: TeacherAssignmentCreate,
    db: Session = Depends(get_db),
    _=Depends(require_role(UserRole.ADMIN)),
):
    return teacher_assignment_service.create_assignment(db, data)


@router.get("", response_model=list[TeacherAssignmentResponse])
def lister_affectations(
    teacher_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.TEACHER)),
):
    return teacher_assignment_service.list_assignments(db, current_user, teacher_id)


@router.get("/{assignment_id}", response_model=TeacherAssignmentResponse)
def obtenir_affectation(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.TEACHER)),
):
    assignment = teacher_assignment_service.get_assignment(db, assignment_id)
    teacher_assignment_service.ensure_can_view_assignment(assignment, current_user)
    return assignment


@router.put("/{assignment_id}", response_model=TeacherAssignmentResponse)
def modifier_affectation(
    assignment_id: int,
    data: TeacherAssignmentUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_role(UserRole.ADMIN)),
):
    return teacher_assignment_service.update_assignment(db, assignment_id, data)


@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
def supprimer_affectation(
    assignment_id: int, db: Session = Depends(get_db), _=Depends(require_role(UserRole.ADMIN))
):
    teacher_assignment_service.delete_assignment(db, assignment_id)
