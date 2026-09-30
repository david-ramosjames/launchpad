import { isEmailApproved, getDefaultRoleForEmail } from "@/lib/auth/allowed-users";
import { isAdminRole, type UserRole } from "@/types";

export interface VerifiedUser {
  uid: string;
  email: string;
  role: UserRole;
  isAdmin: boolean;
}

const ROLES: UserRole[] = ["viewer", "editor", "admin", "super_admin"];

/**
 * Verifies a Firebase ID token without a service account by asking Google's
 * Identity Toolkit to resolve it, then reads the user's role from Firestore
 * using the same token (so Firestore security rules still apply).
 */
export async function verifyFirebaseUser(request: Request): Promise<VerifiedUser | null> {
  const header = request.headers.get("authorization") ?? "";
  const idToken = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!idToken) return null;

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!apiKey || !projectId) return null;

  const lookup = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
      cache: "no-store",
    }
  );
  if (!lookup.ok) return null;

  const data = (await lookup.json()) as {
    users?: { localId: string; email?: string; emailVerified?: boolean }[];
  };
  const account = data.users?.[0];
  const email = account?.email?.toLowerCase().trim();
  if (!account || !email || !account.emailVerified || !isEmailApproved(email)) {
    return null;
  }

  let role: UserRole = getDefaultRoleForEmail(email);
  const profile = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${account.localId}`,
    { headers: { Authorization: `Bearer ${idToken}` }, cache: "no-store" }
  );
  if (profile.ok) {
    const doc = (await profile.json()) as {
      fields?: { role?: { stringValue?: string } };
    };
    const stored = doc.fields?.role?.stringValue as UserRole | undefined;
    if (stored && ROLES.includes(stored) && role !== "super_admin") role = stored;
  }

  return { uid: account.localId, email, role, isAdmin: isAdminRole(role) };
}
