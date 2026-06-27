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
  signInWithGoogle: () => Promise<string | null>;
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

  async function signInWithGoogle(): Promise<string | null> {
    try {
      const { getAuth, GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
      const auth = getAuth(app);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
      return null;
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code ?? "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return null;
      if (code === "auth/unauthorized-domain") return "이 도메인이 Firebase에 등록되지 않았습니다. Firebase Console → Authentication → Settings → Authorized domains에 현재 주소를 추가해주세요.";
      if (code === "auth/invalid-api-key") return "Firebase 환경변수가 Vercel에 설정되지 않았습니다.";
      return `로그인 실패: ${code || String(e)}`;
    }
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
