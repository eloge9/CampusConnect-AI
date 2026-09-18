import type { HTMLAttributes, ReactNode } from 'react'

type CardProps = HTMLAttributes<HTMLElement> & {
  extra?: string
  children: ReactNode
}

/** Wrapper type Horizon Card : colonne flex, pleine largeur, design CampusConnect. */
export function Card({ extra = '', className = '', children, ...rest }: CardProps) {
  return (
    <article className={`card hz-card ${extra} ${className}`.trim()} {...rest}>
      {children}
    </article>
  )
}

export function CardHeader({
  title,
  action,
}: {
  title: string
  action?: ReactNode
}) {
  return (
    <div className="card-h">
      <h2>{title}</h2>
      {action}
    </div>
  )
}
