from datetime import date

from app.models.lost_found_item import ItemStatus, ItemType, LostFoundItem
from app.services.lost_found_ai import MATCH_THRESHOLD, compute_similarity


def _make_item(**overrides):
    defaults = dict(
        id=1,
        user_id=1,
        item_type=ItemType.PERDU,
        title="Trousse noire",
        description="Trousse noire avec un stylo bleu et une clé USB",
        category="trousse",
        color="noir",
        location="Salle B2",
        item_date=date(2026, 10, 1),
        status=ItemStatus.OUVERT,
    )
    defaults.update(overrides)
    return LostFoundItem(**defaults)


def test_score_eleve_pour_objets_tres_similaires():
    lost = _make_item(item_type=ItemType.PERDU)
    found = _make_item(
        item_type=ItemType.TROUVE,
        title="Trousse noire trouvée",
        description="Trousse noire trouvée contenant un stylo bleu et une clé USB",
    )
    score = compute_similarity(lost, found)
    assert score >= MATCH_THRESHOLD


def test_score_faible_pour_objets_tres_differents():
    lost = _make_item(item_type=ItemType.PERDU)
    found = _make_item(
        item_type=ItemType.TROUVE,
        title="Parapluie rouge",
        description="Grand parapluie rouge oublié",
        category="parapluie",
        color="rouge",
        location="Bibliothèque",
        item_date=date(2026, 1, 1),
    )
    score = compute_similarity(lost, found)
    assert score < MATCH_THRESHOLD


def test_score_reste_calculable_sans_categorie_ni_couleur():
    lost = _make_item(category=None, color=None)
    found = _make_item(item_type=ItemType.TROUVE, category=None, color=None)
    score = compute_similarity(lost, found)
    assert 0.0 <= score <= 1.0
