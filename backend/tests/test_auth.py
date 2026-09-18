import pytest
from fastapi import HTTPException

from app.core.dependencies import require_role
from app.core.security import create_access_token
from app.models.user import User, UserRole

VALID_USER = {
    "first_name": "Ada",
    "last_name": "Lovelace",
    "email": "ada.lovelace@example.com",
    "password": "motdepasse123",
}


def register(client, **overrides):
    payload = {**VALID_USER, **overrides}
    return client.post("/auth/inscription", json=payload)


# ---------- Inscription ----------


def test_inscription_valide(client):
    response = register(client)
    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "ada.lovelace@example.com"
    assert body["role"] == "STUDENT"
    assert "password_hash" not in body
    assert "password" not in body


def test_inscription_email_deja_utilise(client):
    register(client)
    response = register(client, first_name="Autre")
    assert response.status_code == 400


def test_inscription_email_invalide(client):
    response = register(client, email="pas-un-email")
    assert response.status_code == 422


def test_inscription_champ_obligatoire_manquant(client):
    payload = {k: v for k, v in VALID_USER.items() if k != "last_name"}
    response = client.post("/auth/inscription", json=payload)
    assert response.status_code == 422


def test_inscription_mot_de_passe_invalide(client):
    response = register(client, password="short")
    assert response.status_code == 422


def test_inscription_normalise_email(client):
    response = register(client, email="  Ada.Lovelace@Example.COM  ")
    assert response.status_code == 201
    assert response.json()["email"] == "ada.lovelace@example.com"


# ---------- Connexion ----------


def test_connexion_identifiants_corrects(client):
    register(client)
    response = client.post(
        "/auth/connexion", json={"email": VALID_USER["email"], "password": VALID_USER["password"]}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert len(body["access_token"]) > 0


def test_connexion_email_inexistant(client):
    response = client.post(
        "/auth/connexion", json={"email": "inconnu@example.com", "password": "peuimporte123"}
    )
    assert response.status_code == 401


def test_connexion_mauvais_mot_de_passe(client):
    register(client)
    response = client.post(
        "/auth/connexion", json={"email": VALID_USER["email"], "password": "mauvais123"}
    )
    assert response.status_code == 401


# ---------- Authentification (/auth/moi) ----------


def test_moi_avec_token_valide(client):
    register(client)
    token = client.post(
        "/auth/connexion", json={"email": VALID_USER["email"], "password": VALID_USER["password"]}
    ).json()["access_token"]

    response = client.get("/auth/moi", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["email"] == VALID_USER["email"]


def test_moi_sans_token(client):
    response = client.get("/auth/moi")
    assert response.status_code == 401


def test_moi_avec_token_invalide(client):
    response = client.get("/auth/moi", headers={"Authorization": "Bearer token.invalide.xyz"})
    assert response.status_code == 401


def test_moi_avec_token_expire(client):
    expired_token = create_access_token(subject="1", expires_minutes=-1)
    response = client.get("/auth/moi", headers={"Authorization": f"Bearer {expired_token}"})
    assert response.status_code == 401


# ---------- Changement de mot de passe ----------


def _login_headers(client):
    token = client.post(
        "/auth/connexion", json={"email": VALID_USER["email"], "password": VALID_USER["password"]}
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_changement_mdp_avec_ancien_mdp_correct(client):
    register(client)
    headers = _login_headers(client)

    response = client.post(
        "/auth/changer-mot-de-passe",
        headers=headers,
        json={"current_password": VALID_USER["password"], "new_password": "nouveaumdp123"},
    )
    assert response.status_code == 204

    relogin = client.post(
        "/auth/connexion", json={"email": VALID_USER["email"], "password": "nouveaumdp123"}
    )
    assert relogin.status_code == 200


def test_changement_mdp_avec_ancien_mdp_incorrect(client):
    register(client)
    headers = _login_headers(client)

    response = client.post(
        "/auth/changer-mot-de-passe",
        headers=headers,
        json={"current_password": "faux-mdp", "new_password": "nouveaumdp123"},
    )
    assert response.status_code == 400


def test_changement_mdp_nouveau_mdp_invalide(client):
    register(client)
    headers = _login_headers(client)

    response = client.post(
        "/auth/changer-mot-de-passe",
        headers=headers,
        json={"current_password": VALID_USER["password"], "new_password": "short"},
    )
    assert response.status_code == 422


# ---------- Permissions (require_role) ----------


def _make_user(role: UserRole) -> User:
    return User(
        id=1,
        first_name="Test",
        last_name="User",
        email="test@example.com",
        password_hash="hash",
        role=role,
        is_active=True,
    )


def test_require_role_autorise_le_bon_role():
    dependency = require_role(UserRole.ADMIN)
    admin = _make_user(UserRole.ADMIN)
    assert dependency(current_user=admin) is admin


def test_require_role_bloque_un_role_non_autorise():
    dependency = require_role(UserRole.ADMIN)
    student = _make_user(UserRole.STUDENT)
    with pytest.raises(HTTPException) as exc_info:
        dependency(current_user=student)
    assert exc_info.value.status_code == 403


def test_require_role_accepte_plusieurs_roles():
    dependency = require_role(UserRole.TEACHER, UserRole.ADMIN)
    teacher = _make_user(UserRole.TEACHER)
    admin = _make_user(UserRole.ADMIN)
    student = _make_user(UserRole.STUDENT)

    assert dependency(current_user=teacher) is teacher
    assert dependency(current_user=admin) is admin
    with pytest.raises(HTTPException):
        dependency(current_user=student)
