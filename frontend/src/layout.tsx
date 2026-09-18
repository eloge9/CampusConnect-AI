import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Icons } from './icons'
import { LogoMark } from './LogoMark'
import { useUi } from './ui'

export type Role = 'student' | 'teacher' | 'admin'

type Tone = 'info' | 'success' | 'warning' | 'danger'

export type NavItem = {
  id: string
  label: string
  icon: keyof typeof Icons
  badge?: { text: string; tone: Tone }
}

export const NAV: Record<Role, NavItem[]> = {
  student: [
    { id: 'dash', label: 'Tableau de bord', icon: 'layout' },
    { id: 'time', label: "Mon Emploi du Temps", icon: 'calendar', badge: { text: "Aujourd'hui", tone: 'info' } },
    { id: 'courses', label: 'Mes Cours & Notes', icon: 'book' },
    { id: 'exams', label: 'Devoirs & Examens', icon: 'clipboard', badge: { text: '4', tone: 'info' } },
    { id: 'msg', label: 'Messagerie & Groupes', icon: 'message' },
    { id: 'lost', label: 'Objets Trouvés', icon: 'bag', badge: { text: 'Alerte', tone: 'warning' } },
    { id: 'ai', label: 'Assistant IA Campus', icon: 'spark', badge: { text: 'Nouveau', tone: 'info' } },
  ],
  teacher: [
    { id: 'dash', label: 'Tableau de bord', icon: 'layout' },
    { id: 'agenda', label: 'Cours & Agenda', icon: 'calendar', badge: { text: '3 tâches', tone: 'info' } },
    { id: 'classes', label: 'Gestion des Classes', icon: 'users' },
    { id: 'exams', label: 'Examens & Notes', icon: 'clipboard', badge: { text: '12 copies', tone: 'info' } },
    { id: 'admin', label: "Messages de l'Admin", icon: 'message' },
  ],
  admin: [
    { id: 'sup', label: 'Supervision IA & Systèmes', icon: 'activity' },
    { id: 'users', label: 'Comptes Utilisateurs', icon: 'users' },
    { id: 'abs', label: 'Absences & Justificatifs', icon: 'file', badge: { text: '2 en attente', tone: 'warning' } },
    { id: 'audit', label: 'Audit Trail', icon: 'shield' },
    { id: 'lost', label: 'Objets Perdus & Trouvés', icon: 'bag', badge: { text: '1 récemment', tone: 'info' } },
  ],
}

const USERS: Record<Role, { name: string; role: string; id: string; initials: string }> = {
  student: {
    name: 'Alexandre Dubois',
    role: 'L3 Informatique · Gr. A',
    id: 'N° ÉTUDIANT : 22004815',
    initials: 'AD',
  },
  teacher: {
    name: 'Mme Christine Roche',
    role: 'Enseignante en Informatique',
    id: 'N° ENSEIGNANT : 384201',
    initials: 'CR',
  },
  admin: {
    name: 'Stéphane Duchêne',
    role: 'Administrateur Système',
    id: '',
    initials: 'SD',
  },
}

export function Shell({
  role,
  search,
  extra,
  onSectionChange,
  children,
}: {
  role: Role
  search: string
  extra?: ReactNode
  onSectionChange?: (id: string) => void
  children: (ctx: { section: string; query: string; go: (id: string) => void }) => ReactNode
}) {
  const { toast } = useUi()
  const items = NAV[role]
  const [section, setSection] = useState(items[0].id)
  const [query, setQuery] = useState('')
  const user = USERS[role]

  useEffect(() => {
    setSection(NAV[role][0].id)
    setQuery('')
  }, [role])

  const go = (id: string) => {
    onSectionChange?.(id)
    setSection(id)
    window.requestAnimationFrame(() => {
      document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const onSearch = (e: FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) {
      toast('Saisissez un mot-clé pour lancer la recherche.')
      return
    }
    toast(`Recherche : « ${q} »`)
  }

  return (
    <div className={`dash ${role}`}>
      <aside className="sidebar">
        <div className="brand">
          <LogoMark size={36} />
          <div className="brand-copy">
            <strong>CampusConnect AI</strong>
          </div>
        </div>
        <nav className="nav">
          {items.map((item) => {
            const Icon = Icons[item.icon]
            return (
              <button
                key={item.id}
                className={`nav-item ${section === item.id ? 'active' : ''}`}
                type="button"
                onClick={() => go(item.id)}
              >
                <Icon size={17} />
                <span className="grow">{item.label}</span>
                {item.badge && <span className={`badge ${item.badge.tone}`}>{item.badge.text}</span>}
              </button>
            )
          })}
        </nav>
        <div className="user-card">
          <div className="avatar fallback">{user.initials}</div>
          <div className="meta">
            <strong>{user.name}</strong>
            <p>{user.role}</p>
            {user.id && (
              <div className="user-id">
                <Icons.id size={12} />
                {user.id}
              </div>
            )}
          </div>
        </div>
      </aside>
      <section className="main">
        <header className="topbar">
          <form className="search" onSubmit={onSearch}>
            <Icons.search size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={search}
              aria-label={search}
            />
          </form>
          {extra}
        </header>
        <div className="content">{children({ section, query, go })}</div>
      </section>
    </div>
  )
}
