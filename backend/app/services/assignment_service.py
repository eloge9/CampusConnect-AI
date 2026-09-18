from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.assignment import Assignment
from app.models.teacher_assignment import TeacherAssignment
from app.models.user import User, UserRole
from app.schemas.assignment import AssignmentCreate, AssignmentUpdate
from app.services.teacher_assignment_service import (
    ensure_can_manage_for_assignment,
    ensure_can_view_for_assignment,
)


def _get_assignment_or_404(db: Session, teacher_assignment_id: int) -> TeacherAssignment:
    assignment = (
        db.query(TeacherAssignment).filter(TeacherAssignment.id == teacher_assignment_id).first()
    )
    if assignment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Affectation introuvable.")
    return assignment


def get_assignment_task(db: Session, assignment_id: int) -> Assignment:
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if assignment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Devoir introuvable.")
    return assignment


def ensure_can_view_assignment_task(assignment: Assignment, current_user: User) -> None:
    ensure_can_view_for_assignment(current_user, assignment.affectation)


def list_assignment_tasks(
    db: Session,
    current_user: User,
    class_id: int | None = None,
    subject_id: int | None = None,
    upcoming_only: bool | None = None,
) -> list[Assignment]:
    query = db.query(Assignment).join(TeacherAssignment)

    if current_user.role == UserRole.TEACHER:
        query = query.filter(TeacherAssignment.teacher_id == current_user.id)
    elif current_user.role == UserRole.STUDENT:
        query = query.filter(TeacherAssignment.class_id == current_user.class_id)
    elif class_id is not None:
        query = query.filter(TeacherAssignment.class_id == class_id)

    if subject_id is not None:
        query = query.filter(TeacherAssignment.subject_id == subject_id)
    if upcoming_only:
        query = query.filter(Assignment.due_date >= datetime.now(timezone.utc))

    return query.order_by(Assignment.due_date).all()


def create_assignment_task(db: Session, data: AssignmentCreate, current_user: User) -> Assignment:
    assignment = _get_assignment_or_404(db, data.teacher_assignment_id)
    ensure_can_manage_for_assignment(current_user, assignment)

    task = Assignment(
        teacher_assignment_id=data.teacher_assignment_id,
        title=data.title,
        description=data.description,
        due_date=data.due_date,
        created_by=current_user.id,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def update_assignment_task(
    db: Session, assignment_id: int, data: AssignmentUpdate, current_user: User
) -> Assignment:
    task = get_assignment_task(db, assignment_id)
    ensure_can_manage_for_assignment(current_user, task.affectation)

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)
    return task


def delete_assignment_task(db: Session, assignment_id: int, current_user: User) -> None:
    task = get_assignment_task(db, assignment_id)
    ensure_can_manage_for_assignment(current_user, task.affectation)
    db.delete(task)
    db.commit()
