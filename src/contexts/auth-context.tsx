"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { getFirebaseAuth, getGoogleProvider } from "@/lib/firebase/config";
import {
  getUserProfile,
  createUserProfile,
} from "@/lib/firestore/helpers";
import {
  isEmailApproved,
  getDefaultRoleForEmail,
} from "@/lib/auth/allowed-users";
import type { AppUser } from "@/types";

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  appUser: AppUser | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setAppUser: (user: AppUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async (user: FirebaseUser) => {
    let profile = await getUserProfile(user.uid);
    if (!profile) {
      profile = await createUserProfile(user.uid, {
        email: user.email ?? "",
        displayName: user.displayName ?? user.email ?? "User",
        photoURL: user.photoURL ?? undefined,
        role: getDefaultRoleForEmail(user.email ?? ""),
        favoriteCardIds: [],
        recentCardIds: [],
        onboardingCompleted: false,
        showInDirectory: true,
      });
    }
    setAppUser(profile);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(getFirebaseAuth(), async (user) => {
      setLoading(true);
      setError(null);
      if (!user) {
        setFirebaseUser(null);
        setAppUser(null);
        setLoading(false);
        return;
      }

      if (!user.email || !isEmailApproved(user.email)) {
        await firebaseSignOut(getFirebaseAuth());
        setFirebaseUser(null);
        setAppUser(null);
        setError(
          "Access restricted. Please sign in with an approved Ramos James Law account."
        );
        setLoading(false);
        return;
      }

      setFirebaseUser(user);
      try {
        await loadProfile(user);
      } catch {
        setError("Failed to load your profile. Please try again.");
      }
      setLoading(false);
    });
    return () => unsub();
  }, [loadProfile]);

  const signInWithGoogle = async () => {
    setError(null);
    try {
      const result = await signInWithPopup(getFirebaseAuth(), getGoogleProvider());
      if (!result.user.email || !isEmailApproved(result.user.email)) {
        await firebaseSignOut(getFirebaseAuth());
        setError(
          "Access restricted. Please sign in with an approved Ramos James Law account."
        );
      }
    } catch {
      setError("Sign in failed. Please try again.");
    }
  };

  const signOut = async () => {
    await firebaseSignOut(getFirebaseAuth());
    setFirebaseUser(null);
    setAppUser(null);
  };

  const refreshUser = async () => {
    if (firebaseUser) await loadProfile(firebaseUser);
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        appUser,
        loading,
        error,
        signInWithGoogle,
        signOut,
        refreshUser,
        setAppUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
