import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { fullName, initials } from './api'
import { useAuth } from './auth'
import { Icons } from './icons'
import { LogoMark } from './LogoMark'
import { useTheme } from './theme'
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
    { id: 'exams', label: 'Devoirs & Examens', icon: 'clipboard' },
    { id: 'abs', label: 'Mes absences', icon: 'file' },
    { id: 'msg', label: 'Messagerie & Groupes', icon: 'message' },
    { id: 'lost', label: 'Objets Trouvés', icon: 'bag', badge: { text: 'Alerte', tone: 'warning' } },
    { id: 'ai', label: 'Assistant IA Campus', icon: 'spark', badge: { text: 'Nouveau', tone: 'info' } },
  ],
  teacher: [
    { id: 'dash', label: 'Tableau de bord', icon: 'layout' },
    { id: 'agenda', label: 'Cours & Agenda', icon: 'calendar', badge: { text: '3 tâches', tone: 'info' } },
    { id: 'classes', label: 'Gestion des Classes', icon: 'users' },
    { id: 'exams', label: 'Examens', icon: 'clipboard' },
    { id: 'devoirs', label: 'Devoirs', icon: 'file' },
    { id: 'abs', label: 'Absences à traiter', icon: 'alert' },
    { id: 'msg', label: 'Messagerie', icon: 'message' },
    { id: 'admin', label: "Messages de l'Admin", icon: 'message' },
  ],
  admin: [
    { id: 'sup', label: 'Supervision IA & Systèmes', icon: 'activity' },
    { id: 'users', label: 'Comptes Utilisateurs', icon: 'users' },
    { id: 'classes', label: 'Classes', icon: 'book' },
    { id: 'matieres', label: 'Matières', icon: 'clipboard' },
    { id: 'aff', label: 'Affectations', icon: 'users' },
    { id: 'edt', label: 'Emploi du temps', icon: 'calendar' },
    { id: 'abs', label: 'Absences & Justificatifs', icon: 'file' },
    { id: 'audit', label: 'Audit Trail', icon: 'shield' },
    { id: 'lost', label: 'Objets Perdus & Trouvés', icon: 'bag', badge: { text: '1 récemment', tone: 'info' } },
  ],
}

const ROLE_LABEL: Record<Role, string> = {
  student: 'Étudiant',
  teacher: 'Enseignant',
  admin: 'Administrateur',
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
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const items = NAV[role]
  const [section, setSection] = useState(items[0].id)
  const [query, setQuery] = useState('')
  const displayName = user ? fullName(user) : ROLE_LABEL[role]
  const displayRole = user ? ROLE_LABEL[role] : ''
  const displayId = user?.email ?? ''
  const avatar = user ? initials(user) : 'CC'

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
          <LogoMark size={44} />
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
          <div className="avatar fallback">{avatar}</div>
          <div className="meta">
            <strong>{displayName}</strong>
            <p>{displayRole}</p>
            {displayId && (
              <div className="user-id">
                <Icons.id size={12} />
                {displayId}
              </div>
            )}
            <button className="link logout-link" type="button" onClick={toggle}>
              {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            </button>
            <button className="link logout-link" type="button" onClick={logout}>
              Déconnexion
            </button>
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
