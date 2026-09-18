import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from './api'
import { homeForRole, useAuth } from './auth'
import { Icons } from './icons'
import { LogoMark } from './LogoMark'

const DEMOS = [
  { role: 'Étudiant', email: 'etudiant@campusconnect.dev', password: 'StudentDemo123!' },
  { role: 'Enseignant', email: 'enseignant@campusconnect.dev', password: 'TeacherDemo123!' },
  { role: 'Admin', email: 'admin@campusconnect.dev', password: 'AdminDemo123!' },
]

export function LoginPage() {
  const { user, loading, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const locState = location.state as { from?: string; registered?: boolean; expired?: boolean } | null
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!loading && user) {
    return <Navigate to={locState?.from || homeForRole(user.role)} replace />
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const me = await login(email, password)
      navigate(homeForRole(me.role), { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Connexion impossible.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card card">
        <div className="login-brand login-brand-logo">
          <LogoMark size={72} />
          <p>Connexion à l’espace campus</p>
        </div>
        {locState?.registered && (
          <p className="login-success">Compte créé. Connectez-vous avec votre e-mail et mot de passe.</p>
        )}
        {locState?.expired && (
          <p className="login-error">Session expirée. Veuillez vous reconnecter.</p>
        )}
        <form className="login-form" onSubmit={onSubmit}>
          <label>
            E-mail
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Mot de passe
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && <p className="login-error">{error}</p>}
          <button className="btn btn-accent" type="submit" disabled={busy}>
            {busy ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
        <p className="login-switch">
          Pas encore de compte ? <Link to="/inscription">Créer un compte</Link>
        </p>
        {import.meta.env.DEV && (
          <>
            <p className="login-hint">Comptes de démonstration (dev uniquement)</p>
            <div className="login-demos">
              {DEMOS.map((d) => (
                <button
                  key={d.email}
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => {
                    setEmail(d.email)
                    setPassword(d.password)
                    setError(null)
                  }}
                >
                  <Icons.user size={14} /> {d.role}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
