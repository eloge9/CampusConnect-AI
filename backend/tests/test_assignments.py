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


def test_creation_devoir_par_teacher_responsable(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    _, _, assignment = _setup_assignment(client, admin, teacher)

    response = client.post(
        "/devoirs",
        json={
            "teacher_assignment_id": assignment["id"],
            "title": "Exercices de boucles",
            "description": "Faire les exercices 1 à 5",
            "due_date": "2026-10-15T23:59:00Z",
        },
        headers=auth_header(teacher),
    )
    assert response.status_code == 201
    assert response.json()["title"] == "Exercices de boucles"


def test_refus_creation_par_teacher_non_responsable(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher1 = create_user(db_session, UserRole.TEACHER, "teacher1@example.com")
    teacher2 = create_user(db_session, UserRole.TEACHER, "teacher2@example.com")
    _, _, assignment = _setup_assignment(client, admin, teacher1)

    response = client.post(
        "/devoirs",
        json={
            "teacher_assignment_id": assignment["id"],
            "title": "X",
            "due_date": "2026-10-15T23:59:00Z",
        },
        headers=auth_header(teacher2),
    )
    assert response.status_code == 403


def test_refus_creation_par_student(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")
    _, _, assignment = _setup_assignment(client, admin, teacher)

    response = client.post(
        "/devoirs",
        json={
            "teacher_assignment_id": assignment["id"],
            "title": "X",
            "due_date": "2026-10-15T23:59:00Z",
        },
        headers=auth_header(student),
    )
    assert response.status_code == 403


def test_student_voit_uniquement_devoirs_de_sa_classe(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    classe1, _, assignment1 = _setup_assignment(client, admin, teacher, "GL1")
    classe2 = client.post("/classes", json={"name": "GL2", "code": "GL2"}, headers=auth_header(admin)).json()
    subject2 = client.post(
        "/matieres", json={"name": "BDD", "code": "BDD"}, headers=auth_header(admin)
    ).json()
    assignment2 = client.post(
        "/affectations-enseignants",
        json={"teacher_id": teacher.id, "class_id": classe2["id"], "subject_id": subject2["id"]},
        headers=auth_header(admin),
    ).json()

    student = create_user(db_session, UserRole.STUDENT, "student@example.com")
    student.class_id = classe1["id"]
    db_session.commit()

    client.post(
        "/devoirs",
        json={
            "teacher_assignment_id": assignment1["id"],
            "title": "Pour GL1",
            "due_date": "2026-10-15T23:59:00Z",
        },
        headers=auth_header(teacher),
    )
    client.post(
        "/devoirs",
        json={
            "teacher_assignment_id": assignment2["id"],
            "title": "Pour GL2",
            "due_date": "2026-10-15T23:59:00Z",
        },
        headers=auth_header(teacher),
    )

    response = client.get("/devoirs", headers=auth_header(student))
    assert response.status_code == 200
    titles = [d["title"] for d in response.json()]
    assert titles == ["Pour GL1"]


def test_filtre_a_venir(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    _, _, assignment = _setup_assignment(client, admin, teacher)

    client.post(
        "/devoirs",
        json={
            "teacher_assignment_id": assignment["id"],
            "title": "Devoir passé",
            "due_date": "2020-01-01T23:59:00Z",
        },
        headers=auth_header(teacher),
    )
    client.post(
        "/devoirs",
        json={
            "teacher_assignment_id": assignment["id"],
            "title": "Devoir futur",
            "due_date": "2099-01-01T23:59:00Z",
        },
        headers=auth_header(teacher),
    )

    response = client.get("/devoirs?a_venir=true", headers=auth_header(admin))
    assert response.status_code == 200
    titles = [d["title"] for d in response.json()]
    assert titles == ["Devoir futur"]


def test_modification_devoir_par_teacher_responsable(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    _, _, assignment = _setup_assignment(client, admin, teacher)

    created = client.post(
        "/devoirs",
        json={
            "teacher_assignment_id": assignment["id"],
            "title": "Devoir",
            "due_date": "2026-10-15T23:59:00Z",
        },
        headers=auth_header(teacher),
    ).json()

    response = client.put(
        f"/devoirs/{created['id']}", json={"title": "Devoir modifié"}, headers=auth_header(teacher)
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Devoir modifié"


def test_suppression_devoir_par_teacher_responsable(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    _, _, assignment = _setup_assignment(client, admin, teacher)

    created = client.post(
        "/devoirs",
        json={
            "teacher_assignment_id": assignment["id"],
            "title": "Devoir",
            "due_date": "2026-10-15T23:59:00Z",
        },
        headers=auth_header(teacher),
    ).json()

    response = client.delete(f"/devoirs/{created['id']}", headers=auth_header(teacher))
    assert response.status_code == 204
