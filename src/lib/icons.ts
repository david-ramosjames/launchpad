import {
  MessageSquare,
  Cloud,
  HardDrive,
  Workflow,
  Phone,
  FileSignature,
  GraduationCap,
  BookOpen,
  Briefcase,
  Globe,
  Share2,
  MapPin,
  LayoutGrid,
  Users,
  Megaphone,
  Settings,
  Calendar,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  slack: MessageSquare,
  dropbox: Cloud,
  "google-drive": HardDrive,
  docketflow: Workflow,
  "docket-flow": Workflow,
  quo: Phone,
  callrail: Phone,
  "adobe-sign": FileSignature,
  docuseal: FileSignature,
  training: GraduationCap,
  "sop-library": BookOpen,
  "case-tracker": Briefcase,
  "website-admin": Globe,
  "social-media": Share2,
  "google-business": MapPin,
  grid: LayoutGrid,
  users: Users,
  directory: Users,
  megaphone: Megaphone,
  settings: Settings,
  calendar: Calendar,
};

export function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? LayoutGrid;
}
