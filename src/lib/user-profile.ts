import type { AppUser } from "@/types";

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function formatRole(role: AppUser["role"]): string {
  return role.replace("_", " ");
}
