import { useState, type FormEvent, type ReactNode } from 'react'
import {
  api,
  formatDate,
  formatTime,
  fullName,
  type ClassItem,
  type Schedule,
  type Subject,
  type TeacherAssignment,
  type User,
} from '../../api'
import { LoadState } from '../../components/LoadState'
import { useUi } from '../../ui'

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="stack-field">
      {label}
      {children}
    </label>
  )
}

export function ClassesCatalog({
  items,
  loading,
  onChange,
}: {
  items: ClassItem[]
  loading: boolean
  onChange: () => Promise<void> | void
}) {
  const { toast, modal } = useUi()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await api('/classes', {
        method: 'POST',
        body: JSON.stringify({ name, code, description: description || null }),
      })
      setName('')
      setCode('')
      setDescription('')
      toast('Classe créée.')
      await onChange()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Création impossible.')
    }
  }

  return (
    <article className="card" id="sec-classes">
      <div className="card-h">
        <h2>Classes</h2>
      </div>
      <form className="login-form" onSubmit={submit}>
        <Field label="Nom">
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Code">
          <input value={code} onChange={(e) => setCode(e.target.value)} required />
        </Field>
        <Field label="Description">
          <input value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <button className="btn btn-accent" type="submit">
          Créer
        </button>
      </form>
      <LoadState loading={loading} empty={items.length === 0} emptyText="Aucune classe.">
        {items.map((c) => (
          <div className="spark-item" key={c.id}>
            <div className="spark-item-copy">
              <h4>
                {c.name} · {c.code}
              </h4>
              <p>{c.description || '—'}</p>
            </div>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() =>
                modal({
                  title: 'Supprimer la classe',
                  body: <p>{c.name}</p>,
                  confirm: 'Supprimer',
                  onConfirm: () => {
                    void api(`/classes/${c.id}`, { method: 'DELETE' })
                      .then(() => {
                        toast('Classe supprimée.')
                        return onChange()
                      })
                      .catch((err) => toast(err instanceof Error ? err.message : 'Suppression impossible.'))
                  },
                })
              }
            >
              Supprimer
            </button>
          </div>
        ))}
      </LoadState>
    </article>
  )
}

export function SubjectsCatalog({
  items,
  loading,
  onChange,
}: {
  items: Subject[]
  loading: boolean
  onChange: () => Promise<void> | void
}) {
  const { toast, modal } = useUi()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await api('/matieres', {
        method: 'POST',
        body: JSON.stringify({ name, code, description: description || null }),
      })
      setName('')
      setCode('')
      setDescription('')
      toast('Matière créée.')
      await onChange()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Création impossible.')
    }
  }

  return (
    <article className="card" id="sec-matieres">
      <div className="card-h">
        <h2>Matières</h2>
      </div>
      <form className="login-form" onSubmit={submit}>
        <Field label="Nom">
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Code">
          <input value={code} onChange={(e) => setCode(e.target.value)} required />
        </Field>
        <Field label="Description">
          <input value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <button className="btn btn-accent" type="submit">
          Créer
        </button>
      </form>
      <LoadState loading={loading} empty={items.length === 0} emptyText="Aucune matière.">
        {items.map((s) => (
          <div className="spark-item" key={s.id}>
            <div className="spark-item-copy">
              <h4>
                {s.name} · {s.code}
              </h4>
              <p>{s.description || '—'}</p>
            </div>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() =>
                modal({
                  title: 'Supprimer la matière',
                  body: <p>{s.name}</p>,
                  confirm: 'Supprimer',
                  onConfirm: () => {
                    void api(`/matieres/${s.id}`, { method: 'DELETE' })
                      .then(() => {
                        toast('Matière supprimée.')
                        return onChange()
                      })
                      .catch((err) => toast(err instanceof Error ? err.message : 'Suppression impossible.'))
                  },
                })
              }
            >
              Supprimer
            </button>
          </div>
        ))}
      </LoadState>
    </article>
  )
}

