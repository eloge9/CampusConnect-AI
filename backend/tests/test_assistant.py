from app.models.user import UserRole
from tests.helpers import auth_header, create_user


def _setup_assignment(client, admin, teacher, class_code="GL1"):
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
    return classe, subject, assignment


def test_question_inconnue_ne_fabrique_pas_de_reponse(client, db_session):
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")
    response = client.post(
        "/assistant/question", json={"question": "Quelle est la météo demain ?"}, headers=auth_header(student)
    )
    assert response.status_code == 200
    body = response.json()
    assert body["intent"] == "inconnu"
    assert body["data"] == []


def test_prochain_cours(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    classe, _, assignment = _setup_assignment(client, admin, teacher)
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")
    student.class_id = classe["id"]
    db_session.commit()

    client.post(
        "/emploi-du-temps",
        json={
            "teacher_assignment_id": assignment["id"],
            "room": "A1",
            "session_date": "2099-10-01",
            "start_time": "10:00:00",
            "end_time": "12:00:00",
        },
        headers=auth_header(teacher),
    )

    response = client.post(
        "/assistant/question",
        json={"question": "Quand est mon prochain cours ?"},
        headers=auth_header(student),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["intent"] == "prochain_cours"
    assert "Python" in body["answer"]
    assert len(body["data"]) == 1


def test_prochain_cours_sans_seance(client, db_session):
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")
    response = client.post(
        "/assistant/question", json={"question": "Quand est mon prochain cours ?"}, headers=auth_header(student)
    )
    body = response.json()
    assert body["intent"] == "prochain_cours"
    assert "aucun" in body["answer"].lower()
    assert body["data"] == []


def test_prochain_cours_refuse_pour_admin(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    response = client.post(
        "/assistant/question", json={"question": "Quand est mon prochain cours ?"}, headers=auth_header(admin)
    )
    body = response.json()
    assert body["data"] == []
    assert "connecte-toi" in body["answer"].lower()


def test_examens_a_venir(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    classe, _, assignment = _setup_assignment(client, admin, teacher)
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")
    student.class_id = classe["id"]
    db_session.commit()

    client.post(
        "/examens",
        json={
            "teacher_assignment_id": assignment["id"],
            "title": "Examen final",
            "room": "A1",
            "exam_date": "2099-12-01",
            "start_time": "09:00:00",
            "end_time": "11:00:00",
        },
        headers=auth_header(teacher),
    )

    response = client.post(
        "/assistant/question", json={"question": "Quels sont mes examens ?"}, headers=auth_header(student)
    )
    body = response.json()
    assert body["intent"] == "examens"
    assert "Examen final" in body["answer"]
    assert len(body["data"]) == 1


def test_devoirs_a_venir(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    classe, _, assignment = _setup_assignment(client, admin, teacher)
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")
    student.class_id = classe["id"]
    db_session.commit()

    client.post(
        "/devoirs",
        json={
            "teacher_assignment_id": assignment["id"],
            "title": "Exercices de boucles",
            "due_date": "2099-10-15T23:59:00Z",
        },
        headers=auth_header(teacher),
    )

    response = client.post(
        "/assistant/question", json={"question": "Quels sont mes devoirs ?"}, headers=auth_header(student)
    )
    body = response.json()
    assert body["intent"] == "devoirs"
    assert "Exercices de boucles" in body["answer"]


def test_aide_absence(client, db_session):
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")
    response = client.post(
        "/assistant/question",
        json={"question": "Où puis-je déclarer une absence ?"},
        headers=auth_header(student),
    )
    body = response.json()
    assert body["intent"] == "absence"
    assert "/absences" in body["answer"]


def test_correspondances_objets(client, db_session):
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

    response = client.post(
        "/assistant/question",
        json={"question": "Est-ce qu'un objet correspond à ma trousse perdue ?"},
        headers=auth_header(student1),
    )
    body = response.json()
    assert body["intent"] == "objets_perdus"
    assert len(body["data"]) == 1


def test_dernieres_annonces(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")

    client.post(
        "/annonces",
        json={"title": "Rentrée", "content": "Info importante", "category": "ADMINISTRATION"},
        headers=auth_header(admin),
    )

    response = client.post(
        "/assistant/question", json={"question": "Quelles sont les dernières annonces ?"}, headers=auth_header(student)
    )
    body = response.json()
    assert body["intent"] == "annonces"
    assert "Rentrée" in body["answer"]
