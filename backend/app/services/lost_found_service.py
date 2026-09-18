import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.file_validation import detect_extension, is_extension_allowed
from app.models.lost_found_item import ItemStatus, ItemType, LostFoundItem
from app.models.user import User, UserRole
from app.schemas.lost_found_item import LostFoundItemCreate, LostFoundItemUpdate
from app.services.lost_found_ai import generate_matches_for_item

IMAGE_EXTENSIONS = {"jpg", "jpeg", "png"}


def get_item(db: Session, item_id: int) -> LostFoundItem:
    item = db.query(LostFoundItem).filter(LostFoundItem.id == item_id).first()
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Objet introuvable.")
    return item


def ensure_can_manage_item(item: LostFoundItem, current_user: User) -> None:
    if current_user.role == UserRole.ADMIN:
        return
    if item.user_id == current_user.id:
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Vous ne pouvez gérer que vos propres déclarations.",
    )


def list_items(
    db: Session,
    item_type: ItemType | None = None,
    status_filter: ItemStatus | None = None,
    category: str | None = None,
    search: str | None = None,
) -> list[LostFoundItem]:
    query = db.query(LostFoundItem)

    if item_type is not None:
        query = query.filter(LostFoundItem.item_type == item_type)
    if status_filter is not None:
        query = query.filter(LostFoundItem.status == status_filter)
    if category:
        query = query.filter(LostFoundItem.category.ilike(f"%{category}%"))
    if search:
        like = f"%{search}%"
        query = query.filter(or_(LostFoundItem.title.ilike(like), LostFoundItem.description.ilike(like)))

    return query.order_by(LostFoundItem.created_at.desc()).all()


def create_item(db: Session, data: LostFoundItemCreate, current_user: User) -> LostFoundItem:
    item = LostFoundItem(
        user_id=current_user.id,
        item_type=data.item_type,
        title=data.title,
        description=data.description,
        category=data.category,
        color=data.color,
        location=data.location,
        item_date=data.item_date,
        status=ItemStatus.OUVERT,
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    generate_matches_for_item(db, item)

    return item


def update_item(db: Session, item_id: int, data: LostFoundItemUpdate, current_user: User) -> LostFoundItem:
    item = get_item(db, item_id)
    ensure_can_manage_item(item, current_user)

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)
    return item


def delete_item(db: Session, item_id: int, current_user: User) -> None:
    item = get_item(db, item_id)
    ensure_can_manage_item(item, current_user)
    db.delete(item)
    db.commit()


async def upload_photo(db: Session, item_id: int, file: UploadFile, current_user: User) -> LostFoundItem:
    item = get_item(db, item_id)
    ensure_can_manage_item(item, current_user)

    content = await file.read()
    max_size = settings.max_upload_size_mb * 1024 * 1024
    if len(content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image trop volumineuse (max {settings.max_upload_size_mb} Mo).",
        )

    detected_extension = detect_extension(content)
    if detected_extension is None or not is_extension_allowed(detected_extension, IMAGE_EXTENSIONS):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Image non reconnue ou format non autorisé (vérifié par contenu, pas par nom "
                f"de fichier). Formats acceptés : {', '.join(sorted(IMAGE_EXTENSIONS))}."
            ),
        )

    upload_dir = Path(settings.upload_dir) / "objets"
    upload_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4().hex}.{detected_extension}"
    (upload_dir / filename).write_bytes(content)

    item.photo_path = f"/uploads/objets/{filename}"
    db.commit()
    db.refresh(item)
    return item
