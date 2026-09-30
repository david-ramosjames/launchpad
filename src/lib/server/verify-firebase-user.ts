import { isEmailApproved, getDefaultRoleForEmail } from "@/lib/auth/allowed-users";
import { isAdminRole, type UserRole } from "@/types";

export interface VerifiedUser {
  uid: string;
  email: string;
  role: UserRole;
  isAdmin: boolean;
  idToken: string;
}

type FirestoreValue = {
  stringValue?: string;
  arrayValue?: { values?: FirestoreValue[] };
};

/** Reads a Firestore document as the signed-in user, so security rules apply. */
export async function readFirestoreDoc(
  idToken: string,
  path: string
): Promise<Record<string, FirestoreValue> | null> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) return null;
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}`,
    { headers: { Authorization: `Bearer ${idToken}` }, cache: "no-store" }
  );
  if (!res.ok) return null;
  const doc = (await res.json()) as { fields?: Record<string, FirestoreValue> };
  return doc.fields ?? {};
}

export function stringArrayField(value: FirestoreValue | undefined): string[] {
  return (value?.arrayValue?.values ?? [])
    .map((v) => v.stringValue)
    .filter((v): v is string => Boolean(v));
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
  const profile = await readFirestoreDoc(idToken, `users/${account.localId}`);
  const stored = profile?.role?.stringValue as UserRole | undefined;
  if (stored && ROLES.includes(stored) && role !== "super_admin") role = stored;

  return { uid: account.localId, email, role, isAdmin: isAdminRole(role), idToken };
}
