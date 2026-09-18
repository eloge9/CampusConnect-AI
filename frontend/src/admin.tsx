import { useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import {
  api,
  formatDate,
  formatWhen,
  fullName,
  type Absence,
  type AdminStats,
  type LostFoundItem,
  type User,
} from './api'
import { Card, CardHeader } from './components/Card'
import { DataTable } from './components/DataTable'
import { Widget } from './components/Widget'
import { Icons } from './icons'
import { Shell } from './layout'
import { useUi } from './ui'

type AdminOutlet = { section: string; query: string }

const ROLE_FR: Record<string, string> = {
  STUDENT: 'Étudiant',
  TEACHER: 'Enseignant',
  ADMIN: 'Admin',
}

export function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <Shell
      role="admin"
      search="Supervision, comptes, absences..."
      onSectionChange={() => {
        if (location.pathname !== '/admin') navigate('/admin')
      }}
    >
      {({ section, query }) => (
        <Outlet key={location.pathname} context={{ section, query } satisfies AdminOutlet} />
      )}
    </Shell>
  )
}

export function AdminHome() {
  const { section, query } = useOutletContext<AdminOutlet>()
  const { modal, toast } = useUi()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [absences, setAbsences] = useState<Absence[]>([])
  const [items, setItems] = useState<LostFoundItem[]>([])

  const load = useCallback(async () => {
    try {
      const [st, us, ab, obj] = await Promise.all([
        api<AdminStats>('/administration/statistiques'),
        api<User[]>('/utilisateurs'),
        api<Absence[]>('/absences'),
        api<LostFoundItem[]>('/objets-perdus-trouves'),
      ])
      setStats(st)
      setUsers(us)
      setAbsences(ab)
      setItems(obj)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Chargement API impossible.')
    }
  }, [toast])

  useEffect(() => {
    void load()
  }, [load])

  const reviewAbsence = (id: number, status: 'ACCEPTEE' | 'REFUSEE') => {
    void api(`/absences/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    })
      .then(() => {
        toast(status === 'ACCEPTEE' ? 'Absence acceptée.' : 'Demande rejetée.')
        return load()
      })
      .catch((err) => toast(err instanceof Error ? err.message : 'Action impossible.'))
  }

  const q = query.trim().toLowerCase()
  const showDash = section === 'sup' || section === 'dash'
  const filteredAbsences = absences.filter((a) => {
    const label = `${a.reason} ${a.schedule.affectation.classe.name}`.toLowerCase()
    return !q || label.includes(q)
  })
  const filteredUsers = users.filter((u) => {
    const label = `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase()
    return !q || label.includes(q)
  })

  return (
    <div className="hz-page">
      {showDash && (
        <>
          <header className="hz-page-h" id="sec-sup">
            <h1>Console de Supervision CampusConnect AI</h1>
          </header>

          <div className="widget-row">
            <Widget
              icon={<Icons.activity size={20} />}
              title="Utilisateurs"
              subtitle={`${stats?.total_utilisateurs ?? '—'} comptes`}
              to="/admin/supervision/disponibilite"
            />
            <Widget
              icon={<Icons.users size={20} />}
              title="Étudiants / Enseignants"
              subtitle={`${stats?.total_etudiants ?? 0} · ${stats?.total_enseignants ?? 0}`}
              to="/admin/supervision/utilisateurs-actifs"
            />
            <Widget
              icon={<Icons.shield size={20} />}
              title="Absences en attente"
              subtitle={`${stats?.absences_en_attente ?? 0} dossier(s)`}
              tone="danger"
              to="/admin/supervision/incidents"
            />
          </div>
        </>
      )}

      {(showDash || section === 'abs') && (
        <div className="hz-row-2">
          <DataTable
            id="sec-abs"
            title="Validation des Demandes d’Absence"
            columns={['Étudiant', 'Justificatif', 'Date', 'Action']}
          >
            {filteredAbsences.length === 0 && (
              <tr>
                <td colSpan={4}>Aucune demande d’absence.</td>
              </tr>
            )}
            {filteredAbsences.map((a) => (
              <tr key={a.id}>
                <td>
                  <strong>Étudiant #{a.student_id}</strong>
                  <span className="td-sub">{a.schedule.affectation.classe.name}</span>
                </td>
                <td>
                  <span className={`chip ${a.justificatif_path ? 'success' : 'warning'}`}>
                    {a.justificatif_path ? 'Justificatif reçu' : a.reason}
                  </span>
                </td>
                <td>{formatDate(a.created_at)}</td>
                <td>
                  {a.status === 'EN_ATTENTE' ? (
                    <div className="actions-row">
                      <button
                        className="btn btn-accent"
                        type="button"
                        onClick={() =>
                          modal({
                            title: 'Accepter la demande',
                            body: <p>{a.reason}</p>,
                            confirm: 'Accepter',
                            onConfirm: () => reviewAbsence(a.id, 'ACCEPTEE'),
                          })
                        }
                      >
                        Accepter
                      </button>
                      <button
                        className="btn btn-soft-warning"
                        type="button"
                        onClick={() =>
                          modal({
                            title: 'Rejeter la demande',
                            body: <p>L’étudiant devra éventuellement déposer un nouveau justificatif.</p>,
                            confirm: 'Rejeter',
                            onConfirm: () => reviewAbsence(a.id, 'REFUSEE'),
                          })
                        }
                      >
                        Rejeter
                      </button>
                    </div>
                  ) : (
                    <span className={`chip ${a.status === 'ACCEPTEE' ? 'success' : 'danger'}`}>
                      {a.status === 'ACCEPTEE' ? 'Acceptée' : 'Rejetée'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </DataTable>

          {showDash && (
            <Card extra="task-card">
              <CardHeader title="Synthèse plateforme" />
              <p className="task-lead">
                {stats?.annonces_total ?? 0} annonces · {stats?.objets_ouverts ?? 0} objets ouverts ·{' '}
                {stats?.correspondances_proposees ?? 0} correspondances proposées.
              </p>
            </Card>
          )}
        </div>
      )}

      {(showDash || section === 'lost') && (
        <div className="hz-row-2">
          <DataTable
            id="sec-lost"
            title="Modération Objets Trouvés"
            columns={['Objet', 'Statut', 'Description']}
          >
            {items.length === 0 && (
              <tr>
                <td colSpan={3}>Aucun objet déclaré.</td>
              </tr>
            )}
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.title}</strong>
                </td>
                <td>
                  <span className="chip info">
                    {item.item_type} · {item.status}
                  </span>
                </td>
                <td className="td-desc">
                  {item.description} ({item.location})
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      )}

      {section === 'users' && (
        <DataTable id="sec-users" title="Comptes Utilisateurs" columns={['Compte', 'Rôle', 'Statut']}>
          {filteredUsers.map((u) => (
            <tr key={u.id}>
              <td>
                <strong>{fullName(u)}</strong>
                <span className="td-sub">{u.email}</span>
              </td>
              <td>{ROLE_FR[u.role] ?? u.role}</td>
              <td>
                <span className={`chip ${u.is_active ? 'success' : 'danger'}`}>
                  {u.is_active ? 'Compte actif' : 'Désactivé'}
                </span>
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      {section === 'audit' && (
        <Card id="sec-audit">
          <CardHeader title="Activité récente" />
          <div className="ann">
            <h4>{stats?.total_utilisateurs ?? 0} utilisateurs</h4>
            <p>Comptes présents en base PostgreSQL.</p>
          </div>
          <div className="ann">
            <h4>{formatWhen(new Date().toISOString())}</h4>
            <p>Statistiques lues via GET /administration/statistiques.</p>
          </div>
        </Card>
      )}
    </div>
  )
}
