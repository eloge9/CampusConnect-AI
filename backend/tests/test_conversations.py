from datetime import datetime, timedelta, timezone

from app.models.message import Message
from app.models.user import UserRole
from tests.helpers import auth_header, create_user


def test_creation_conversation_directe(client, db_session):
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")

    response = client.post(
        "/conversations", json={"user_id": teacher.id}, headers=auth_header(student)
    )
    assert response.status_code == 201
    body = response.json()
    assert body["is_group"] is False
    member_ids = {m["id"] for m in body["members"]}
    assert member_ids == {student.id, teacher.id}


def test_conversation_reutilisee_si_deja_existante(client, db_session):
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")

    first = client.post(
        "/conversations", json={"user_id": teacher.id}, headers=auth_header(student)
    ).json()
    second = client.post(
        "/conversations", json={"user_id": student.id}, headers=auth_header(teacher)
    ).json()

    assert first["id"] == second["id"]


def test_refus_conversation_avec_soi_meme(client, db_session):
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")
    response = client.post(
        "/conversations", json={"user_id": student.id}, headers=auth_header(student)
    )
    assert response.status_code == 400


def test_envoi_et_lecture_de_messages(client, db_session):
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    conversation = client.post(
        "/conversations", json={"user_id": teacher.id}, headers=auth_header(student)
    ).json()

    response = client.post(
        f"/conversations/{conversation['id']}/messages",
        json={"content": "Bonjour, j'ai une question sur le cours."},
        headers=auth_header(student),
    )
    assert response.status_code == 201
    assert response.json()["sender"]["id"] == student.id

    messages = client.get(
        f"/conversations/{conversation['id']}/messages", headers=auth_header(teacher)
    ).json()
    assert len(messages) == 1
    assert messages[0]["content"] == "Bonjour, j'ai une question sur le cours."


def test_refus_acces_conversation_pour_non_membre(client, db_session):
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    tiers = create_user(db_session, UserRole.STUDENT, "tiers@example.com")
    conversation = client.post(
        "/conversations", json={"user_id": teacher.id}, headers=auth_header(student)
    ).json()

    response = client.get(f"/conversations/{conversation['id']}", headers=auth_header(tiers))
    assert response.status_code == 403

    response2 = client.post(
        f"/conversations/{conversation['id']}/messages",
        json={"content": "Intrusion"},
        headers=auth_header(tiers),
    )
    assert response2.status_code == 403


def test_admin_na_pas_acces_par_defaut(client, db_session):
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    conversation = client.post(
        "/conversations", json={"user_id": teacher.id}, headers=auth_header(student)
    ).json()

    response = client.get(f"/conversations/{conversation['id']}", headers=auth_header(admin))
    assert response.status_code == 403


def test_compteur_non_lus_et_marquage_lu(client, db_session):
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    conversation = client.post(
        "/conversations", json={"user_id": teacher.id}, headers=auth_header(student)
    ).json()

    client.post(
        f"/conversations/{conversation['id']}/messages",
        json={"content": "Message 1"},
        headers=auth_header(student),
    )
    client.post(
        f"/conversations/{conversation['id']}/messages",
        json={"content": "Message 2"},
        headers=auth_header(student),
    )

    teacher_view = client.get(
        f"/conversations/{conversation['id']}", headers=auth_header(teacher)
    ).json()
    assert teacher_view["unread_count"] == 2

    client.post(f"/conversations/{conversation['id']}/lire", headers=auth_header(teacher))

    teacher_view_after = client.get(
        f"/conversations/{conversation['id']}", headers=auth_header(teacher)
    ).json()
    assert teacher_view_after["unread_count"] == 0


def test_nouveau_message_declenche_notification(client, db_session):
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    conversation = client.post(
        "/conversations", json={"user_id": teacher.id}, headers=auth_header(student)
    ).json()

    client.post(
        f"/conversations/{conversation['id']}/messages",
        json={"content": "Bonjour !"},
        headers=auth_header(student),
    )

    notifs = client.get("/notifications", headers=auth_header(teacher)).json()
    assert any(n["type"] == "NOUVEAU_MESSAGE" for n in notifs)

    notifs_sender = client.get("/notifications", headers=auth_header(student)).json()
    assert notifs_sender == []


def test_liste_conversations_triee_par_dernier_message(client, db_session):
    student = create_user(db_session, UserRole.STUDENT, "student@example.com")
    teacher1 = create_user(db_session, UserRole.TEACHER, "teacher1@example.com")
    teacher2 = create_user(db_session, UserRole.TEACHER, "teacher2@example.com")

    conv1 = client.post(
        "/conversations", json={"user_id": teacher1.id}, headers=auth_header(student)
    ).json()
    conv2 = client.post(
        "/conversations", json={"user_id": teacher2.id}, headers=auth_header(student)
    ).json()

    client.post(
        f"/conversations/{conv1['id']}/messages", json={"content": "Ancien"}, headers=auth_header(student)
    )
    client.post(
        f"/conversations/{conv2['id']}/messages", json={"content": "Récent"}, headers=auth_header(student)
    )

    # SQLite (utilisé en test) n'a qu'une résolution de la seconde sur CURRENT_TIMESTAMP,
    # contrairement à PostgreSQL (microseconde) : on force des horodatages distincts
    # pour vérifier le tri sans dépendre de la granularité de l'horloge du test.
    now = datetime.now(timezone.utc)
    db_session.query(Message).filter(Message.conversation_id == conv1["id"]).update(
        {"created_at": now - timedelta(minutes=1)}
    )
    db_session.query(Message).filter(Message.conversation_id == conv2["id"]).update(
        {"created_at": now}
    )
    db_session.commit()

    response = client.get("/conversations", headers=auth_header(student))
    conversations = response.json()
    assert conversations[0]["id"] == conv2["id"]
