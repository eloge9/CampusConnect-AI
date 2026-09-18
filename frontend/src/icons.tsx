import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  Bell,
  BookOpen,
  Briefcase,
  Calendar,
  CircleAlert,
  CircleCheck,
  ClipboardList,
  Clock,
  Cpu,
  FileText,
  GraduationCap,
  IdCard,
  LayoutDashboard,
  MapPin,
  MessageSquare,
  Search,
  Send,
  Shield,
  X,
  Sparkles,
  User,
  Users,
} from 'lucide-react'

const stroke = {
  strokeWidth: 1.75,
}

type IconProps = { size?: number; className?: string }

function wrap(Icon: LucideIcon) {
  return function BrandIcon({ size = 18, className }: IconProps) {
    return <Icon size={size} className={className} {...stroke} aria-hidden="true" />
  }
}

/** Set unique Lucide, trait 1.75px, outline — mêmes glyphes pour les mêmes actions. */
export const Icons = {
  layout: wrap(LayoutDashboard),
  calendar: wrap(Calendar),
  book: wrap(BookOpen),
  clipboard: wrap(ClipboardList),
  message: wrap(MessageSquare),
  search: wrap(Search),
  spark: wrap(Sparkles),
  bag: wrap(Briefcase),
  bell: wrap(Bell),
  clock: wrap(Clock),
  map: wrap(MapPin),
  user: wrap(User),
  send: wrap(Send),
  check: wrap(CircleCheck),
  alert: wrap(CircleAlert),
  file: wrap(FileText),
  users: wrap(Users),
  shield: wrap(Shield),
  activity: wrap(Activity),
  id: wrap(IdCard),
  cpu: wrap(Cpu),
  grad: wrap(GraduationCap),
  close: wrap(X),
}

export type IconName = keyof typeof Icons
