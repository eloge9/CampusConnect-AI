from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.school_class import Class
from app.schemas.school_class import ClassCreate, ClassUpdate


def get_class(db: Session, class_id: int) -> Class:
    classe = db.query(Class).filter(Class.id == class_id).first()
    if classe is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classe introuvable.")
    return classe


def list_classes(db: Session) -> list[Class]:
    return db.query(Class).order_by(Class.name).all()


def create_class(db: Session, data: ClassCreate) -> Class:
    classe = Class(**data.model_dump())
    db.add(classe)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ce code de classe existe déjà.")
    db.refresh(classe)
    return classe


def update_class(db: Session, class_id: int, data: ClassUpdate) -> Class:
    classe = get_class(db, class_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(classe, field, value)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ce code de classe existe déjà.")
    db.refresh(classe)
    return classe


def delete_class(db: Session, class_id: int) -> None:
    classe = get_class(db, class_id)
    db.delete(classe)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Impossible de supprimer cette classe : elle est utilisée par des affectations existantes.",
        )
