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


def test_creation_seance_par_teacher_responsable(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    _, _, assignment = _setup_assignment(client, admin, teacher)

    response = client.post(
        "/emploi-du-temps",
        json={
            "teacher_assignment_id": assignment["id"],
            "room": "A1",
            "session_date": "2026-10-01",
            "start_time": "10:00:00",
            "end_time": "12:00:00",
        },
        headers=auth_header(teacher),
    )
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "PREVU"
    assert body["affectation"]["id"] == assignment["id"]


def test_refus_creation_par_teacher_non_responsable(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher1 = create_user(db_session, UserRole.TEACHER, "teacher1@example.com")
    teacher2 = create_user(db_session, UserRole.TEACHER, "teacher2@example.com")
    _, _, assignment = _setup_assignment(client, admin, teacher1)

    response = client.post(
        "/emploi-du-temps",
        json={
            "teacher_assignment_id": assignment["id"],
            "room": "A1",
            "session_date": "2026-10-01",
            "start_time": "10:00:00",
            "end_time": "12:00:00",
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
        "/emploi-du-temps",
        json={
            "teacher_assignment_id": assignment["id"],
            "room": "A1",
            "session_date": "2026-10-01",
            "start_time": "10:00:00",
            "end_time": "12:00:00",
        },
        headers=auth_header(student),
    )
    assert response.status_code == 403


def test_modification_marque_modifie_automatiquement(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    _, _, assignment = _setup_assignment(client, admin, teacher)

    created = client.post(
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

    response = client.put(
        f"/emploi-du-temps/{created['id']}", json={"room": "B2"}, headers=auth_header(teacher)
    )
    assert response.status_code == 200
    assert response.json()["room"] == "B2"
    assert response.json()["status"] == "MODIFIE"


def test_annulation_explicite_ne_force_pas_modifie(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    _, _, assignment = _setup_assignment(client, admin, teacher)

    created = client.post(
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

    response = client.put(
        f"/emploi-du-temps/{created['id']}", json={"status": "ANNULE"}, headers=auth_header(teacher)
    )
    assert response.status_code == 200
    assert response.json()["status"] == "ANNULE"


def test_student_voit_uniquement_les_seances_de_sa_classe(client, db_session):
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
        "/emploi-du-temps",
        json={
            "teacher_assignment_id": assignment1["id"],
            "room": "A1",
            "session_date": "2026-10-01",
            "start_time": "10:00:00",
            "end_time": "12:00:00",
        },
        headers=auth_header(teacher),
    )
    client.post(
        "/emploi-du-temps",
        json={
            "teacher_assignment_id": assignment2["id"],
            "room": "B2",
            "session_date": "2026-10-01",
            "start_time": "14:00:00",
            "end_time": "16:00:00",
        },
        headers=auth_header(teacher),
    )

    response = client.get("/emploi-du-temps", headers=auth_header(student))
    assert response.status_code == 200
    rooms = [s["room"] for s in response.json()]
    assert rooms == ["A1"]


def test_filtre_par_date(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    _, _, assignment = _setup_assignment(client, admin, teacher)

    client.post(
        "/emploi-du-temps",
        json={
            "teacher_assignment_id": assignment["id"],
            "room": "A1",
            "session_date": "2026-10-01",
            "start_time": "10:00:00",
            "end_time": "12:00:00",
        },
        headers=auth_header(teacher),
    )
    client.post(
        "/emploi-du-temps",
        json={
            "teacher_assignment_id": assignment["id"],
            "room": "A1",
            "session_date": "2026-10-02",
            "start_time": "10:00:00",
            "end_time": "12:00:00",
        },
        headers=auth_header(teacher),
    )

    response = client.get("/emploi-du-temps?date_seance=2026-10-01", headers=auth_header(admin))
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["session_date"] == "2026-10-01"


def test_suppression_seance_par_teacher_responsable(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    _, _, assignment = _setup_assignment(client, admin, teacher)

    created = client.post(
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

    response = client.delete(f"/emploi-du-temps/{created['id']}", headers=auth_header(teacher))
    assert response.status_code == 204


def test_teacher_refuse_consultation_seance_dautrui(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher1 = create_user(db_session, UserRole.TEACHER, "teacher1@example.com")
    teacher2 = create_user(db_session, UserRole.TEACHER, "teacher2@example.com")
    _, _, assignment = _setup_assignment(client, admin, teacher1)

    created = client.post(
        "/emploi-du-temps",
        json={
            "teacher_assignment_id": assignment["id"],
            "room": "A1",
            "session_date": "2026-10-01",
            "start_time": "10:00:00",
            "end_time": "12:00:00",
        },
        headers=auth_header(teacher1),
    ).json()

    response = client.get(f"/emploi-du-temps/{created['id']}", headers=auth_header(teacher2))
    assert response.status_code == 403
