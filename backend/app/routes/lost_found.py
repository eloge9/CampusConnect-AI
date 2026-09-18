from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.lost_found_item import ItemStatus, ItemType
from app.models.user import User
from app.schemas.lost_found_item import LostFoundItemCreate, LostFoundItemResponse, LostFoundItemUpdate
from app.schemas.potential_match import PotentialMatchResponse
from app.services import lost_found_service, potential_match_service

router = APIRouter(prefix="/objets-perdus-trouves", tags=["Objets perdus/trouvés"])


@router.post("", response_model=LostFoundItemResponse, status_code=status.HTTP_201_CREATED)
def declarer_objet(
    data: LostFoundItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return lost_found_service.create_item(db, data, current_user)


@router.get("", response_model=list[LostFoundItemResponse])
def lister_objets(
    type_: ItemType | None = Query(default=None, alias="type"),
    statut: ItemStatus | None = Query(default=None),
    categorie: str | None = Query(default=None),
    recherche: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return lost_found_service.list_items(
        db, item_type=type_, status_filter=statut, category=categorie, search=recherche
    )


@router.get("/{item_id}", response_model=LostFoundItemResponse)
def obtenir_objet(
    item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return lost_found_service.get_item(db, item_id)


@router.put("/{item_id}", response_model=LostFoundItemResponse)
def modifier_objet(
    item_id: int,
    data: LostFoundItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return lost_found_service.update_item(db, item_id, data, current_user)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def supprimer_objet(
    item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    lost_found_service.delete_item(db, item_id, current_user)


@router.post("/{item_id}/photo", response_model=LostFoundItemResponse)
async def televerser_photo(
    item_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await lost_found_service.upload_photo(db, item_id, file, current_user)


@router.get("/{item_id}/correspondances", response_model=list[PotentialMatchResponse])
def lister_correspondances(
    item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return potential_match_service.list_matches_for_item(db, item_id, current_user)
