"""Crée les comptes de démonstration (ADMIN, TEACHER, STUDENT). Lancer avec : python -m app.seed"""

from app.core.config import settings
from app.core.security import hash_password
from app.db.database import SessionLocal
from app.models.user import User, UserRole

DEMO_ACCOUNTS = [
    {
        "role": UserRole.ADMIN,
        "first_name": "Admin",
        "last_name": "CampusConnect",
        "email": settings.seed_admin_email,
        "password": settings.seed_admin_password,
    },
    {
        "role": UserRole.TEACHER,
        "first_name": "Enseignant",
        "last_name": "Demo",
        "email": settings.seed_teacher_email,
        "password": settings.seed_teacher_password,
    },
    {
        "role": UserRole.STUDENT,
        "first_name": "Etudiant",
        "last_name": "Demo",
        "email": settings.seed_student_email,
        "password": settings.seed_student_password,
    },
]


def seed() -> None:
    db = SessionLocal()
    try:
        for account in DEMO_ACCOUNTS:
            email = account["email"].strip().lower()
            existing = db.query(User).filter(User.email == email).first()
            if existing is not None:
                print(f"[ignoré]  {account['role'].value:8} {email} existe déjà")
                continue

            user = User(
                first_name=account["first_name"],
                last_name=account["last_name"],
                email=email,
                password_hash=hash_password(account["password"]),
                role=account["role"],
            )
            db.add(user)
            db.commit()
            print(f"[créé]    {account['role'].value:8} {email}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
