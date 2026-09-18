from app.models.user import UserRole
from tests.helpers import auth_header, create_user


def _setup_class_and_subject(client, admin):
    classe = client.post("/classes", json={"name": "GL1", "code": "GL1"}, headers=auth_header(admin)).json()
    subject = client.post(
        "/matieres", json={"name": "Python", "code": "PYTHON"}, headers=auth_header(admin)
    ).json()
    return classe, subject


def test_creation_affectation_valide(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    classe, subject = _setup_class_and_subject(client, admin)

    response = client.post(
        "/affectations-enseignants",
        json={"teacher_id": teacher.id, "class_id": classe["id"], "subject_id": subject["id"]},
        headers=auth_header(admin),
    )
    assert response.status_code == 201
    body = response.json()
    assert body["teacher"]["id"] == teacher.id
    assert body["classe"]["code"] == "GL1"
    assert body["subject"]["code"] == "PYTHON"


def test_refus_si_teacher_id_est_student(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")
    classe, subject = _setup_class_and_subject(client, admin)

    response = client.post(
        "/affectations-enseignants",
        json={"teacher_id": student.id, "class_id": classe["id"], "subject_id": subject["id"]},
        headers=auth_header(admin),
    )
    assert response.status_code == 400


def test_refus_si_teacher_id_est_admin(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    autre_admin = create_user(db_session, UserRole.ADMIN, "admin2@example.com")
    classe, subject = _setup_class_and_subject(client, admin)

    response = client.post(
        "/affectations-enseignants",
        json={"teacher_id": autre_admin.id, "class_id": classe["id"], "subject_id": subject["id"]},
        headers=auth_header(admin),
    )
    assert response.status_code == 400


def test_creation_refusee_pour_non_admin(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    classe, subject = _setup_class_and_subject(client, admin)

    response = client.post(
        "/affectations-enseignants",
        json={"teacher_id": teacher.id, "class_id": classe["id"], "subject_id": subject["id"]},
        headers=auth_header(teacher),
    )
    assert response.status_code == 403


def test_impossible_de_creer_un_doublon(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    classe, subject = _setup_class_and_subject(client, admin)
    payload = {"teacher_id": teacher.id, "class_id": classe["id"], "subject_id": subject["id"]}

    first = client.post("/affectations-enseignants", json=payload, headers=auth_header(admin))
    assert first.status_code == 201

    second = client.post("/affectations-enseignants", json=payload, headers=auth_header(admin))
    assert second.status_code == 400


def test_modification_affectation(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher1 = create_user(db_session, UserRole.TEACHER, "teacher1@example.com")
    teacher2 = create_user(db_session, UserRole.TEACHER, "teacher2@example.com")
    classe, subject = _setup_class_and_subject(client, admin)

    created = client.post(
        "/affectations-enseignants",
        json={"teacher_id": teacher1.id, "class_id": classe["id"], "subject_id": subject["id"]},
        headers=auth_header(admin),
    ).json()

    response = client.put(
        f"/affectations-enseignants/{created['id']}",
        json={"teacher_id": teacher2.id},
        headers=auth_header(admin),
    )
    assert response.status_code == 200
    assert response.json()["teacher"]["id"] == teacher2.id


def test_suppression_affectation(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    classe, subject = _setup_class_and_subject(client, admin)

    created = client.post(
        "/affectations-enseignants",
        json={"teacher_id": teacher.id, "class_id": classe["id"], "subject_id": subject["id"]},
        headers=auth_header(admin),
    ).json()

    response = client.delete(f"/affectations-enseignants/{created['id']}", headers=auth_header(admin))
    assert response.status_code == 204


def test_teacher_ne_voit_que_ses_propres_affectations(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher1 = create_user(db_session, UserRole.TEACHER, "teacher1@example.com")
    teacher2 = create_user(db_session, UserRole.TEACHER, "teacher2@example.com")
    classe, subject = _setup_class_and_subject(client, admin)

    assignment1 = client.post(
        "/affectations-enseignants",
        json={"teacher_id": teacher1.id, "class_id": classe["id"], "subject_id": subject["id"]},
        headers=auth_header(admin),
    ).json()

    subject2 = client.post(
        "/matieres", json={"name": "BDD", "code": "BDD"}, headers=auth_header(admin)
    ).json()
    client.post(
        "/affectations-enseignants",
        json={"teacher_id": teacher2.id, "class_id": classe["id"], "subject_id": subject2["id"]},
        headers=auth_header(admin),
    )

    response = client.get("/affectations-enseignants", headers=auth_header(teacher1))
    assert response.status_code == 200
    ids = [a["id"] for a in response.json()]
    assert ids == [assignment1["id"]]


def test_admin_voit_toutes_les_affectations(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher1 = create_user(db_session, UserRole.TEACHER, "teacher1@example.com")
    teacher2 = create_user(db_session, UserRole.TEACHER, "teacher2@example.com")
    classe, subject = _setup_class_and_subject(client, admin)
    subject2 = client.post(
        "/matieres", json={"name": "BDD", "code": "BDD"}, headers=auth_header(admin)
    ).json()

    client.post(
        "/affectations-enseignants",
        json={"teacher_id": teacher1.id, "class_id": classe["id"], "subject_id": subject["id"]},
        headers=auth_header(admin),
    )
    client.post(
        "/affectations-enseignants",
        json={"teacher_id": teacher2.id, "class_id": classe["id"], "subject_id": subject2["id"]},
        headers=auth_header(admin),
    )

    response = client.get("/affectations-enseignants", headers=auth_header(admin))
    assert response.status_code == 200
    assert len(response.json()) == 2


def test_teacher_refuse_consultation_affectation_dautrui(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher1 = create_user(db_session, UserRole.TEACHER, "teacher1@example.com")
    teacher2 = create_user(db_session, UserRole.TEACHER, "teacher2@example.com")
    classe, subject = _setup_class_and_subject(client, admin)

    created = client.post(
        "/affectations-enseignants",
        json={"teacher_id": teacher1.id, "class_id": classe["id"], "subject_id": subject["id"]},
        headers=auth_header(admin),
    ).json()

    response = client.get(f"/affectations-enseignants/{created['id']}", headers=auth_header(teacher2))
    assert response.status_code == 403


def test_student_ne_peut_pas_consulter_les_affectations(client, db_session):
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")
    response = client.get("/affectations-enseignants", headers=auth_header(student))
    assert response.status_code == 403
