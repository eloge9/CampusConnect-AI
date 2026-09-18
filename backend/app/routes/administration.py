from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import require_role
from app.db.database import get_db
from app.models.user import User, UserRole
from app.schemas.administration import AdminStatsResponse
from app.services import administration_service

router = APIRouter(prefix="/administration", tags=["Administration"])


@router.get("/statistiques", response_model=AdminStatsResponse)
def obtenir_statistiques(
    db: Session = Depends(get_db), _: User = Depends(require_role(UserRole.ADMIN))
):
    return administration_service.get_admin_statistics(db)
