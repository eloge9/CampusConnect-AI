from app.models.user import UserRole
from tests.helpers import auth_header, create_user


def _setup_class_with_student(client, admin, class_code="GL1"):
    classe = client.post(
        "/classes", json={"name": class_code, "code": class_code}, headers=auth_header(admin)
    ).json()
    return classe


def test_nouvelle_annonce_notifie_les_etudiants_de_la_classe(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    classe = _setup_class_with_student(client, admin)
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")
    student.class_id = classe["id"]
    autre_student = create_user(db_session, UserRole.STUDENT, "autre@example.com")
    db_session.commit()

    client.post(
        "/annonces",
        json={"title": "Rentrée", "content": "Info importante", "category": "ADMINISTRATION", "class_id": classe["id"]},
        headers=auth_header(admin),
    )

    response = client.get("/notifications", headers=auth_header(student))
    assert response.status_code == 200
    notifs = response.json()
    assert len(notifs) == 1
    assert notifs[0]["type"] == "NOUVELLE_ANNONCE"
    assert notifs[0]["is_read"] is False

    response_autre = client.get("/notifications", headers=auth_header(autre_student))
    assert response_autre.json() == []


def test_annonce_globale_notifie_tous_les_etudiants(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    student1 = create_user(db_session, UserRole.STUDENT, "student1@example.com")
    student2 = create_user(db_session, UserRole.STUDENT, "student2@example.com")

    client.post(
        "/annonces",
        json={"title": "Info générale", "content": "...", "category": "ADMINISTRATION"},
        headers=auth_header(admin),
    )

    assert len(client.get("/notifications", headers=auth_header(student1)).json()) == 1
    assert len(client.get("/notifications", headers=auth_header(student2)).json()) == 1


def test_changement_seance_notifie_les_etudiants(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    classe = _setup_class_with_student(client, admin)
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

    student = create_user(db_session, UserRole.STUDENT, "student@example.com")
    student.class_id = classe["id"]
    db_session.commit()

    client.put(
        f"/emploi-du-temps/{schedule['id']}", json={"room": "B2"}, headers=auth_header(teacher)
    )

    response = client.get("/notifications", headers=auth_header(student))
    notifs = response.json()
    assert len(notifs) == 1
    assert notifs[0]["type"] == "CHANGEMENT_SEANCE"
    assert "A1" in notifs[0]["message"] and "B2" in notifs[0]["message"]


def test_nouvel_examen_notifie_les_etudiants(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    classe = _setup_class_with_student(client, admin)
    subject = client.post(
        "/matieres", json={"name": "Python", "code": "PYTHON"}, headers=auth_header(admin)
    ).json()
    assignment = client.post(
        "/affectations-enseignants",
        json={"teacher_id": teacher.id, "class_id": classe["id"], "subject_id": subject["id"]},
        headers=auth_header(admin),
    ).json()

    student = create_user(db_session, UserRole.STUDENT, "student@example.com")
    student.class_id = classe["id"]
    db_session.commit()

    client.post(
        "/examens",
        json={
            "teacher_assignment_id": assignment["id"],
            "title": "Examen final",
            "room": "A1",
            "exam_date": "2026-12-01",
            "start_time": "09:00:00",
            "end_time": "11:00:00",
        },
        headers=auth_header(teacher),
    )

    notifs = client.get("/notifications", headers=auth_header(student)).json()
    assert len(notifs) == 1
    assert notifs[0]["type"] == "NOUVEL_EXAMEN"


def test_reponse_absence_notifie_etudiant(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    classe = _setup_class_with_student(client, admin)
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

    student = create_user(db_session, UserRole.STUDENT, "student@example.com")
    student.class_id = classe["id"]
    db_session.commit()

    absence = client.post(
        "/absences",
        json={"schedule_id": schedule["id"], "reason": "Motif"},
        headers=auth_header(student),
    ).json()

    client.put(
        f"/absences/{absence['id']}", json={"status": "ACCEPTEE"}, headers=auth_header(teacher)
    )

    notifs = client.get("/notifications", headers=auth_header(student)).json()
    assert any(n["type"] == "REPONSE_ABSENCE" for n in notifs)


def test_correspondance_notifie_les_deux_declarants(client, db_session):
    student1 = create_user(db_session, UserRole.STUDENT, "student1@example.com")
    student2 = create_user(db_session, UserRole.STUDENT, "student2@example.com")

    client.post(
        "/objets-perdus-trouves",
        json={
            "item_type": "PERDU",
            "title": "Trousse noire",
            "description": "Trousse noire perdue en B2 avec un stylo bleu",
            "category": "trousse",
            "color": "noir",
            "location": "Salle B2",
            "item_date": "2026-10-01",
        },
        headers=auth_header(student1),
    )
    client.post(
        "/objets-perdus-trouves",
        json={
            "item_type": "TROUVE",
            "title": "Trousse noire trouvée",
            "description": "Trousse noire trouvée en B2 contenant un stylo bleu",
            "category": "trousse",
            "color": "noir",
            "location": "Salle B2",
            "item_date": "2026-10-01",
        },
        headers=auth_header(student2),
    )

    notifs1 = client.get("/notifications", headers=auth_header(student1)).json()
    notifs2 = client.get("/notifications", headers=auth_header(student2)).json()
    assert any(n["type"] == "CORRESPONDANCE_OBJET" for n in notifs1)
    assert any(n["type"] == "CORRESPONDANCE_OBJET" for n in notifs2)


def test_marquer_comme_lue(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")

    client.post(
        "/annonces",
        json={"title": "Info", "content": "...", "category": "ADMINISTRATION"},
        headers=auth_header(admin),
    )
    notif = client.get("/notifications", headers=auth_header(student)).json()[0]

    response = client.post(f"/notifications/{notif['id']}/lire", headers=auth_header(student))
    assert response.status_code == 200
    assert response.json()["is_read"] is True


def test_filtre_non_lues(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")

    client.post(
        "/annonces",
        json={"title": "Info 1", "content": "...", "category": "ADMINISTRATION"},
        headers=auth_header(admin),
    )
    client.post(
        "/annonces",
        json={"title": "Info 2", "content": "...", "category": "ADMINISTRATION"},
        headers=auth_header(admin),
    )
    notifs = client.get("/notifications", headers=auth_header(student)).json()
    client.post(f"/notifications/{notifs[0]['id']}/lire", headers=auth_header(student))

    response = client.get("/notifications?non_lues=true", headers=auth_header(student))
    assert len(response.json()) == 1


def test_marquer_tout_comme_lu(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")

    client.post(
        "/annonces",
        json={"title": "Info 1", "content": "...", "category": "ADMINISTRATION"},
        headers=auth_header(admin),
    )
    client.post(
        "/annonces",
        json={"title": "Info 2", "content": "...", "category": "ADMINISTRATION"},
        headers=auth_header(admin),
    )

    response = client.post("/notifications/lire-tout", headers=auth_header(student))
    assert response.status_code == 200
    assert response.json()["marquees"] == 2

    assert client.get("/notifications?non_lues=true", headers=auth_header(student)).json() == []


def test_refus_consultation_notification_dautrui(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    student1 = create_user(db_session, UserRole.STUDENT, "student1@example.com")
    student2 = create_user(db_session, UserRole.STUDENT, "student2@example.com")

    client.post(
        "/annonces",
        json={"title": "Info", "content": "...", "category": "ADMINISTRATION"},
        headers=auth_header(admin),
    )
    notif = client.get("/notifications", headers=auth_header(student1)).json()[0]

    response = client.get(f"/notifications/{notif['id']}", headers=auth_header(student2))
    assert response.status_code == 403
