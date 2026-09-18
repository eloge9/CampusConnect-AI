from difflib import SequenceMatcher

from sqlalchemy.orm import Session

from app.models.lost_found_item import ItemStatus, ItemType, LostFoundItem
from app.models.potential_match import PotentialMatch

MATCH_THRESHOLD = 0.45
DATE_DECAY_DAYS = 14


def _text_similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a.strip().lower(), b.strip().lower()).ratio()


def compute_similarity(lost: LostFoundItem, found: LostFoundItem) -> float:
    """Score heuristique 0-1 : similarité de texte + catégorie/couleur/lieu/date.

    Pas un modèle entraîné : combinaison pondérée de règles simples et de
    similarité de chaînes (difflib), volontairement transparente et déterministe.
    """
    score = 0.0
    weight_total = 0.0

    text_score = _text_similarity(f"{lost.title} {lost.description}", f"{found.title} {found.description}")
    score += text_score * 0.4
    weight_total += 0.4

    if lost.category and found.category:
        score += (0.2 if lost.category.strip().lower() == found.category.strip().lower() else 0.0)
        weight_total += 0.2

    if lost.color and found.color:
        score += (0.15 if lost.color.strip().lower() == found.color.strip().lower() else 0.0)
        weight_total += 0.15

    if lost.location and found.location:
        score += _text_similarity(lost.location, found.location) * 0.15
        weight_total += 0.15

    days_diff = abs((lost.item_date - found.item_date).days)
    date_score = max(0.0, 1 - days_diff / DATE_DECAY_DAYS)
    score += date_score * 0.10
    weight_total += 0.10

    return score / weight_total if weight_total else 0.0


def generate_matches_for_item(db: Session, item: LostFoundItem) -> list[PotentialMatch]:
    """Compare un nouvel objet aux objets ouverts du type opposé et propose des correspondances.

    Ne confirme jamais rien automatiquement : les correspondances sont créées
    avec le statut PROPOSEE, à valider par un utilisateur.
    """
    opposite_type = ItemType.TROUVE if item.item_type == ItemType.PERDU else ItemType.PERDU
    candidates = (
        db.query(LostFoundItem)
        .filter(LostFoundItem.item_type == opposite_type, LostFoundItem.status == ItemStatus.OUVERT)
        .all()
    )

    created_matches = []
    for candidate in candidates:
        lost_item, found_item = (
            (item, candidate) if item.item_type == ItemType.PERDU else (candidate, item)
        )
        score = compute_similarity(lost_item, found_item)
        if score < MATCH_THRESHOLD:
            continue

        existing = (
            db.query(PotentialMatch)
            .filter(
                PotentialMatch.lost_item_id == lost_item.id,
                PotentialMatch.found_item_id == found_item.id,
            )
            .first()
        )
        if existing is not None:
            continue

        match = PotentialMatch(
            lost_item_id=lost_item.id, found_item_id=found_item.id, similarity_score=round(score, 4)
        )
        db.add(match)
        created_matches.append(match)

    if created_matches:
        db.commit()
        for match in created_matches:
            db.refresh(match)

    return created_matches
