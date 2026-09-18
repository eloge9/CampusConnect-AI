from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_role
from app.db.database import get_db
from app.models.user import User, UserRole
from app.schemas.assignment import AssignmentCreate, AssignmentResponse, AssignmentUpdate
from app.services import assignment_service

router = APIRouter(prefix="/devoirs", tags=["Devoirs"])


@router.post("", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED)
def creer_devoir(
    data: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.TEACHER)),
):
    return assignment_service.create_assignment_task(db, data, current_user)


@router.get("", response_model=list[AssignmentResponse])
def lister_devoirs(
    classe_id: int | None = Query(default=None),
    matiere_id: int | None = Query(default=None),
    a_venir: bool | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return assignment_service.list_assignment_tasks(
        db, current_user, class_id=classe_id, subject_id=matiere_id, upcoming_only=a_venir
    )


@router.get("/{assignment_id}", response_model=AssignmentResponse)
def obtenir_devoir(
    assignment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    task = assignment_service.get_assignment_task(db, assignment_id)
    assignment_service.ensure_can_view_assignment_task(task, current_user)
    return task


@router.put("/{assignment_id}", response_model=AssignmentResponse)
def modifier_devoir(
    assignment_id: int,
    data: AssignmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.TEACHER)),
):
    return assignment_service.update_assignment_task(db, assignment_id, data, current_user)


@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
def supprimer_devoir(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.TEACHER)),
):
    assignment_service.delete_assignment_task(db, assignment_id, current_user)
