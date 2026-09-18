from app.models.user import UserRole
from tests.helpers import auth_header, create_user


def test_creation_matiere_admin(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    response = client.post(
        "/matieres", json={"name": "Python", "code": "PYTHON"}, headers=auth_header(admin)
    )
    assert response.status_code == 201
    assert response.json()["code"] == "PYTHON"


def test_creation_matiere_refus_student(client, db_session):
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")
    response = client.post(
        "/matieres", json={"name": "Python", "code": "PYTHON"}, headers=auth_header(student)
    )
    assert response.status_code == 403


def test_creation_matiere_refus_teacher(client, db_session):
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    response = client.post(
        "/matieres", json={"name": "Python", "code": "PYTHON"}, headers=auth_header(teacher)
    )
    assert response.status_code == 403


def test_consultation_matieres(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")
    created = client.post(
        "/matieres", json={"name": "Python", "code": "PYTHON"}, headers=auth_header(admin)
    ).json()

    liste = client.get("/matieres", headers=auth_header(student))
    assert liste.status_code == 200
    assert any(m["code"] == "PYTHON" for m in liste.json())

    detail = client.get(f"/matieres/{created['id']}", headers=auth_header(student))
    assert detail.status_code == 200


def test_modification_matiere_admin(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    created = client.post(
        "/matieres", json={"name": "Python", "code": "PYTHON"}, headers=auth_header(admin)
    ).json()

    response = client.put(
        f"/matieres/{created['id']}", json={"name": "Programmation Python"}, headers=auth_header(admin)
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Programmation Python"


def test_suppression_matiere_admin(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    created = client.post(
        "/matieres", json={"name": "Python", "code": "PYTHON"}, headers=auth_header(admin)
    ).json()

    response = client.delete(f"/matieres/{created['id']}", headers=auth_header(admin))
    assert response.status_code == 204

    verif = client.get(f"/matieres/{created['id']}", headers=auth_header(admin))
    assert verif.status_code == 404
