"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const STYLES = [
  { id: "minimal", label: "미니멀", emoji: "🤍", desc: "깔끔하고 단순한" },
  { id: "street", label: "스트릿", emoji: "🔥", desc: "그래픽·오버핏" },
  { id: "casual", label: "캐주얼", emoji: "👟", desc: "편안한 일상룩" },
  { id: "formal", label: "포멀", emoji: "🖤", desc: "슬랙스·블레이저" },
  { id: "vintage", label: "빈티지", emoji: "🪄", desc: "레트로·데님" },
  { id: "sporty", label: "스포티", emoji: "⚡", desc: "트레이닝·애슬레저" },
  { id: "feminine", label: "페미닌", emoji: "🌸", desc: "플로럴·원피스" },
  { id: "outdoor", label: "아웃도어", emoji: "🏔️", desc: "고어텍스·트레킹" },
  { id: "luxury", label: "럭셔리", emoji: "💎", desc: "하이엔드·명품" },
  { id: "y2k", label: "Y2K", emoji: "✨", desc: "2000년대 감성" },
  { id: "amekaji", label: "아메카지", emoji: "🧥", desc: "아메리칸 캐주얼" },
  { id: "preppy", label: "프레피", emoji: "🎓", desc: "컬리지·클래식" },
];

export default function OnboardingPage() {
  const { profile, updatePreferences } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function toggle(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  }

  async function handleDone() {
    if (selected.length < 3) return;
    setSaving(true);
    await updatePreferences(selected);
    router.push("/");
  }

  return (
    <div className="min-h-screen flex flex-col px-5 py-10" style={{ background: "#F7F0E6" }}>
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col">
        {/* Logo */}
        <h1 className="text-2xl font-black text-[#1A1A1A] mb-8" style={{ letterSpacing: "-0.03em" }}>
          ablelia
        </h1>

        {/* Title */}
        <div className="mb-6">
          <h2 className="text-xl font-black text-[#1A1A1A] leading-snug">
            안녕하세요,<br />
            <span className="text-[#FF5C1A]">{profile?.displayName?.split(" ")[0]}님</span>
          </h2>
          <p className="text-sm text-gray-500 mt-2">좋아하는 스타일을 <strong>3개 이상</strong> 골라주세요</p>
        </div>

        <p className="text-[10px] font-black tracking-widest text-[#FF5C1A] uppercase mb-3">
          CATEGORIES
        </p>

        <div className="grid grid-cols-3 gap-2.5 mb-8 flex-1">
          {STYLES.map((s) => {
            const on = selected.includes(s.id);
            return (
              <button
                key={s.id}
                onClick={() => toggle(s.id)}
                className={`flex flex-col items-center gap-1 py-4 px-2 rounded-3xl transition-all ${
                  on
                    ? "bg-[#FF5C1A] text-white shadow-md scale-105"
                    : "bg-white text-[#1A1A1A] shadow-sm hover:shadow-md"
                }`}
              >
                <span className="text-2xl">{s.emoji}</span>
                <span className="text-xs font-bold">{s.label}</span>
                <span className={`text-[10px] text-center leading-tight ${on ? "text-orange-100" : "text-gray-400"}`}>
                  {s.desc}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleDone}
          disabled={selected.length < 3 || saving}
          className={`w-full py-4 rounded-2xl text-sm font-bold transition-all ${
            selected.length >= 3
              ? "bg-[#FF5C1A] text-white hover:bg-[#e04e10] shadow-md"
              : "bg-white text-gray-300 cursor-not-allowed"
          }`}
        >
          {saving ? "저장 중..." : `시작하기 ${selected.length > 0 ? `(${selected.length}개 선택)` : ""}`}
        </button>
      </div>
    </div>
  );
}
