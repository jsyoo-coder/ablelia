"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { app } from "@/lib/firebase";

type UserProfile = {
  uid: string;
  displayName: string;
  photoURL: string;
  email: string;
  preferences: string[];
  onboardingComplete: boolean;
};

type AuthContextType = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updatePreferences: (preferences: string[]) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function init() {
      // getAuth / getFirestore는 브라우저(useEffect)에서만 호출
      const { getAuth, onAuthStateChanged } = await import("firebase/auth");
      const { getFirestore, doc, getDoc, setDoc } = await import("firebase/firestore");
      const auth = getAuth(app);
      const db = getFirestore(app);

      unsubscribe = onAuthStateChanged(auth, async (u) => {
        setUser(u);
        if (u) {
          const ref = doc(db, "users", u.uid);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            setProfile(snap.data() as UserProfile);
          } else {
            const newProfile: UserProfile = {
              uid: u.uid,
              displayName: u.displayName ?? "",
              photoURL: u.photoURL ?? "",
              email: u.email ?? "",
              preferences: [],
              onboardingComplete: false,
            };
            await setDoc(ref, newProfile);
            setProfile(newProfile);
          }
        } else {
          setProfile(null);
        }
        setLoading(false);
      });
    }

    init();
    return () => unsubscribe?.();
  }, []);

  async function signInWithGoogle() {
    const { getAuth, GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
    const auth = getAuth(app);
    await signInWithPopup(auth, new GoogleAuthProvider());
  }

  async function logout() {
    const { getAuth, signOut } = await import("firebase/auth");
    const auth = getAuth(app);
    await signOut(auth);
  }

  async function updatePreferences(preferences: string[]) {
    if (!user) return;
    const { getFirestore, doc, setDoc } = await import("firebase/firestore");
    const db = getFirestore(app);
    const ref = doc(db, "users", user.uid);
    await setDoc(ref, { preferences, onboardingComplete: true }, { merge: true });
    setProfile((prev) => (prev ? { ...prev, preferences, onboardingComplete: true } : prev));
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, logout, updatePreferences }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
