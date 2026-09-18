"""Crée les comptes et données de démonstration. Lancer avec : python -m app.seed"""

from datetime import date, datetime, time, timedelta, timezone

from app.core.config import settings
from app.core.security import hash_password
from app.db.database import SessionLocal
from app.models.announcement import Announcement, AnnouncementCategory
from app.models.assignment import Assignment
from app.models.exam import Exam
from app.models.lost_found_item import ItemStatus, ItemType, LostFoundItem
from app.models.school_class import Class
from app.models.schedule import Schedule, ScheduleStatus
from app.models.subject import Subject
from app.models.teacher_assignment import TeacherAssignment
from app.models.user import User, UserRole
from app.services.lost_found_ai import generate_matches_for_item

DEMO_ACCOUNTS = [
    {
        "role": UserRole.ADMIN,
        "first_name": "Admin",
        "last_name": "CampusConnect",
        "email": settings.seed_admin_email,
        "password": settings.seed_admin_password,
    },
    {
        "role": UserRole.TEACHER,
        "first_name": "Enseignant",
        "last_name": "Demo",
        "email": settings.seed_teacher_email,
        "password": settings.seed_teacher_password,
    },
    {
        "role": UserRole.STUDENT,
        "first_name": "Etudiant",
        "last_name": "Demo",
        "email": settings.seed_student_email,
        "password": settings.seed_student_password,
    },
]


