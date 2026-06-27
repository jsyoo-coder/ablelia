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
    let settled = false;

    function finish() {
      if (!settled) { settled = true; setLoading(false); }
    }

    // 5초 안에 Firebase가 응답 없으면 강제 로딩 해제
    const timeout = setTimeout(finish, 5000);

    async function init() {
      try {
        const { getAuth, onAuthStateChanged } = await import("firebase/auth");
        const { getFirestore, doc, getDoc, setDoc } = await import("firebase/firestore");
        const auth = getAuth(app);
        const db = getFirestore(app);

        unsubscribe = onAuthStateChanged(auth, async (u) => {
          setUser(u);
          try {
            if (u) {
              const ref = doc(db, "users", u.uid);
              const snap = await getDoc(ref);
              // Firebase Auth의 photoURL/displayName은 항상 최신 — Firestore 값 위에 덮어씀
              const authOverride = {
                photoURL: u.photoURL ?? "",
                displayName: u.displayName ?? "",
                email: u.email ?? "",
              };
              if (snap.exists()) {
                const stored = snap.data() as UserProfile;
                const merged = { ...stored, ...authOverride };
                // photoURL이 바뀌었으면 Firestore도 업데이트
                if (stored.photoURL !== authOverride.photoURL && authOverride.photoURL) {
                  const { updateDoc } = await import("firebase/firestore");
                  await updateDoc(ref, { photoURL: authOverride.photoURL });
                }
                setProfile(merged);
              } else {
                const newProfile: UserProfile = {
                  uid: u.uid,
                  preferences: [],
                  onboardingComplete: false,
                  ...authOverride,
                };
                await setDoc(ref, newProfile);
                setProfile(newProfile);
              }
            } else {
              setProfile(null);
            }
          } catch (err) {
            console.error("Firestore error:", err);
            setProfile(null);
          } finally {
            finish();
          }
        });
      } catch (err) {
        console.error("Firebase init error:", err);
        finish();
      }
    }

    init();
    return () => { unsubscribe?.(); clearTimeout(timeout); };
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
