/**
 * SkillUp Digitech Academy — Centralized Semantic Iconography Map (Rebrand V2)
 * Standardizes Lucide React icons at 1.75px stroke weight across Public, Student,
 * Instructor, and Admin portals.
 */
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  Brain,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Code2,
  Compass,
  CreditCard,
  FileCheck2,
  FolderGit2,
  GraduationCap,
  HelpCircle,
  Info,
  Laptop,
  Layers,
  LayoutDashboard,
  MapPin,
  MessageSquare,
  Palette,
  Play,
  QrCode,
  Rocket,
  Search,
  Settings,
  Share2,
  ShieldCheck,
  Sparkles,
  Users,
  Video,
  Wifi,
  Zap,
} from "lucide-react"

export const ICON_STROKE_WIDTH = 1.75

export const SkillUpIcons = {
  // Navigation & Workspaces
  dashboard: LayoutDashboard,
  explore: Compass,
  courses: BookOpen,
  search: Search,
  settings: Settings,
  arrowRight: ArrowRight,

  // Learning & Tracks
  software: Code2,
  ai: Brain,
  design: Palette,
  social: Share2,
  video: Video,
  pathway: Layers,
  project: FolderGit2,
  play: Play,
  milestone: Rocket,

  // Academy Operations & Campuses
  campus: Building2,
  location: MapPin,
  schedule: Calendar,
  duration: Clock,
  cohort: Users,
  laptop: Laptop,
  power: Zap,
  wifi: Wifi,

  // Assessment, Credentials & Governance
  graduation: GraduationCap,
  certificate: Award,
  verify: ShieldCheck,
  qr: QrCode,
  rubric: ClipboardCheck,
  submission: FileCheck2,
  analytics: BarChart3,
  billing: CreditCard,
  message: MessageSquare,
  highlight: Sparkles,

  // Feedback & Status
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
  info: Info,
  help: HelpCircle,
} as const

export type SkillUpIconKey = keyof typeof SkillUpIcons
