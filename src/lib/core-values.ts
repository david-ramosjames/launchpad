import type { LucideIcon } from "lucide-react";
import {
  ShieldCheck,
  Heart,
  Handshake,
  Megaphone,
  Target,
} from "lucide-react";

export interface CoreValue {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export const CORE_VALUES: CoreValue[] = [
  {
    id: "integrity",
    title: "Integrity",
    description:
      "We live up to our word, we say what we mean and mean what we say; we're honest",
    icon: ShieldCheck,
  },
  {
    id: "compassion",
    title: "Compassion",
    description: "We put people FIRST; we listen because we care",
    icon: Heart,
  },
  {
    id: "trust",
    title: "Trust",
    description: "Earned through respect and communication",
    icon: Handshake,
  },
  {
    id: "advocacy",
    title: "Advocacy",
    description:
      "We are the voice of those who can't speak on their own behalf; we do it through experience, competency and hard work",
    icon: Megaphone,
  },
  {
    id: "results",
    title: "Results",
    description:
      "We aim to achieve the most it takes to make our clients whole",
    icon: Target,
  },
];
