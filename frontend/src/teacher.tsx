import { useCallback, useEffect, useState } from 'react'
import {
  api,
  formatDate,
  formatTime,
  formatWhen,
  type Absence,
  type Announcement,
  type Assignment,
  type ClassItem,
  type Conversation,
  type Exam,
  type Schedule,
  type TeacherAssignment,
} from './api'
import { detectAnnouncementCategory, CATEGORY_LABELS } from './announcementCategory'
import { useAuth } from './auth'
import { AbsenceActions } from './components/AbsenceActions'
import { Inbox } from './components/Inbox'
import { LoadState } from './components/LoadState'
import { Icons } from './icons'
import { Shell } from './layout'
import { useUi } from './ui'

function Assistant({ greeting }: { greeting: string }) {
  const [input, setInput] = useState('')
  const [thread, setThread] = useState<{ from: 'ai' | 'me'; text: string }[]>([
    { from: 'ai', text: greeting },
  ])

  const ask = async (text: string) => {
    const q = text.trim()
    if (!q) return
    setThread((t) => [...t, { from: 'me', text: q }])
    setInput('')
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

  return (
    <article className="card ai-card" id="sec-ai">
      <div className="card-h">
        <h2>
          <Icons.spark size={16} /> Assistant IA Enseignant
        </h2>
        <span className="chip success">
          <span className="dot" /> API
        </span>
      </div>
      <div className="ai-thread">
        {thread.map((m, i) => (
          <div key={i} className={`bubble ${m.from === 'me' ? 'me' : ''}`}>
            {m.text}
          </div>
        ))}
      </div>
      <form
        className="ai-input"
        onSubmit={(e) => {
          e.preventDefault()
          void ask(input)
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

export function TeacherDashboard() {
  const { user } = useAuth()
  const { modal, toast } = useUi()
  const [announce, setAnnounce] = useState('')
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [homework, setHomework] = useState<Assignment[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [absences, setAbsences] = useState<Absence[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [hwTitle, setHwTitle] = useState('')
  const [hwDesc, setHwDesc] = useState('')
  const [hwDue, setHwDue] = useState('')
  const [hwAssign, setHwAssign] = useState('')
  const [exTitle, setExTitle] = useState('')
  const [exDesc, setExDesc] = useState('')
  const [exRoom, setExRoom] = useState('')
  const [exDate, setExDate] = useState('')
  const [exStart, setExStart] = useState('08:00')
  const [exEnd, setExEnd] = useState('10:00')
  const [exAssign, setExAssign] = useState('')

  const load = useCallback(async () => {
    try {
      const [cls, aff, seances, examens, anns, abs, convos, devoirs] = await Promise.all([
        api<ClassItem[]>('/classes'),
        api<TeacherAssignment[]>('/affectations-enseignants'),
        api<Schedule[]>('/emploi-du-temps'),
        api<Exam[]>('/examens'),
        api<Announcement[]>('/annonces'),
        api<Absence[]>('/absences'),
        api<Conversation[]>('/conversations'),
        api<Assignment[]>('/devoirs'),
      ])
      setClasses(cls)
      setAssignments(aff)
      setSchedules(seances)
      setExams(examens)
      setAnnouncements(anns)
      setAbsences(abs)
      setConversations(convos)
      setHomework(devoirs)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Chargement API impossible.')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void load()
  }, [load])

  const publish = async () => {
    if (!announce.trim()) {
      toast('Le message ne peut pas être vide.')
      return
    }
    try {
      await api('/annonces', {
        method: 'POST',
        body: JSON.stringify({
          title: announce.trim().slice(0, 80),
          content: announce.trim(),
          category: detectAnnouncementCategory(announce.trim().slice(0, 80), announce.trim()),
        }),
      })
      setAnnounce('')
      toast('Annonce publiée.')
      await load()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Publication impossible.')
    }
  }

  return (
    <Shell
      role="teacher"
      search="Chercher un étudiant, une note, un cours..."
      extra={
        <div className="top-meta">
          <span className="chip success">Espace Enseignant Actif</span>
          <div className="date-block">
            <strong>{new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full' }).format(new Date())}</strong>
            <span>Connecté à l’API</span>
          </div>
        </div>
      }
    >
      {({ section, query }) => {
        const q = query.trim().toLowerCase()
        const match = (text: string) => !q || text.toLowerCase().includes(q)
        const classList = classes.filter((c) => match(c.name + c.code))

        return (
          <div className="spark-page">
            {(section === 'dash' || section === 'agenda') && (
              <>
                {section === 'dash' && (
                  <>
                    <header className="spark-header" id="sec-dash">
                      <h1>Espace Pédagogique — Bonjour {user?.first_name} !</h1>
                    </header>
                    <div className="spark-stats">
                      <article className="card spark-stat">
                        <span className="stat-label">Classes</span>
                        <strong className="stat-value">{classes.length}</strong>
                      </article>
                      <article className="card spark-stat">
                        <span className="stat-label">Affectations</span>
                        <strong className="stat-value">{assignments.length}</strong>
                      </article>
                      <article className="card spark-stat">
                        <span className="stat-label">Séances</span>
                        <strong className="stat-value success">{schedules.length}</strong>
                      </article>
                    </div>
                  </>
                )}

                <div className="spark-split">
                  <div className="spark-main">
                    <article className="card" id="sec-agenda">
                      <div className="card-h">
                        <h2>Gestion des Cours & Changements d’Emploi du Temps</h2>
                      </div>
                      {schedules.filter((s) => match(s.affectation.subject.name + s.room)).length ===
                        0 && <p className="spark-lead">Aucune séance pour l’instant.</p>}
                      {schedules
                        .filter((s) => match(s.affectation.subject.name + s.room))
                        .slice(0, 6)
                        .map((s) => (
                          <div className="spark-item" key={s.id}>
                            <span className="icon-wrap warning">
                              <Icons.clock size={15} />
                            </span>
                            <div className="spark-item-copy">
                              <h4>
                                {s.affectation.subject.name} · {s.affectation.classe.name}
                              </h4>
                              <p>
                                {formatDate(s.session_date)} · {formatTime(s.start_time)}–{formatTime(s.end_time)} ·{' '}
                                {s.room} · {s.status}
                              </p>
                            </div>
                            <button
                              className="btn cta btn-soft-warning"
                              type="button"
                              disabled={s.status === 'ANNULE'}
                              onClick={() =>
                                modal({
                                  title: 'Déplacer la séance',
                                  body: (
                                    <p>
                                      La séance passera en salle 302. Les étudiants recevront une
                                      notification de changement d’emploi du temps.
                                    </p>
                                  ),
                                  confirm: 'Confirmer',
                                  onConfirm: () => {
                                    void api(`/emploi-du-temps/${s.id}`, {
                                      method: 'PUT',
                                      body: JSON.stringify({ room: 'Salle 302' }),
                                    })
                                      .then(() => {
                                        toast('Changement de salle notifié aux étudiants.')
                                        return load()
                                      })
                                      .catch((err) =>
                                        toast(err instanceof Error ? err.message : 'Action impossible.'),
                                      )
                                  },
                                })
                              }
                            >
                              Signaler un changement
                            </button>
                          </div>
                        ))}
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
                          onChange={(e) => setAnnounce(e.target.value)}
                        />
                        {announce.trim() && (
                          <p className="hint">
                            Catégorie détectée :{' '}
                            <strong>
                              {
                                CATEGORY_LABELS[
                                  detectAnnouncementCategory(announce.trim().slice(0, 80), announce)
                                ]
                              }
                            </strong>
                          </p>
                        )}
                        <div className="spark-actions">
                          <button className="btn btn-accent" type="button" onClick={() => void publish()}>
                            Publier l’Annonce Campus
                          </button>
                        </div>
                      </article>
                    )}
                  </div>

                  <div className="spark-side">
                    {section === 'dash' && (
                      <Assistant
                        greeting={`Bonjour ${user?.first_name ?? ''}, je m’appuie sur les données réelles de la plateforme.`}
                      />
                    )}
                    <article className="card" id="sec-classes">
                      <div className="card-h">
                        <h2>Aperçu des Classes</h2>
                      </div>
                      {classList.length === 0 && <p className="spark-lead">Aucune classe en base.</p>}
                      {classList.map((c) => (
                        <div className="spark-progress" key={c.id}>
                          <div className="spark-progress-lab">
                            <strong>{c.name}</strong>
                            <span>{c.code}</span>
                          </div>
                          <div className="track">
                            <div className="fill" style={{ width: '100%' }} />
                          </div>
                        </div>
                      ))}
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
                {classes.map((c) => (
                  <div className="spark-progress" key={c.id}>
                    <div className="spark-progress-lab">
                      <strong>{c.name}</strong>
                      <span>{c.code}</span>
                    </div>
                    <p className="spark-lead">{c.description || 'Pas de description.'}</p>
                  </div>
                ))}
              </article>
            )}

            {section === 'exams' && (
              <article className="card" id="sec-exams">
                <div className="card-h">
                  <h2>Examens</h2>
                  <span className="badge info">{exams.length}</span>
                </div>
                {loading && <p className="hint load-hint">Chargement en cours…</p>}
                <form
                  className="login-form"
                  onSubmit={(e) => {
                    e.preventDefault()
                    void (async () => {
                      try {
                        await api('/examens', {
                          method: 'POST',
                          body: JSON.stringify({
                            teacher_assignment_id: Number(exAssign),
                            title: exTitle,
                            description: exDesc || null,
                            room: exRoom,
                            exam_date: exDate,
                            start_time: exStart.length === 5 ? `${exStart}:00` : exStart,
                            end_time: exEnd.length === 5 ? `${exEnd}:00` : exEnd,
                          }),
                        })
                        toast('Examen créé.')
                        setExTitle('')
                        await load()
                      } catch (err) {
                        toast(err instanceof Error ? err.message : 'Création impossible.')
                      }
                    })()
                  }}
                >
                  <label>
                    Affectation
                    <select value={exAssign} onChange={(e) => setExAssign(e.target.value)} required>
                      <option value="">Choisir</option>
                      {assignments.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.subject.name} · {a.classe.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Titre
                    <input value={exTitle} onChange={(e) => setExTitle(e.target.value)} required />
                  </label>
                  <label>
                    Description
                    <input value={exDesc} onChange={(e) => setExDesc(e.target.value)} />
                  </label>
                  <label>
                    Salle
                    <input value={exRoom} onChange={(e) => setExRoom(e.target.value)} required />
                  </label>
                  <label>
                    Date
                    <input type="date" value={exDate} onChange={(e) => setExDate(e.target.value)} required />
                  </label>
                  <label>
                    Début
                    <input type="time" value={exStart} onChange={(e) => setExStart(e.target.value)} required />
                  </label>
                  <label>
                    Fin
                    <input type="time" value={exEnd} onChange={(e) => setExEnd(e.target.value)} required />
                  </label>
                  <button className="btn btn-accent" type="submit">
                    Créer l’examen
                  </button>
                </form>
                <LoadState loading={loading} empty={exams.length === 0} emptyText="Aucun examen planifié.">
                  {exams.map((item) => (
                    <div className="spark-item" key={item.id}>
                      <span className="icon-wrap accent">
                        <Icons.clipboard size={15} />
                      </span>
                      <div className="spark-item-copy">
                        <h4>{item.title}</h4>
                        <p>
                          {item.affectation.classe.name} · {formatDate(item.exam_date)} · {item.room}
                        </p>
                      </div>
                    </div>
                  ))}
                </LoadState>
              </article>
            )}

            {section === 'devoirs' && (
              <article className="card" id="sec-devoirs">
                <div className="card-h">
                  <h2>Devoirs</h2>
                </div>
                <form
                  className="login-form"
                  onSubmit={(e) => {
                    e.preventDefault()
                    void (async () => {
                      try {
                        await api('/devoirs', {
                          method: 'POST',
                          body: JSON.stringify({
                            teacher_assignment_id: Number(hwAssign),
                            title: hwTitle,
                            description: hwDesc || null,
                            due_date: new Date(hwDue).toISOString(),
                          }),
                        })
                        toast('Devoir créé.')
                        setHwTitle('')
                        await load()
                      } catch (err) {
                        toast(err instanceof Error ? err.message : 'Création impossible.')
                      }
                    })()
                  }}
                >
                  <label>
                    Affectation
                    <select value={hwAssign} onChange={(e) => setHwAssign(e.target.value)} required>
                      <option value="">Choisir</option>
                      {assignments.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.subject.name} · {a.classe.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Titre
                    <input value={hwTitle} onChange={(e) => setHwTitle(e.target.value)} required />
                  </label>
                  <label>
                    Description
                    <input value={hwDesc} onChange={(e) => setHwDesc(e.target.value)} />
                  </label>
                  <label>
                    Date limite
                    <input type="datetime-local" value={hwDue} onChange={(e) => setHwDue(e.target.value)} required />
                  </label>
                  <button className="btn btn-accent" type="submit">
                    Créer le devoir
                  </button>
                </form>
                <LoadState loading={loading} empty={homework.length === 0} emptyText="Aucun devoir.">
                  {homework.map((d) => (
                    <div className="spark-item" key={d.id}>
                      <div className="spark-item-copy">
                        <h4>{d.title}</h4>
                        <p>
                          {d.affectation.classe.name} · {formatWhen(d.due_date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </LoadState>
              </article>
            )}

            {section === 'abs' && (
              <article className="card" id="sec-abs">
                <div className="card-h">
                  <h2>Absences à traiter</h2>
                </div>
                <LoadState
                  loading={loading}
                  empty={absences.length === 0}
                  emptyText="Aucune demande d’absence."
                >
                  {absences.map((a) => (
                    <div className="spark-item" key={a.id}>
                      <div className="spark-item-copy">
                        <h4>
                          Étudiant #{a.student_id} · {a.schedule.affectation.subject.name}
                        </h4>
                        <p>{a.reason}</p>
                      </div>
                      <AbsenceActions absence={a} onDone={load} />
                    </div>
                  ))}
                </LoadState>
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

            {section === 'admin' && (
              <article className="card" id="sec-admin">
                <div className="card-h">
                  <h2>Annonces campus</h2>
                </div>
                {announcements.length === 0 && <p className="spark-lead">Aucune annonce.</p>}
                {announcements.slice(0, 8).map((a) => (
                  <div className="ann" key={a.id}>
                    <div className="kicker">
                      <span>{a.category}</span>
                      <span>{formatWhen(a.created_at)}</span>
                    </div>
                    <h4>{a.title}</h4>
                    <p>{a.content}</p>
                  </div>
                ))}
              </article>
            )}
          </div>
        )
      }}
    </Shell>
  )
}
