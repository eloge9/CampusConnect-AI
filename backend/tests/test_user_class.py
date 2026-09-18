import pytest
from sqlalchemy.exc import IntegrityError

from app.models.school_class import Class
from app.models.user import UserRole
from tests.helpers import create_user


def test_etudiant_associe_a_une_classe(db_session):
    classe = Class(name="GL1", code="GL1")
    db_session.add(classe)
    db_session.commit()
    db_session.refresh(classe)

    student = create_user(db_session, UserRole.STUDENT, "student@example.com")
    student.class_id = classe.id
    db_session.commit()
    db_session.refresh(student)

    assert student.class_id == classe.id


def test_enseignant_sans_classe(db_session):
    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    assert teacher.class_id is None


def test_admin_sans_classe(db_session):
    admin = create_user(db_session, UserRole.ADMIN, "admin@example.com")
    assert admin.class_id is None


def test_contrainte_bloque_classe_pour_non_etudiant(db_session):
    classe = Class(name="GL1", code="GL1")
    db_session.add(classe)
    db_session.commit()
    db_session.refresh(classe)

    teacher = create_user(db_session, UserRole.TEACHER, "teacher@example.com")
    teacher.class_id = classe.id
    db_session.add(teacher)

    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()