export function AssignmentsCatalog({
  items,
  teachers,
  classes,
  subjects,
  loading,
  onChange,
}: {
  items: TeacherAssignment[]
  teachers: User[]
  classes: ClassItem[]
  subjects: Subject[]
  loading: boolean
  onChange: () => Promise<void> | void
}) {
  const { toast, modal } = useUi()
  const [teacherId, setTeacherId] = useState('')
  const [classId, setClassId] = useState('')
  const [subjectId, setSubjectId] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await api('/affectations-enseignants', {
        method: 'POST',
        body: JSON.stringify({
          teacher_id: Number(teacherId),
          class_id: Number(classId),
          subject_id: Number(subjectId),
        }),
      })
      toast('Affectation créée.')
      await onChange()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Création impossible.')
    }
  }

  return (
    <article className="card" id="sec-aff">
      <div className="card-h">
        <h2>Affectations enseignants</h2>
      </div>
      <form className="login-form" onSubmit={submit}>
        <Field label="Enseignant">
          <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} required>
            <option value="">Choisir</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {fullName(t)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Classe">
          <select value={classId} onChange={(e) => setClassId(e.target.value)} required>
            <option value="">Choisir</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Matière">
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} required>
            <option value="">Choisir</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <button className="btn btn-accent" type="submit">
          Créer
        </button>
      </form>
      <LoadState loading={loading} empty={items.length === 0} emptyText="Aucune affectation.">
        {items.map((a) => (
          <div className="spark-item" key={a.id}>
            <div className="spark-item-copy">
              <h4>{fullName(a.teacher)}</h4>
              <p>
                {a.classe.name} · {a.subject.name}
              </p>
            </div>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() =>
                modal({
                  title: 'Supprimer l’affectation',
                  body: <p>{fullName(a.teacher)}</p>,
                  confirm: 'Supprimer',
                  onConfirm: () => {
                    void api(`/affectations-enseignants/${a.id}`, { method: 'DELETE' })
                      .then(() => {
                        toast('Affectation supprimée.')
                        return onChange()
                      })
                      .catch((err) => toast(err instanceof Error ? err.message : 'Suppression impossible.'))
                  },
                })
              }
            >
              Supprimer
            </button>
          </div>
        ))}
      </LoadState>
    </article>
  )
}

export function SchedulesCatalog({
  items,
  assignments,
  loading,
  onChange,
}: {
  items: Schedule[]
  assignments: TeacherAssignment[]
  loading: boolean
  onChange: () => Promise<void> | void
}) {
  const { toast, modal } = useUi()
  const [assignmentId, setAssignmentId] = useState('')
  const [room, setRoom] = useState('')
  const [sessionDate, setSessionDate] = useState('')
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('10:00')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await api('/emploi-du-temps', {
        method: 'POST',
        body: JSON.stringify({
          teacher_assignment_id: Number(assignmentId),
          room,
          session_date: sessionDate,
          start_time: startTime.length === 5 ? `${startTime}:00` : startTime,
          end_time: endTime.length === 5 ? `${endTime}:00` : endTime,
        }),
      })
      toast('Séance créée.')
      await onChange()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Création impossible.')
    }
  }

  return (
    <article className="card" id="sec-edt">
      <div className="card-h">
        <h2>Emploi du temps</h2>
      </div>
      <form className="login-form" onSubmit={submit}>
        <Field label="Affectation">
          <select value={assignmentId} onChange={(e) => setAssignmentId(e.target.value)} required>
            <option value="">Choisir</option>
            {assignments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.subject.name} · {a.classe.name} · {fullName(a.teacher)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Salle">
          <input value={room} onChange={(e) => setRoom(e.target.value)} required />
        </Field>
        <Field label="Date">
          <input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} required />
        </Field>
        <Field label="Début">
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
        </Field>
        <Field label="Fin">
          <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
        </Field>
        <button className="btn btn-accent" type="submit">
          Créer
        </button>
      </form>
      <LoadState loading={loading} empty={items.length === 0} emptyText="Aucune séance.">
        {items.map((s) => (
          <div className="spark-item" key={s.id}>
            <div className="spark-item-copy">
              <h4>
                {s.affectation.subject.name} · {s.room}
              </h4>
              <p>
                {formatDate(s.session_date)} · {formatTime(s.start_time)}–{formatTime(s.end_time)} · {s.status}
              </p>
            </div>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() =>
                modal({
                  title: 'Supprimer la séance',
                  body: <p>{s.affectation.subject.name}</p>,
                  confirm: 'Supprimer',
                  onConfirm: () => {
                    void api(`/emploi-du-temps/${s.id}`, { method: 'DELETE' })
                      .then(() => {
                        toast('Séance supprimée.')
                        return onChange()
                      })
                      .catch((err) => toast(err instanceof Error ? err.message : 'Suppression impossible.'))
                  },
                })
              }
            >
              Supprimer
            </button>
          </div>
        ))}
      </LoadState>
    </article>
  )
}
