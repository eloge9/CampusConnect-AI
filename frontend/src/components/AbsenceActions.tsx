import { api, formatDate, type Absence } from '../api'
import { useUi } from '../ui'

export function reviewAbsence(id: number, status: 'ACCEPTEE' | 'REFUSEE', onDone: () => void) {
  return api(`/absences/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  }).then(onDone)
}

export function AbsenceStatusChip({ status }: { status: Absence['status'] }) {
  const map = {
    EN_ATTENTE: { cls: 'warning', label: 'En attente' },
    ACCEPTEE: { cls: 'success', label: 'Acceptée' },
    REFUSEE: { cls: 'danger', label: 'Refusée' },
  } as const
  const m = map[status]
  return <span className={`chip ${m.cls}`}>{m.label}</span>
}

export function AbsenceActions({
  absence,
  onDone,
}: {
  absence: Absence
  onDone: () => Promise<void> | void
}) {
  const { modal, toast } = useUi()
  if (absence.status !== 'EN_ATTENTE') {
    return (
      <span>
        <AbsenceStatusChip status={absence.status} />
        {absence.review_comment && <span className="td-sub">{absence.review_comment}</span>}
      </span>
    )
  }
  const act = (status: 'ACCEPTEE' | 'REFUSEE') =>
    modal({
      title: status === 'ACCEPTEE' ? 'Accepter la demande' : 'Rejeter la demande',
      body: (
        <p>
          {absence.reason} · {formatDate(absence.created_at)}
        </p>
      ),
      confirm: status === 'ACCEPTEE' ? 'Accepter' : 'Rejeter',
      onConfirm: () => {
        void reviewAbsence(absence.id, status, () => {
          toast(status === 'ACCEPTEE' ? 'Absence acceptée.' : 'Demande rejetée.')
          void onDone()
        }).catch((err) => toast(err instanceof Error ? err.message : 'Action impossible.'))
      },
    })

  return (
    <div className="actions-row">
      <button className="btn btn-accent" type="button" onClick={() => act('ACCEPTEE')}>
        Accepter
      </button>
      <button className="btn btn-soft-warning" type="button" onClick={() => act('REFUSEE')}>
        Rejeter
      </button>
    </div>
  )
}
