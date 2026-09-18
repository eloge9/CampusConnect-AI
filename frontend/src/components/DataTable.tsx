import type { ReactNode } from 'react'
import { Card, CardHeader } from './Card'

export function DataTable({
  id,
  title,
  action,
  columns,
  children,
}: {
  id?: string
  title: string
  action?: ReactNode
  columns: string[]
  children: ReactNode
}) {
  return (
    <Card id={id} extra="table-card">
      <CardHeader title={title} action={action} />
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </Card>
  )
}
