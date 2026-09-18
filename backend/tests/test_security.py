import io

from app.models.user import UserRole
from tests.helpers import auth_header, create_user


def _setup_absence(client, admin, teacher):
    classe = client.post("/classes", json={"name": "GL1", "code": "GL1"}, headers=auth_header(admin)).json()
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
    return classe, schedule


# ---------- Rate limiting ----------


def test_rate_limit_bloque_connexion_apres_5_tentatives(client, db_session):
    create_user(db_session, UserRole.STUDENT, "student@example.com")
    payload = {"email": "student@example.com", "password": "mauvais-mot-de-passe"}

    for _ in range(5):
        response = client.post("/auth/connexion", json=payload)
        assert response.status_code == 401

    response = client.post("/auth/connexion", json=payload)
    assert response.status_code == 429


def test_rate_limit_bloque_inscription_apres_5_tentatives(client, db_session):
    payload = {
        "first_name": "Test",
        "last_name": "User",
        "email": "spam@example.com",
        "password": "motdepasse123",
    }

    for i in range(5):
        client.post(
            "/auth/inscription",
            json={**payload, "email": f"spam{i}@example.com"},
        )

    response = client.post(
        "/auth/inscription", json={**payload, "email": "spam-de-trop@example.com"}
    )
    assert response.status_code == 429


# ---------- Validation réelle des fichiers uploadés (magic bytes, pas juste l'extension) ----------


def test_justificatif_avec_extension_mensongere_est_refuse(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    classe, schedule = _setup_absence(client, admin, teacher)
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")
    student.class_id = classe["id"]
    db_session.commit()

    absence = client.post(
        "/absences",
        json={"schedule_id": schedule["id"], "reason": "Motif"},
        headers=auth_header(student),
    ).json()

    # Fichier nommé "justificatif.pdf" mais dont le contenu réel n'est pas un PDF
    # (ex: un exécutable renommé) — doit être rejeté malgré l'extension "valide".
    fichier_suspect = io.BytesIO(b"MZ\x90\x00\x03\x00\x00\x00 ceci n'est pas un vrai PDF")
    response = client.post(
        f"/absences/{absence['id']}/justificatif",
        files={"file": ("justificatif.pdf", fichier_suspect, "application/pdf")},
        headers=auth_header(student),
    )
    assert response.status_code == 400


def test_justificatif_extension_mensongere_mais_contenu_valide_est_accepte_avec_la_vraie_extension(
    client, db_session
):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    classe, schedule = _setup_absence(client, admin, teacher)
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")
    student.class_id = classe["id"]
    db_session.commit()

    absence = client.post(
        "/absences",
        json={"schedule_id": schedule["id"], "reason": "Motif"},
        headers=auth_header(student),
    ).json()

    # Le client ment sur l'extension ("notes.txt") mais le contenu est un vrai PDF :
    # le fichier est accepté et stocké avec la VRAIE extension détectée, pas celle du nom fourni.
    fichier = io.BytesIO(b"%PDF-1.4 contenu reel")
    response = client.post(
        f"/absences/{absence['id']}/justificatif",
        files={"file": ("notes.txt", fichier, "text/plain")},
        headers=auth_header(student),
    )
    assert response.status_code == 200
    assert response.json()["justificatif_path"].endswith(".pdf")


def test_photo_objet_avec_extension_mensongere_est_refusee(client, db_session):
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")
    item = client.post(
        "/objets-perdus-trouves",
        json={
            "item_type": "PERDU",
            "title": "Trousse noire",
            "description": "Description",
            "location": "Salle B2",
            "item_date": "2026-10-01",
        },
        headers=auth_header(student),
    ).json()

    fichier_suspect = io.BytesIO(b"<script>alert(1)</script>")
    response = client.post(
        f"/objets-perdus-trouves/{item['id']}/photo",
        files={"file": ("photo.png", fichier_suspect, "image/png")},
        headers=auth_header(student),
    )
    assert response.status_code == 400
