import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Card } from './Card'

/** Widget Horizon : icône circulaire + libellé + valeur. */
export function Widget({
  icon,
  title,
  subtitle,
  tone = 'navy',
  to,
}: {
  icon: ReactNode
  title: string
  subtitle: ReactNode
  tone?: 'navy' | 'success' | 'danger'
  to?: string
}) {
  const body = (
    <Card extra="widget-card">
      <div className={`widget-icon ${tone}`}>{icon}</div>
      <div className="widget-copy">
        <p>{title}</p>
        <h3 className={tone === 'danger' ? 'alert' : undefined}>{subtitle}</h3>
      </div>
    </Card>
  )

  if (!to) return body

  return (
    <Link to={to} className="widget-link" aria-label={`${title} — ouvrir le détail`}>
      {body}
    </Link>
  )
}
