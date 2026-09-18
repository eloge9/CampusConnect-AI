from datetime import date

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.exam import Exam
from app.models.teacher_assignment import TeacherAssignment
from app.models.user import User, UserRole
from app.schemas.exam import ExamCreate, ExamUpdate
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


def get_exam(db: Session, exam_id: int) -> Exam:
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if exam is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Examen introuvable.")
    return exam


def ensure_can_view_exam(exam: Exam, current_user: User) -> None:
    ensure_can_view_for_assignment(current_user, exam.affectation)


def list_exams(
    db: Session,
    current_user: User,
    class_id: int | None = None,
    subject_id: int | None = None,
    upcoming_only: bool | None = None,
) -> list[Exam]:
    query = db.query(Exam).join(TeacherAssignment)

    if current_user.role == UserRole.TEACHER:
        query = query.filter(TeacherAssignment.teacher_id == current_user.id)
    elif current_user.role == UserRole.STUDENT:
        query = query.filter(TeacherAssignment.class_id == current_user.class_id)
    elif class_id is not None:
        query = query.filter(TeacherAssignment.class_id == class_id)

    if subject_id is not None:
        query = query.filter(TeacherAssignment.subject_id == subject_id)
    if upcoming_only:
        query = query.filter(Exam.exam_date >= date.today())

    return query.order_by(Exam.exam_date, Exam.start_time).all()


def create_exam(db: Session, data: ExamCreate, current_user: User) -> Exam:
    assignment = _get_assignment_or_404(db, data.teacher_assignment_id)
    ensure_can_manage_for_assignment(current_user, assignment)

    exam = Exam(
        teacher_assignment_id=data.teacher_assignment_id,
        title=data.title,
        description=data.description,
        room=data.room,
        exam_date=data.exam_date,
        start_time=data.start_time,
        end_time=data.end_time,
        created_by=current_user.id,
    )
    db.add(exam)
    db.commit()
    db.refresh(exam)
    return exam


def update_exam(db: Session, exam_id: int, data: ExamUpdate, current_user: User) -> Exam:
    exam = get_exam(db, exam_id)
    ensure_can_manage_for_assignment(current_user, exam.affectation)

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(exam, field, value)

    db.commit()
    db.refresh(exam)
    return exam


def delete_exam(db: Session, exam_id: int, current_user: User) -> None:
    exam = get_exam(db, exam_id)
    ensure_can_manage_for_assignment(current_user, exam.affectation)
    db.delete(exam)
    db.commit()
