from app.models.user import UserRole
from tests.helpers import auth_header, create_user


def test_creation_classe_admin(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    response = client.post(
        "/classes", json={"name": "Licence 1 Génie Logiciel", "code": "GL1"}, headers=auth_header(admin)
    )
    assert response.status_code == 201
    assert response.json()["code"] == "GL1"


def test_creation_classe_refus_student(client, db_session):
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")
    response = client.post(
        "/classes", json={"name": "Licence 1 Génie Logiciel", "code": "GL1"}, headers=auth_header(student)
    )
    assert response.status_code == 403


def test_creation_classe_refus_teacher(client, db_session):
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    response = client.post(
        "/classes", json={"name": "Licence 1 Génie Logiciel", "code": "GL1"}, headers=auth_header(teacher)
    )
    assert response.status_code == 403


def test_consultation_classes(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")
    created = client.post(
        "/classes", json={"name": "GL1", "code": "GL1"}, headers=auth_header(admin)
    ).json()

    liste = client.get("/classes", headers=auth_header(student))
    assert liste.status_code == 200
    assert any(c["code"] == "GL1" for c in liste.json())

    detail = client.get(f"/classes/{created['id']}", headers=auth_header(student))
    assert detail.status_code == 200
    assert detail.json()["code"] == "GL1"


def test_modification_classe_admin(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    created = client.post(
        "/classes", json={"name": "GL1", "code": "GL1"}, headers=auth_header(admin)
    ).json()

    response = client.put(
        f"/classes/{created['id']}", json={"name": "Génie Logiciel 1"}, headers=auth_header(admin)
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Génie Logiciel 1"
    assert response.json()["code"] == "GL1"


def test_suppression_classe_admin(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    created = client.post(
        "/classes", json={"name": "GL1", "code": "GL1"}, headers=auth_header(admin)
    ).json()

    response = client.delete(f"/classes/{created['id']}", headers=auth_header(admin))
    assert response.status_code == 204

    verif = client.get(f"/classes/{created['id']}", headers=auth_header(admin))
    assert verif.status_code == 404


def test_suppression_classe_bloquee_si_affectation_existante(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    classe = client.post("/classes", json={"name": "GL1", "code": "GL1"}, headers=auth_header(admin)).json()
    subject = client.post(
        "/matieres", json={"name": "Python", "code": "PYTHON"}, headers=auth_header(admin)
    ).json()
    client.post(
        "/affectations-enseignants",
        json={"teacher_id": teacher.id, "class_id": classe["id"], "subject_id": subject["id"]},
        headers=auth_header(admin),
    )

    response = client.delete(f"/classes/{classe['id']}", headers=auth_header(admin))
    assert response.status_code == 409
