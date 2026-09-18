import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  api,
  formatDate,
  formatTime,
  formatWhen,
  fullName,
  scheduleStart,
  type Absence,
  type Announcement,
  type Assignment,
  type Conversation,
  type Exam,
  type Notification,
  type PotentialMatch,
  type Schedule,
} from './api'
import { useAuth } from './auth'
import { AbsenceStatusChip } from './components/AbsenceActions'
import { Inbox } from './components/Inbox'
import { LoadState } from './components/LoadState'
import { LostFoundForm } from './components/LostFoundForm'
import {
  ANNOUNCEMENT_CATEGORIES,
  CATEGORY_LABELS,
  type AnnouncementCategory,
} from './announcementCategory'
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
  const [absences, setAbsences] = useState<Absence[]>([])
  const [health, setHealth] = useState(false)
  const [loading, setLoading] = useState(true)
  const [absScheduleId, setAbsScheduleId] = useState('')
  const [absReason, setAbsReason] = useState('')
  const [annCat, setAnnCat] = useState<'ALL' | AnnouncementCategory>('ALL')

  const load = useCallback(async () => {
    try {
      const [sante, anns, seances, devoirs, examens, notifs, convos, objets, abs] = await Promise.all([
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
        api<Absence[]>('/absences'),
      ])
      setHealth(sante.status === 'ok')
      setAnnouncements(anns)
      setSchedules(seances)
      setAssignments(devoirs)
      setExams(examens)
      setNotifications(notifs)
      setConversations(convos)
      setAbsences(abs)
      const lostIds = objets
        .filter((o) => o.reporter.id === user?.id)
        .map((o) => o.id)
      const found = await Promise.all(
        lostIds.map((id) =>
          api<PotentialMatch[]>(`/objets-perdus-trouves/${id}/correspondances`).catch(() => []),
        ),
      )
      setMatches(found.flat().filter((m) => m.status === 'PROPOSEE'))
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Chargement API impossible.')
    } finally {
      setLoading(false)
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

  const submitAbsence = async () => {
    if (!absScheduleId) {
      toast('Choisissez une séance.')
      return
    }
    if (!absReason.trim()) {
      toast('Indiquez un motif.')
      return
    }
    try {
      await api('/absences', {
        method: 'POST',
        body: JSON.stringify({ schedule_id: Number(absScheduleId), reason: absReason.trim() }),
      })
      setAbsReason('')
      toast('Absence déclarée.')
      await load()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Déclaration impossible.')
    }
  }

  const uploadJustificatif = async (id: number, file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    try {
      await api(`/absences/${id}/justificatif`, { method: 'POST', body: fd })
      toast('Justificatif envoyé.')
      await load()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Upload impossible.')
    }
  }

  const changedSessions = useMemo(
    () => schedules.filter((s) => s.status === 'MODIFIE' || s.status === 'ANNULE'),
    [schedules],
  )
  const upcomingSessions = useMemo(
    () =>
      [...schedules].sort(
        (a, b) => scheduleStart(a).getTime() - scheduleStart(b).getTime(),
      ),
    [schedules],
  )
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
        const showMain =
          showDash || section === 'time' || section === 'exams' || section === 'msg' || section === 'abs'
        const showSide = notifsOpen || showDash || section === 'ai' || section === 'lost'
        const filteredHomework = homework.filter((h) => match(h.title + h.meta))
        const filteredAnns = announcements.filter((a) => {
          if (!match(a.title + a.content)) return false
          if (annCat !== 'ALL' && a.category !== annCat) return false
          return true
        })

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
                  {loading && <p className="hint load-hint">Chargement en cours…</p>}
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
                            <span
                              className={`chip ${nextCourse.status === 'MODIFIE' ? 'warning' : nextCourse.status === 'ANNULE' ? 'danger' : 'info'}`}
                            >
                              {nextCourse.status}
                            </span>
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
                        {changedSessions.length > 0 && (
                          <div className="ann" style={{ marginTop: 12 }}>
                            <div className="kicker">
                              <span>CHANGEMENT DÉTECTÉ</span>
                            </div>
                            {changedSessions.map((s) => (
                              <p key={s.id}>
                                {s.affectation.subject.name} · {formatDate(s.session_date)} · {s.room} —{' '}
                                {s.status === 'ANNULE' ? 'séance annulée' : 'séance modifiée'}
                              </p>
                            ))}
                          </div>
                        )}
                        {section === 'time' && (
                          <div style={{ marginTop: 16 }}>
                            <h3 className="course-title">Toutes les séances</h3>
                            {upcomingSessions.map((s) => (
                              <div className="homework nx-row" key={s.id}>
                                <div>
                                  <h4>{s.affectation.subject.name}</h4>
                                  <p>
                                    {formatDate(s.session_date)} · {formatTime(s.start_time)}–
                                    {formatTime(s.end_time)} · {s.room}
                                  </p>
                                </div>
                                <span
                                  className={`chip ${s.status === 'MODIFIE' ? 'warning' : s.status === 'ANNULE' ? 'danger' : 'info'}`}
                                >
                                  {s.status}
                                </span>
                              </div>
                            ))}
                          </div>
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
                          <h2>Fil d’actualité du campus</h2>
                        </div>
                        <div className="login-demos" style={{ marginBottom: 12 }}>
                          <button
                            className={`chip ${annCat === 'ALL' ? 'navy' : 'info'}`}
                            type="button"
                            onClick={() => setAnnCat('ALL')}
                          >
                            Toutes
                          </button>
                          {ANNOUNCEMENT_CATEGORIES.map((c) => (
                            <button
                              key={c}
                              className={`chip ${annCat === c ? 'navy' : 'info'}`}
                              type="button"
                              onClick={() => setAnnCat(c)}
                            >
                              {CATEGORY_LABELS[c]}
                            </button>
                          ))}
                        </div>
                        {filteredAnns.length === 0 && <p className="hint">Aucune annonce pour le moment.</p>}
                        {filteredAnns.slice(0, 8).map((a) => (
                          <div className="ann" key={a.id}>
                            <div className="kicker">
                              <span>{CATEGORY_LABELS[a.category as AnnouncementCategory] ?? a.category}</span>
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
                        <LoadState loading={loading} empty={false}>
                          <Inbox conversations={conversations} onRefresh={load} />
                        </LoadState>
                      </article>
                    )}

                    {section === 'abs' && (
                      <article className="card" id="sec-abs">
                        <div className="card-h">
                          <h2>Mes demandes d’absence</h2>
                        </div>
                        <form
                          className="login-form"
                          onSubmit={(e) => {
                            e.preventDefault()
                            void submitAbsence()
                          }}
                        >
                          <label>
                            Séance
                            <select
                              value={absScheduleId}
                              onChange={(e) => setAbsScheduleId(e.target.value)}
                              required
                            >
                              <option value="">Choisir une séance</option>
                              {schedules.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.affectation.subject.name} · {formatDate(s.session_date)} ·{' '}
                                  {formatTime(s.start_time)}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            Motif
                            <textarea
                              className="textarea"
                              value={absReason}
                              onChange={(e) => setAbsReason(e.target.value)}
                              required
                            />
                          </label>
                          <button className="btn btn-accent" type="submit">
                            Déclarer
                          </button>
                        </form>
                        <LoadState
                          loading={loading}
                          empty={absences.length === 0}
                          emptyText="Aucune demande d’absence."
                        >
                          {absences.map((a) => (
                            <div className="spark-item" key={a.id}>
                              <div className="spark-item-copy">
                                <h4>
                                  {a.schedule.affectation.subject.name} · {formatDate(a.created_at)}
                                </h4>
                                <p>{a.reason}</p>
                                {a.review_comment && <p>Réponse : {a.review_comment}</p>}
                                <AbsenceStatusChip status={a.status} />
                              </div>
                              {a.status === 'EN_ATTENTE' && (
                                <label className="btn btn-ghost">
                                  Justificatif
                                  <input
                                    type="file"
                                    accept="application/pdf,image/jpeg,image/png,image/jpg"
                                    hidden
                                    onChange={(e) => {
                                      const file = e.target.files?.[0]
                                      if (file) void uploadJustificatif(a.id, file)
                                    }}
                                  />
                                </label>
                              )}
                            </div>
                          ))}
                        </LoadState>
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
                          {notifications
                            .slice()
                            .sort((a, b) => {
                              const rank = (t: string) =>
                                t === 'CHANGEMENT_SEANCE' || t === 'CORRESPONDANCE_OBJET' ? 0 : 1
                              return rank(a.type) - rank(b.type)
                            })
                            .slice(0, 5)
                            .map((n) => (
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
                        <h2 style={{ marginTop: 16, fontSize: 14 }}>Nouvelle déclaration</h2>
                        <LostFoundForm onCreated={load} />
                      </article>
                    )}

                    {showDash && (
                      <article className="card">
                        <div className="card-h">
                          <h2>Actions rapides</h2>
                        </div>
                        <div className="nx-quick-stack">
                          <button className="quick" type="button" onClick={() => go('abs')}>
                            <span className="icon-wrap danger">
                              <Icons.alert size={15} />
                            </span>
                            <span>
                              <strong>Déclarer une absence</strong>
                              <span>Formulaire séance + motif</span>
                            </span>
                          </button>
                          <button className="quick" type="button" onClick={() => go('lost')}>
                            <span className="icon-wrap warning">
                              <Icons.search size={15} />
                            </span>
                            <span>
                              <strong>Signaler un objet perdu</strong>
                              <span>Formulaire + photo</span>
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
