from datetime import date

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.schedule import Schedule, ScheduleStatus
from app.models.teacher_assignment import TeacherAssignment
from app.models.user import User, UserRole
from app.schemas.schedule import ScheduleCreate, ScheduleUpdate

FIELDS_TRIGGERING_MODIFIE = {"room", "session_date", "start_time", "end_time"}


def _get_assignment_or_404(db: Session, teacher_assignment_id: int) -> TeacherAssignment:
    assignment = (
        db.query(TeacherAssignment).filter(TeacherAssignment.id == teacher_assignment_id).first()
    )
    if assignment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Affectation introuvable.")
    return assignment


def _ensure_can_manage_assignment(current_user: User, assignment: TeacherAssignment) -> None:
    if current_user.role == UserRole.ADMIN:
        return
    if current_user.role == UserRole.TEACHER and assignment.teacher_id == current_user.id:
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Vous ne pouvez gérer que les séances liées à vos propres affectations.",
    )


def get_schedule(db: Session, schedule_id: int) -> Schedule:
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if schedule is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Séance introuvable.")
    return schedule


def ensure_can_view_schedule(schedule: Schedule, current_user: User) -> None:
    if current_user.role == UserRole.ADMIN:
        return
    if current_user.role == UserRole.TEACHER and schedule.affectation.teacher_id == current_user.id:
        return
    if current_user.role == UserRole.STUDENT and schedule.affectation.class_id == current_user.class_id:
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Vous n'avez pas accès à cette séance.")


def list_schedules(
    db: Session, current_user: User, class_id: int | None = None, session_date: date | None = None
) -> list[Schedule]:
    query = db.query(Schedule).join(TeacherAssignment)

    if current_user.role == UserRole.TEACHER:
        query = query.filter(TeacherAssignment.teacher_id == current_user.id)
    elif current_user.role == UserRole.STUDENT:
        query = query.filter(TeacherAssignment.class_id == current_user.class_id)
    elif class_id is not None:
        query = query.filter(TeacherAssignment.class_id == class_id)

    if session_date is not None:
        query = query.filter(Schedule.session_date == session_date)

    return query.order_by(Schedule.session_date, Schedule.start_time).all()


def create_schedule(db: Session, data: ScheduleCreate, current_user: User) -> Schedule:
    assignment = _get_assignment_or_404(db, data.teacher_assignment_id)
    _ensure_can_manage_assignment(current_user, assignment)

    schedule = Schedule(
        teacher_assignment_id=data.teacher_assignment_id,
        room=data.room,
        session_date=data.session_date,
        start_time=data.start_time,
        end_time=data.end_time,
        status=ScheduleStatus.PREVU,
        created_by=current_user.id,
    )
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule


def update_schedule(db: Session, schedule_id: int, data: ScheduleUpdate, current_user: User) -> Schedule:
    schedule = get_schedule(db, schedule_id)
    _ensure_can_manage_assignment(current_user, schedule.affectation)

    updates = data.model_dump(exclude_unset=True)
    if FIELDS_TRIGGERING_MODIFIE.intersection(updates) and "status" not in updates:
        updates["status"] = ScheduleStatus.MODIFIE

    for field, value in updates.items():
        setattr(schedule, field, value)

    db.commit()
    db.refresh(schedule)
    return schedule


def delete_schedule(db: Session, schedule_id: int, current_user: User) -> None:
    schedule = get_schedule(db, schedule_id)
    _ensure_can_manage_assignment(current_user, schedule.affectation)
    db.delete(schedule)
    db.commit()
