import type { ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AdminHome, AdminLayout } from './admin'
import { homeForRole, useAuth } from './auth'
import { LoginPage } from './Login'
import {
  DisponibilitePage,
  IncidentsPage,
  UtilisateursActifsPage,
} from './pages/admin/metrics'
import { StudentDashboard } from './student'
import { TeacherDashboard } from './teacher'
import type { UserRole } from './api'

function RequireAuth({
  roles,
  children,
}: {
  roles: UserRole[]
  children: ReactNode
}) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="boot-screen">Chargement de la session…</div>
  }
  if (!user) {
    return <Navigate to="/connexion" replace state={{ from: location.pathname }} />
  }
  if (!roles.includes(user.role)) {
    return <Navigate to={homeForRole(user.role)} replace />
  }
  return children
}

function AppRoutes() {
  return (
    <div className="app-shell">
      <Routes>
        <Route path="/connexion" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <RequireAuth roles={['STUDENT']}>
              <StudentDashboard />
            </RequireAuth>
          }
        />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return <AppRoutes />
}
