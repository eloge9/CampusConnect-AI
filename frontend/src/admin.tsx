import { useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import {
  api,
  formatDate,
  formatWhen,
  fullName,
  type Absence,
  type AdminStats,
  type ClassItem,
  type LostFoundItem,
  type Schedule,
  type Subject,
  type TeacherAssignment,
  type User,
} from './api'
import { Card, CardHeader } from './components/Card'
import { DataTable } from './components/DataTable'
import { Widget } from './components/Widget'
import { Icons } from './icons'
import { Shell } from './layout'
import {
  AssignmentsCatalog,
  ClassesCatalog,
  SchedulesCatalog,
  SubjectsCatalog,
} from './pages/admin/catalog'
import { useUi } from './ui'

type AdminOutlet = { section: string; query: string }

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
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [st, us, ab, obj, cls, mats, aff, edt] = await Promise.all([
        api<AdminStats>('/administration/statistiques'),
        api<User[]>('/utilisateurs'),
        api<Absence[]>('/absences'),
        api<LostFoundItem[]>('/objets-perdus-trouves'),
        api<ClassItem[]>('/classes'),
        api<Subject[]>('/matieres'),
        api<TeacherAssignment[]>('/affectations-enseignants'),
        api<Schedule[]>('/emploi-du-temps'),
      ])
      setStats(st)
      setUsers(us)
      setAbsences(ab)
      setItems(obj)
      setClasses(cls)
      setSubjects(mats)
      setAssignments(aff)
      setSchedules(edt)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Chargement API impossible.')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void load()
  }, [load])

  const patchUser = (id: number, data: Partial<User>) => {
    void api(`/utilisateurs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
      .then(() => {
        toast('Compte mis à jour.')
        return load()
      })
      .catch((err) => toast(err instanceof Error ? err.message : 'Mise à jour impossible.'))
  }

  const patchItem = (id: number, status: LostFoundItem['status']) => {
    void api(`/objets-perdus-trouves/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    })
      .then(() => {
        toast('Statut mis à jour.')
        return load()
      })
      .catch((err) => toast(err instanceof Error ? err.message : 'Mise à jour impossible.'))
  }
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
          {loading && <p className="hint load-hint">Chargement en cours…</p>}

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
            columns={['Objet', 'Statut', 'Description', 'Actions']}
          >
            {loading && (
              <tr>
                <td colSpan={4}>Chargement en cours…</td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={4}>Aucun objet déclaré.</td>
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
                <td>
                  <div className="actions-row">
                    <select
                      value={item.status}
                      onChange={(e) => patchItem(item.id, e.target.value as LostFoundItem['status'])}
                    >
                      <option value="OUVERT">OUVERT</option>
                      <option value="RESOLU">RESOLU</option>
                      <option value="FERME">FERME</option>
                    </select>
                    <button
                      className="btn btn-ghost"
                      type="button"
                      onClick={() =>
                        void api(`/objets-perdus-trouves/${item.id}`, { method: 'DELETE' })
                          .then(() => {
                            toast('Objet supprimé.')
                            return load()
                          })
                          .catch((err) =>
                            toast(err instanceof Error ? err.message : 'Suppression impossible.'),
                          )
                      }
                    >
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      )}

      {section === 'users' && (
        <>
          <p className="hint">
            Pas d’endpoint de création TEACHER/ADMIN : seul `POST /auth/inscription` existe (rôle
            STUDENT forcé). Promouvoir via le rôle ci-dessous.
          </p>
          <DataTable
            id="sec-users"
            title="Comptes Utilisateurs"
            columns={['Compte', 'Rôle', 'Classe', 'Statut']}
          >
            {loading && (
              <tr>
                <td colSpan={4}>Chargement en cours…</td>
              </tr>
            )}
            {filteredUsers.map((u) => (
              <tr key={u.id}>
                <td>
                  <strong>{fullName(u)}</strong>
                  <span className="td-sub">{u.email}</span>
                </td>
                <td>
                  <select
                    value={u.role}
                    onChange={(e) => {
                      const role = e.target.value as User['role']
                      patchUser(u.id, role === 'STUDENT' ? { role } : { role, class_id: null })
                    }}
                  >
                    <option value="STUDENT">Étudiant</option>
                    <option value="TEACHER">Enseignant</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </td>
                <td>
                  {u.role === 'STUDENT' ? (
                    <select
                      value={u.class_id ?? ''}
                      onChange={(e) =>
                        patchUser(u.id, { class_id: e.target.value ? Number(e.target.value) : null })
                      }
                    >
                      <option value="">Aucune</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    '—'
                  )}
                </td>
                <td>
                  <button
                    className={`btn ${u.is_active ? 'btn-soft-success' : 'btn-ghost'}`}
                    type="button"
                    onClick={() => patchUser(u.id, { is_active: !u.is_active })}
                  >
                    {u.is_active ? 'Actif — désactiver' : 'Inactif — activer'}
                  </button>
                </td>
              </tr>
            ))}
          </DataTable>
        </>
      )}

      {section === 'classes' && (
        <ClassesCatalog items={classes} loading={loading} onChange={load} />
      )}
      {section === 'matieres' && (
        <SubjectsCatalog items={subjects} loading={loading} onChange={load} />
      )}
      {section === 'aff' && (
        <AssignmentsCatalog
          items={assignments}
          teachers={users.filter((u) => u.role === 'TEACHER')}
          classes={classes}
          subjects={subjects}
          loading={loading}
          onChange={load}
        />
      )}
      {section === 'edt' && (
        <SchedulesCatalog items={schedules} assignments={assignments} loading={loading} onChange={load} />
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
