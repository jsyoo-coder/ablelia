"use client";

import { useState } from "react";
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
  const { user, profile, logout, updatePreferences } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(profile?.preferences ?? []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!user || !profile) {
    router.push("/");
    return null;
  }

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
    setSaved(false);
  }

  async function handleSave() {
    if (selected.length < 3) return;
    setSaving(true);
    await updatePreferences(selected);
    setSaving(false);
    setSaved(true);
  }

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <button onClick={() => router.push("/")} className="text-gray-400 hover:text-black transition-colors">
          ← 홈
        </button>
        <h1 className="font-bold">프로필</h1>
        <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-black transition-colors">
          로그아웃
        </button>
      </header>

      <div className="max-w-md mx-auto px-6 pt-8">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-8">
          {profile.photoURL ? (
            <img src={profile.photoURL} alt={profile.displayName} className="w-20 h-20 rounded-full" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-2xl font-bold">
              {profile.displayName?.[0]}
            </div>
          )}
          <h2 className="mt-3 font-semibold">{profile.displayName}</h2>
          <p className="text-sm text-gray-400">{profile.email}</p>
        </div>

        {/* Style Preferences */}
        <div className="mb-6">
          <h3 className="font-semibold mb-1">스타일 취향</h3>
          <p className="text-xs text-gray-400 mb-4">최소 3개 선택 · 홈 추천에 반영됩니다</p>
          <div className="grid grid-cols-3 gap-3">
            {STYLES.map((s) => {
              const on = selected.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => toggle(s.id)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all ${
                    on ? "border-black bg-black text-white" : "border-gray-100 hover:border-gray-300"
                  }`}
                >
                  <span className="text-xl">{s.emoji}</span>
                  <span className="text-xs font-semibold">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={selected.length < 3 || saving}
          className={`w-full py-4 rounded-2xl text-sm font-semibold transition-all ${
            selected.length >= 3 ? "bg-black text-white hover:bg-gray-800" : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          {saving ? "저장 중..." : saved ? "저장됨 ✓" : "취향 저장"}
        </button>
      </div>
    </div>
  );
}
