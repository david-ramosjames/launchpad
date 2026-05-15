import type { UserRole } from "@/types";

const APPROVED_DOMAINS = (
  process.env.NEXT_PUBLIC_APPROVED_DOMAINS ?? "ramosjameslaw.com"
)
  .split(",")
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

const APPROVED_EMAILS = (
  process.env.NEXT_PUBLIC_APPROVED_EMAILS ?? ""
)
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const SUPER_ADMIN_EMAILS = (
  process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS ?? ""
)
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isEmailApproved(email: string): boolean {
  const normalized = email.toLowerCase().trim();
  if (APPROVED_EMAILS.includes(normalized)) return true;
  const domain = normalized.split("@")[1];
  return domain ? APPROVED_DOMAINS.includes(domain) : false;
}

export function getDefaultRoleForEmail(email: string): UserRole {
  const normalized = email.toLowerCase().trim();
  if (SUPER_ADMIN_EMAILS.includes(normalized)) return "super_admin";
  return "viewer";
}
