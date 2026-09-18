import re
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.absence_request import AbsenceStatus
from app.models.user import User, UserRole
from app.schemas.announcement import AnnouncementResponse
from app.schemas.assignment import AssignmentResponse
from app.schemas.exam import ExamResponse
from app.schemas.potential_match import PotentialMatchResponse
from app.schemas.schedule import ScheduleResponse
from app.services import (
    absence_request_service,
    announcement_service,
    assignment_service,
    exam_service,
    potential_match_service,
    schedule_service,
)

# Pas de LLM : détection d'intention par mots-clés, puis réponse construite à
# partir des vraies données de la plateforme (jamais inventée), conformément
# à l'exigence du cahier des charges.
INTENT_PATTERNS = [
    ("prochain_cours", re.compile(r"prochain\s+cours|cours.*(quand|prochain)|quand.*cours", re.I)),
    ("examens", re.compile(r"examen", re.I)),
    ("devoirs", re.compile(r"devoir", re.I)),
    ("absence", re.compile(r"absence", re.I)),
    ("objets_perdus", re.compile(r"objet|trousse|perdu|trouv[ée]", re.I)),
    ("annonces", re.compile(r"annonce", re.I)),
]

UNKNOWN_ANSWER = (
    "Je n'ai pas compris ta question. Je peux répondre sur : ton prochain cours, "
    "tes examens ou devoirs à venir, comment déclarer une absence, tes correspondances "
    "d'objets perdus/trouvés, ou les dernières annonces."
)


def detect_intent(question: str) -> str:
    for intent, pattern in INTENT_PATTERNS:
        if pattern.search(question):
            return intent
    return "inconnu"


def _answer_prochain_cours(db: Session, current_user: User) -> tuple[str, list[dict]]:
    if current_user.role not in (UserRole.STUDENT, UserRole.TEACHER):
        return (
            "Cette question concerne l'emploi du temps personnel — connecte-toi en tant "
            "qu'étudiant ou enseignant pour l'utiliser.",
            [],
        )

    schedules = schedule_service.list_schedules(db, current_user)
    now = datetime.now(timezone.utc)
    upcoming = sorted(
        (
            s
            for s in schedules
            if datetime.combine(s.session_date, s.start_time, tzinfo=timezone.utc) >= now
        ),
        key=lambda s: (s.session_date, s.start_time),
    )
    if not upcoming:
        return "Je ne trouve aucun prochain cours dans ton emploi du temps.", []

    next_course = upcoming[0]
    answer = (
        f"Ton prochain cours est {next_course.affectation.subject.name} le "
        f"{next_course.session_date} de {next_course.start_time} à {next_course.end_time} "
        f"en salle {next_course.room}."
    )
    return answer, [ScheduleResponse.model_validate(next_course).model_dump(mode="json")]


def _answer_examens(db: Session, current_user: User) -> tuple[str, list[dict]]:
    exams = exam_service.list_exams(db, current_user, upcoming_only=True)
    if not exams:
        return "Aucun examen à venir n'est prévu.", []
    lignes = [f"{e.title} le {e.exam_date} en salle {e.room}" for e in exams[:5]]
    answer = "Tes prochains examens : " + " ; ".join(lignes)
    return answer, [ExamResponse.model_validate(e).model_dump(mode="json") for e in exams[:5]]


def _answer_devoirs(db: Session, current_user: User) -> tuple[str, list[dict]]:
    devoirs = assignment_service.list_assignment_tasks(db, current_user, upcoming_only=True)
    if not devoirs:
        return "Aucun devoir à venir n'est prévu.", []
    lignes = [f"{d.title} pour le {d.due_date}" for d in devoirs[:5]]
    answer = "Tes prochains devoirs : " + " ; ".join(lignes)
    return answer, [AssignmentResponse.model_validate(d).model_dump(mode="json") for d in devoirs[:5]]


def _answer_absence(db: Session, current_user: User) -> tuple[str, list[dict]]:
    answer = (
        "Pour déclarer une absence : envoie POST /absences avec l'identifiant de la séance "
        "concernée et le motif. Tu pourras ensuite suivre son statut (en attente, acceptée, refusée)."
    )
    if current_user.role == UserRole.STUDENT:
        pending = absence_request_service.list_absence_requests(
            db, current_user, status_filter=AbsenceStatus.EN_ATTENTE
        )
        if pending:
            answer += f" Tu as actuellement {len(pending)} demande(s) en attente de traitement."
    return answer, []


def _answer_objets_perdus(db: Session, current_user: User) -> tuple[str, list[dict]]:
    matches = potential_match_service.list_matches_for_user(db, current_user)
    if not matches:
        return "Aucune correspondance potentielle n'a été détectée pour tes objets déclarés.", []
    answer = (
        f"{len(matches)} correspondance(s) potentielle(s) détectée(s) pour tes objets déclarés. "
        "Consulte /correspondances/{id} pour les détails et les confirmer ou les rejeter."
    )
    return answer, [
        PotentialMatchResponse.model_validate(m).model_dump(mode="json") for m in matches[:5]
    ]


def _answer_annonces(db: Session, current_user: User) -> tuple[str, list[dict]]:
    annonces = announcement_service.list_announcements(db, current_user)
    if not annonces:
        return "Aucune annonce disponible pour le moment.", []
    lignes = [a.title for a in annonces[:5]]
    answer = "Dernières annonces : " + " ; ".join(lignes)
    return answer, [AnnouncementResponse.model_validate(a).model_dump(mode="json") for a in annonces[:5]]


INTENT_HANDLERS = {
    "prochain_cours": _answer_prochain_cours,
    "examens": _answer_examens,
    "devoirs": _answer_devoirs,
    "absence": _answer_absence,
    "objets_perdus": _answer_objets_perdus,
    "annonces": _answer_annonces,
}


def answer_question(db: Session, current_user: User, question: str) -> tuple[str, str, list[dict]]:
    intent = detect_intent(question)
    handler = INTENT_HANDLERS.get(intent)
    if handler is None:
        return "inconnu", UNKNOWN_ANSWER, []

    answer, data = handler(db, current_user)
    return intent, answer, data
