from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.school_class import Class
from app.models.subject import Subject
from app.models.teacher_assignment import TeacherAssignment
from app.models.user import User, UserRole
from app.schemas.teacher_assignment import TeacherAssignmentCreate, TeacherAssignmentUpdate

DUPLICATE_ASSIGNMENT_MESSAGE = "Cette affectation (enseignant + classe + matière) existe déjà."


def _get_teacher(db: Session, teacher_id: int) -> User:
    teacher = db.query(User).filter(User.id == teacher_id).first()
    if teacher is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enseignant introuvable.")
    if teacher.role != UserRole.TEACHER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cet utilisateur n'a pas le rôle enseignant.",
        )
    return teacher


def _get_class(db: Session, class_id: int) -> Class:
    classe = db.query(Class).filter(Class.id == class_id).first()
    if classe is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classe introuvable.")
    return classe


def _get_subject(db: Session, subject_id: int) -> Subject:
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if subject is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Matière introuvable.")
    return subject


def ensure_can_manage_for_assignment(current_user: User, assignment: TeacherAssignment) -> None:
    """Réutilisé par les modules qui référencent teacher_assignment_id (emploi du temps, devoirs, examens)."""
    if current_user.role == UserRole.ADMIN:
        return
    if current_user.role == UserRole.TEACHER and assignment.teacher_id == current_user.id:
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Vous ne pouvez gérer que les ressources liées à vos propres affectations.",
    )


def ensure_can_view_for_assignment(current_user: User, assignment: TeacherAssignment) -> None:
    """Réutilisé par les modules qui référencent teacher_assignment_id (emploi du temps, devoirs, examens)."""
    if current_user.role == UserRole.ADMIN:
        return
    if current_user.role == UserRole.TEACHER and assignment.teacher_id == current_user.id:
        return
    if current_user.role == UserRole.STUDENT and assignment.class_id == current_user.class_id:
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Vous n'avez pas accès à cette ressource.")


def get_assignment(db: Session, assignment_id: int) -> TeacherAssignment:
    assignment = db.query(TeacherAssignment).filter(TeacherAssignment.id == assignment_id).first()
    if assignment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Affectation introuvable.")
    return assignment


def list_assignments(
    db: Session, current_user: User, teacher_id: int | None = None
) -> list[TeacherAssignment]:
    query = db.query(TeacherAssignment)
    if current_user.role == UserRole.TEACHER:
        query = query.filter(TeacherAssignment.teacher_id == current_user.id)
    elif teacher_id is not None:
        query = query.filter(TeacherAssignment.teacher_id == teacher_id)
    return query.order_by(TeacherAssignment.id).all()


def ensure_can_view_assignment(assignment: TeacherAssignment, current_user: User) -> None:
    if current_user.role == UserRole.TEACHER and assignment.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous ne pouvez consulter que vos propres affectations.",
        )


def create_assignment(db: Session, data: TeacherAssignmentCreate) -> TeacherAssignment:
    _get_teacher(db, data.teacher_id)
    _get_class(db, data.class_id)
    _get_subject(db, data.subject_id)

    assignment = TeacherAssignment(
        teacher_id=data.teacher_id, class_id=data.class_id, subject_id=data.subject_id
    )
    db.add(assignment)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=DUPLICATE_ASSIGNMENT_MESSAGE)
    db.refresh(assignment)
    return assignment


def update_assignment(db: Session, assignment_id: int, data: TeacherAssignmentUpdate) -> TeacherAssignment:
    assignment = get_assignment(db, assignment_id)

    if data.teacher_id is not None:
        _get_teacher(db, data.teacher_id)
        assignment.teacher_id = data.teacher_id
    if data.class_id is not None:
        _get_class(db, data.class_id)
        assignment.class_id = data.class_id
    if data.subject_id is not None:
        _get_subject(db, data.subject_id)
        assignment.subject_id = data.subject_id

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=DUPLICATE_ASSIGNMENT_MESSAGE)
    db.refresh(assignment)
    return assignment


def delete_assignment(db: Session, assignment_id: int) -> None:
    assignment = get_assignment(db, assignment_id)
    db.delete(assignment)
    db.commit()


def is_teacher_assigned_to_class(db: Session, teacher_id: int, class_id: int) -> bool:
    return (
        db.query(TeacherAssignment)
        .filter(TeacherAssignment.teacher_id == teacher_id, TeacherAssignment.class_id == class_id)
        .first()
        is not None
    )


def is_teacher_assigned_to_subject(db: Session, teacher_id: int, subject_id: int) -> bool:
    return (
        db.query(TeacherAssignment)
        .filter(TeacherAssignment.teacher_id == teacher_id, TeacherAssignment.subject_id == subject_id)
        .first()
        is not None
    )


def is_teacher_responsible_for(db: Session, teacher_id: int, class_id: int, subject_id: int) -> bool:
    return (
        db.query(TeacherAssignment)
        .filter(
            TeacherAssignment.teacher_id == teacher_id,
            TeacherAssignment.class_id == class_id,
            TeacherAssignment.subject_id == subject_id,
        )
        .first()
        is not None
    )
