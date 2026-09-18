from app.models.user import UserRole
from tests.helpers import auth_header, create_user


def test_lister_utilisateurs_admin(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    create_user(db_session, UserRole.STUDENT, "student@example.com")
    create_user(db_session, UserRole.TEACHER, "teacher@example.com")

    response = client.get("/utilisateurs", headers=auth_header(admin))
    assert response.status_code == 200
    assert len(response.json()) == 3


def test_refus_liste_utilisateurs_pour_non_admin(client, db_session):
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")
    response = client.get("/utilisateurs", headers=auth_header(student))
    assert response.status_code == 403


def test_filtre_par_role_et_recherche(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    create_user(db_session, UserRole.STUDENT, "alice@example.com")
    create_user(db_session, UserRole.STUDENT, "bob@example.com")

    response = client.get("/utilisateurs?role=STUDENT", headers=auth_header(admin))
    assert response.status_code == 200
    assert len(response.json()) == 2

    response2 = client.get("/utilisateurs?recherche=alice", headers=auth_header(admin))
    assert response2.status_code == 200
    assert len(response2.json()) == 1
    assert response2.json()[0]["email"] == "alice@example.com"


def test_admin_change_role_dun_utilisateur(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")

    response = client.put(
        f"/utilisateurs/{student.id}", json={"role": "TEACHER"}, headers=auth_header(admin)
    )
    assert response.status_code == 200
    assert response.json()["role"] == "TEACHER"


def test_admin_assigne_classe_a_un_etudiant(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")
    classe = client.post("/classes", json={"name": "GL1", "code": "GL1"}, headers=auth_header(admin)).json()

    response = client.put(
        f"/utilisateurs/{student.id}", json={"class_id": classe["id"]}, headers=auth_header(admin)
    )
    assert response.status_code == 200
    assert response.json()["class_id"] == classe["id"]


def test_refus_classe_pour_un_enseignant(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    classe = client.post("/classes", json={"name": "GL1", "code": "GL1"}, headers=auth_header(admin)).json()

    response = client.put(
        f"/utilisateurs/{teacher.id}", json={"class_id": classe["id"]}, headers=auth_header(admin)
    )
    assert response.status_code == 400


def test_admin_desactive_un_compte(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")

    response = client.put(
        f"/utilisateurs/{student.id}", json={"is_active": False}, headers=auth_header(admin)
    )
    assert response.status_code == 200
    assert response.json()["is_active"] is False


def test_admin_ne_peut_pas_se_desactiver_lui_meme(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    response = client.put(
        f"/utilisateurs/{admin.id}", json={"is_active": False}, headers=auth_header(admin)
    )
    assert response.status_code == 400


def test_admin_ne_peut_pas_changer_son_propre_role(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    response = client.put(
        f"/utilisateurs/{admin.id}", json={"role": "STUDENT"}, headers=auth_header(admin)
    )
    assert response.status_code == 400


def test_refus_modification_utilisateur_pour_non_admin(client, db_session):
    student1 = create_user(db_session, UserRole.STUDENT, "student1@example.com")
    student2 = create_user(db_session, UserRole.STUDENT, "student2@example.com")

    response = client.put(
        f"/utilisateurs/{student2.id}", json={"is_active": False}, headers=auth_header(student1)
    )
    assert response.status_code == 403


def test_statistiques_admin(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    create_user(db_session, UserRole.STUDENT, "student1@example.com")
    create_user(db_session, UserRole.STUDENT, "student2@example.com")
    create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    client.post("/classes", json={"name": "GL1", "code": "GL1"}, headers=auth_header(admin))

    response = client.get("/administration/statistiques", headers=auth_header(admin))
    assert response.status_code == 200
    body = response.json()
    assert body["total_utilisateurs"] == 4
    assert body["total_etudiants"] == 2
    assert body["total_enseignants"] == 1
    assert body["total_admins"] == 1
    assert body["total_classes"] == 1


def test_refus_statistiques_pour_non_admin(client, db_session):
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")
    response = client.get("/administration/statistiques", headers=auth_header(student))
    assert response.status_code == 403
