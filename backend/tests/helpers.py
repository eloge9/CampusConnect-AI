from app.core.security import create_access_token, hash_password
from app.models.user import User, UserRole


def create_user(db_session, role: UserRole, email: str, password: str = "Password123!") -> User:
    user = User(
        first_name="Test",
        last_name=role.value,
        email=email,
        password_hash=hash_password(password),
        role=role,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def auth_header(user: User) -> dict:
    token = create_access_token(subject=str(user.id))
    return {"Authorization": f"Bearer {token}"}
