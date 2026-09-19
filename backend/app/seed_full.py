"""Script complet pour initialiser la base de données avec toutes les données du cahier des charges."""

import datetime
from app.core.security import hash_password
from app.db.base import Base
from app.db.database import SessionLocal, engine
from app.models.user import User, UserRole
from app.models.school_class import Class
from app.models.subject import Subject
from app.models.teacher_assignment import TeacherAssignment
from app.models.announcement import Announcement, AnnouncementCategory
from app.models.schedule import Schedule, ScheduleStatus
from app.models.assignment import Assignment
from app.models.exam import Exam
from app.models.absence_request import AbsenceRequest, AbsenceStatus
from app.models.lost_found_item import LostFoundItem, ItemType, ItemStatus
from app.models.potential_match import PotentialMatch, MatchStatus
from app.models.notification import Notification, NotificationType
from app.models.conversation import Conversation
from app.models.conversation_member import ConversationMember
from app.models.message import Message


def populate_full_db():
    print("Initialisation des tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Classes
        c_l3 = db.query(Class).filter(Class.code == "L3-INFO").first()
        if not c_l3:
            c_l3 = Class(name="L3 Informatique", code="L3-INFO", description="Licence 3 Informatique et Science des Données")
            db.add(c_l3)
            db.flush()

        c_m1 = db.query(Class).filter(Class.code == "M1-GL").first()
        if not c_m1:
            c_m1 = Class(name="M1 Génie Logiciel", code="M1-GL", description="Master 1 Architectures Logicielles")
            db.add(c_m1)
            db.flush()

        # 2. Utilisateurs
        admin = db.query(User).filter(User.email == "admin@campusconnect.dev").first()
        if not admin:
            admin = User(
                first_name="Stéphane",
                last_name="Duchêne",
                email="admin@campusconnect.dev",
                password_hash=hash_password("AdminDemo123!"),
                role=UserRole.ADMIN,
                is_active=True,
            )
            db.add(admin)

        teacher = db.query(User).filter(User.email == "enseignant@campusconnect.dev").first()
        if not teacher:
            teacher = User(
                first_name="Jean-Marc",
                last_name="Lecoq",
                email="enseignant@campusconnect.dev",
                password_hash=hash_password("TeacherDemo123!"),
                role=UserRole.TEACHER,
                is_active=True,
            )
            db.add(teacher)

        student = db.query(User).filter(User.email == "etudiant@campusconnect.dev").first()
        if not student:
            student = User(
                first_name="Alexandre",
                last_name="Dubois",
                email="etudiant@campusconnect.dev",
                password_hash=hash_password("StudentDemo123!"),
                role=UserRole.STUDENT,
                class_id=c_l3.id,
                is_active=True,
            )
            db.add(student)
        else:
            student.class_id = c_l3.id

        db.flush()

        # 3. Matières
        matieres = [
            ("Intelligence Artificielle", "IA301", "Réseaux de neurones profonds et vision par ordinateur"),
            ("Compilation & Langages", "COMP302", "Analyse lexicale, syntaxique et génération de code"),
            ("Bases de Données NoSQL", "BD303", "Bases orientées documents et graphes"),
            ("Développement Web & APIs", "WEB304", "FastAPI, React Native et REST/GraphQL"),
        ]
        sub_objs = {}
        for name, code, desc in matieres:
            s = db.query(Subject).filter(Subject.code == code).first()
            if not s:
                s = Subject(name=name, code=code, description=desc)
                db.add(s)
                db.flush()
            sub_objs[code] = s

        # 4. Affectation enseignant (TeacherAssignment)
        aff_ia = db.query(TeacherAssignment).filter(
            TeacherAssignment.teacher_id == teacher.id,
            TeacherAssignment.class_id == c_l3.id,
            TeacherAssignment.subject_id == sub_objs["IA301"].id,
        ).first()
        if not aff_ia:
            aff_ia = TeacherAssignment(teacher_id=teacher.id, class_id=c_l3.id, subject_id=sub_objs["IA301"].id)
            db.add(aff_ia)

        aff_comp = db.query(TeacherAssignment).filter(
            TeacherAssignment.teacher_id == teacher.id,
            TeacherAssignment.class_id == c_l3.id,
            TeacherAssignment.subject_id == sub_objs["COMP302"].id,
        ).first()
        if not aff_comp:
            aff_comp = TeacherAssignment(teacher_id=teacher.id, class_id=c_l3.id, subject_id=sub_objs["COMP302"].id)
            db.add(aff_comp)

        aff_bd = db.query(TeacherAssignment).filter(
            TeacherAssignment.teacher_id == teacher.id,
            TeacherAssignment.class_id == c_l3.id,
            TeacherAssignment.subject_id == sub_objs["BD303"].id,
        ).first()
        if not aff_bd:
            aff_bd = TeacherAssignment(teacher_id=teacher.id, class_id=c_l3.id, subject_id=sub_objs["BD303"].id)
            db.add(aff_bd)

        aff_web = db.query(TeacherAssignment).filter(
            TeacherAssignment.teacher_id == teacher.id,
            TeacherAssignment.class_id == c_l3.id,
            TeacherAssignment.subject_id == sub_objs["WEB304"].id,
        ).first()
        if not aff_web:
            aff_web = TeacherAssignment(teacher_id=teacher.id, class_id=c_l3.id, subject_id=sub_objs["WEB304"].id)
            db.add(aff_web)

        db.flush()

        # 5. Emploi du temps (Schedules)
        today = datetime.date.today()
        # Créer les séances pour la semaine courante
        schedules_data = [
            (today, datetime.time(10, 0), datetime.time(11, 30), aff_ia.id, "Amphi Alan Turing (Bât. C)", ScheduleStatus.PREVU),
            (today, datetime.time(14, 0), datetime.time(16, 0), aff_comp.id, "Salle B2 (Déplacé)", ScheduleStatus.MODIFIE),
            (today + datetime.timedelta(days=1), datetime.time(8, 30), datetime.time(10, 30), aff_bd.id, "Lab Informatique 4", ScheduleStatus.PREVU),
            (today + datetime.timedelta(days=1), datetime.time(11, 0), datetime.time(12, 30), aff_web.id, "Amphi Shannon", ScheduleStatus.PREVU),
            (today + datetime.timedelta(days=2), datetime.time(14, 0), datetime.time(17, 0), aff_comp.id, "Salle Réseau 1", ScheduleStatus.PREVU),
            (today + datetime.timedelta(days=3), datetime.time(10, 0), datetime.time(12, 0), aff_ia.id, "Lab GPU Turing", ScheduleStatus.PREVU),
        ]
        created_schedules = []
        for s_date, start_t, end_t, aff_id, room, status in schedules_data:
            exists = db.query(Schedule).filter(
                Schedule.teacher_assignment_id == aff_id,
                Schedule.session_date == s_date,
                Schedule.start_time == start_t,
            ).first()
            if not exists:
                sch = Schedule(
                    teacher_assignment_id=aff_id,
                    room=room,
                    session_date=s_date,
                    start_time=start_t,
                    end_time=end_t,
                    status=status,
                    created_by=teacher.id,
                )
                db.add(sch)
                created_schedules.append(sch)
            else:
                created_schedules.append(exists)
        db.flush()

        # 6. Devoirs (Assignments)
        if db.query(Assignment).count() == 0:
            db.add(Assignment(
                teacher_assignment_id=aff_comp.id,
                title="Rendu de Projet : Analyseur Lexical",
                description="Implémenter un analyseur lexical complet avec expressions régulières et automate fini. Travail d'équipe.",
                due_date=datetime.datetime.combine(today + datetime.timedelta(days=1), datetime.time(23, 59)),
                created_by=teacher.id,
            ))
            db.add(Assignment(
                teacher_assignment_id=aff_web.id,
                title="Exercice pratique : Requêtes Réseau REST Client",
                description="Réaliser un client API typé avec gestion d'erreurs et mise en cache locale.",
                due_date=datetime.datetime.combine(today + datetime.timedelta(days=4), datetime.time(18, 0)),
                created_by=teacher.id,
            ))

        # 7. Examens (Exams)
        if db.query(Exam).count() == 0:
            db.add(Exam(
                teacher_assignment_id=aff_bd.id,
                title="Évaluation de Base de Données NoSQL",
                description="Contrôle sur table et Moodle : requêtage agrégé, modélisation et performances.",
                room="Amphi Alan Turing",
                exam_date=today + datetime.timedelta(days=3),
                start_time=datetime.time(14, 0),
                end_time=datetime.time(16, 0),
                created_by=teacher.id,
            ))
            db.add(Exam(
                teacher_assignment_id=aff_ia.id,
                title="Partiel d'Intelligence Artificielle & Deep Learning",
                description="Questions de cours et calculs de rétropropagation du gradient.",
                room="Amphi Shannon",
                exam_date=today + datetime.timedelta(days=7),
                start_time=datetime.time(10, 0),
                end_time=datetime.time(12, 0),
                created_by=teacher.id,
            ))

        # 8. Annonces (Announcements)
        if db.query(Announcement).count() == 0:
            db.add(Announcement(
                title="Campagne d'évaluation des enseignements du second semestre",
                content="Plus qu'une semaine ! Prenez 5 minutes sur votre espace personnel pour évaluer vos modules et faire progresser vos formations.",
                category=AnnouncementCategory.ADMINISTRATION,
                author_id=admin.id,
                class_id=None,
                created_at=datetime.datetime.utcnow() - datetime.timedelta(hours=18),
            ))
            db.add(Announcement(
                title="Forum Tech & Alternance du CampusConnect - 25 Mai",
                content="Plus de 40 entreprises de la tech viennent sur le campus présenter leurs futures opportunités d'alternance et de stages. Venez avec vos CV !",
                category=AnnouncementCategory.EVENEMENTS,
                author_id=admin.id,
                class_id=None,
                created_at=datetime.datetime.utcnow() - datetime.timedelta(days=2),
            ))
            db.add(Announcement(
                title="Changement de salle : TD de Compilation à 14h",
                content="Le cours de Compilation de cet après-midi prévu initialement en salle A1 est déplacé en salle B2 à 14h00.",
                category=AnnouncementCategory.COURS,
                author_id=teacher.id,
                class_id=c_l3.id,
                created_at=datetime.datetime.utcnow() - datetime.timedelta(hours=2),
            ))

        # 9. Objets perdus / trouvés (Lost & Found)
        if db.query(LostFoundItem).count() == 0:
            lost_item = LostFoundItem(
                user_id=student.id,
                item_type=ItemType.PERDU,
                title="Clé USB SanDisk 64Go",
                description="Clé USB rouge et noire avec anneau plastique bleu. Contient mes TP de compilation.",
                category="ELECTRONIQUE",
                color="rouge/noire",
                location="Foyer Turing / Bâtiment C",
                item_date=today,
                status=ItemStatus.OUVERT,
            )
            found_item = LostFoundItem(
                user_id=teacher.id,
                item_type=ItemType.TROUVE,
                title="Clé USB SanDisk 64Go rouge/noire",
                description="Trouvée sur une table au Foyer Turing ce matin. SanDisk Ultra 64Go plastique noir et rouge.",
                category="ELECTRONIQUE",
                color="rouge/noire",
                location="Foyer Turing",
                item_date=today,
                status=ItemStatus.OUVERT,
            )
            db.add(lost_item)
            db.add(found_item)
            db.flush()

            # Correspondance IA
            match = PotentialMatch(
                lost_item_id=lost_item.id,
                found_item_id=found_item.id,
                similarity_score=0.88,
                status=MatchStatus.PROPOSEE,
            )
            db.add(match)

        # 10. Absences
        if db.query(AbsenceRequest).count() == 0 and created_schedules:
            db.add(AbsenceRequest(
                student_id=student.id,
                schedule_id=created_schedules[0].id,
                reason="Consultation médicale d'urgence (justificatif fourni au secrétariat)",
                status=AbsenceStatus.ACCEPTEE,
                reviewed_by=admin.id,
                reviewed_at=datetime.datetime.utcnow(),
                review_comment="Justificatif médical validé.",
            ))
            if len(created_schedules) > 1:
                db.add(AbsenceRequest(
                    student_id=student.id,
                    schedule_id=created_schedules[1].id,
                    reason="Rendez-vous consulat pour visa académique",
                    status=AbsenceStatus.EN_ATTENTE,
                ))

        # 11. Notifications
        if db.query(Notification).count() == 0:
            db.add(Notification(
                user_id=student.id,
                title="Contrôle continu décalé",
                message="Le CC de Compilation est décalé au Vendredi 18 Avril en salle B2.",
                type=NotificationType.CHANGEMENT_SEANCE,
                is_read=False,
            ))
            db.add(Notification(
                user_id=student.id,
                title="Correspondance IA Détectée",
                message="Une clé USB SanDisk 64Go trouvée au Foyer Turing correspond à 88% à votre objet perdu.",
                type=NotificationType.CORRESPONDANCE_OBJET,
                is_read=False,
            ))
            db.add(Notification(
                user_id=student.id,
                title="Note disponible",
                message="Projet Algorithmique de Graphes : 17/20 (Top 12% de la promotion).",
                type=NotificationType.NOUVELLE_ANNONCE,
                is_read=True,
            ))

        # 12. Messagerie (Conversations)
        if db.query(Conversation).count() == 0:
            conv = Conversation(is_group=False)
            db.add(conv)
            db.flush()
            db.add(ConversationMember(conversation_id=conv.id, user_id=student.id))
            db.add(ConversationMember(conversation_id=conv.id, user_id=teacher.id))
            db.flush()
            db.add(Message(
                conversation_id=conv.id,
                sender_id=teacher.id,
                content="Bonjour Alexandre, n'oubliez pas d'inclure le fichier de tests unitaires dans votre rendu de TP de demain.",
                created_at=datetime.datetime.utcnow() - datetime.timedelta(hours=3),
            ))
            db.add(Message(
                conversation_id=conv.id,
                sender_id=student.id,
                content="Bonjour Monsieur, c'est bien noté. Tout est prêt pour le rendu !",
                created_at=datetime.datetime.utcnow() - datetime.timedelta(hours=1),
            ))

        db.commit()
        print("Base de données initialisée et peuplée avec succès !")
    except Exception as e:
        db.rollback()
        print(f"Erreur lors du peuplement : {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    populate_full_db()
