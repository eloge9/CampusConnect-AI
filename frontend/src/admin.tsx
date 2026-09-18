import { useState } from 'react'
import { Outlet, useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import { Card, CardHeader } from './components/Card'
import { DataTable } from './components/DataTable'
import { Widget } from './components/Widget'
import { Icons } from './icons'
import { Shell } from './layout'
import { useUi } from './ui'

type AbsenceStatus = 'pending' | 'accepted' | 'rejected'
type AdminOutlet = { section: string; query: string }

/** Occupancy mock — brancher plus tard (websocket / polling API). */
const ACTIVE_USERS_COUNT = 312

export function AdminLayout() {
  const { modal, toast } = useUi()
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <Shell
      role="admin"
      search="Supervision temps réel, état des données, IA..."
      onSectionChange={() => {
        if (location.pathname !== '/admin') navigate('/admin')
      }}
      extra={
        <div className="top-meta">
          <button
            className="top-cta"
            type="button"
            onClick={() =>
              modal({
                title: 'Ajouter / Inviter des comptes',
                body: (
                  <p>
                    Un e-mail d’invitation sera envoyé à l’adresse institutionnelle du nouveau
                    compte.
                  </p>
                ),
                confirm: 'Envoyer l’invitation',
                onConfirm: () => toast('Invitation envoyée.'),
              })
            }
          >
            + Ajouter/Inviter Comptes
          </button>
        </div>
      }
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
  const [notified, setNotified] = useState(false)
  const [absences, setAbsences] = useState<Record<string, AbsenceStatus>>({
    dubois: 'pending',
    mercier: 'accepted',
  })
  const [checked, setChecked] = useState<Record<string, boolean>>({
    dubois: false,
    mercier: true,
  })
  const q = query.trim().toLowerCase()
  const showDash = section === 'sup' || section === 'dash'
  const showDubois = !q || 'alexandre dubois'.includes(q)
  const showMercier = !q || 'camille mercier'.includes(q)

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
                    title="Disponibilité de l’IA (SLA)"
                    subtitle="99.98%"
                    to="/admin/supervision/disponibilite"
                  />
                  <Widget
                    icon={<Icons.users size={20} />}
                    title="Utilisateurs actifs en ce moment"
                    subtitle={
                      <span className="widget-value-row">
                        {ACTIVE_USERS_COUNT} connectés
                        <span className="live-pill">
                          <span className="dot live" aria-hidden="true" />
                          en direct
                        </span>
                      </span>
                    }
                    to="/admin/supervision/utilisateurs-actifs"
                  />
                  <Widget
                    icon={<Icons.shield size={20} />}
                    title="Grâce à la supervision prédictive"
                    subtitle="4 pannes réseau évitées"
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
                  title="Validation des Demandes d’Absence (IA OCR Avaja)"
                  columns={['', 'Étudiant', 'Justificatif', 'Date', 'Action']}
                >
                  {showDubois && (
                    <tr>
                      <td>
                        <input
                          type="checkbox"
                          checked={checked.dubois}
                          onChange={(e) => setChecked((s) => ({ ...s, dubois: e.target.checked }))}
                          aria-label="Sélectionner Alexandre Dubois"
                        />
                      </td>
                      <td>
                        <strong>Alexandre Dubois</strong>
                        <span className="td-sub">Groupe Informatique</span>
                      </td>
                      <td>
                        <span className="chip warning">Certificat médical illisible</span>
                      </td>
                      <td>14 Avril 2025</td>
                      <td>
                        {absences.dubois === 'pending' ? (
                          <div className="actions-row">
                            <button
                              className="btn btn-accent"
                              type="button"
                              onClick={() =>
                                modal({
                                  title: 'Accepter définitivement',
                                  body: (
                                    <p>
                                      Le justificatif d’Alexandre Dubois sera validé malgré l’OCR
                                      illisible.
                                    </p>
                                  ),
                                  confirm: 'Accepter',
                                  onConfirm: () => {
                                    setAbsences((s) => ({ ...s, dubois: 'accepted' }))
                                    toast('Absence d’Alexandre Dubois acceptée.')
                                  },
                                })
                              }
                            >
                              Accepter définitivement
                            </button>
                            <button
                              className="btn btn-soft-warning"
                              type="button"
                              onClick={() =>
                                modal({
                                  title: 'Rejeter la demande',
                                  body: <p>L’étudiant devra déposer un nouveau justificatif lisible.</p>,
                                  confirm: 'Rejeter',
                                  onConfirm: () => {
                                    setAbsences((s) => ({ ...s, dubois: 'rejected' }))
                                    toast('Demande rejetée.')
                                  },
                                })
                              }
                            >
                              Rejeter
                            </button>
                          </div>
                        ) : (
                          <span
                            className={`chip ${absences.dubois === 'accepted' ? 'success' : 'danger'}`}
                          >
                            {absences.dubois === 'accepted' ? 'Document accepté' : 'Demande rejetée'}
                          </span>
                        )}
                      </td>
                    </tr>
                  )}
                  {showMercier && (
                    <tr>
                      <td>
                        <input
                          type="checkbox"
                          checked={checked.mercier}
                          onChange={(e) => setChecked((s) => ({ ...s, mercier: e.target.checked }))}
                          aria-label="Sélectionner Camille Mercier"
                        />
                      </td>
                      <td>
                        <strong>Camille Mercier</strong>
                        <span className="td-sub">Filière Informatique</span>
                      </td>
                      <td>
                        <span className="chip success">Attestation familiale</span>
                      </td>
                      <td>14 Avril 2025</td>
                      <td>
                        <button
                          className="btn btn-soft-success"
                          type="button"
                          onClick={() => toast('Dossier déjà validé.')}
                        >
                          Document accepté
                        </button>
                      </td>
                    </tr>
                  )}
                </DataTable>

                {showDash && (
                  <Card extra="task-card">
                    <CardHeader
                      title="Statut Index & RAG IA"
                      action={<span className="chip success">Indexation RAG OK</span>}
                    />
                    <p className="task-lead">
                      Base vectorielle synchronisée, 845 nouveaux documents de cours indexés. 0
                      échec depuis hier.
                    </p>
                    <div className="chip success" style={{ marginTop: 12 }}>
                      Indexation RAG IA 100% ce trimestre
                    </div>
                    <p className="task-meta">Latence de recherche moyenne : 42ms</p>
                  </Card>
                )}
              </div>
            )}

            {(showDash || section === 'lost') && (
              <div className="hz-row-2">
                <DataTable
                  id="sec-lost"
                  title="Modération Objets Trouvés"
                  columns={['Objet', 'Statut', 'Description', 'Action']}
                >
                  <tr>
                    <td>
                      <strong>Casque Audio Bose QC45</strong>
                    </td>
                    <td>
                      <span className="chip success">Confiance 92%</span>
                    </td>
                    <td className="td-desc">
                      Perdu au foyer du campus, décrit par un étudiant comme « noir, coussinets cuir,
                      câble USB-C inclus ».
                    </td>
                    <td>
                      <button
                        className={`btn ${notified ? 'btn-soft-success' : 'btn-accent'}`}
                        type="button"
                        disabled={notified}
                        onClick={() =>
                          modal({
                            title: 'Déclencher une notification',
                            body: (
                              <p>
                                Une alerte sera envoyée à l’étudiant déclarant et affichée sur le fil
                                Objets trouvés.
                              </p>
                            ),
                            confirm: 'Notifier',
                            onConfirm: () => {
                              setNotified(true)
                              toast('Notification déclenchée.')
                            },
                          })
                        }
                      >
                        {notified ? 'Notification envoyée' : 'Déclencher Notification'}
                      </button>
                    </td>
                  </tr>
                </DataTable>
              </div>
            )}

            {section === 'users' && (
              <DataTable
                id="sec-users"
                title="Comptes Utilisateurs"
                columns={['Compte', 'Statut', 'Action']}
              >
                {[
                  'Alexandre Dubois — Étudiant',
                  'Christine Roche — Enseignante',
                  'Stéphane Duchêne — Admin',
                ].map((u) => (
                  <tr key={u}>
                    <td>
                      <strong>{u}</strong>
                    </td>
                    <td>
                      <span className="chip success">Compte actif</span>
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost"
                        type="button"
                        onClick={() => toast(`Fiche ouverte : ${u}`)}
                      >
                        Voir
                      </button>
                    </td>
                  </tr>
                ))}
              </DataTable>
            )}

            {section === 'audit' && (
              <Card id="sec-audit">
                <CardHeader title="Audit Trail" />
                <div className="ann">
                  <h4>08:12 — Indexation RAG</h4>
                  <p>845 documents synchronisés, 0 échec.</p>
                </div>
                <div className="ann">
                  <h4>07:55 — Supervision réseau</h4>
                  <p>4 pannes évitées par prédiction de charge.</p>
                </div>
              </Card>
            )}
          </div>
  )
}
