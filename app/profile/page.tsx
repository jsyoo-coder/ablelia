"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const STYLES = [
  { id: "minimal", label: "미니멀", emoji: "🤍" },
  { id: "street", label: "스트릿", emoji: "🔥" },
  { id: "casual", label: "캐주얼", emoji: "👟" },
  { id: "formal", label: "포멀", emoji: "🖤" },
  { id: "vintage", label: "빈티지", emoji: "🪄" },
  { id: "sporty", label: "스포티", emoji: "⚡" },
  { id: "feminine", label: "페미닌", emoji: "🌸" },
  { id: "outdoor", label: "아웃도어", emoji: "🏔️" },
  { id: "luxury", label: "럭셔리", emoji: "💎" },
  { id: "y2k", label: "Y2K", emoji: "✨" },
  { id: "amekaji", label: "아메카지", emoji: "🧥" },
  { id: "preppy", label: "프레피", emoji: "🎓" },
];

export default function ProfilePage() {
  const { user, profile, loading, logout, updatePreferences } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user || !profile) { router.push("/"); return; }
    setSelected(profile.preferences ?? []);
  }, [loading, user, profile]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#F7F0E6" }}>
      <div className="w-6 h-6 border-2 border-[#FF5C1A] border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user || !profile) return null;

  function toggle(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
    setSaved(false);
  }

  async function handleSave() {
    if (selected.length < 3) return;
    setSaving(true);
    await updatePreferences(selected);
    setSaving(false);
    setSaved(true);
    setTimeout(() => router.push("/"), 800);
  }

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <div className="min-h-screen pb-10" style={{ background: "#F7F0E6" }}>
      {/* Header */}
      <header className="px-5 pt-5 pb-4 flex items-center justify-between">
        <button onClick={() => router.push("/")}
          className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm">
          <svg width="16" height="16" fill="none" stroke="#1A1A1A" strokeWidth="2.2" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <h1 className="text-sm font-black tracking-widest uppercase text-[#1A1A1A]">프로필</h1>
        <button onClick={handleLogout}
          className="text-xs font-semibold text-gray-400 hover:text-[#FF5C1A] transition-colors">
          로그아웃
        </button>
      </header>

      <div className="max-w-md mx-auto px-5">
        {/* Avatar card */}
        <div className="bg-white rounded-3xl p-6 flex items-center gap-4 mb-6 shadow-sm">
          {profile.photoURL ? (
            <img src={profile.photoURL} alt="" className="w-16 h-16 rounded-full" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#FF5C1A] flex items-center justify-center text-white text-xl font-black">
              {profile.displayName?.[0]}
            </div>
          )}
          <div>
            <p className="font-bold text-[#1A1A1A]">{profile.displayName}</p>
            <p className="text-xs text-gray-400 mt-0.5">{profile.email}</p>
            <p className="text-xs text-[#FF5C1A] font-semibold mt-1">{selected.length}개 스타일 선택됨</p>
          </div>
        </div>

        {/* Style section */}
        <p className="text-[10px] font-black tracking-widest text-[#FF5C1A] uppercase mb-3">
          CATEGORIES
        </p>
        <p className="text-xs text-gray-400 mb-4">최소 3개 선택 · 홈 피드에 반영됩니다</p>

        <div className="grid grid-cols-3 gap-2.5 mb-6">
          {STYLES.map((s) => {
            const on = selected.includes(s.id);
            return (
              <button
                key={s.id}
                onClick={() => toggle(s.id)}
                className={`flex flex-col items-center gap-1.5 py-4 px-2 rounded-3xl transition-all ${
                  on
                    ? "bg-[#FF5C1A] text-white shadow-md scale-105"
                    : "bg-white text-[#1A1A1A] shadow-sm hover:shadow-md"
                }`}
              >
                <span className="text-2xl">{s.emoji}</span>
                <span className="text-xs font-bold">{s.label}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleSave}
          disabled={selected.length < 3 || saving}
          className={`w-full py-4 rounded-2xl text-sm font-bold transition-all ${
            selected.length >= 3
              ? "bg-[#FF5C1A] text-white hover:bg-[#e04e10] shadow-md"
              : "bg-white text-gray-300 cursor-not-allowed"
          }`}
        >
          {saving ? "저장 중..." : saved ? "저장됨 ✓" : "취향 저장"}
        </button>
      </div>
    </div>
  );
}
