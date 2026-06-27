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
  brands: string[];
  onboardingComplete: boolean;
};

type AuthContextType = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<string | null>;
  logout: () => Promise<void>;
  updatePreferences: (preferences: string[], brands?: string[]) => Promise<void>;
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
          if (!u) { setProfile(null); finish(); return; }

          // u.photoURL이 null인 경우 providerData(구글 등)에서 직접 가져옴
          const freshPhoto = u.photoURL
            || u.providerData?.find(p => p.photoURL)?.photoURL
            || "";
          const freshName = u.displayName
            || u.providerData?.find(p => p.displayName)?.displayName
            || "";

          // Firestore 실패해도 Auth 기본값으로 프로필 표시
          const authFallback: UserProfile = {
            uid: u.uid,
            photoURL: freshPhoto,
            displayName: freshName,
            email: u.email ?? "",
            preferences: [],
            brands: [],
            onboardingComplete: false,
          };

          try {
            const ref = doc(db, "users", u.uid);
            const snap = await getDoc(ref);

            if (snap.exists()) {
              const stored = snap.data() as UserProfile;
              // Auth 값이 있을 때만 Firestore 값을 덮어씀
              const merged: UserProfile = {
                ...stored,
                ...(freshPhoto ? { photoURL: freshPhoto } : {}),
                ...(freshName ? { displayName: freshName } : {}),
                email: u.email ?? stored.email,
              };
              // photoURL이 달라졌으면 Firestore도 업데이트
              if (freshPhoto && stored.photoURL !== freshPhoto) {
                const { updateDoc } = await import("firebase/firestore");
                await updateDoc(ref, { photoURL: freshPhoto });
              }
              setProfile(merged);
            } else {
              await setDoc(ref, authFallback);
              setProfile(authFallback);
            }
          } catch (err) {
            console.error("Firestore error:", err);
            // Firestore 실패해도 Auth 정보로 기본 표시
            setProfile(authFallback);
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

  async function updatePreferences(preferences: string[], brands: string[] = []) {
    if (!user) return;
    const { getFirestore, doc, setDoc } = await import("firebase/firestore");
    const db = getFirestore(app);
    const ref = doc(db, "users", user.uid);
    await setDoc(ref, { preferences, brands, onboardingComplete: true }, { merge: true });
    setProfile((prev) => (prev ? { ...prev, preferences, brands, onboardingComplete: true } : prev));
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
