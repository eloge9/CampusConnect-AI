import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { api, ApiError } from './api'
import { homeForRole, useAuth } from './auth'
import { LogoMark } from './LogoMark'

export function RegisterPage() {
  const { user, loading, login } = useAuth()
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!loading && user) {
    return <Navigate to={homeForRole(user.role)} replace />
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    setBusy(true)
    const emailNorm = email.trim()
    try {
      await api('/auth/inscription', {
        method: 'POST',
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: emailNorm,
          phone: phone.trim() || null,
          password,
        }),
      })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Inscription impossible.')
      setBusy(false)
      return
    }
    try {
      const me = await login(emailNorm, password)
      navigate(homeForRole(me.role), { replace: true })
    } catch {
      navigate('/connexion', { replace: true, state: { registered: true } })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card card">
        <div className="login-brand login-brand-logo">
          <LogoMark size={72} />
          <p>Créer un compte étudiant</p>
        </div>
        <form className="login-form" onSubmit={onSubmit}>
          <label>
            Prénom
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </label>
          <label>
            Nom
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </label>
          <label>
            E-mail
            <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Téléphone (optionnel)
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <label>
            Mot de passe
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && <p className="login-error">{error}</p>}
          <button className="btn btn-accent" type="submit" disabled={busy}>
            {busy ? 'Création…' : 'Créer mon compte'}
          </button>
        </form>
        <p className="login-switch">
          Déjà inscrit ? <Link to="/connexion">Se connecter</Link>
        </p>
      </div>
    </div>
  )
}
