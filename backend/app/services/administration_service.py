from sqlalchemy.orm import Session

from app.models.absence_request import AbsenceRequest, AbsenceStatus
from app.models.announcement import Announcement
from app.models.lost_found_item import ItemStatus, LostFoundItem
from app.models.potential_match import MatchStatus, PotentialMatch
from app.models.school_class import Class
from app.models.subject import Subject
from app.models.user import User, UserRole
from app.schemas.administration import AdminStatsResponse


def get_admin_statistics(db: Session) -> AdminStatsResponse:
    return AdminStatsResponse(
        total_utilisateurs=db.query(User).count(),
        total_etudiants=db.query(User).filter(User.role == UserRole.STUDENT).count(),
        total_enseignants=db.query(User).filter(User.role == UserRole.TEACHER).count(),
        total_admins=db.query(User).filter(User.role == UserRole.ADMIN).count(),
        total_classes=db.query(Class).count(),
        total_matieres=db.query(Subject).count(),
        absences_en_attente=db.query(AbsenceRequest)
        .filter(AbsenceRequest.status == AbsenceStatus.EN_ATTENTE)
        .count(),
        objets_ouverts=db.query(LostFoundItem).filter(LostFoundItem.status == ItemStatus.OUVERT).count(),
        correspondances_proposees=db.query(PotentialMatch)
        .filter(PotentialMatch.status == MatchStatus.PROPOSEE)
        .count(),
        annonces_total=db.query(Announcement).count(),
    )
