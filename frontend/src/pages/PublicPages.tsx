import { Link } from 'react-router-dom'
import { LogoMark } from '../LogoMark'

export function PublicHome() {
  return (
    <div className="login-page">
      <div className="login-card card" style={{ maxWidth: 520 }}>
        <div className="login-brand login-brand-logo">
          <LogoMark size={80} />
          <p>Plateforme campus — annonces, cours, absences, objets trouvés.</p>
        </div>
        <div className="actions-row" style={{ marginTop: 16 }}>
          <Link className="btn btn-accent" to="/connexion">
            Se connecter
          </Link>
          <Link className="btn btn-ghost" to="/inscription">
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  )
}

function StatusPage({ title, body, code }: { title: string; body: string; code: string }) {
  return (
    <div className="login-page">
      <div className="login-card card">
        <p className="login-hint">{code}</p>
        <h1>{title}</h1>
        <p className="hint" style={{ margin: '12px 0 20px' }}>
          {body}
        </p>
        <Link className="btn btn-accent" to="/accueil">
          Retour à l’accueil
        </Link>
      </div>
    </div>
  )
}

export function NotFoundPage() {
  return (
    <StatusPage
      code="404"
      title="Page introuvable"
      body="Cette adresse n’existe pas sur CampusConnect."
    />
  )
}

export function ForbiddenPage() {
  return (
    <StatusPage
      code="403"
      title="Accès refusé"
      body="Votre rôle ne permet pas d’ouvrir cette page."
    />
  )
}

export function ServerErrorPage() {
  return (
    <StatusPage
      code="500"
      title="Erreur serveur"
      body="Une erreur inattendue s’est produite. Réessayez plus tard."
    />
  )
}

export function MaintenancePage() {
  return (
    <StatusPage
      code="Maintenance"
      title="Plateforme en maintenance"
      body="CampusConnect est temporairement indisponible. Merci de revenir plus tard."
    />
  )
}
