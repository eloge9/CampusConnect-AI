import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { AdminHome, AdminLayout } from './admin'
import { StudentDashboard } from './student'
import { TeacherDashboard } from './teacher'
import type { Role } from './layout'
import {
  DisponibilitePage,
  IncidentsPage,
  UtilisateursActifsPage,
} from './pages/admin/metrics'
import { UiProvider } from './ui'

const ROLES: { id: Role; label: string; path: string }[] = [
  { id: 'student', label: 'Étudiant', path: '/' },
  { id: 'teacher', label: 'Enseignant', path: '/enseignant' },
  { id: 'admin', label: 'Administration', path: '/admin' },
]

function roleFromPath(pathname: string): Role {
  if (pathname.startsWith('/admin')) return 'admin'
  if (pathname.startsWith('/enseignant')) return 'teacher'
  return 'student'
}

function AppRoutes() {
  const location = useLocation()
  const navigate = useNavigate()
  const role = roleFromPath(location.pathname)

  return (
    <div className="app-shell">
      <div className="role-switch" role="tablist" aria-label="Choisir un espace">
        {ROLES.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={role === item.id}
            className={role === item.id ? 'active' : ''}
            onClick={() => navigate(item.path)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <Routes>
        <Route path="/" element={<StudentDashboard />} />
        <Route path="/enseignant" element={<TeacherDashboard />} />
        <Route element={<AdminLayout />}>
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
  return (
    <UiProvider>
      <AppRoutes />
    </UiProvider>
  )
}
