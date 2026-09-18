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


def test_creation_examen_par_teacher_responsable(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    _, _, assignment = _setup_assignment(client, admin, teacher)

    response = client.post(
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
    assert response.status_code == 201
    assert response.json()["room"] == "A1"


def test_refus_creation_par_teacher_non_responsable(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher1 = create_user(db_session, UserRole.TEACHER, "teacher1@example.com")
    teacher2 = create_user(db_session, UserRole.TEACHER, "teacher2@example.com")
    _, _, assignment = _setup_assignment(client, admin, teacher1)

    response = client.post(
        "/examens",
        json={
            "teacher_assignment_id": assignment["id"],
            "title": "X",
            "room": "A1",
            "exam_date": "2026-12-01",
            "start_time": "09:00:00",
            "end_time": "11:00:00",
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
        "/examens",
        json={
            "teacher_assignment_id": assignment["id"],
            "title": "X",
            "room": "A1",
            "exam_date": "2026-12-01",
            "start_time": "09:00:00",
            "end_time": "11:00:00",
        },
        headers=auth_header(student),
    )
    assert response.status_code == 403


def test_filtre_par_matiere(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    classe, subject, assignment = _setup_assignment(client, admin, teacher)
    subject2 = client.post(
        "/matieres", json={"name": "BDD", "code": "BDD"}, headers=auth_header(admin)
    ).json()
    assignment2 = client.post(
        "/affectations-enseignants",
        json={"teacher_id": teacher.id, "class_id": classe["id"], "subject_id": subject2["id"]},
        headers=auth_header(admin),
    ).json()

    client.post(
        "/examens",
        json={
            "teacher_assignment_id": assignment["id"],
            "title": "Examen Python",
            "room": "A1",
            "exam_date": "2026-12-01",
            "start_time": "09:00:00",
            "end_time": "11:00:00",
        },
        headers=auth_header(teacher),
    )
    client.post(
        "/examens",
        json={
            "teacher_assignment_id": assignment2["id"],
            "title": "Examen BDD",
            "room": "B2",
            "exam_date": "2026-12-02",
            "start_time": "09:00:00",
            "end_time": "11:00:00",
        },
        headers=auth_header(teacher),
    )

    response = client.get(f"/examens?matiere_id={subject['id']}", headers=auth_header(admin))
    assert response.status_code == 200
    titles = [e["title"] for e in response.json()]
    assert titles == ["Examen Python"]


def test_modification_examen(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    _, _, assignment = _setup_assignment(client, admin, teacher)

    created = client.post(
        "/examens",
        json={
            "teacher_assignment_id": assignment["id"],
            "title": "Examen",
            "room": "A1",
            "exam_date": "2026-12-01",
            "start_time": "09:00:00",
            "end_time": "11:00:00",
        },
        headers=auth_header(teacher),
    ).json()

    response = client.put(f"/examens/{created['id']}", json={"room": "B2"}, headers=auth_header(teacher))
    assert response.status_code == 200
    assert response.json()["room"] == "B2"


def test_suppression_examen(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    _, _, assignment = _setup_assignment(client, admin, teacher)

    created = client.post(
        "/examens",
        json={
            "teacher_assignment_id": assignment["id"],
            "title": "Examen",
            "room": "A1",
            "exam_date": "2026-12-01",
            "start_time": "09:00:00",
            "end_time": "11:00:00",
        },
        headers=auth_header(teacher),
    ).json()

    response = client.delete(f"/examens/{created['id']}", headers=auth_header(teacher))
    assert response.status_code == 204


def test_student_voit_uniquement_examens_de_sa_classe(client, db_session):
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
        "/examens",
        json={
            "teacher_assignment_id": assignment1["id"],
            "title": "Pour GL1",
            "room": "A1",
            "exam_date": "2026-12-01",
            "start_time": "09:00:00",
            "end_time": "11:00:00",
        },
        headers=auth_header(teacher),
    )
    client.post(
        "/examens",
        json={
            "teacher_assignment_id": assignment2["id"],
            "title": "Pour GL2",
            "room": "B2",
            "exam_date": "2026-12-01",
            "start_time": "09:00:00",
            "end_time": "11:00:00",
        },
        headers=auth_header(teacher),
    )

    response = client.get("/examens", headers=auth_header(student))
    assert response.status_code == 200
    titles = [e["title"] for e in response.json()]
    assert titles == ["Pour GL1"]
