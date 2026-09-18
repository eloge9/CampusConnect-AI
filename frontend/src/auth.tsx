import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { api, getToken, setToken, setUnauthorizedHandler, type User } from './api'

type AuthApi = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  logout: () => void
}

const AuthContext = createContext<AuthApi | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken(null)
      setUser(null)
      navigate('/connexion', { replace: true, state: { expired: true } })
    })
    return () => setUnauthorizedHandler(null)
  }, [navigate])

  const refreshMe = useCallback(async () => {
    if (!getToken()) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const me = await api<User>('/auth/moi')
      setUser(me)
    } catch {
      logout()
    } finally {
      setLoading(false)
    }
  }, [logout])

  useEffect(() => {
    void refreshMe()
  }, [refreshMe])

  const login = useCallback(async (email: string, password: string) => {
    const token = await api<{ access_token: string }>('/auth/connexion', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    setToken(token.access_token)
    const me = await api<User>('/auth/moi')
    setUser(me)
    return me
  }, [])

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function homeForRole(role: User['role']) {
  if (role === 'ADMIN') return '/admin'
  if (role === 'TEACHER') return '/enseignant'
  return '/'
}
