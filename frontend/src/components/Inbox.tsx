import { useEffect, useState } from 'react'
import {
  api,
  formatWhen,
  fullName,
  type ChatMessage,
  type Conversation,
  type UserRole,
} from '../api'
import { useAuth } from '../auth'
import { Icons } from '../icons'
import { useUi } from '../ui'
import { LoadState } from './LoadState'

type Contact = {
  id: number
  first_name: string
  last_name: string
  role: UserRole
}

const ROLE_FR: Record<UserRole, string> = {
  STUDENT: 'Étudiant',
  TEACHER: 'Enseignant',
  ADMIN: 'Admin',
}

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
  const [contacts, setContacts] = useState<Contact[]>([])
  const [picked, setPicked] = useState('')
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    void api<Contact[]>('/conversations/destinataires')
      .then(setContacts)
      .catch((err) => toast(err instanceof Error ? err.message : 'Contacts indisponibles.'))
  }, [toast])

  const open = async (id: number) => {
    setActiveId(id)
    setLoadingMsgs(true)
    try {
      const list = await api<ChatMessage[]>(`/conversations/${id}/messages`)
      setMessages(list)
      await api(`/conversations/${id}/lire`, { method: 'POST' })
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Conversation indisponible.')
    } finally {
      setLoadingMsgs(false)
    }
  }

  useEffect(() => {
    if (activeId && conversations.length > 0 && !conversations.some((c) => c.id === activeId)) {
      setActiveId(null)
      setMessages([])
    }
  }, [conversations, activeId])

  const startConversation = async () => {
    if (!picked) {
      toast('Choisissez un destinataire.')
      return
    }
    setStarting(true)
    try {
      const conv = await api<Conversation>('/conversations', {
        method: 'POST',
        body: JSON.stringify({ user_id: Number(picked) }),
      })
      setPicked('')
      await onRefresh()
      await open(conv.id)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Impossible de créer la conversation.')
    } finally {
      setStarting(false)
    }
  }

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
        <form
          className="login-form"
          onSubmit={(e) => {
            e.preventDefault()
            void startConversation()
          }}
        >
          <label>
            Nouvelle conversation
            <select value={picked} onChange={(e) => setPicked(e.target.value)} required>
              <option value="">Choisir un destinataire</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {fullName(c)} ({ROLE_FR[c.role]})
                </option>
              ))}
            </select>
          </label>
          <button className="btn btn-accent" type="submit" disabled={starting || contacts.length === 0}>
            {starting ? 'Ouverture…' : 'Démarrer'}
          </button>
        </form>
        <LoadState
          loading={false}
          empty={conversations.length === 0}
          emptyText="Aucune conversation. Choisissez un destinataire ci-dessus."
        >
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
      </div>
      <div className="inbox-thread">
        {!active && <p className="hint">Sélectionnez une conversation ou démarrez-en une.</p>}
        {active && (
          <>
            {loadingMsgs ? (
              <p className="hint load-hint">Chargement des messages…</p>
            ) : messages.length === 0 ? (
              <p className="hint">Aucun message. Écrivez le premier.</p>
            ) : (
              <div className="inbox-msgs">
                {messages.map((m) => (
                  <div key={m.id} className={`nx-bubble ${m.sender.id === user?.id ? 'me' : 'ai'}`}>
                    <strong>{fullName(m.sender)}</strong>
                    <p>{m.content}</p>
                    <span className="time">{formatWhen(m.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
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
