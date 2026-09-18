from datetime import date

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.notification import NotificationType
from app.models.schedule import Schedule, ScheduleStatus
from app.models.teacher_assignment import TeacherAssignment
from app.models.user import User, UserRole
from app.schemas.schedule import ScheduleCreate, ScheduleUpdate
from app.services.notification_service import get_student_ids_for_class, notify_users
from app.services.teacher_assignment_service import (
    ensure_can_manage_for_assignment,
    ensure_can_view_for_assignment,
)

FIELDS_TRIGGERING_MODIFIE = {"room", "session_date", "start_time", "end_time"}


def _get_assignment_or_404(db: Session, teacher_assignment_id: int) -> TeacherAssignment:
    assignment = (
        db.query(TeacherAssignment).filter(TeacherAssignment.id == teacher_assignment_id).first()
    )
    if assignment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Affectation introuvable.")
    return assignment


def get_schedule(db: Session, schedule_id: int) -> Schedule:
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if schedule is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Séance introuvable.")
    return schedule


def ensure_can_view_schedule(schedule: Schedule, current_user: User) -> None:
    ensure_can_view_for_assignment(current_user, schedule.affectation)


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
    ensure_can_manage_for_assignment(current_user, assignment)

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
    ensure_can_manage_for_assignment(current_user, schedule.affectation)

    old_room, old_date = schedule.room, schedule.session_date
    old_start, old_end = schedule.start_time, schedule.end_time

    updates = data.model_dump(exclude_unset=True)
    if FIELDS_TRIGGERING_MODIFIE.intersection(updates) and "status" not in updates:
        updates["status"] = ScheduleStatus.MODIFIE

    for field, value in updates.items():
        setattr(schedule, field, value)

    db.commit()
    db.refresh(schedule)

    if schedule.status in (ScheduleStatus.MODIFIE, ScheduleStatus.ANNULE):
        if schedule.status == ScheduleStatus.ANNULE:
            message = "Cette séance a été annulée."
        else:
            changes = []
            if schedule.room != old_room:
                changes.append(f"salle {old_room} → {schedule.room}")
            if (schedule.session_date, schedule.start_time, schedule.end_time) != (
                old_date,
                old_start,
                old_end,
            ):
                changes.append(
                    f"horaire {old_date} {old_start}-{old_end} → "
                    f"{schedule.session_date} {schedule.start_time}-{schedule.end_time}"
                )
            message = "; ".join(changes) if changes else "Cette séance a été mise à jour."

        student_ids = get_student_ids_for_class(db, schedule.affectation.class_id)
        notify_users(
            db,
            student_ids,
            NotificationType.CHANGEMENT_SEANCE,
            title="Changement d'emploi du temps",
            message=message,
            reference_type="seance",
            reference_id=schedule.id,
        )

    return schedule


def delete_schedule(db: Session, schedule_id: int, current_user: User) -> None:
    schedule = get_schedule(db, schedule_id)
    ensure_can_manage_for_assignment(current_user, schedule.affectation)
    db.delete(schedule)
    db.commit()
