import type { ReactNode } from 'react'

export function LoadState({
  loading,
  empty,
  emptyText,
  children,
}: {
  loading: boolean
  empty?: boolean
  emptyText?: string
  children?: ReactNode
}) {
  if (loading) return <p className="hint load-hint">Chargement en cours…</p>
  if (empty) return <p className="hint">{emptyText ?? 'Aucune donnée.'}</p>
  return children
}
