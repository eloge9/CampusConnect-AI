from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_role
from app.db.database import get_db
from app.models.absence_request import AbsenceStatus
from app.models.user import User, UserRole
from app.schemas.absence_request import AbsenceRequestCreate, AbsenceRequestResponse, AbsenceRequestUpdate
from app.services import absence_request_service

router = APIRouter(prefix="/absences", tags=["Absences"])


@router.post("", response_model=AbsenceRequestResponse, status_code=status.HTTP_201_CREATED)
def declarer_absence(
    data: AbsenceRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.STUDENT)),
):
    return absence_request_service.create_absence_request(db, data, current_user)


@router.get("", response_model=list[AbsenceRequestResponse])
def lister_absences(
    statut: AbsenceStatus | None = Query(default=None),
    classe_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return absence_request_service.list_absence_requests(
        db, current_user, status_filter=statut, class_id=classe_id
    )


@router.get("/{absence_id}", response_model=AbsenceRequestResponse)
def obtenir_absence(
    absence_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    absence = absence_request_service.get_absence_request(db, absence_id)
    absence_request_service.ensure_can_view_absence_request(absence, current_user)
    return absence


@router.put("/{absence_id}", response_model=AbsenceRequestResponse)
def modifier_absence(
    absence_id: int,
    data: AbsenceRequestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return absence_request_service.update_absence_request(db, absence_id, data, current_user)


@router.delete("/{absence_id}", status_code=status.HTTP_204_NO_CONTENT)
def supprimer_absence(
    absence_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    absence_request_service.delete_absence_request(db, absence_id, current_user)


@router.post("/{absence_id}/justificatif", response_model=AbsenceRequestResponse)
async def televerser_justificatif(
    absence_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.STUDENT)),
):
    return await absence_request_service.upload_justificatif(db, absence_id, file, current_user)
