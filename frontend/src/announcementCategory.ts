export const ANNOUNCEMENT_CATEGORIES = [
  'COURS',
  'EXAMENS',
  'EMPLOI_DU_TEMPS',
  'ADMINISTRATION',
  'EVENEMENTS',
  'OBJETS_PERDUS_TROUVES',
] as const

export type AnnouncementCategory = (typeof ANNOUNCEMENT_CATEGORIES)[number]

const RULES: [AnnouncementCategory, string[]][] = [
  ['EXAMENS', ['examen', 'contrôle', 'controle', 'partiel', 'devoir surveill', 'rattrapage']],
  ['EMPLOI_DU_TEMPS', ['emploi du temps', 'séance', 'seance', 'salle', 'déplacé', 'deplace', 'annulé', 'horaire']],
  ['OBJETS_PERDUS_TROUVES', ['objet perdu', 'objet trouvé', 'objet trouve', 'perdu', 'trouvé']],
  ['COURS', ['cours', 'td ', 'tp ', 'cm ', 'polycopié', 'chapitre', 'module']],
  ['EVENEMENTS', ['forum', 'soirée', 'soiree', 'événement', 'evenement', 'conférence', 'journée']],
]

export function detectAnnouncementCategory(title: string, content: string): AnnouncementCategory {
  const text = `${title} ${content}`.toLowerCase()
  for (const [category, keywords] of RULES) {
    if (keywords.some((k) => text.includes(k))) return category
  }
  return 'ADMINISTRATION'
}

export const CATEGORY_LABELS: Record<AnnouncementCategory, string> = {
  COURS: 'Cours',
  EXAMENS: 'Examens',
  EMPLOI_DU_TEMPS: 'Emploi du temps',
  ADMINISTRATION: 'Administration',
  EVENEMENTS: 'Événements',
  OBJETS_PERDUS_TROUVES: 'Objets perdus',
}
