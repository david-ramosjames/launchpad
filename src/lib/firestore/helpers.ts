import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  addDoc,
  writeBatch,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/config";

function db() {
  return getFirebaseDb();
}
import type {
  AppUser,
  LaunchCard,
  Category,
  Announcement,
  UserRole,
  ProfileUpdate,
} from "@/types";

function toDate(value: Timestamp | Date | undefined): Date {
  if (!value) return new Date();
  if (value instanceof Timestamp) return value.toDate();
  return value;
}

export const COLLECTIONS = {
  users: "users",
  cards: "cards",
  categories: "categories",
  announcements: "announcements",
  clickEvents: "clickEvents",
  settings: "settings",
} as const;

// --- Settings ---

export async function getHiddenAttorneyIds(): Promise<string[]> {
  const snap = await getDoc(doc(db(), COLLECTIONS.settings, "caseTracker"));
  const ids = snap.data()?.hiddenAttorneyIds;
  return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string") : [];
}

export async function setHiddenAttorneyIds(ids: string[]): Promise<void> {
  await setDoc(
    doc(db(), COLLECTIONS.settings, "caseTracker"),
    { hiddenAttorneyIds: ids, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

// --- Users ---

function mapUserDoc(d: { id: string; data: () => Record<string, unknown> }): AppUser {
  const data = d.data();
  return {
    id: d.id,
    email: data.email as string,
    displayName: data.displayName as string,
    photoURL: data.photoURL as string | undefined,
    role: data.role as UserRole,
    jobTitle: data.jobTitle as string | undefined,
    department: data.department as string | undefined,
    phone: data.phone as string | undefined,
    bio: data.bio as string | undefined,
    onboardingCompleted: data.onboardingCompleted === true,
    showInDirectory: data.showInDirectory !== false,
    favoriteCardIds: (data.favoriteCardIds as string[]) ?? [],
    recentCardIds: (data.recentCardIds as string[]) ?? [],
    createdAt: toDate(data.createdAt as Timestamp),
    updatedAt: toDate(data.updatedAt as Timestamp),
  };
}

export async function getUserProfile(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db(), COLLECTIONS.users, uid));
  if (!snap.exists()) return null;
  return mapUserDoc(snap);
}

export async function createUserProfile(
  uid: string,
  profile: Omit<AppUser, "id" | "createdAt" | "updatedAt">
): Promise<AppUser> {
  const ref = doc(db(), COLLECTIONS.users, uid);
  const payload = {
    ...profile,
    favoriteCardIds: profile.favoriteCardIds ?? [],
    recentCardIds: profile.recentCardIds ?? [],
    onboardingCompleted: profile.onboardingCompleted ?? false,
    showInDirectory: profile.showInDirectory ?? true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(ref, payload);
  return {
    id: uid,
    ...profile,
    onboardingCompleted: profile.onboardingCompleted ?? false,
    showInDirectory: profile.showInDirectory ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/** Firestore rejects `undefined` in writes — strip or use deleteField. */
function buildProfilePatch(
  updates: Partial<
    Pick<AppUser, "role" | "favoriteCardIds" | "recentCardIds">
  > &
    ProfileUpdate
): Record<string, unknown> {
  const patch: Record<string, unknown> = { updatedAt: serverTimestamp() };
  const optionalStrings = [
    "jobTitle",
    "department",
    "phone",
    "bio",
    "photoURL",
  ] as const;

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) continue;
    if (
      optionalStrings.includes(key as (typeof optionalStrings)[number]) &&
      value === ""
    ) {
      patch[key] = deleteField();
      continue;
    }
    patch[key] = value;
  }

  return patch;
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<
    Pick<AppUser, "role" | "favoriteCardIds" | "recentCardIds">
  > &
    ProfileUpdate
): Promise<void> {
  const ref = doc(db(), COLLECTIONS.users, uid);
  const patch = buildProfilePatch(updates);
  await updateDoc(ref, patch);
}

export async function getAllUsers(): Promise<AppUser[]> {
  const snap = await getDocs(collection(db(), COLLECTIONS.users));
  return snap.docs.map(mapUserDoc);
}

export async function getDirectoryUsers(): Promise<AppUser[]> {
  const users = await getAllUsers();
  return users
    .filter((u) => u.onboardingCompleted && u.showInDirectory)
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

// --- Cards ---

export async function getCards(activeOnly = true): Promise<LaunchCard[]> {
  const q = activeOnly
    ? query(
        collection(db(), COLLECTIONS.cards),
        where("isActive", "==", true),
        orderBy("order", "asc")
      )
    : query(collection(db(), COLLECTIONS.cards), orderBy("order", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map(mapCardDoc);
}

export async function getCard(id: string): Promise<LaunchCard | null> {
  const snap = await getDoc(doc(db(), COLLECTIONS.cards, id));
  if (!snap.exists()) return null;
  return mapCardDoc(snap);
}

function mapCardDoc(d: { id: string; data: () => Record<string, unknown> }): LaunchCard {
  const data = d.data();
  return {
    id: d.id,
    title: data.title as string,
    description: data.description as string,
    icon: (data.icon as string) ?? "grid",
    logoUrl: data.logoUrl as string | undefined,
    categoryId: data.categoryId as string,
    type: data.type as LaunchCard["type"],
    url: data.url as string,
    tags: (data.tags as string[]) ?? [],
    visibilityRoles: (data.visibilityRoles as UserRole[]) ?? [],
    isActive: data.isActive as boolean,
    isNew: data.isNew as boolean,
    isImportant: data.isImportant as boolean,
    order: data.order as number,
    createdAt: toDate(data.createdAt as Timestamp),
    updatedAt: toDate(data.updatedAt as Timestamp),
  };
}

export async function createCard(
  card: Omit<LaunchCard, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const { logoUrl, ...rest } = card;
  const ref = await addDoc(collection(db(), COLLECTIONS.cards), {
    ...rest,
    ...(logoUrl?.trim() ? { logoUrl: logoUrl.trim() } : {}),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateCard(
  id: string,
  updates: Partial<Omit<LaunchCard, "id" | "createdAt" | "updatedAt">>
): Promise<void> {
  const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };
  for (const [k, v] of Object.entries(updates)) {
    if (k === "logoUrl") {
      payload.logoUrl =
        typeof v === "string" && v.trim() ? v.trim() : deleteField();
      continue;
    }
    if (v !== undefined) payload[k] = v;
  }
  await updateDoc(doc(db(), COLLECTIONS.cards, id), payload);
}

export async function deleteCard(id: string): Promise<void> {
  await deleteDoc(doc(db(), COLLECTIONS.cards, id));
}

export async function archiveCard(id: string): Promise<void> {
  await updateCard(id, { isActive: false });
}

// --- Categories ---

export async function getCategories(): Promise<Category[]> {
  const q = query(
    collection(db(), COLLECTIONS.categories),
    where("isActive", "==", true),
    orderBy("order", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      order: data.order,
      isActive: data.isActive,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    };
  });
}

export async function getAllCategories(): Promise<Category[]> {
  const q = query(
    collection(db(), COLLECTIONS.categories),
    orderBy("order", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      order: data.order,
      isActive: data.isActive,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    };
  });
}

export async function createCategory(
  category: Omit<Category, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const ref = await addDoc(collection(db(), COLLECTIONS.categories), {
    ...category,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateCategory(
  id: string,
  updates: Partial<Omit<Category, "id" | "createdAt" | "updatedAt">>
): Promise<void> {
  await updateDoc(doc(db(), COLLECTIONS.categories, id), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCategory(id: string): Promise<void> {
  await deleteDoc(doc(db(), COLLECTIONS.categories, id));
}

// --- Announcements ---

export async function getAnnouncements(): Promise<Announcement[]> {
  const q = query(
    collection(db(), COLLECTIONS.announcements),
    where("isActive", "==", true),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      title: data.title,
      message: data.message,
      visibilityRoles: data.visibilityRoles ?? [],
      isActive: data.isActive,
      priority: data.priority,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    };
  });
}

export async function createAnnouncement(
  announcement: Omit<Announcement, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const ref = await addDoc(collection(db(), COLLECTIONS.announcements), {
    ...announcement,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateAnnouncement(
  id: string,
  updates: Partial<Omit<Announcement, "id" | "createdAt" | "updatedAt">>
): Promise<void> {
  await updateDoc(doc(db(), COLLECTIONS.announcements, id), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

// --- Click events ---

export async function logClickEvent(
  userId: string,
  cardId: string,
  cardTitle: string
): Promise<void> {
  await addDoc(collection(db(), COLLECTIONS.clickEvents), {
    userId,
    cardId,
    cardTitle,
    timestamp: serverTimestamp(),
  });
}

export async function updateRecentCards(
  userId: string,
  cardId: string,
  currentRecent: string[]
): Promise<string[]> {
  const updated = [cardId, ...currentRecent.filter((id) => id !== cardId)].slice(
    0,
    8
  );
  await updateUserProfile(userId, { recentCardIds: updated });
  return updated;
}

export async function toggleFavorite(
  userId: string,
  cardId: string,
  currentFavorites: string[]
): Promise<string[]> {
  const isFav = currentFavorites.includes(cardId);
  const updated = isFav
    ? currentFavorites.filter((id) => id !== cardId)
    : [...currentFavorites, cardId];
  await updateUserProfile(userId, { favoriteCardIds: updated });
  return updated;
}

// --- Seed ---

export async function seedDatabase(
  categories: Omit<Category, "id" | "createdAt" | "updatedAt">[],
  cards: Omit<LaunchCard, "id" | "createdAt" | "updatedAt">[]
): Promise<{ categoryIds: Record<string, string> }> {
  const batch = writeBatch(db());
  const categoryIds: Record<string, string> = {};

  for (const cat of categories) {
    const ref = doc(collection(db(), COLLECTIONS.categories));
    categoryIds[cat.slug] = ref.id;
    batch.set(ref, {
      ...cat,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  await batch.commit();

  const cardBatch = writeBatch(db());
  for (const card of cards) {
    const ref = doc(collection(db(), COLLECTIONS.cards));
    const categoryId = categoryIds[card.categoryId] ?? card.categoryId;
    cardBatch.set(ref, {
      ...card,
      categoryId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  await cardBatch.commit();

  return { categoryIds };
}
