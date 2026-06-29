"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { app } from "@/lib/firebase";

const ADMIN_EMAILS = ["js.yoo@ablelia.com"];

const DEFAULT_SLIDES = [
  { title: "국내 모든 패션\n한눈에 비교", desc: "무신사·에이블리·지그재그\n가격을 앱 하나로 비교하세요" },
  { title: "지금 인기 있는\n아이템 먼저", desc: "가장 많이 찜 받은 상품을\n실시간으로 발견하세요" },
  { title: "로그인하고\n내 스타일 저장", desc: "취향에 맞는 상품 추천과\n찜 목록을 언제나 확인하세요" },
];

type Slide = { title: string; desc: string };
type UserRow = {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  preferences: string[];
  genders: string[];
  ageGroups: string[];
  onboardingComplete: boolean;
};

export default function AdminPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"onboarding" | "users">("onboarding");

  // 온보딩 문구
  const [slides, setSlides] = useState<Slide[]>(DEFAULT_SLIDES);
  const [slidesLoading, setSlidesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // 사용자 목록
  const [users, setUsers] = useState<UserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");

  const isAdmin = !!profile && ADMIN_EMAILS.includes(profile.email);

  // 온보딩 Firestore에서 로드
  useEffect(() => {
    if (!isAdmin) return;
    async function loadSlides() {
      try {
        const { getFirestore, doc, getDoc } = await import("firebase/firestore");
        const db = getFirestore(app);
        const snap = await getDoc(doc(db, "config", "onboarding"));
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.slides)) setSlides(data.slides as Slide[]);
        }
      } catch {
        // Firestore 권한 없으면 기본값 유지
      } finally {
        setSlidesLoading(false);
      }
    }
    loadSlides();
  }, [isAdmin]);

  // 사용자 목록 로드 (탭 전환 시)
  useEffect(() => {
    if (tab !== "users" || !isAdmin) return;
    setUsersLoading(true);
    setUsersError("");
    async function loadUsers() {
      try {
        const { getFirestore, collection, getDocs } = await import("firebase/firestore");
        const db = getFirestore(app);
        const snap = await getDocs(collection(db, "users"));
        const rows: UserRow[] = snap.docs.map(d => {
          const data = d.data();
          return {
            uid: d.id,
            displayName: data.displayName ?? "",
            email: data.email ?? "",
            photoURL: data.photoURL ?? "",
            preferences: data.preferences ?? [],
            genders: data.genders ?? [],
            ageGroups: data.ageGroups ?? [],
            onboardingComplete: data.onboardingComplete ?? false,
          };
        });
        rows.sort((a, b) => a.displayName.localeCompare(b.displayName));
        setUsers(rows);
      } catch (e: unknown) {
        const code = (e as { code?: string })?.code ?? String(e);
        if (code.includes("permission")) {
          setUsersError("Firestore 규칙에서 관리자 읽기 권한을 허용해주세요.\nmatch /users/{uid} { allow read: if request.auth.token.email == \"js.yoo@ablelia.com\"; }");
        } else {
          setUsersError(code);
        }
      } finally {
        setUsersLoading(false);
      }
    }
    loadUsers();
  }, [tab, isAdmin]);

  async function saveSlides() {
    setSaving(true);
    setSaveMsg("");
    try {
      const { getFirestore, doc, setDoc } = await import("firebase/firestore");
      const db = getFirestore(app);
      await setDoc(doc(db, "config", "onboarding"), { slides }, { merge: true });
      setSaveMsg("저장 완료!");
    } catch (e: unknown) {
      setSaveMsg("저장 실패: " + ((e as { code?: string })?.code ?? String(e)));
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 3000);
    }
  }

  function updateSlide(i: number, field: "title" | "desc", val: string) {
    setSlides(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F0E6]">
      <div className="w-6 h-6 border-2 border-[#FF3D7F] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F0E6] gap-4">
      <p className="text-sm font-bold text-[#1A1A1A]">로그인이 필요합니다</p>
      <button onClick={() => router.push("/")} className="text-xs text-[#FF3D7F] font-semibold">홈으로 이동</button>
    </div>
  );

  if (!isAdmin) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F0E6] gap-4">
      <p className="text-sm font-bold text-[#1A1A1A]">접근 권한이 없습니다</p>
      <p className="text-xs text-gray-400">{profile?.email}</p>
      <button onClick={() => router.push("/")} className="text-xs text-[#FF3D7F] font-semibold">홈으로 이동</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F0E6]">
      {/* 헤더 */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur">
        <header className="border-b border-gray-100 px-5 py-3 flex items-center gap-3">
          <button onClick={() => router.push("/")} className="w-8 h-8 bg-[#F7F0E6] rounded-full flex items-center justify-center">
            <svg width="14" height="14" fill="none" stroke="#1A1A1A" strokeWidth="2.2" viewBox="0 0 24 24">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>
          <span className="text-[10px] font-black tracking-widest text-[#FF3D7F] uppercase">ADMIN</span>
          <span className="ml-auto text-xs text-gray-400">{profile.email}</span>
        </header>

        {/* 탭 */}
        <div className="flex border-b border-gray-100">
          {(["onboarding", "users"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-3 text-xs font-bold transition-colors ${
                tab === t ? "text-[#FF3D7F] border-b-2 border-[#FF3D7F]" : "text-gray-400"
              }`}>
              {t === "onboarding" ? "온보딩 문구" : "사용자 목록"}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* 온보딩 문구 편집 */}
        {tab === "onboarding" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400">앱 첫 실행 시 보이는 3단계 슬라이드 문구입니다</p>
            </div>

            {slidesLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-5 h-5 border-2 border-[#FF3D7F] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              slides.map((slide, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 shadow-sm">
                  <p className="text-[10px] font-black tracking-widest text-[#FF3D7F] uppercase mb-3">
                    STEP {i + 1}
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">제목</label>
                      <textarea
                        value={slide.title}
                        onChange={e => updateSlide(i, "title", e.target.value)}
                        rows={2}
                        className="w-full text-sm font-bold text-[#1A1A1A] border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:border-[#FF3D7F] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">설명</label>
                      <textarea
                        value={slide.desc}
                        onChange={e => updateSlide(i, "desc", e.target.value)}
                        rows={2}
                        className="w-full text-sm text-gray-500 border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:border-[#FF3D7F] transition-colors"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}

            <div className="flex items-center gap-3 pt-2">
              <button onClick={saveSlides} disabled={saving || slidesLoading}
                className="flex-1 py-3 rounded-xl text-sm font-bold bg-[#FF3D7F] text-white disabled:opacity-50 transition-opacity">
                {saving ? "저장 중..." : "저장하기"}
              </button>
              {saveMsg && (
                <span className={`text-xs font-semibold ${saveMsg.startsWith("저장 완료") ? "text-green-500" : "text-red-500"}`}>
                  {saveMsg}
                </span>
              )}
            </div>

          </div>
        )}

        {/* 사용자 목록 */}
        {tab === "users" && (
          <div className="space-y-3">
            <p className="text-xs text-gray-400">가입한 사용자 {usersLoading ? "" : `${users.length}명`}</p>

            {usersLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-5 h-5 border-2 border-[#FF3D7F] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : usersError ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-xs font-bold text-red-600 mb-2">불러오기 실패</p>
                <pre className="text-[10px] text-red-500 whitespace-pre-wrap font-mono">{usersError}</pre>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-16 text-sm text-gray-400">사용자 없음</div>
            ) : (
              users.map(u => (
                <div key={u.uid} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    {u.photoURL ? (
                      <img src={u.photoURL} alt={u.displayName} referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[#FF3D7F] flex items-center justify-center text-white text-sm font-black shrink-0">
                        {u.displayName?.[0] ?? "?"}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-[#1A1A1A] truncate">{u.displayName || "이름 없음"}</p>
                        {ADMIN_EMAILS.includes(u.email) && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-[#1A1A1A] text-white shrink-0">최고관리자</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate">{u.email}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${
                      u.onboardingComplete ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"
                    }`}>
                      {u.onboardingComplete ? "설정 완료" : "미설정"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {u.genders.map(g => (
                      <span key={g} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFF0F5] text-[#FF3D7F]">{g}</span>
                    ))}
                    {u.ageGroups.map(a => (
                      <span key={a} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFF0F5] text-[#FF3D7F]">{a}</span>
                    ))}
                    {u.preferences.map(p => (
                      <span key={p} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{p}</span>
                    ))}
                  </div>
                </div>
              ))
            )}

          </div>
        )}
      </div>
    </div>
  );
}
