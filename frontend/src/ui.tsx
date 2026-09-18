import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { Icons } from './icons'

type ModalState = { title: string; body: ReactNode; confirm?: string; onConfirm?: () => void } | null

type UiApi = {
  toast: (message: string) => void
  modal: (state: Exclude<ModalState, null>) => void
  closeModal: () => void
}

const UiContext = createContext<UiApi | null>(null)

export function useUi() {
  const ctx = useContext(UiContext)
  if (!ctx) throw new Error('useUi must be used within UiProvider')
  return ctx
}

export function UiProvider({ children }: { children: ReactNode }) {
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [modalState, setModalState] = useState<ModalState>(null)

  const toast = useCallback((message: string) => {
    setToastMsg(message)
  }, [])

  const modal = useCallback((state: Exclude<ModalState, null>) => {
    setModalState(state)
  }, [])

  const closeModal = useCallback(() => setModalState(null), [])

  useEffect(() => {
    if (!toastMsg) return
    const t = window.setTimeout(() => setToastMsg(null), 2800)
    return () => window.clearTimeout(t)
  }, [toastMsg])

  useEffect(() => {
    if (!modalState) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modalState, closeModal])

  const api = useMemo(() => ({ toast, modal, closeModal }), [toast, modal, closeModal])

  return (
    <UiContext.Provider value={api}>
      {children}
      {toastMsg && (
        <div className="toast" role="status">
          {toastMsg}
        </div>
      )}
      {modalState && (
        <div className="modal-backdrop" onClick={closeModal} role="presentation">
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-h">
              <h2 id="modal-title">{modalState.title}</h2>
              <button className="icon-btn modal-close" type="button" onClick={closeModal} aria-label="Fermer">
                <Icons.close size={16} />
              </button>
            </div>
            <div className="modal-body">{modalState.body}</div>
            <div className="modal-actions">
              <button className="btn btn-ghost" type="button" onClick={closeModal}>
                Annuler
              </button>
              {modalState.confirm && (
                <button
                  className="btn btn-accent"
                  type="button"
                  onClick={() => {
                    modalState.onConfirm?.()
                    closeModal()
                  }}
                >
                  {modalState.confirm}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </UiContext.Provider>
  )
}
