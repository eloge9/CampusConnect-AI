import { Link } from 'react-router-dom'
import { Card, CardHeader } from '../../components/Card'

type DayPoint = { label: string; value: number }

function WeekChart({
  series,
  format,
  caption,
}: {
  series: DayPoint[]
  format: (value: number) => string
  caption: string
}) {
  const max = Math.max(...series.map((d) => d.value), 1)

  return (
    <figure className="week-chart-wrap">
      <div className="week-chart" role="img" aria-label={caption}>
        {series.map((d) => (
          <div className="week-col" key={d.label}>
            <span className="week-val">{format(d.value)}</span>
            <div className="week-bar-track">
              <div className="week-bar" style={{ height: `${Math.max(8, (d.value / max) * 100)}%` }} />
            </div>
            <span className="week-lab">{d.label}</span>
          </div>
        ))}
      </div>
      <figcaption className="week-caption">{caption}</figcaption>
    </figure>
  )
}

function AdminMetricPage({
  title,
  summary,
  series,
  format,
  caption,
  columns,
}: {
  title: string
  summary: string
  series: DayPoint[]
  format: (value: number) => string
  caption: string
  columns: [string, string]
}) {
  return (
    <div className="hz-page metric-page">
      <Link to="/admin" className="btn btn-ghost metric-back">
        ← Retour au tableau de bord
      </Link>
      <header className="hz-page-h">
        <h1>{title}</h1>
        <p className="metric-summary">{summary}</p>
      </header>
      <Card extra="task-card">
        <CardHeader title="Évolution sur 7 jours" />
        <WeekChart series={series} format={format} caption={caption} />
      </Card>
      <Card extra="table-card">
        <CardHeader title="Historique quotidien (données simulées)" />
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>{columns[0]}</th>
                <th>{columns[1]}</th>
              </tr>
            </thead>
            <tbody>
              {series.map((d) => (
                <tr key={d.label}>
                  <td>
                    <strong>{d.label}</strong>
                  </td>
                  <td>{format(d.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

/** Mock 7 jours — brancher plus tard sur la télémétrie SLA. */
const SLA_SERIES: DayPoint[] = [
  { label: 'Sam', value: 99.91 },
  { label: 'Dim', value: 99.94 },
  { label: 'Lun', value: 99.96 },
  { label: 'Mar', value: 99.93 },
  { label: 'Mer', value: 99.97 },
  { label: 'Jeu', value: 99.98 },
  { label: 'Ven', value: 99.98 },
]

/** Mock 7 jours — brancher plus tard (websocket / polling). */
const USERS_SERIES: DayPoint[] = [
  { label: 'Sam', value: 148 },
  { label: 'Dim', value: 96 },
  { label: 'Lun', value: 284 },
  { label: 'Mar', value: 301 },
  { label: 'Mer', value: 276 },
  { label: 'Jeu', value: 318 },
  { label: 'Ven', value: 312 },
]

/** Mock 7 jours — incidents évités par supervision prédictive. */
const INCIDENTS_SERIES: DayPoint[] = [
  { label: 'Sam', value: 0 },
  { label: 'Dim', value: 1 },
  { label: 'Lun', value: 1 },
  { label: 'Mar', value: 0 },
  { label: 'Mer', value: 2 },
  { label: 'Jeu', value: 0 },
  { label: 'Ven', value: 0 },
]

export function DisponibilitePage() {
  return (
    <AdminMetricPage
      title="Disponibilité de l’IA (SLA)"
      summary="SLA actuel : 99.98%. Les services d’apprentissage restent au-dessus de l’objectif 99.9%."
      series={SLA_SERIES}
      format={(v) => `${v.toFixed(2)}%`}
      caption="Disponibilité quotidienne de l’IA sur 7 jours"
      columns={['Jour', 'Disponibilité']}
    />
  )
}

export function UtilisateursActifsPage() {
  return (
    <AdminMetricPage
      title="Utilisateurs actifs en ce moment"
      summary="312 sessions connectées en direct (donnée simulée, prête à être branchée)."
      series={USERS_SERIES}
      format={(v) => `${v} connectés`}
      caption="Pic d’utilisateurs actifs par jour sur 7 jours"
      columns={['Jour', 'Utilisateurs']}
    />
  )
}

export function IncidentsPage() {
  return (
    <AdminMetricPage
      title="Pannes réseau évitées"
      summary="4 pannes évitées grâce à la supervision prédictive depuis le début de la période."
      series={INCIDENTS_SERIES}
      format={(v) => `${v}`}
      caption="Incidents réseau évités par jour sur 7 jours"
      columns={['Jour', 'Incidents évités']}
    />
  )
}
