import { useState } from 'react'
import { Icons } from './icons'
import { Shell } from './layout'
import { useUi } from './ui'

const CLASSES: [string, string][] = [
  ['L3 Informatique · Gr. A', '96.2%'],
  ['L3 Informatique · Gr. B', '94.8%'],
  ['M1 IA & Datascience', '89.4%'],
]

/** Effectifs mock — brancher plus tard sur le SI scolarité. */
const totalStudents = 108

function Assistant({
  greeting,
  suggestions,
}: {
  greeting: string
  suggestions: string[]
}) {
  const [input, setInput] = useState('')
  const [thread, setThread] = useState<{ from: 'ai' | 'me'; text: string }[]>([
    { from: 'ai', text: greeting },
  ])

  const ask = (text: string) => {
    const q = text.trim()
    if (!q) return
    const lower = q.toLowerCase()
    let answer =
      'Je m’appuie sur vos cours CampusConnect pour répondre. Précisez une matière ou une salle si besoin.'
    if (lower.includes('compilation') || lower.includes('analyseur')) {
      answer =
        'Fiche Compilation : tokens, analyse lexicale, grammaire LL. Le rendu Analyseur Lexical est attendu demain 23:59.'
    } else if (lower.includes('salle') || lower.includes('classe')) {
      answer = 'Prochain cours : Amphi Alan Turing (Bâtiment C, 2e étage), 10:00 – 11:30.'
    } else if (lower.includes('copie') || lower.includes('note')) {
      answer = 'Dernière note indexée : Projet Graphes 17/20. 12 copies restent à évaluer.'
    }
    setThread((t) => [...t, { from: 'me', text: q }, { from: 'ai', text: answer }])
    setInput('')
  }

  return (
    <article className="card ai-card" id="sec-ai">
      <div className="card-h">
        <h2>
          <Icons.spark size={16} /> Assistant IA Enseignant
        </h2>
        <span className="chip success">
          <span className="dot" /> EN LIGNE
        </span>
      </div>
      <div className="ai-thread">
        {thread.map((m, i) => (
          <div key={i} className={`bubble ${m.from === 'me' ? 'me' : ''}`}>
            {m.text}
          </div>
        ))}
      </div>
      {suggestions.map((s) => (
        <button className="suggest" type="button" key={s} onClick={() => ask(s)}>
          {s}
        </button>
      ))}
      <form
        className="ai-input"
        onSubmit={(e) => {
          e.preventDefault()
          ask(input)
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Posez une question à l’IA..."
        />
        <button className="send" type="submit" aria-label="Envoyer">
          <Icons.send />
        </button>
      </form>
    </article>
  )
}

function ClassBars({ items }: { items: [string, string][] }) {
  return (
    <>
      {items.map(([name, pct]) => (
        <div className="spark-progress" key={name}>
          <div className="spark-progress-lab">
            <strong>{name}</strong>
            <span>
              Présence <b>{pct}</b>
            </span>
          </div>
          <div className="track">
            <div className="fill" style={{ width: pct }} />
          </div>
        </div>
      ))}
    </>
  )
}

export function TeacherDashboard() {
  const { modal, toast } = useUi()
  const [moved, setMoved] = useState(false)
  const [roomFlagged, setRoomFlagged] = useState(false)
  const [announce, setAnnounce] = useState(
    "Rappel à tous, les notes du projet d’architecture ont été publiées sur votre espace. Vous pouvez consulter les détails.",
  )
  const [published, setPublished] = useState(false)

  return (
    <Shell
      role="teacher"
      search="Chercher un étudiant, une note, un cours..."
      extra={
        <div className="top-meta">
          <span className="chip success">Espace Enseignant Actif</span>
          <div className="date-block">
            <strong>Mardi 15 Avril 2025</strong>
            <span>Espace Enseignant · Semestre 2</span>
          </div>
        </div>
      }
    >
      {({ section, query }) => {
        const q = query.trim().toLowerCase()
        const match = (text: string) => !q || text.toLowerCase().includes(q)

        return (
          <div className="spark-page">
            {(section === 'dash' || section === 'agenda') && (
              <>
                {section === 'dash' && (
                  <>
                    <header className="spark-header" id="sec-dash">
                      <h1>Espace Pédagogique — Bonjour Christine Roche !</h1>
                    </header>
                    <div className="spark-stats">
                      <article className="card spark-stat">
                        <span className="stat-label">Moyenne générale</span>
                        <strong className="stat-value">15.4/20</strong>
                      </article>
                      <article className="card spark-stat">
                        <span className="stat-label">Étudiants inscrits</span>
                        <strong className="stat-value">{totalStudents}</strong>
                      </article>
                      <article className="card spark-stat">
                        <span className="stat-label">Présence moyenne</span>
                        <strong className="stat-value success">94%</strong>
                      </article>
                    </div>
                  </>
                )}

                <div className="spark-split">
                  <div className="spark-main">
                    <article className="card" id="sec-agenda">
                      <div className="card-h">
                        <h2>Gestion des Cours & Changements d’Emploi du Temps</h2>
                        <button
                          className="link"
                          type="button"
                          onClick={() =>
                            modal({
                              title: 'Historique des aménagements',
                              body: (
                                <ul className="modal-list">
                                  <li>12 Avril — CM Compilation déplacé (salle Turing)</li>
                                  <li>03 Avril — TD Graphes avancé d’une heure</li>
                                </ul>
                              ),
                            })
                          }
                        >
                          Historique des aménagements →
                        </button>
                      </div>
                      {match('Théorie des Langages Compilation') && (
                        <div className="spark-item">
                          <span className="icon-wrap warning">
                            <Icons.clock size={15} />
                          </span>
                          <div className="spark-item-copy">
                            <h4>Déplacer le Cours : Théorie des Langages & Compilation</h4>
                            <p>
                              {moved
                                ? 'Nouveau créneau : Vendredi 14h00 · Amphithéâtre Turing'
                                : 'L3 Informatique · Gr. A · CM · Amphithéâtre Turing'}
                            </p>
                          </div>
                          <button
                            className={`btn cta ${moved ? 'btn-soft-success' : 'btn-accent'}`}
                            type="button"
                            disabled={moved}
                            onClick={() =>
                              modal({
                                title: 'Confirmer le déplacement',
                                body: (
                                  <p>
                                    Le CM Théorie des Langages & Compilation sera déplacé au vendredi
                                    14h00. Les étudiants du Gr. A seront notifiés.
                                  </p>
                                ),
                                confirm: 'Confirmer',
                                onConfirm: () => {
                                  setMoved(true)
                                  toast('Cours déplacé au vendredi 14h00. Notification envoyée.')
                                },
                              })
                            }
                          >
                            {moved ? 'Cours déplacé' : 'Déplacer au Vendredi 14h00'}
                          </button>
                        </div>
                      )}
                      {match('Changement de Salle Turing') && (
                        <div className="spark-item">
                          <span className="icon-wrap warning">
                            <Icons.alert size={15} />
                          </span>
                          <div className="spark-item-copy">
                            <h4>Signaler un Changement de Salle Exceptionnel</h4>
                            <p>Salle Turing saturée, besoin d’une plus grande</p>
                          </div>
                          <button
                            className={`btn cta ${roomFlagged ? 'btn-soft-success' : 'btn-soft-warning'}`}
                            type="button"
                            disabled={roomFlagged}
                            onClick={() =>
                              modal({
                                title: 'Signaler la salle 302',
                                body: (
                                  <p>
                                    Un changement exceptionnel vers la salle 302 sera transmis à
                                    l’administration et aux étudiants.
                                  </p>
                                ),
                                confirm: 'Signaler',
                                onConfirm: () => {
                                  setRoomFlagged(true)
                                  toast('Changement de salle 302 signalé.')
                                },
                              })
                            }
                          >
                            {roomFlagged ? 'Salle 302 signalée' : 'Signaler (salle 302)'}
                          </button>
                        </div>
                      )}
                    </article>

                    {section === 'dash' && (
                      <article className="card">
                        <div className="card-h">
                          <h2>Publication d’Annonces & Notifications de Classe</h2>
                        </div>
                        <p className="muted-label">RÉDIGER UN MESSAGE POUR LES ÉTUDIANTS</p>
                        <textarea
                          className="textarea"
                          value={announce}
                          onChange={(e) => {
                            setAnnounce(e.target.value)
                            setPublished(false)
                          }}
                        />
                        <div className="spark-actions">
                          <button
                            className={`btn ${published ? 'btn-soft-success' : 'btn-accent'}`}
                            type="button"
                            onClick={() => {
                              if (!announce.trim()) {
                                toast('Le message ne peut pas être vide.')
                                return
                              }
                              setPublished(true)
                              toast('Annonce campus publiée.')
                            }}
                          >
                            {published ? 'Annonce publiée' : 'Publier l’Annonce Campus'}
                          </button>
                        </div>
                      </article>
                    )}
                  </div>

                  <div className="spark-side">
                    {section === 'dash' && (
                      <Assistant
                        greeting="Bonjour Mme Roche, j’ai analysé les résultats du dernier examen de Compilation : 85% de la classe a réussi. Voulez-vous que je génère un exercice ciblé ?"
                        suggestions={[
                          'Générer un exercice de rattrapage « Analyseur Syntaxique »',
                          'Extraire un extrait de tes 3 meilleurs copies à fêter',
                        ]}
                      />
                    )}
                    <article className="card" id="sec-classes">
                      <div className="card-h">
                        <h2>Aperçu des Classes</h2>
                      </div>
                      <ClassBars items={CLASSES.filter(([name]) => match(name))} />
                    </article>
                  </div>
                </div>
              </>
            )}

            {section === 'classes' && (
              <article className="card" id="sec-classes">
                <div className="card-h">
                  <h2>Gestion des Classes</h2>
                </div>
                <ClassBars items={CLASSES} />
              </article>
            )}

            {section === 'exams' && (
              <article className="card" id="sec-exams">
                <div className="card-h">
                  <h2>Examens & Notes</h2>
                  <span className="badge info">12 copies</span>
                </div>
                <p className="spark-lead">
                  Copies en attente d’évaluation — Compilation et bases de données.
                </p>
                {['Analyseur Lexical', 'NoSQL — contrôle Moodle', 'Requêtes Réseau'].map((item) => (
                  <div className="spark-item" key={item}>
                    <span className="icon-wrap accent">
                      <Icons.clipboard size={15} />
                    </span>
                    <div className="spark-item-copy">
                      <h4>{item}</h4>
                      <p>À corriger</p>
                    </div>
                    <button
                      className="btn btn-accent"
                      type="button"
                      onClick={() => toast(`Ouverture du paquet : ${item}`)}
                    >
                      Ouvrir
                    </button>
                  </div>
                ))}
              </article>
            )}

            {section === 'admin' && (
              <article className="card" id="sec-admin">
                <div className="card-h">
                  <h2>Messages de l’Admin</h2>
                </div>
                <div className="ann">
                  <div className="kicker">
                    <span>ADMINISTRATION</span>
                    <span>Hier à 14:30</span>
                  </div>
                  <h4>Campagne d’évaluation des enseignements du second semestre ouverte</h4>
                  <p>Merci de relayer l’information à vos groupes.</p>
                </div>
                <button className="btn btn-accent" type="button" onClick={() => toast('Message marqué comme lu.')}>
                  Marquer comme lu
                </button>
              </article>
            )}
          </div>
        )
      }}
    </Shell>
  )
}
