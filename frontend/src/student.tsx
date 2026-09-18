import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  api,
  formatDate,
  formatTime,
  formatWhen,
  fullName,
  scheduleStart,
  type Announcement,
  type Assignment,
  type Conversation,
  type Exam,
  type Notification,
  type PotentialMatch,
  type Schedule,
} from './api'
import { useAuth } from './auth'
import { Icons } from './icons'
import { Shell } from './layout'
import { useUi } from './ui'

export function StudentDashboard() {
  const { user } = useAuth()
  const { modal, toast } = useUi()
  const [aiInput, setAiInput] = useState('')
  const [thread, setThread] = useState<{ from: 'ai' | 'me'; text: string }[]>([])
  const [notifsOpen, setNotifsOpen] = useState(false)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [matches, setMatches] = useState<PotentialMatch[]>([])
  const [health, setHealth] = useState(false)

  const load = useCallback(async () => {
    try {
      const [sante, anns, seances, devoirs, examens, notifs, convos, objets] = await Promise.all([
        api<{ status: string }>('/sante').catch(() => ({ status: 'down' })),
        api<Announcement[]>('/annonces'),
        api<Schedule[]>('/emploi-du-temps'),
        api<Assignment[]>('/devoirs?a_venir=true'),
        api<Exam[]>('/examens?a_venir=true'),
        api<Notification[]>('/notifications'),
        api<Conversation[]>('/conversations'),
        api<{ id: number; item_type: string; reporter: { id: number } }[]>(
          '/objets-perdus-trouves',
        ),
      ])
      setHealth(sante.status === 'ok')
      setAnnouncements(anns)
      setSchedules(seances)
      setAssignments(devoirs)
      setExams(examens)
      setNotifications(notifs)
      setConversations(convos)
      const lostIds = objets
        .filter((o) => o.item_type === 'PERDU' && o.reporter.id === user?.id)
        .map((o) => o.id)
      const found = await Promise.all(
        lostIds.map((id) =>
          api<PotentialMatch[]>(`/objets-perdus-trouves/${id}/correspondances`).catch(() => []),
        ),
      )
      setMatches(found.flat().filter((m) => m.status === 'PROPOSEE'))
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Chargement API impossible.')
    }
  }, [toast, user?.id])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!user) return
    setThread([
      {
        from: 'ai',
        text: `Bonjour ${user.first_name}, pose-moi une question sur tes cours, devoirs, examens, absences ou objets perdus.`,
      },
    ])
  }, [user])

  const nextCourse = useMemo(() => {
    const now = Date.now()
    return [...schedules]
      .filter((s) => s.status !== 'ANNULE' && scheduleStart(s).getTime() >= now)
      .sort((a, b) => scheduleStart(a).getTime() - scheduleStart(b).getTime())[0]
  }, [schedules])

  const homework = useMemo(
    () => [
      ...assignments.map((a) => ({
        key: `a-${a.id}`,
        title: a.title,
        meta: `${a.affectation.subject.name} · ${a.affectation.classe.name}`,
        when: formatWhen(a.due_date),
        tone: 'danger' as const,
        body: a.description || 'Devoir à rendre.',
      })),
      ...exams.map((e) => ({
        key: `e-${e.id}`,
        title: e.title,
        meta: `${e.affectation.subject.name} · ${e.room}`,
        when: `${formatDate(e.exam_date)} · ${formatTime(e.start_time)}`,
        tone: 'warning' as const,
        body: e.description || `Examen en salle ${e.room}.`,
      })),
    ],
    [assignments, exams],
  )

  const ask = async (text: string) => {
    const q = text.trim()
    if (!q) return
    setThread((t) => [...t, { from: 'me', text: q }])
    setAiInput('')
    try {
      const res = await api<{ answer: string }>('/assistant/question', {
        method: 'POST',
        body: JSON.stringify({ question: q }),
      })
      setThread((t) => [...t, { from: 'ai', text: res.answer }])
    } catch (err) {
      setThread((t) => [
        ...t,
        { from: 'ai', text: err instanceof Error ? err.message : 'Assistant indisponible.' },
      ])
    }
  }

  const declareAbsence = () => {
    const session = nextCourse ?? schedules[0]
    if (!session) {
      toast('Aucun cours en base pour rattacher une absence.')
      return
    }
    modal({
      title: 'Déclarer une absence',
      body: (
        <p>
          Absence pour {session.affectation.subject.name} le {formatDate(session.session_date)} (
          {formatTime(session.start_time)} – {formatTime(session.end_time)}).
        </p>
      ),
      confirm: 'Déclarer',
      onConfirm: () => {
        void (async () => {
          try {
            await api('/absences', {
              method: 'POST',
              body: JSON.stringify({
                schedule_id: session.id,
                reason: 'Absence déclarée depuis l’espace étudiant.',
              }),
            })
            toast('Absence déclarée.')
            await load()
          } catch (err) {
            toast(err instanceof Error ? err.message : 'Déclaration impossible.')
          }
        })()
      },
    })
  }

  const declareLost = () => {
    modal({
      title: 'Signaler un objet perdu',
      body: (
        <p>
          Une déclaration « objet perdu » sera créée (campus, aujourd’hui) pour lancer la
          correspondance IA.
        </p>
      ),
      confirm: 'Déclarer',
      onConfirm: () => {
        void (async () => {
          try {
            await api('/objets-perdus-trouves', {
              method: 'POST',
              body: JSON.stringify({
                item_type: 'PERDU',
                title: 'Objet perdu',
                description: 'Déclaration depuis l’espace étudiant.',
                location: 'Campus',
                item_date: new Date().toISOString().slice(0, 10),
              }),
            })
            toast('Objet perdu déclaré.')
            await load()
          } catch (err) {
            toast(err instanceof Error ? err.message : 'Déclaration impossible.')
          }
        })()
      },
    })
  }

  const firstMatch = matches[0]

  return (
    <Shell
      role="student"
      search="Rechercher un cours, un document, une salle..."
      extra={
        <div className="top-meta">
          <div className="status-ok">
            <span className="dot" />
            {health ? 'API OK' : 'API hors ligne'}
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
            <strong>{new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full' }).format(new Date())}</strong>
            <span>Espace étudiant</span>
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
        const filteredHomework = homework.filter((h) => match(h.title + h.meta))
        const filteredAnns = announcements.filter((a) => match(a.title + a.content))

        return (
          <div className="nx-page">
            {(showDash || section === 'courses') && (
              <>
                <header className="nx-header" id="sec-dash">
                  <h1>Ravi de vous revoir, {user?.first_name} !</h1>
                  <p>
                    Données chargées depuis l’API CampusConnect. {assignments.length} devoir(s) à
                    venir, {notifications.filter((n) => !n.is_read).length} notification(s) non lue(s).
                  </p>
                </header>
                <div className="nx-stats">
                  <article className="card nx-stat">
                    <span className="nx-stat-ico">
                      <Icons.book size={18} />
                    </span>
                    <strong className="nx-stat-val">{announcements.length}</strong>
                    <span className="nx-stat-lbl">Annonces</span>
                  </article>
                  <article className="card nx-stat">
                    <span className="nx-stat-ico">
                      <Icons.check size={18} />
                    </span>
                    <strong className="nx-stat-val success">{schedules.length}</strong>
                    <span className="nx-stat-lbl">Séances</span>
                  </article>
                  <article className="card nx-stat">
                    <span className="nx-stat-ico">
                      <Icons.grad size={18} />
                    </span>
                    <strong className="nx-stat-val">
                      {assignments.length} / {exams.length}
                    </strong>
                    <span className="nx-stat-lbl">Devoirs / Examens</span>
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
                        {nextCourse ? (
                          <>
                            <div className="chip navy">{nextCourse.affectation.subject.code}</div>{' '}
                            <span className="chip info">{nextCourse.status}</span>
                            <h3 className="course-title">{nextCourse.affectation.subject.name}</h3>
                            <div className="meta-row">
                              <span>
                                <Icons.clock size={14} /> {formatTime(nextCourse.start_time)} –{' '}
                                {formatTime(nextCourse.end_time)}
                              </span>
                              <span>
                                <Icons.map size={14} /> {nextCourse.room}
                              </span>
                              <span>
                                <Icons.user size={14} /> {fullName(nextCourse.affectation.teacher)}
                              </span>
                            </div>
                          </>
                        ) : (
                          <p className="hint">Aucun cours à venir dans l’emploi du temps.</p>
                        )}
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
                        {filteredHomework.length === 0 && (
                          <p className="hint">Aucun devoir ni examen à venir.</p>
                        )}
                        {filteredHomework.map((h) => (
                          <button
                            className="homework as-btn nx-row"
                            type="button"
                            key={h.key}
                            onClick={() =>
                              modal({
                                title: h.title,
                                body: (
                                  <p>
                                    {h.meta}. Échéance : {h.when}. {h.body}
                                  </p>
                                ),
                              })
                            }
                          >
                            <span className={`icon-wrap ${h.tone}`}>
                              <Icons.file size={15} />
                            </span>
                            <div>
                              <h4>{h.title}</h4>
                              <p>{h.meta}</p>
                            </div>
                            <div className="when" style={{ color: `var(--${h.tone})` }}>
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
                        </div>
                        {filteredAnns.length === 0 && <p className="hint">Aucune annonce pour le moment.</p>}
                        {filteredAnns.slice(0, 5).map((a) => (
                          <div className="ann" key={a.id}>
                            <div className="kicker">
                              <span>{a.category.replaceAll('_', ' ')}</span>
                              <span style={{ fontWeight: 500, letterSpacing: 0 }}>
                                {formatWhen(a.created_at)}
                              </span>
                            </div>
                            <h4>{a.title}</h4>
                            <p>{a.content}</p>
                          </div>
                        ))}
                      </article>
                    )}

                    {section === 'msg' && (
                      <article className="card" id="sec-msg">
                        <div className="card-h">
                          <h2>Messagerie</h2>
                        </div>
                        {conversations.length === 0 && (
                          <p className="hint">Aucune conversation. Elles se créent en 1-à-1 via l’API.</p>
                        )}
                        {conversations.map((c) => {
                          const other = c.members.find((m) => m.id !== user?.id) ?? c.members[0]
                          return (
                            <div className="quick" key={c.id}>
                              <span className="icon-wrap accent">
                                <Icons.message size={15} />
                              </span>
                              <span>
                                <strong>{other ? fullName(other) : `Conversation #${c.id}`}</strong>
                                <span>{c.last_message?.content ?? 'Pas encore de message'}</span>
                              </span>
                            </div>
                          )
                        })}
                      </article>
                    )}
                  </div>
                )}

                {showSide && (
                  <div className="nx-side">
                    {notifsOpen && (
                      <article className="card">
                        <h2>Notifications</h2>
                        {notifications.length === 0 ? (
                          <p className="nx-muted">Aucune notification.</p>
                        ) : (
                          notifications.slice(0, 8).map((n) => (
                            <p className="nx-muted" key={n.id}>
                              <strong>{n.title}</strong> — {n.message}
                            </p>
                          ))
                        )}
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
                          {notifications.slice(0, 5).map((n) => (
                            <div className="nx-activity-item" key={n.id}>
                              <span className={`chip ${n.is_read ? 'info' : 'warning'}`}>
                                <Icons.alert size={12} />
                              </span>
                              <div>
                                <strong>{n.title}</strong>
                                <p>{n.message}</p>
                              </div>
                            </div>
                          ))}
                          {notifications.length === 0 && (
                            <p className="nx-muted">Rien de nouveau pour l’instant.</p>
                          )}
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
                              <span className="dot" /> API
                            </span>
                          </div>
                        </div>
                        <div className="nx-chat-thread">
                          {thread.map((m, i) => (
                            <div key={i} className={`nx-bubble ${m.from === 'me' ? 'me' : 'ai'}`}>
                              {m.text}
                            </div>
                          ))}
                        </div>
                        <button
                          className="suggest"
                          type="button"
                          onClick={() => void ask('Quel est mon prochain cours ?')}
                        >
                          Quel est mon prochain cours ?
                        </button>
                        <form
                          className="ai-input"
                          onSubmit={(e) => {
                            e.preventDefault()
                            void ask(aiInput)
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
                        {firstMatch ? (
                          <>
                            <p className="nx-muted">
                              Un objet trouvé correspond peut-être à votre déclaration.
                            </p>
                            <div className="found-item">
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                                <h4>{firstMatch.found_item.title}</h4>
                                <span className="chip success">
                                  {Math.round(firstMatch.similarity_score * 100)}%
                                </span>
                              </div>
                              <p>
                                {firstMatch.found_item.description} · {firstMatch.found_item.location}
                              </p>
                            </div>
                            <div className="actions-row">
                              <button
                                className="btn btn-accent"
                                type="button"
                                style={{ flex: 1 }}
                                onClick={() => {
                                  void api(`/correspondances/${firstMatch.id}`, {
                                    method: 'PUT',
                                    body: JSON.stringify({ status: 'CONFIRMEE' }),
                                  })
                                    .then(() => {
                                      toast('Correspondance confirmée.')
                                      return load()
                                    })
                                    .catch((err) =>
                                      toast(err instanceof Error ? err.message : 'Action impossible.'),
                                    )
                                }}
                              >
                                C’est la mienne !
                              </button>
                              <button
                                className="btn btn-ghost"
                                type="button"
                                onClick={() => {
                                  void api(`/correspondances/${firstMatch.id}`, {
                                    method: 'PUT',
                                    body: JSON.stringify({ status: 'REJETEE' }),
                                  })
                                    .then(() => {
                                      toast('Correspondance ignorée.')
                                      return load()
                                    })
                                    .catch((err) =>
                                      toast(err instanceof Error ? err.message : 'Action impossible.'),
                                    )
                                }}
                              >
                                Non
                              </button>
                            </div>
                          </>
                        ) : (
                          <p className="nx-muted">Aucune correspondance proposée pour vos objets.</p>
                        )}
                      </article>
                    )}

                    {showDash && (
                      <article className="card">
                        <div className="card-h">
                          <h2>Actions rapides</h2>
                        </div>
                        <div className="nx-quick-stack">
                          <button className="quick" type="button" onClick={declareAbsence}>
                            <span className="icon-wrap danger">
                              <Icons.alert size={15} />
                            </span>
                            <span>
                              <strong>Déclarer une absence</strong>
                              <span>Liée à votre prochaine séance</span>
                            </span>
                          </button>
                          <button
                            className="quick"
                            type="button"
                            onClick={() => {
                              go('lost')
                              declareLost()
                            }}
                          >
                            <span className="icon-wrap warning">
                              <Icons.search size={15} />
                            </span>
                            <span>
                              <strong>Signaler un objet perdu</strong>
                              <span>Déclarer un objet pour lancer l’IA</span>
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
