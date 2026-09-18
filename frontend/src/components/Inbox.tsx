import { useEffect, useState } from 'react'
import {
  api,
  formatWhen,
  fullName,
  type ChatMessage,
  type Conversation,
} from '../api'
import { useAuth } from '../auth'
import { Icons } from '../icons'
import { useUi } from '../ui'
import { LoadState } from './LoadState'

export function Inbox({
  conversations,
  onRefresh,
}: {
  conversations: Conversation[]
  onRefresh: () => Promise<void> | void
}) {
  const { user } = useAuth()
  const { toast } = useUi()
  const [activeId, setActiveId] = useState<number | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [draft, setDraft] = useState('')

  const open = async (id: number) => {
    setActiveId(id)
    setLoadingMsgs(true)
    try {
      const list = await api<ChatMessage[]>(`/conversations/${id}/messages`)
      setMessages(list)
      await api(`/conversations/${id}/lire`, { method: 'POST' })
      await onRefresh()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Conversation indisponible.')
    } finally {
      setLoadingMsgs(false)
    }
  }

  useEffect(() => {
    if (activeId && !conversations.some((c) => c.id === activeId)) {
      setActiveId(null)
      setMessages([])
    }
  }, [conversations, activeId])

  const send = async () => {
    if (!activeId || !draft.trim()) return
    try {
      const msg = await api<ChatMessage>(`/conversations/${activeId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: draft.trim() }),
      })
      setMessages((m) => [...m, msg])
      setDraft('')
      await onRefresh()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Envoi impossible.')
    }
  }

  const active = conversations.find((c) => c.id === activeId)

  return (
    <div className="inbox">
      <div className="inbox-list">
        <LoadState loading={false} empty={conversations.length === 0} emptyText="Aucune conversation.">
          {conversations.map((c) => {
            const other = c.members.find((m) => m.id !== user?.id) ?? c.members[0]
            const label = c.is_group ? `Groupe #${c.id}` : other ? fullName(other) : `Conversation #${c.id}`
            return (
              <button
                key={c.id}
                className={`quick ${c.id === activeId ? 'active' : ''}`}
                type="button"
                onClick={() => void open(c.id)}
              >
                <span className="icon-wrap accent">
                  <Icons.message size={15} />
                </span>
                <span>
                  <strong>
                    {label}
                    {c.unread_count > 0 ? ` (${c.unread_count})` : ''}
                  </strong>
                  <span>{c.last_message?.content ?? 'Pas encore de message'}</span>
                </span>
              </button>
            )
          })}
        </LoadState>
        <p className="hint">
          Démarrer une nouvelle conversation 1-à-1 exige `POST /conversations` avec `user_id`. Aucun
          endpoint de liste d’utilisateurs n’existe pour STUDENT/TEACHER — à ajouter côté backend.
        </p>
      </div>
      <div className="inbox-thread">
        {!active && <p className="hint">Sélectionnez une conversation.</p>}
        {active && (
          <>
            <LoadState loading={loadingMsgs} empty={messages.length === 0} emptyText="Aucun message.">
              <div className="inbox-msgs">
                {messages.map((m) => (
                  <div key={m.id} className={`nx-bubble ${m.sender.id === user?.id ? 'me' : 'ai'}`}>
                    <strong>{fullName(m.sender)}</strong>
                    <p>{m.content}</p>
                    <span className="time">{formatWhen(m.created_at)}</span>
                  </div>
                ))}
              </div>
            </LoadState>
            <form
              className="ai-input"
              onSubmit={(e) => {
                e.preventDefault()
                void send()
              }}
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Écrire un message…"
              />
              <button className="send" type="submit" aria-label="Envoyer">
                <Icons.send />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
