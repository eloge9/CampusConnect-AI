from datetime import date

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_role
from app.db.database import get_db
from app.models.user import User, UserRole
from app.schemas.schedule import ScheduleCreate, ScheduleResponse, ScheduleUpdate
from app.services import schedule_service

router = APIRouter(prefix="/emploi-du-temps", tags=["Emploi du temps"])


@router.post("", response_model=ScheduleResponse, status_code=status.HTTP_201_CREATED)
def creer_seance(
    data: ScheduleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.TEACHER)),
):
    return schedule_service.create_schedule(db, data, current_user)


@router.get("", response_model=list[ScheduleResponse])
def lister_seances(
    classe_id: int | None = Query(default=None),
    date_seance: date | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return schedule_service.list_schedules(db, current_user, class_id=classe_id, session_date=date_seance)


@router.get("/{schedule_id}", response_model=ScheduleResponse)
def obtenir_seance(
    schedule_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    schedule = schedule_service.get_schedule(db, schedule_id)
    schedule_service.ensure_can_view_schedule(schedule, current_user)
    return schedule


@router.put("/{schedule_id}", response_model=ScheduleResponse)
def modifier_seance(
    schedule_id: int,
    data: ScheduleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.TEACHER)),
):
    return schedule_service.update_schedule(db, schedule_id, data, current_user)


@router.delete("/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
def supprimer_seance(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.TEACHER)),
):
    schedule_service.delete_schedule(db, schedule_id, current_user)
