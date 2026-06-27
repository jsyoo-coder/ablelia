"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const STYLES = [
  { id: "minimal",  label: "미니멀",   q: "미니멀 베이직 패션" },
  { id: "street",   label: "스트릿",   q: "스트릿 그래픽 오버핏" },
  { id: "casual",   label: "캐주얼",   q: "캐주얼 데일리 룩" },
  { id: "formal",   label: "포멀",     q: "슬랙스 블레이저 포멀" },
  { id: "vintage",  label: "빈티지",   q: "빈티지 레트로 데님" },
  { id: "sporty",   label: "스포티",   q: "스포티 트레이닝 애슬레저" },
  { id: "feminine", label: "페미닌",   q: "플로럴 원피스 페미닌" },
  { id: "outdoor",  label: "아웃도어", q: "아웃도어 고어텍스" },
  { id: "luxury",   label: "럭셔리",   q: "하이엔드 럭셔리 패션" },
  { id: "y2k",      label: "Y2K",      q: "Y2K 로우라이즈" },
  { id: "amekaji",  label: "아메카지", q: "아메카지 워크웨어" },
  { id: "preppy",   label: "프레피",   q: "프레피 컬리지룩" },
];

export default function ProfilePage() {
  const { user, profile, loading, logout, updatePreferences } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(false);
  const [styleImgs, setStyleImgs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (loading) return;
    if (!user || !profile) { router.push("/"); return; }
    setSelected(profile.preferences ?? []);
  }, [loading, user, profile]);

  useEffect(() => {
    async function loadImages() {
      const entries = await Promise.allSettled(
        STYLES.map(async (s) => {
          const res = await fetch(`/api/search?q=${encodeURIComponent(s.q)}&display=5`);
          const data = await res.json();
          const img = (data.items ?? []).find((i: { image?: string }) => i.image)?.image ?? "";
          return { id: s.id, img };
        })
      );
      const map: Record<string, string> = {};
      entries.forEach(r => { if (r.status === "fulfilled" && r.value.img) map[r.value.id] = r.value.img; });
      setStyleImgs(map);
    }
    loadImages();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#F7F0E6" }}>
      <div className="w-6 h-6 border-2 border-[#FF3D7F] border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user || !profile) return null;

  function toggle(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
    setSaved(false);
  }

  async function handleSave() {
    if (selected.length < 1) return;
    setSaving(true);
    try {
      await updatePreferences(selected, []);
      setToast(true);
      setTimeout(() => { setToast(false); router.push("/"); }, 1800);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <div className="min-h-screen pb-10" style={{ background: "#F7F0E6" }}>
      {/* 토스트 */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
        toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
      }`}>
        <div className="flex items-center gap-2 bg-[#1A1A1A] text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl">
          <svg width="16" height="16" fill="none" stroke="#FF3D7F" strokeWidth="3" viewBox="0 0 24 24">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          취향이 저장됐어요
        </div>
      </div>
      <header className="px-5 pt-5 pb-4 flex items-center justify-between">
        <button onClick={() => router.push("/")}
          className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm">
          <svg width="16" height="16" fill="none" stroke="#1A1A1A" strokeWidth="2.2" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <h1 className="text-sm font-black tracking-widest uppercase text-[#1A1A1A]">프로필</h1>
        <button onClick={handleLogout}
          className="text-xs font-semibold text-gray-400 hover:text-[#FF3D7F] transition-colors">
          로그아웃
        </button>
      </header>

      <div className="max-w-md mx-auto px-5">
        <div className="bg-white rounded-3xl p-4 flex items-center gap-3 mb-6 shadow-sm">
          {profile.photoURL ? (
            <img src={profile.photoURL} alt="" className="w-14 h-14 rounded-full shrink-0" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-[#FF3D7F] flex items-center justify-center text-white text-xl font-black shrink-0">
              {profile.displayName?.[0]}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-bold text-[#1A1A1A] truncate">{profile.displayName}</p>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{profile.email}</p>
            <p className="text-xs text-[#FF3D7F] font-semibold mt-1">스타일 {selected.length}개 선택</p>
          </div>
        </div>

        <p className="text-[10px] font-black tracking-widest text-[#FF3D7F] uppercase mb-1">CATEGORIES</p>
        <p className="text-xs text-gray-400 mb-3">홈 피드에 반영됩니다</p>
        <div className="grid grid-cols-3 gap-2.5 mb-6">
          {STYLES.map(s => {
            const on = selected.includes(s.id);
            const img = styleImgs[s.id];
            return (
              <button key={s.id} onClick={() => toggle(s.id)}
                className={`relative flex flex-col items-end justify-end overflow-hidden rounded-3xl transition-all aspect-square ${
                  on ? "ring-[3px] ring-[#FF3D7F] shadow-lg z-10" : "shadow-sm hover:shadow-md"
                }`}>
                {img ? <img src={img} alt={s.label} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                  : <div className="absolute inset-0 bg-[#EDE6DA] animate-pulse" />}
                <div className="absolute inset-0" style={{ background: on ? "linear-gradient(to top, rgba(255,61,127,0.85) 0%, rgba(255,61,127,0.3) 50%, rgba(0,0,0,0.1) 100%)" : "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)" }} />
                {on && <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow">
                  <svg width="11" height="11" fill="none" stroke="#FF3D7F" strokeWidth="3" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                </div>}
                <div className="relative z-10 pb-2.5 px-2 w-full">
                  <p className="text-white text-xs font-black drop-shadow">{s.label}</p>
                </div>
              </button>
            );
          })}
        </div>

        <button onClick={handleSave} disabled={selected.length < 1 || saving}
          className={`w-full py-4 rounded-2xl text-sm font-bold transition-all ${
            selected.length >= 1 ? "bg-[#FF3D7F] text-white hover:bg-[#d42d6e] shadow-md" : "bg-white text-gray-300 cursor-not-allowed"
          }`}>
          {saving ? "저장 중..." : "취향 저장"}
        </button>
      </div>
    </div>
  );
}
