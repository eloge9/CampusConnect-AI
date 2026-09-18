import { useState } from 'react'
import { Icons } from './icons'
import { Shell } from './layout'
import { useUi } from './ui'

const HOMEWORK = [
  {
    title: 'Rendu de Projet : Analyseur Lexical',
    meta: 'Théorie des Langages & Compilation · Travail d’Équipe',
    when: 'Demain, 23:59',
    tone: 'danger' as const,
  },
  {
    title: 'Examen : Évaluation de Base de Données NoSQL',
    meta: 'Bases de données avancées · Contrôle sur Moodle',
    when: 'Jeudi 17 Avril',
    tone: 'warning' as const,
  },
  {
    title: 'Exercice pratique : Requêtes Réseau Rest Client',
    meta: 'Développement Web & APIs · Individuel',
    when: 'Lundi 21 Avril',
    tone: 'accent' as const,
  },
]

export function StudentDashboard() {
  const { modal, toast } = useUi()
  const [claim, setClaim] = useState<'idle' | 'mine' | 'no'>('idle')
  const [aiInput, setAiInput] = useState('')
  const [thread, setThread] = useState<{ from: 'ai' | 'me'; text: string }[]>([
    {
      from: 'ai',
      text: 'Bonjour Alexandre, j’ai préparé une fiche de révision à partir du dernier cours de Compilation. Tu as aussi un devoir à rendre demain. Comment puis-je t’aider ?',
    },
  ])
  const [notifsOpen, setNotifsOpen] = useState(false)

  const ask = (text: string) => {
    const q = text.trim()
    if (!q) return
    const lower = q.toLowerCase()
    let answer = 'Je peux t’aider sur tes cours, salles et devoirs CampusConnect. Reformule ta question si besoin.'
    if (lower.includes('compilation') || lower.includes('résumer')) {
      answer =
        'Résumé Compilation : analyse lexicale, tokens, expressions régulières. Relis le polycopié avant le rendu de demain 23:59.'
    } else if (lower.includes('salle') || lower.includes('classe')) {
      answer = 'Ta prochaine salle : Amphi Alan Turing (Bâtiment C, 2e étage), 10:00 – 11:30.'
    }
    setThread((t) => [...t, { from: 'me', text: q }, { from: 'ai', text: answer }])
    setAiInput('')
  }

  return (
    <Shell
      role="student"
      search="Rechercher un cours, un document, une salle..."
      extra={
        <div className="top-meta">
          <div className="status-ok">
            <span className="dot" />
            Services OK
          </div>
          <button
            className="icon-btn"
            type="button"
            aria-label="Notifications"
            onClick={() => setNotifsOpen((v) => !v)}
          >
            <Icons.bell size={16} />
          </button>
          <div className="date-block">
            <strong>Mardi 15 Avril 2025</strong>
            <span>Semaine 15 · Semestre 2</span>
          </div>
        </div>
      }
    >
      {({ section, query, go }) => {
        const q = query.trim().toLowerCase()
        const match = (text: string) => !q || text.toLowerCase().includes(q)
        const showDash = section === 'dash'
        const showMain = showDash || section === 'time' || section === 'exams' || section === 'msg'
        const showSide = notifsOpen || showDash || section === 'ai' || section === 'lost'

        return (
          <div className="nx-page">
            {(showDash || section === 'courses') && (
              <>
                <header className="nx-header" id="sec-dash">
                  <h1>Ravi de vous revoir, Alexandre !</h1>
                  <p>
                    Vos serveurs de compilation tournent actuellement. Votre moyenne actuelle est
                    stable. L’assistant IA a analysé 3 nouveaux documents de cours pour vous
                    aujourd’hui.
                  </p>
                </header>
                <div className="nx-stats">
                  <article className="card nx-stat">
                    <span className="nx-stat-ico">
                      <Icons.book size={18} />
                    </span>
                    <strong className="nx-stat-val">14,8/20</strong>
                    <span className="nx-stat-lbl">Moyenne Générale</span>
                  </article>
                  <article className="card nx-stat">
                    <span className="nx-stat-ico">
                      <Icons.check size={18} />
                    </span>
                    <strong className="nx-stat-val success">96.2%</strong>
                    <span className="nx-stat-lbl">Taux de Présence</span>
                  </article>
                  <article className="card nx-stat">
                    <span className="nx-stat-ico">
                      <Icons.grad size={18} />
                    </span>
                    <strong className="nx-stat-val">14 / 30</strong>
                    <span className="nx-stat-lbl">Crédits ECTS Acquis</span>
                  </article>
                </div>
              </>
            )}

            {(showMain || showSide) && (
            <div className="nx-split">
              {showMain && (
              <div className="nx-main">
                {(showDash || section === 'time') && (
                  <article className="card" id="sec-time">
                    <div className="card-h">
                      <h2>
                        <Icons.clock size={16} /> Prochain cours
                      </h2>
                    </div>
                    <div className="chip navy">CM · INFORMATIQUE</div>{' '}
                    <span className="chip info">Dans 25 min</span>
                    <h3 className="course-title">Intelligence Artificielle & Réseaux de Neurones</h3>
                    <div className="meta-row">
                      <span>
                        <Icons.clock size={14} /> 10:00 – 11:30
                      </span>
                      <span>
                        <Icons.map size={14} /> Amphi Alan Turing (Bâtiment C, 2e étage)
                      </span>
                      <span>
                        <Icons.user size={14} /> Prof. Jean-Marc Lecoq
                      </span>
                    </div>
                    <p className="hint">
                      <Icons.check size={14} /> Diapositives de cours pré-téléchargées par l’assistant
                      IA.
                    </p>
                  </article>
                )}

                {(showDash || section === 'exams') && (
                  <article className="card" id="sec-exams">
                    <div className="card-h">
                      <h2>Devoirs et Examens à venir</h2>
                      <button className="link" type="button" onClick={() => go('exams')}>
                        Voir le calendrier
                      </button>
                    </div>
                    {HOMEWORK.filter((h) => match(h.title + h.meta)).map((h) => (
                      <button
                        className="homework as-btn nx-row"
                        type="button"
                        key={h.title}
                        onClick={() =>
                          modal({
                            title: h.title,
                            body: (
                              <p>
                                {h.meta}. Échéance : {h.when}.
                              </p>
                            ),
                            confirm: 'Ouvrir le sujet',
                            onConfirm: () => toast(`Sujet ouvert : ${h.title}`),
                          })
                        }
                      >
                        <span className={`icon-wrap ${h.tone === 'accent' ? 'accent' : h.tone}`}>
                          <Icons.file size={15} />
                        </span>
                        <div>
                          <h4>{h.title}</h4>
                          <p>{h.meta}</p>
                        </div>
                        <div
                          className="when"
                          style={{ color: h.tone === 'accent' ? 'var(--navy)' : `var(--${h.tone})` }}
                        >
                          {h.when}
                        </div>
                      </button>
                    ))}
                  </article>
                )}

                {showDash && (
                  <article className="card">
                    <div className="card-h">
                      <h2>Dernières annonces du campus</h2>
                      <button
                        className="link"
                        type="button"
                        onClick={() => toast('Toutes les annonces sont affichées ci-dessous.')}
                      >
                        Voir toutes les annonces
                      </button>
                    </div>
                    <div className="ann">
                      <div className="kicker">
                        <span>ADMINISTRATION</span>
                        <span style={{ fontWeight: 500, letterSpacing: 0 }}>Hier à 14:30</span>
                      </div>
                      <h4>Campagne d’évaluation des enseignements du second semestre ouverte</h4>
                      <p>
                        Plus qu’une semaine ! Prenez 5 minutes sur votre espace personnel pour
                        évaluer la pertinence de vos modules.
                      </p>
                    </div>
                    <div className="ann">
                      <div className="kicker">
                        <span>RECRUTEMENT & STAGES</span>
                        <span style={{ fontWeight: 500, letterSpacing: 0 }}>Il y a 3j</span>
                      </div>
                      <h4>Forum Tech & Alternance du CampusConnect - 25 Mai</h4>
                      <p>
                        Plus de 40 entreprises de la tech viennent sur le campus présenter leurs
                        futurs alternants pour la rentrée de Septembre. Préparez vos CV !
                      </p>
                    </div>
                  </article>
                )}

                {section === 'msg' && (
                  <article className="card" id="sec-msg">
                    <div className="card-h">
                      <h2>Messagerie & Groupes</h2>
                    </div>
                    {['L3 Informatique · Gr. A', 'Projet Compilation', 'Administration'].map((g) => (
                      <button
                        className="quick"
                        type="button"
                        key={g}
                        onClick={() => toast(`Conversation « ${g} » ouverte.`)}
                      >
                        <span className="icon-wrap accent">
                          <Icons.message size={15} />
                        </span>
                        <span>
                          <strong>{g}</strong>
                          <span>Dernier message aujourd’hui</span>
                        </span>
                      </button>
                    ))}
                  </article>
                )}
              </div>
              )}

              {showSide && (
              <div className="nx-side">
                {notifsOpen && (
                  <article className="card">
                    <h2>Notifications</h2>
                    <p className="nx-muted">
                      3 notifications non lues — CC décalé, note Graphes, nouveau polycopié.
                    </p>
                  </article>
                )}

                {showDash && (
                  <article className="card">
                    <div className="card-h">
                      <h2>
                        <Icons.bell size={16} /> Notifications prioritaires
                      </h2>
                    </div>
                    <div className="nx-activity">
                      <div className="nx-activity-item">
                        <span className="chip warning">
                          <Icons.alert size={12} />
                        </span>
                        <div>
                          <strong>Contrôle continu décalé</strong>
                          <p>Le CC de Compilation est décalé au Vendredi 18 Avril.</p>
                        </div>
                      </div>
                      <div className="nx-activity-item">
                        <span className="chip success">
                          <Icons.check size={12} />
                        </span>
                        <div>
                          <strong>Note disponible</strong>
                          <p>Projet Algorithmique de Graphes : 17/20 (Top 12%)</p>
                        </div>
                      </div>
                      <div className="nx-activity-item">
                        <span className="chip info">
                          <Icons.file size={12} />
                        </span>
                        <div>
                          <strong>Nouveau support de cours</strong>
                          <p>Le polycopié d’Architecture Système est en ligne.</p>
                        </div>
                      </div>
                    </div>
                  </article>
                )}

                {(showDash || section === 'ai') && (
                  <article className="card nx-chat" id="sec-ai">
                    <div className="nx-chat-h">
                      <span className="nx-chat-ava">
                        <Icons.spark size={16} />
                      </span>
                      <div>
                        <h2>Assistant IA Campus</h2>
                        <span className="chip success">
                          <span className="dot" /> EN LIGNE
                        </span>
                      </div>
                    </div>
                    <div className="nx-chat-thread">
                      {thread.map((m, i) => (
                        <div key={i} className={`nx-bubble ${m.from === 'me' ? 'me' : 'ai'}`}>
                          {m.text}
                          {i === 0 && m.from === 'ai' && (
                            <span className="time">Aujourd’hui · 08:34</span>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      className="suggest"
                      type="button"
                      onClick={() => ask('Résumer le cours de Compilation d’hier')}
                    >
                      Résumer le cours de Compilation d’hier
                    </button>
                    <button
                      className="suggest"
                      type="button"
                      onClick={() => ask('Quelle est ma prochaine salle de classe ?')}
                    >
                      Quelle est ma prochaine salle de classe ?
                    </button>
                    <form
                      className="ai-input"
                      onSubmit={(e) => {
                        e.preventDefault()
                        ask(aiInput)
                      }}
                    >
                      <input
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        placeholder="Posez une question à l’IA..."
                      />
                      <button className="send" type="submit" aria-label="Envoyer">
                        <Icons.send />
                      </button>
                    </form>
                  </article>
                )}

                {(showDash || section === 'lost') && (
                  <article className="card" id="sec-lost">
                    <div className="card-h">
                      <h2>Correspondance IA Potentielle</h2>
                    </div>
                    {claim === 'idle' ? (
                      <>
                        <p className="nx-muted">
                          Un nouvel objet correspondant potentiellement à votre déclaration a été
                          déposé. Voulez-vous vérifier s’il s’agit du vôtre ?
                        </p>
                        <div className="found-item">
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                            <h4>Clé USB SanDisk 64Go</h4>
                            <span className="chip success">FIABILITÉ 88%</span>
                          </div>
                          <p>Trouvée ce matin au Foyer Turing. Coque plastique rouge/noire.</p>
                        </div>
                        <div className="actions-row">
                          <button
                            className="btn btn-accent"
                            type="button"
                            style={{ flex: 1 }}
                            onClick={() => {
                              setClaim('mine')
                              toast('Demande de restitution enregistrée.')
                            }}
                          >
                            C’est la mienne !
                          </button>
                          <button className="btn btn-ghost" type="button" onClick={() => setClaim('no')}>
                            Non
                          </button>
                        </div>
                      </>
                    ) : (
                      <p style={{ fontSize: 13, color: 'var(--navy)' }}>
                        {claim === 'mine'
                          ? 'Demande envoyée. Présentez-vous au foyer Turing avec une pièce d’identité.'
                          : 'Objet ignoré. L’alerte est retirée de votre fil.'}
                      </p>
                    )}
                  </article>
                )}

                {showDash && (
                  <article className="card">
                    <div className="card-h">
                      <h2>Actions rapides</h2>
                    </div>
                    <div className="nx-quick-stack">
                      <button
                        className="quick"
                        type="button"
                        onClick={() =>
                          modal({
                            title: 'Déclarer une absence',
                            body: (
                              <p>
                                Un justificatif médical/administratif sera généré pour le 15 avril
                                2025.
                              </p>
                            ),
                            confirm: 'Déclarer',
                            onConfirm: () =>
                              toast('Absence déclarée. Dossier transmis au secrétariat.'),
                          })
                        }
                      >
                        <span className="icon-wrap danger">
                          <Icons.alert size={15} />
                        </span>
                        <span>
                          <strong>Déclarer une absence</strong>
                          <span>Générer un justificatif médical/administratif</span>
                        </span>
                      </button>
                      <button
                        className="quick"
                        type="button"
                        onClick={() => {
                          go('lost')
                          toast('Formulaire objet perdu ouvert.')
                        }}
                      >
                        <span className="icon-wrap warning">
                          <Icons.search size={15} />
                        </span>
                        <span>
                          <strong>Signaler un objet perdu</strong>
                          <span>Déclarer un objet pour lancer l’IA de recherche</span>
                        </span>
                      </button>
                      <button
                        className="quick"
                        type="button"
                        onClick={() =>
                          modal({
                            title: 'Demander un document',
                            body: (
                              <p>Certificat de scolarité ou bulletin de notes — génération sous 24h.</p>
                            ),
                            confirm: 'Demander',
                            onConfirm: () => toast('Demande de document enregistrée.'),
                          })
                        }
                      >
                        <span className="icon-wrap accent">
                          <Icons.file size={15} />
                        </span>
                        <span>
                          <strong>Demander un document</strong>
                          <span>Certificat de scolarité, bulletin de notes</span>
                        </span>
                      </button>
                    </div>
                  </article>
                )}
              </div>
              )}
            </div>
            )}
          </div>
        )
      }}
    </Shell>
  )
}