def _get_or_create_user(db, account: dict) -> User:
    email = account["email"].strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if user is not None:
        print(f"[ignoré]  {account['role'].value:8} {email} existe déjà")
        return user
    user = User(
        first_name=account["first_name"],
        last_name=account["last_name"],
        email=email,
        password_hash=hash_password(account["password"]),
        role=account["role"],
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    print(f"[créé]    {account['role'].value:8} {email}")
    return user


def seed() -> None:
    db = SessionLocal()
    try:
        users = {account["role"]: _get_or_create_user(db, account) for account in DEMO_ACCOUNTS}
        admin = users[UserRole.ADMIN]
        teacher = users[UserRole.TEACHER]
        student = users[UserRole.STUDENT]

        classe = db.query(Class).filter(Class.code == "L3-INFO-A").first()
        if classe is None:
            classe = Class(
                name="L3 Informatique · Gr. A",
                code="L3-INFO-A",
                description="Groupe A — licence 3 informatique",
            )
            db.add(classe)
            db.commit()
            db.refresh(classe)
            print("[créé]    classe L3-INFO-A")
        else:
            print("[ignoré]  classe L3-INFO-A existe déjà")

        if student.class_id != classe.id:
            student.class_id = classe.id
            db.commit()
            print("[maj]     étudiant affecté à L3-INFO-A")

        subject = db.query(Subject).filter(Subject.code == "COMPIL").first()
        if subject is None:
            subject = Subject(
                name="Théorie des Langages & Compilation",
                code="COMPIL",
                description="Analyse lexicale, syntaxique et génération de code",
            )
            db.add(subject)
            db.commit()
            db.refresh(subject)
            print("[créé]    matière COMPIL")

        assignment = (
            db.query(TeacherAssignment)
            .filter(
                TeacherAssignment.teacher_id == teacher.id,
                TeacherAssignment.class_id == classe.id,
                TeacherAssignment.subject_id == subject.id,
            )
            .first()
        )
        if assignment is None:
            assignment = TeacherAssignment(
                teacher_id=teacher.id, class_id=classe.id, subject_id=subject.id
            )
            db.add(assignment)
            db.commit()
            db.refresh(assignment)
            print("[créé]    affectation enseignant")

        today = date.today()
        if db.query(Schedule).filter(Schedule.teacher_assignment_id == assignment.id).count() == 0:
            db.add(
                Schedule(
                    teacher_assignment_id=assignment.id,
                    room="Amphi Turing",
                    session_date=today + timedelta(days=1),
                    start_time=time(10, 0),
                    end_time=time(11, 30),
                    status=ScheduleStatus.PREVU,
                    created_by=teacher.id,
                )
            )
            db.add(
                Schedule(
                    teacher_assignment_id=assignment.id,
                    room="Salle 302",
                    session_date=today + timedelta(days=2),
                    start_time=time(14, 0),
                    end_time=time(15, 30),
                    status=ScheduleStatus.MODIFIE,
                    created_by=teacher.id,
                )
            )
            db.commit()
            print("[créé]    2 séances (dont 1 MODIFIE)")

        if db.query(Announcement).count() == 0:
            db.add_all(
                [
                    Announcement(
                        title="Polycopié Compilation en ligne",
                        content="Le cours d’analyse lexicale et le polycopié du module sont disponibles.",
                        category=AnnouncementCategory.COURS,
                        author_id=teacher.id,
                        class_id=classe.id,
                    ),
                    Announcement(
                        title="Contrôle continu décalé",
                        content="L’examen / contrôle de Compilation est décalé. Consultez l’emploi du temps.",
                        category=AnnouncementCategory.EXAMENS,
                        author_id=teacher.id,
                        class_id=classe.id,
                    ),
                    Announcement(
                        title="Forum Tech du campus",
                        content="Événement forum entreprises le 25 mai — préparez vos CV.",
                        category=AnnouncementCategory.EVENEMENTS,
                        author_id=admin.id,
                        class_id=None,
                    ),
                ]
            )
            db.commit()
            print("[créé]    3 annonces")

        if db.query(Assignment).filter(Assignment.teacher_assignment_id == assignment.id).count() == 0:
            db.add(
                Assignment(
                    teacher_assignment_id=assignment.id,
                    title="Rendu Analyseur Lexical",
                    description="Travail d’équipe — tokens et expressions régulières.",
                    due_date=datetime.now(timezone.utc) + timedelta(days=2),
                    created_by=teacher.id,
                )
            )
            db.commit()
            print("[créé]    1 devoir")

        if db.query(Exam).filter(Exam.teacher_assignment_id == assignment.id).count() == 0:
            db.add(
                Exam(
                    teacher_assignment_id=assignment.id,
                    title="Évaluation Compilation",
                    description="Contrôle sur les bases de l’analyse lexicale.",
                    room="Amphi Turing",
                    exam_date=today + timedelta(days=7),
                    start_time=time(9, 0),
                    end_time=time(11, 0),
                    created_by=teacher.id,
                )
            )
            db.commit()
            print("[créé]    1 examen")

        if db.query(LostFoundItem).count() == 0:
            lost = LostFoundItem(
                user_id=student.id,
                item_type=ItemType.PERDU,
                title="Clé USB SanDisk 64Go",
                description="Coque plastique rouge et noire, câble inclus.",
                category="électronique",
                color="rouge",
                location="Foyer Turing",
                item_date=today,
                status=ItemStatus.OUVERT,
            )
            found = LostFoundItem(
                user_id=teacher.id,
                item_type=ItemType.TROUVE,
                title="Clé USB SanDisk 64Go",
                description="Coque plastique rouge et noire, trouvée ce matin.",
                category="électronique",
                color="rouge",
                location="Foyer Turing",
                item_date=today,
                status=ItemStatus.OUVERT,
            )
            db.add_all([lost, found])
            db.commit()
            db.refresh(lost)
            generate_matches_for_item(db, found)
            print("[créé]    objets perdu/trouvé + correspondance IA")

        from app.models.conversation import Conversation
        from app.models.conversation_member import ConversationMember
        from app.models.message import Message

        already = (
            db.query(ConversationMember)
            .filter(ConversationMember.user_id == student.id)
            .first()
        )
        if already is None:
            conv = Conversation(is_group=False)
            db.add(conv)
            db.flush()
            db.add(ConversationMember(conversation_id=conv.id, user_id=student.id))
            db.add(ConversationMember(conversation_id=conv.id, user_id=teacher.id))
            db.add(
                Message(
                    conversation_id=conv.id,
                    sender_id=teacher.id,
                    content="Bonjour, je suis disponible pour vos questions sur Compilation.",
                )
            )
            db.commit()
            print("[cree]    conversation etudiant / enseignant")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
