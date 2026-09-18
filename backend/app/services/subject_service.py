from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.subject import Subject
from app.schemas.subject import SubjectCreate, SubjectUpdate


def get_subject(db: Session, subject_id: int) -> Subject:
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if subject is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Matière introuvable.")
    return subject


def list_subjects(db: Session) -> list[Subject]:
    return db.query(Subject).order_by(Subject.name).all()


def create_subject(db: Session, data: SubjectCreate) -> Subject:
    subject = Subject(**data.model_dump())
    db.add(subject)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ce code de matière existe déjà.")
    db.refresh(subject)
    return subject


def update_subject(db: Session, subject_id: int, data: SubjectUpdate) -> Subject:
    subject = get_subject(db, subject_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(subject, field, value)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ce code de matière existe déjà.")
    db.refresh(subject)
    return subject


def delete_subject(db: Session, subject_id: int) -> None:
    subject = get_subject(db, subject_id)
    db.delete(subject)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Impossible de supprimer cette matière : elle est utilisée par des affectations existantes.",
        )
