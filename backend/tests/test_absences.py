import io

from app.models.user import UserRole
from tests.helpers import auth_header, create_user


def _setup_schedule(client, admin, teacher, class_code="GL1"):
    classe = client.post(
        "/classes", json={"name": class_code, "code": class_code}, headers=auth_header(admin)
    ).json()
    subject = client.post(
        "/matieres", json={"name": "Python", "code": "PYTHON"}, headers=auth_header(admin)
    ).json()
    assignment = client.post(
        "/affectations-enseignants",
        json={"teacher_id": teacher.id, "class_id": classe["id"], "subject_id": subject["id"]},
        headers=auth_header(admin),
    ).json()
    schedule = client.post(
        "/emploi-du-temps",
        json={
            "teacher_assignment_id": assignment["id"],
            "room": "A1",
            "session_date": "2026-10-01",
            "start_time": "10:00:00",
            "end_time": "12:00:00",
        },
        headers=auth_header(teacher),
    ).json()
    return classe, assignment, schedule


def test_declaration_absence_par_student_de_la_classe(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    classe, _, schedule = _setup_schedule(client, admin, teacher)
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")
    student.class_id = classe["id"]
    db_session.commit()

    response = client.post(
        "/absences",
        json={"schedule_id": schedule["id"], "reason": "Rendez-vous médical"},
        headers=auth_header(student),
    )
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "EN_ATTENTE"
    assert body["reason"] == "Rendez-vous médical"


def test_refus_declaration_pour_seance_dune_autre_classe(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    classe1, _, schedule = _setup_schedule(client, admin, teacher, "GL1")
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")
    # student n'appartient à aucune classe (class_id=None) -> ne correspond pas à GL1
    response = client.post(
        "/absences",
        json={"schedule_id": schedule["id"], "reason": "Motif"},
        headers=auth_header(student),
    )
    assert response.status_code == 403


def test_refus_declaration_par_teacher(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    _, _, schedule = _setup_schedule(client, admin, teacher)

    response = client.post(
        "/absences",
        json={"schedule_id": schedule["id"], "reason": "Motif"},
        headers=auth_header(teacher),
    )
    assert response.status_code == 403


def test_teacher_traite_une_demande_de_sa_seance(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    classe, _, schedule = _setup_schedule(client, admin, teacher)
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")
    student.class_id = classe["id"]
    db_session.commit()

    absence = client.post(
        "/absences",
        json={"schedule_id": schedule["id"], "reason": "Motif"},
        headers=auth_header(student),
    ).json()

    response = client.put(
        f"/absences/{absence['id']}",
        json={"status": "ACCEPTEE", "review_comment": "Justificatif reçu"},
        headers=auth_header(teacher),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ACCEPTEE"
    assert body["reviewed_by"] == teacher.id


def test_refus_traitement_par_teacher_non_responsable(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher1 = create_user(db_session, UserRole.TEACHER, "teacher1@example.com")
    teacher2 = create_user(db_session, UserRole.TEACHER, "teacher2@example.com")
    classe, _, schedule = _setup_schedule(client, admin, teacher1)
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")
    student.class_id = classe["id"]
    db_session.commit()

    absence = client.post(
        "/absences",
        json={"schedule_id": schedule["id"], "reason": "Motif"},
        headers=auth_header(student),
    ).json()

    response = client.put(
        f"/absences/{absence['id']}", json={"status": "ACCEPTEE"}, headers=auth_header(teacher2)
    )
    assert response.status_code == 403


def test_student_modifie_motif_tant_que_en_attente(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    classe, _, schedule = _setup_schedule(client, admin, teacher)
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")
    student.class_id = classe["id"]
    db_session.commit()

    absence = client.post(
        "/absences",
        json={"schedule_id": schedule["id"], "reason": "Motif initial"},
        headers=auth_header(student),
    ).json()

    response = client.put(
        f"/absences/{absence['id']}", json={"reason": "Motif corrigé"}, headers=auth_header(student)
    )
    assert response.status_code == 200
    assert response.json()["reason"] == "Motif corrigé"


def test_refus_modification_motif_apres_traitement(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    classe, _, schedule = _setup_schedule(client, admin, teacher)
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")
    student.class_id = classe["id"]
    db_session.commit()

    absence = client.post(
        "/absences",
        json={"schedule_id": schedule["id"], "reason": "Motif"},
        headers=auth_header(student),
    ).json()
    client.put(f"/absences/{absence['id']}", json={"status": "REFUSEE"}, headers=auth_header(teacher))

    response = client.put(
        f"/absences/{absence['id']}", json={"reason": "Nouvelle version"}, headers=auth_header(student)
    )
    assert response.status_code == 403


def test_student_retire_sa_demande_en_attente(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    classe, _, schedule = _setup_schedule(client, admin, teacher)
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")
    student.class_id = classe["id"]
    db_session.commit()

    absence = client.post(
        "/absences",
        json={"schedule_id": schedule["id"], "reason": "Motif"},
        headers=auth_header(student),
    ).json()

    response = client.delete(f"/absences/{absence['id']}", headers=auth_header(student))
    assert response.status_code == 204


def test_teacher_ne_peut_pas_supprimer(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    classe, _, schedule = _setup_schedule(client, admin, teacher)
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")
    student.class_id = classe["id"]
    db_session.commit()

    absence = client.post(
        "/absences",
        json={"schedule_id": schedule["id"], "reason": "Motif"},
        headers=auth_header(student),
    ).json()

    response = client.delete(f"/absences/{absence['id']}", headers=auth_header(teacher))
    assert response.status_code == 403


def test_student_ne_voit_que_ses_propres_demandes(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    classe, _, schedule = _setup_schedule(client, admin, teacher)
    student1 = create_user(db_session, UserRole.STUDENT, "student1@example.com")
    student1.class_id = classe["id"]
    student2 = create_user(db_session, UserRole.STUDENT, "student2@example.com")
    student2.class_id = classe["id"]
    db_session.commit()

    client.post(
        "/absences",
        json={"schedule_id": schedule["id"], "reason": "Motif 1"},
        headers=auth_header(student1),
    )
    client.post(
        "/absences",
        json={"schedule_id": schedule["id"], "reason": "Motif 2"},
        headers=auth_header(student2),
    )

    response = client.get("/absences", headers=auth_header(student1))
    assert response.status_code == 200
    reasons = [a["reason"] for a in response.json()]
    assert reasons == ["Motif 1"]


def test_upload_justificatif_valide(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    classe, _, schedule = _setup_schedule(client, admin, teacher)
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")
    student.class_id = classe["id"]
    db_session.commit()

    absence = client.post(
        "/absences",
        json={"schedule_id": schedule["id"], "reason": "Motif"},
        headers=auth_header(student),
    ).json()

    fichier = io.BytesIO(b"%PDF-1.4 contenu factice")
    response = client.post(
        f"/absences/{absence['id']}/justificatif",
        files={"file": ("justificatif.pdf", fichier, "application/pdf")},
        headers=auth_header(student),
    )
    assert response.status_code == 200
    assert response.json()["justificatif_path"].endswith(".pdf")


def test_upload_justificatif_format_refuse(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    classe, _, schedule = _setup_schedule(client, admin, teacher)
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")
    student.class_id = classe["id"]
    db_session.commit()

    absence = client.post(
        "/absences",
        json={"schedule_id": schedule["id"], "reason": "Motif"},
        headers=auth_header(student),
    ).json()

    fichier = io.BytesIO(b"contenu factice")
    response = client.post(
        f"/absences/{absence['id']}/justificatif",
        files={"file": ("virus.exe", fichier, "application/octet-stream")},
        headers=auth_header(student),
    )
    assert response.status_code == 400


def test_upload_justificatif_refuse_pour_autre_etudiant(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    classe, _, schedule = _setup_schedule(client, admin, teacher)
    student1 = create_user(db_session, UserRole.STUDENT, "student1@example.com")
    student1.class_id = classe["id"]
    student2 = create_user(db_session, UserRole.STUDENT, "student2@example.com")
    student2.class_id = classe["id"]
    db_session.commit()

    absence = client.post(
        "/absences",
        json={"schedule_id": schedule["id"], "reason": "Motif"},
        headers=auth_header(student1),
    ).json()

    fichier = io.BytesIO(b"%PDF-1.4 contenu factice")
    response = client.post(
        f"/absences/{absence['id']}/justificatif",
        files={"file": ("justificatif.pdf", fichier, "application/pdf")},
        headers=auth_header(student2),
    )
    assert response.status_code == 403
