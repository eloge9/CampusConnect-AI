import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminHome, AdminLayout } from './admin'
import type { UserRole } from './api'
import { homeForRole, useAuth } from './auth'
import { LoginPage } from './Login'
import {
  DisponibilitePage,
  IncidentsPage,
  UtilisateursActifsPage,
} from './pages/admin/metrics'
import {
  ForbiddenPage,
  MaintenancePage,
  NotFoundPage,
  PublicHome,
  ServerErrorPage,
} from './pages/PublicPages'
import { RegisterPage } from './Register'
import { StudentDashboard } from './student'
import { TeacherDashboard } from './teacher'

function RequireAuth({
  roles,
  children,
}: {
  roles: UserRole[]
  children: ReactNode
}) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="boot-screen">Chargement de la session…</div>
  }
  if (!user) {
    return <Navigate to="/connexion" replace />
  }
  if (!roles.includes(user.role)) {
    return <Navigate to="/interdit" replace />
  }
  return children
}

function RoleHome() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="boot-screen">Chargement de la session…</div>
  }
  if (!user) {
    return <Navigate to="/connexion" replace />
  }
  if (user.role === 'STUDENT') {
    return <StudentDashboard />
  }
  return <Navigate to={homeForRole(user.role)} replace />
}

function AppRoutes() {
  return (
    <div className="app-shell">
      <Routes>
        <Route path="/accueil" element={<PublicHome />} />
        <Route path="/connexion" element={<LoginPage />} />
        <Route path="/inscription" element={<RegisterPage />} />
        <Route path="/interdit" element={<ForbiddenPage />} />
        <Route path="/erreur" element={<ServerErrorPage />} />
        <Route path="/maintenance" element={<MaintenancePage />} />
        <Route path="/" element={<RoleHome />} />
        <Route
          path="/enseignant"
          element={
            <RequireAuth roles={['TEACHER']}>
              <TeacherDashboard />
            </RequireAuth>
          }
        />
        <Route
          element={
            <RequireAuth roles={['ADMIN']}>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route path="/admin" element={<AdminHome />} />
          <Route path="/admin/supervision/disponibilite" element={<DisponibilitePage />} />
          <Route path="/admin/supervision/utilisateurs-actifs" element={<UtilisateursActifsPage />} />
          <Route path="/admin/supervision/incidents" element={<IncidentsPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return <AppRoutes />
}
