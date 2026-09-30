export type UserRole = "viewer" | "editor" | "admin" | "super_admin";

export type CardType =
  | "external_link"
  | "internal_tool"
  | "training"
  | "document"
  | "dashboard";

export interface AppUser {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  jobTitle?: string;
  department?: string;
  phone?: string;
  bio?: string;
  onboardingCompleted: boolean;
  showInDirectory: boolean;
  favoriteCardIds: string[];
  recentCardIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type ProfileUpdate = Partial<
  Pick<
    AppUser,
    | "displayName"
    | "photoURL"
    | "jobTitle"
    | "department"
    | "phone"
    | "bio"
    | "showInDirectory"
    | "onboardingCompleted"
  >
>;

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  order: number;
  isActive: boolean;
  /** User IDs who can see this category. Empty means everyone. */
  allowedUserIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export function canSeeCategory(
  category: Pick<Category, "allowedUserIds">,
  userId: string,
  role: UserRole
): boolean {
  if (category.allowedUserIds.length === 0) return true;
  if (isAdminRole(role)) return true;
  return category.allowedUserIds.includes(userId);
}

export interface LaunchCard {
  id: string;
  title: string;
  description: string;
  /** Lucide-style key; see app icon map / add keys in code. Fallback when no logoUrl. */
  icon: string;
  /** Optional square logo (https URL). Shown on the dashboard when set. */
  logoUrl?: string;
  categoryId: string;
  type: CardType;
  /** Where the card opens: full https URL, internal path like /directory, or # for placeholder */
  url: string;
  tags: string[];
  visibilityRoles: UserRole[];
  isActive: boolean;
  isNew: boolean;
  isImportant: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  visibilityRoles: UserRole[];
  isActive: boolean;
  priority: "low" | "normal" | "high";
  createdAt: Date;
  updatedAt: Date;
}

export interface ClickEvent {
  id: string;
  userId: string;
  cardId: string;
  cardTitle: string;
  timestamp: Date;
}

export const ALL_ROLES: UserRole[] = [
  "viewer",
  "editor",
  "admin",
  "super_admin",
];

export const DEPARTMENTS = [
  "Attorneys",
  "Paralegals",
  "Legal Assistants",
  "Intake",
  "Marketing",
  "Operations",
  "Administration",
  "IT",
  "Other",
] as const;

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  viewer: 0,
  editor: 1,
  admin: 2,
  super_admin: 3,
};

export function hasMinimumRole(
  userRole: UserRole,
  requiredRole: UserRole
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function canAccessCard(
  userRole: UserRole,
  visibilityRoles: UserRole[]
): boolean {
  if (visibilityRoles.length === 0) return true;
  return visibilityRoles.some(
    (role) => ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[role]
  );
}

export function isAdminRole(role: UserRole): boolean {
  return role === "admin" || role === "super_admin";
}

export function needsOnboarding(user: AppUser | null): boolean {
  if (!user) return false;
  return user.onboardingCompleted !== true;
}
