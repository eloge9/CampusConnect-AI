export const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || '/api'

const TOKEN_KEY = 'cc_token'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

function parseDetail(data: unknown): string {
  if (data && typeof data === 'object' && 'detail' in data) {
    const detail = (data as { detail: unknown }).detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          if (item && typeof item === 'object' && 'msg' in item) {
            return String((item as { msg: string }).msg)
          }
          return JSON.stringify(item)
        })
        .join(' ')
    }
  }
  return 'Impossible de joindre l’API.'
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  const isForm = options.body instanceof FormData
  if (!headers.has('Content-Type') && options.body && !isForm) {
    headers.set('Content-Type', 'application/json')
  }
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (res.status === 204) return undefined as T

  const data = await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(parseDetail(data), res.status)
  return data as T
}

export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN'

export type User = {
  id: number
  first_name: string
  last_name: string
  email: string
  phone: string | null
  role: UserRole
  is_active: boolean
  class_id: number | null
}

export type ClassItem = {
  id: number
  name: string
  code: string
  description: string | null
}

export type Subject = {
  id: number
  name: string
  code: string
}

export type TeacherAssignment = {
  id: number
  teacher: User
  classe: ClassItem
  subject: Subject
}

export type Announcement = {
  id: number
  title: string
  content: string
  category: string
  author: { id: number; first_name: string; last_name: string; role: UserRole }
  classe: ClassItem | null
  created_at: string
}

export type Schedule = {
  id: number
  affectation: TeacherAssignment
  room: string
  session_date: string
  start_time: string
  end_time: string
  status: 'PREVU' | 'MODIFIE' | 'ANNULE'
}

export type Assignment = {
  id: number
  affectation: TeacherAssignment
  title: string
  description: string | null
  due_date: string
}

export type Exam = {
  id: number
  affectation: TeacherAssignment
  title: string
  description: string | null
  room: string
  exam_date: string
  start_time: string
  end_time: string
}

export type Notification = {
  id: number
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

export type Conversation = {
  id: number
  members: { id: number; first_name: string; last_name: string; role: UserRole }[]
  last_message: { content: string; created_at: string } | null
  unread_count: number
}

export type LostFoundItem = {
  id: number
  reporter: { id: number; first_name: string; last_name: string }
  item_type: 'PERDU' | 'TROUVE'
  title: string
  description: string
  location: string
  status: string
  item_date: string
}

export type PotentialMatch = {
  id: number
  lost_item: LostFoundItem
  found_item: LostFoundItem
  similarity_score: number
  status: 'PROPOSEE' | 'CONFIRMEE' | 'REJETEE'
}

export type Absence = {
  id: number
  student_id: number
  schedule: Schedule
  reason: string
  justificatif_path: string | null
  status: 'EN_ATTENTE' | 'ACCEPTEE' | 'REFUSEE'
  created_at: string
}

export type AdminStats = {
  total_utilisateurs: number
  total_etudiants: number
  total_enseignants: number
  total_admins: number
  total_classes: number
  absences_en_attente: number
  objets_ouverts: number
  correspondances_proposees: number
  annonces_total: number
}

export function fullName(user: { first_name: string; last_name: string }) {
  return `${user.first_name} ${user.last_name}`.trim()
}

export function initials(user: { first_name: string; last_name: string }) {
  return `${user.first_name[0] ?? ''}${user.last_name[0] ?? ''}`.toUpperCase()
}

export function formatWhen(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export function formatDate(value: string) {
  const date = new Date(value.includes('T') ? value : `${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(date)
}

export function formatTime(value: string) {
  return value.slice(0, 5)
}

export function scheduleStart(s: Schedule) {
  return new Date(`${s.session_date}T${s.start_time}`)
}
