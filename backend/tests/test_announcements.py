from app.models.user import UserRole
from tests.helpers import auth_header, create_user


def _setup_classes(client, admin):
    gl1 = client.post("/classes", json={"name": "GL1", "code": "GL1"}, headers=auth_header(admin)).json()
    gl2 = client.post("/classes", json={"name": "GL2", "code": "GL2"}, headers=auth_header(admin)).json()
    return gl1, gl2


def _assign_teacher(client, admin, teacher, classe):
    subject = client.post(
        "/matieres", json={"name": "Python", "code": "PYTHON"}, headers=auth_header(admin)
    ).json()
    client.post(
        "/affectations-enseignants",
        json={"teacher_id": teacher.id, "class_id": classe["id"], "subject_id": subject["id"]},
        headers=auth_header(admin),
    )


def test_creation_annonce_globale_par_admin(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    response = client.post(
        "/annonces",
        json={"title": "Bienvenue", "content": "Rentrée le 1er octobre", "category": "ADMINISTRATION"},
        headers=auth_header(admin),
    )
    assert response.status_code == 201
    assert response.json()["classe"] is None


def test_creation_annonce_teacher_sur_classe_affectee(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    gl1, _ = _setup_classes(client, admin)
    _assign_teacher(client, admin, teacher, gl1)

    response = client.post(
        "/annonces",
        json={"title": "Cours reporté", "content": "Le cours est déplacé", "category": "COURS", "class_id": gl1["id"]},
        headers=auth_header(teacher),
    )
    assert response.status_code == 201
    assert response.json()["classe"]["code"] == "GL1"


def test_refus_teacher_sur_classe_non_affectee(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    gl1, gl2 = _setup_classes(client, admin)
    _assign_teacher(client, admin, teacher, gl1)

    response = client.post(
        "/annonces",
        json={"title": "X", "content": "Y", "category": "COURS", "class_id": gl2["id"]},
        headers=auth_header(teacher),
    )
    assert response.status_code == 403


def test_refus_annonce_globale_par_teacher(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")

    response = client.post(
        "/annonces",
        json={"title": "X", "content": "Y", "category": "ADMINISTRATION"},
        headers=auth_header(teacher),
    )
    assert response.status_code == 403


def test_refus_creation_par_student(client, db_session):
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")
    response = client.post(
        "/annonces",
        json={"title": "X", "content": "Y", "category": "COURS"},
        headers=auth_header(student),
    )
    assert response.status_code == 403


def test_student_voit_annonces_globales_et_sa_classe(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    gl1, gl2 = _setup_classes(client, admin)
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")
    student.class_id = gl1["id"]
    db_session.commit()

    client.post(
        "/annonces",
        json={"title": "Globale", "content": "...", "category": "ADMINISTRATION"},
        headers=auth_header(admin),
    )
    client.post(
        "/annonces",
        json={"title": "Pour GL1", "content": "...", "category": "COURS", "class_id": gl1["id"]},
        headers=auth_header(admin),
    )
    client.post(
        "/annonces",
        json={"title": "Pour GL2", "content": "...", "category": "COURS", "class_id": gl2["id"]},
        headers=auth_header(admin),
    )

    response = client.get("/annonces", headers=auth_header(student))
    assert response.status_code == 200
    titles = {a["title"] for a in response.json()}
    assert titles == {"Globale", "Pour GL1"}


def test_student_refuse_acces_annonce_autre_classe(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    gl1, gl2 = _setup_classes(client, admin)
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")
    student.class_id = gl1["id"]
    db_session.commit()

    annonce = client.post(
        "/annonces",
        json={"title": "Pour GL2", "content": "...", "category": "COURS", "class_id": gl2["id"]},
        headers=auth_header(admin),
    ).json()

    response = client.get(f"/annonces/{annonce['id']}", headers=auth_header(student))
    assert response.status_code == 403


def test_recherche_et_filtre_categorie(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    client.post(
        "/annonces",
        json={"title": "Examen de Python", "content": "Le 10 octobre", "category": "EXAMENS"},
        headers=auth_header(admin),
    )
    client.post(
        "/annonces",
        json={"title": "Réunion parents", "content": "Salle B2", "category": "EVENEMENTS"},
        headers=auth_header(admin),
    )

    par_categorie = client.get("/annonces?categorie=EXAMENS", headers=auth_header(admin))
    assert par_categorie.status_code == 200
    assert len(par_categorie.json()) == 1
    assert par_categorie.json()[0]["category"] == "EXAMENS"

    par_recherche = client.get("/annonces?recherche=Python", headers=auth_header(admin))
    assert par_recherche.status_code == 200
    assert len(par_recherche.json()) == 1
    assert "Python" in par_recherche.json()[0]["title"]


def test_modification_par_auteur_teacher(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    gl1, _ = _setup_classes(client, admin)
    _assign_teacher(client, admin, teacher, gl1)

    annonce = client.post(
        "/annonces",
        json={"title": "Cours", "content": "...", "category": "COURS", "class_id": gl1["id"]},
        headers=auth_header(teacher),
    ).json()

    response = client.put(
        f"/annonces/{annonce['id']}", json={"title": "Cours modifié"}, headers=auth_header(teacher)
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Cours modifié"


def test_refus_modification_par_teacher_non_auteur(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher1 = create_user(db_session, UserRole.TEACHER, "teacher1@example.com")
    teacher2 = create_user(db_session, UserRole.TEACHER, "teacher2@example.com")
    gl1, _ = _setup_classes(client, admin)
    _assign_teacher(client, admin, teacher1, gl1)

    annonce = client.post(
        "/annonces",
        json={"title": "Cours", "content": "...", "category": "COURS", "class_id": gl1["id"]},
        headers=auth_header(teacher1),
    ).json()

    response = client.put(
        f"/annonces/{annonce['id']}", json={"title": "Piraté"}, headers=auth_header(teacher2)
    )
    assert response.status_code == 403


def test_admin_peut_modifier_annonce_dautrui(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    gl1, _ = _setup_classes(client, admin)
    _assign_teacher(client, admin, teacher, gl1)

    annonce = client.post(
        "/annonces",
        json={"title": "Cours", "content": "...", "category": "COURS", "class_id": gl1["id"]},
        headers=auth_header(teacher),
    ).json()

    response = client.put(
        f"/annonces/{annonce['id']}", json={"title": "Corrigé par admin"}, headers=auth_header(admin)
    )
    assert response.status_code == 200


def test_suppression_par_auteur(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    gl1, _ = _setup_classes(client, admin)
    _assign_teacher(client, admin, teacher, gl1)

    annonce = client.post(
        "/annonces",
        json={"title": "Cours", "content": "...", "category": "COURS", "class_id": gl1["id"]},
        headers=auth_header(teacher),
    ).json()

    response = client.delete(f"/annonces/{annonce['id']}", headers=auth_header(teacher))
    assert response.status_code == 204


def test_refus_suppression_par_teacher_non_auteur(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher1 = create_user(db_session, UserRole.TEACHER, "teacher1@example.com")
    teacher2 = create_user(db_session, UserRole.TEACHER, "teacher2@example.com")
    gl1, _ = _setup_classes(client, admin)
    _assign_teacher(client, admin, teacher1, gl1)

    annonce = client.post(
        "/annonces",
        json={"title": "Cours", "content": "...", "category": "COURS", "class_id": gl1["id"]},
        headers=auth_header(teacher1),
    ).json()

    response = client.delete(f"/annonces/{annonce['id']}", headers=auth_header(teacher2))
    assert response.status_code == 403
