from app.models.announcement import AnnouncementCategory

_CATEGORY_KEYWORDS: list[tuple[AnnouncementCategory, tuple[str, ...]]] = [
    (
        AnnouncementCategory.EXAMENS,
        ("examen", "contrôle", "controle", "partiel", "devoir surveill", "rattrapage"),
    ),
    (
        AnnouncementCategory.EMPLOI_DU_TEMPS,
        ("emploi du temps", "séance", "seance", "salle", "déplacé", "deplace", "annulé", "annule", "horaire"),
    ),
    (
        AnnouncementCategory.OBJETS_PERDUS_TROUVES,
        ("objet perdu", "objet trouvé", "objet trouve", "perdu", "trouvé", "trouve"),
    ),
    (
        AnnouncementCategory.COURS,
        ("cours", "td ", "tp ", "cm ", "polycopié", "polycopie", "chapitre", "module"),
    ),
    (
        AnnouncementCategory.EVENEMENTS,
        ("forum", "soirée", "soiree", "événement", "evenement", "conférence", "conference", "journée", "journee"),
    ),
]


def detect_announcement_category(title: str, content: str) -> AnnouncementCategory:
    """Catégorisation automatique par mots-clés (pas un modèle entraîné)."""
    text = f"{title} {content}".lower()
    for category, keywords in _CATEGORY_KEYWORDS:
        if any(keyword in text for keyword in keywords):
            return category
    return AnnouncementCategory.ADMINISTRATION
