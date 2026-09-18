import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.absence_request import AbsenceRequest, AbsenceStatus
from app.models.schedule import Schedule
from app.models.teacher_assignment import TeacherAssignment
from app.models.user import User, UserRole
from app.schemas.absence_request import AbsenceRequestCreate, AbsenceRequestUpdate


def _get_schedule_or_404(db: Session, schedule_id: int) -> Schedule:
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if schedule is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Séance introuvable.")
    return schedule


def get_absence_request(db: Session, absence_id: int) -> AbsenceRequest:
    absence = db.query(AbsenceRequest).filter(AbsenceRequest.id == absence_id).first()
    if absence is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Demande d'absence introuvable.")
    return absence


def _is_responsible_teacher(absence: AbsenceRequest, current_user: User) -> bool:
    return (
        current_user.role == UserRole.TEACHER
        and absence.schedule.affectation.teacher_id == current_user.id
    )


def ensure_can_view_absence_request(absence: AbsenceRequest, current_user: User) -> None:
    if current_user.role == UserRole.ADMIN:
        return
    if absence.student_id == current_user.id:
        return
    if _is_responsible_teacher(absence, current_user):
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN, detail="Vous n'avez pas accès à cette demande d'absence."
    )


def list_absence_requests(
    db: Session,
    current_user: User,
    status_filter: AbsenceStatus | None = None,
    class_id: int | None = None,
) -> list[AbsenceRequest]:
    query = db.query(AbsenceRequest).join(Schedule, AbsenceRequest.schedule_id == Schedule.id)

    if current_user.role == UserRole.STUDENT:
        query = query.filter(AbsenceRequest.student_id == current_user.id)
    elif current_user.role == UserRole.TEACHER:
        query = query.join(
            TeacherAssignment, Schedule.teacher_assignment_id == TeacherAssignment.id
        ).filter(TeacherAssignment.teacher_id == current_user.id)
    elif class_id is not None:
        query = query.join(
            TeacherAssignment, Schedule.teacher_assignment_id == TeacherAssignment.id
        ).filter(TeacherAssignment.class_id == class_id)

    if status_filter is not None:
        query = query.filter(AbsenceRequest.status == status_filter)

    return query.order_by(AbsenceRequest.created_at.desc()).all()


def create_absence_request(db: Session, data: AbsenceRequestCreate, current_user: User) -> AbsenceRequest:
    schedule = _get_schedule_or_404(db, data.schedule_id)
    if schedule.affectation.class_id != current_user.class_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous ne pouvez déclarer une absence que pour une séance de votre propre classe.",
        )

    absence = AbsenceRequest(
        student_id=current_user.id,
        schedule_id=data.schedule_id,
        reason=data.reason,
        status=AbsenceStatus.EN_ATTENTE,
    )
    db.add(absence)
    db.commit()
    db.refresh(absence)
    return absence


def update_absence_request(
    db: Session, absence_id: int, data: AbsenceRequestUpdate, current_user: User
) -> AbsenceRequest:
    absence = get_absence_request(db, absence_id)
    updates = data.model_dump(exclude_unset=True)

    if "reason" in updates:
        is_owner_while_pending = (
            absence.student_id == current_user.id and absence.status == AbsenceStatus.EN_ATTENTE
        )
        if current_user.role != UserRole.ADMIN and not is_owner_while_pending:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous ne pouvez modifier le motif que pour une demande en attente qui vous appartient.",
            )

    if "status" in updates or "review_comment" in updates:
        if current_user.role != UserRole.ADMIN and not _is_responsible_teacher(absence, current_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous ne pouvez traiter que les demandes liées à vos propres séances.",
            )
        updates["reviewed_by"] = current_user.id
        updates["reviewed_at"] = datetime.now(timezone.utc)

    for field, value in updates.items():
        setattr(absence, field, value)

    db.commit()
    db.refresh(absence)
    return absence


def delete_absence_request(db: Session, absence_id: int, current_user: User) -> None:
    absence = get_absence_request(db, absence_id)
    is_owner_while_pending = (
        absence.student_id == current_user.id and absence.status == AbsenceStatus.EN_ATTENTE
    )
    if current_user.role != UserRole.ADMIN and not is_owner_while_pending:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous ne pouvez retirer qu'une de vos demandes encore en attente.",
        )
    db.delete(absence)
    db.commit()


async def upload_justificatif(
    db: Session, absence_id: int, file: UploadFile, current_user: User
) -> AbsenceRequest:
    absence = get_absence_request(db, absence_id)

    if absence.student_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous ne pouvez ajouter un justificatif qu'à votre propre demande.",
        )
    if absence.status != AbsenceStatus.EN_ATTENTE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Impossible d'ajouter un justificatif à une demande déjà traitée.",
        )

    extension = Path(file.filename or "").suffix.lower().lstrip(".")
    allowed = {ext.strip().lower() for ext in settings.allowed_upload_extensions.split(",")}
    if extension not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Format de fichier non autorisé. Formats acceptés : {', '.join(sorted(allowed))}.",
        )

    content = await file.read()
    max_size = settings.max_upload_size_mb * 1024 * 1024
    if len(content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Fichier trop volumineux (max {settings.max_upload_size_mb} Mo).",
        )

    upload_dir = Path(settings.upload_dir) / "justificatifs"
    upload_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4().hex}.{extension}"
    (upload_dir / filename).write_bytes(content)

    absence.justificatif_path = f"/uploads/justificatifs/{filename}"
    db.commit()
    db.refresh(absence)
    return absence
