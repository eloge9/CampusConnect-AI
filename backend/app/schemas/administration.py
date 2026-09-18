from pydantic import BaseModel


class AdminStatsResponse(BaseModel):
    total_utilisateurs: int
    total_etudiants: int
    total_enseignants: int
    total_admins: int
    total_classes: int
    total_matieres: int
    absences_en_attente: int
    objets_ouverts: int
    correspondances_proposees: int
    annonces_total: int
