import io

from app.models.user import UserRole
from tests.helpers import auth_header, create_user


def test_declaration_objet_perdu(client, db_session):
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")
    response = client.post(
        "/objets-perdus-trouves",
        json={
            "item_type": "PERDU",
            "title": "Trousse noire",
            "description": "Trousse noire avec un stylo bleu et une clé USB",
            "category": "trousse",
            "color": "noir",
            "location": "Salle B2",
            "item_date": "2026-10-01",
        },
        headers=auth_header(student),
    )
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "OUVERT"
    assert body["reporter"]["id"] == student.id


def test_correspondance_generee_automatiquement(client, db_session):
    student1 = create_user(db_session, UserRole.STUDENT, "student1@example.com")
    student2 = create_user(db_session, UserRole.STUDENT, "student2@example.com")

    lost = client.post(
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
    ).json()

    found = client.post(
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
    ).json()

    response = client.get(f"/objets-perdus-trouves/{lost['id']}/correspondances", headers=auth_header(student1))
    assert response.status_code == 200
    matches = response.json()
    assert len(matches) == 1
    assert matches[0]["status"] == "PROPOSEE"
    assert matches[0]["found_item"]["id"] == found["id"]


def test_pas_de_correspondance_pour_objets_differents(client, db_session):
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")

    lost = client.post(
        "/objets-perdus-trouves",
        json={
            "item_type": "PERDU",
            "title": "Trousse noire",
            "description": "Trousse noire perdue en B2",
            "category": "trousse",
            "color": "noir",
            "location": "Salle B2",
            "item_date": "2026-10-01",
        },
        headers=auth_header(student),
    ).json()
    client.post(
        "/objets-perdus-trouves",
        json={
            "item_type": "TROUVE",
            "title": "Parapluie rouge",
            "description": "Grand parapluie rouge oublié à la bibliothèque",
            "category": "parapluie",
            "color": "rouge",
            "location": "Bibliothèque",
            "item_date": "2026-01-01",
        },
        headers=auth_header(student),
    )

    response = client.get(f"/objets-perdus-trouves/{lost['id']}/correspondances", headers=auth_header(student))
    assert response.status_code == 200
    assert response.json() == []


def test_ia_ne_confirme_jamais_automatiquement(client, db_session):
    student1 = create_user(db_session, UserRole.STUDENT, "student1@example.com")
    student2 = create_user(db_session, UserRole.STUDENT, "student2@example.com")

    lost = client.post(
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
    ).json()
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

    response = client.get(f"/objets-perdus-trouves/{lost['id']}/correspondances", headers=auth_header(student1))
    for match in response.json():
        assert match["status"] == "PROPOSEE"


def test_confirmation_correspondance_par_une_partie(client, db_session):
    student1 = create_user(db_session, UserRole.STUDENT, "student1@example.com")
    student2 = create_user(db_session, UserRole.STUDENT, "student2@example.com")

    lost = client.post(
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
    ).json()
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

    match = client.get(
        f"/objets-perdus-trouves/{lost['id']}/correspondances", headers=auth_header(student1)
    ).json()[0]

    response = client.put(
        f"/correspondances/{match['id']}", json={"status": "CONFIRMEE"}, headers=auth_header(student1)
    )
    assert response.status_code == 200
    assert response.json()["status"] == "CONFIRMEE"


def test_refus_consultation_correspondance_par_tiers(client, db_session):
    student1 = create_user(db_session, UserRole.STUDENT, "student1@example.com")
    student2 = create_user(db_session, UserRole.STUDENT, "student2@example.com")
    tiers = create_user(db_session, UserRole.STUDENT, "tiers@example.com")

    lost = client.post(
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
    ).json()
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

    match = client.get(
        f"/objets-perdus-trouves/{lost['id']}/correspondances", headers=auth_header(student1)
    ).json()[0]

    response = client.get(f"/correspondances/{match['id']}", headers=auth_header(tiers))
    assert response.status_code == 403


def test_modification_objet_par_proprietaire(client, db_session):
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

    response = client.put(
        f"/objets-perdus-trouves/{item['id']}", json={"status": "RESOLU"}, headers=auth_header(student)
    )
    assert response.status_code == 200
    assert response.json()["status"] == "RESOLU"


def test_refus_modification_par_un_autre_utilisateur(client, db_session):
    student1 = create_user(db_session, UserRole.STUDENT, "student1@example.com")
    student2 = create_user(db_session, UserRole.STUDENT, "student2@example.com")
    item = client.post(
        "/objets-perdus-trouves",
        json={
            "item_type": "PERDU",
            "title": "Trousse noire",
            "description": "Description",
            "location": "Salle B2",
            "item_date": "2026-10-01",
        },
        headers=auth_header(student1),
    ).json()

    response = client.put(
        f"/objets-perdus-trouves/{item['id']}", json={"status": "RESOLU"}, headers=auth_header(student2)
    )
    assert response.status_code == 403


def test_admin_peut_supprimer_nimporte_quel_objet(client, db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
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

    response = client.delete(f"/objets-perdus-trouves/{item['id']}", headers=auth_header(admin))
    assert response.status_code == 204


def test_upload_photo_valide(client, db_session):
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

    fichier = io.BytesIO(b"\x89PNG\r\n\x1a\n contenu factice")
    response = client.post(
        f"/objets-perdus-trouves/{item['id']}/photo",
        files={"file": ("photo.png", fichier, "image/png")},
        headers=auth_header(student),
    )
    assert response.status_code == 200
    assert response.json()["photo_path"].endswith(".png")


def test_upload_photo_format_refuse(client, db_session):
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

    fichier = io.BytesIO(b"%PDF-1.4")
    response = client.post(
        f"/objets-perdus-trouves/{item['id']}/photo",
        files={"file": ("document.pdf", fichier, "application/pdf")},
        headers=auth_header(student),
    )
    assert response.status_code == 400


def test_filtre_par_type_et_recherche(client, db_session):
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")
    client.post(
        "/objets-perdus-trouves",
        json={
            "item_type": "PERDU",
            "title": "Trousse noire",
            "description": "Description",
            "location": "Salle B2",
            "item_date": "2026-10-01",
        },
        headers=auth_header(student),
    )
    client.post(
        "/objets-perdus-trouves",
        json={
            "item_type": "TROUVE",
            "title": "Clé USB",
            "description": "Petite clé USB noire",
            "location": "Amphi A",
            "item_date": "2026-10-02",
        },
        headers=auth_header(student),
    )

    response = client.get("/objets-perdus-trouves?type=PERDU", headers=auth_header(student))
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["item_type"] == "PERDU"

    response2 = client.get("/objets-perdus-trouves?recherche=USB", headers=auth_header(student))
    assert response2.status_code == 200
    assert len(response2.json()) == 1
    assert response2.json()[0]["title"] == "Clé USB"
