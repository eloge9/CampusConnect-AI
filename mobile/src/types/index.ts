export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN';

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  class_id?: number | null;
  classe?: SchoolClass | null;
}

export interface SchoolClass {
  id: number;
  name: string;
  code: string;
  description?: string;
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  description?: string;
}

export interface TeacherAssignment {
  id: number;
  teacher_id: number;
  class_id: number;
  subject_id: number;
  teacher?: User;
  classe?: SchoolClass;
  subject?: Subject;
}

export type ScheduleStatus = 'PREVU' | 'MODIFIE' | 'ANNULE';

export interface ScheduleItem {
  id: number;
  teacher_assignment_id: number;
  room: string;
  session_date: string;
  start_time: string;
  end_time: string;
  status: ScheduleStatus;
  affectation?: TeacherAssignment;
  course_title?: string;
  teacher_name?: string;
  course_type?: 'CM' | 'TD' | 'TP';
}

export interface Assignment {
  id: number;
  teacher_assignment_id: number;
  title: string;
  description?: string;
  due_date: string;
  created_by?: number;
  affectation?: TeacherAssignment;
}

export interface Exam {
  id: number;
  teacher_assignment_id: number;
  title: string;
  description?: string;
  room: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  created_by?: number;
  affectation?: TeacherAssignment;
}

export type AnnouncementCategory =
  | 'COURS'
  | 'EXAMENS'
  | 'EMPLOI_DU_TEMPS'
  | 'ADMINISTRATION'
  | 'EVENEMENTS'
  | 'OBJETS_PERDUS_TROUVES';

export interface Announcement {
  id: number;
  title: string;
  content: string;
  category: AnnouncementCategory;
  author_id: number;
  class_id?: number | null;
  created_at: string;
  author?: User;
}

export type ItemType = 'PERDU' | 'TROUVE';
export type ItemStatus = 'OUVERT' | 'RESOLU' | 'FERME';

export interface LostFoundItem {
  id: number;
  user_id: number;
  item_type: ItemType;
  title: string;
  description: string;
  category?: string;
  color?: string;
  location: string;
  item_date: string;
  photo_path?: string | null;
  status: ItemStatus;
  created_at: string;
  reporter?: User;
}

export type MatchStatus = 'PROPOSEE' | 'CONFIRMEE' | 'REJETEE';

export interface PotentialMatch {
  id: number;
  lost_item_id: number;
  found_item_id: number;
  similarity_score: number;
  status: MatchStatus;
  created_at: string;
  lost_item?: LostFoundItem;
  found_item?: LostFoundItem;
  explanation?: string;
}

export type AbsenceStatus = 'EN_ATTENTE' | 'ACCEPTEE' | 'REFUSEE';

export interface AbsenceRequest {
  id: number;
  student_id: number;
  schedule_id: number;
  reason: string;
  justificatif_path?: string | null;
  status: AbsenceStatus;
  reviewed_by?: number | null;
  reviewed_at?: string | null;
  review_comment?: string | null;
  created_at: string;
  schedule?: ScheduleItem;
}

export type NotificationType =
  | 'NOUVELLE_ANNONCE'
  | 'CHANGEMENT_SEANCE'
  | 'NOUVEL_EXAMEN'
  | 'REPONSE_ABSENCE'
  | 'CORRESPONDANCE_OBJET';

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
  reference_type?: string;
  reference_id?: number;
}

export interface Conversation {
  id: number;
  is_group: boolean;
  title?: string;
  last_message?: string;
  last_message_date?: string;
  unread_count?: number;
  other_user_name?: string;
}

export interface ChatMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  created_at: string;
  is_me?: boolean;
}

export interface AssistantMessage {
  id: string;
  from: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestions?: string[];
  actionType?: 'schedule' | 'exam' | 'absence' | 'lost_found';
}

export interface Grade {
  id: number;
  subject_name: string;
  subject_code: string;
  teacher_name: string;
  grade_type: 'CC' | 'TD' | 'TP' | 'PARTIEL' | 'PROJET';
  value: number;
  max_value: number;
  coefficient: number;
  date: string;
  comment?: string;
  rank?: number;
  class_average?: number;
}

export interface SubjectGrades {
  subject_id: number;
  subject_name: string;
  subject_code: string;
  teacher_name: string;
  ects_credits: number;
  color: string;
  grades: Grade[];
  average: number;
  class_average: number;
  coefficient: number;
  rank?: number;
}

export interface Transcript {
  semester: string;
  year: string;
  overall_average: number;
  class_average: number;
  ects_validated: number;
  ects_total: number;
  rank: number;
  class_size: number;
  mention?: string;
  subjects: SubjectGrades[];
}
