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
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  async function handleDone() {
    if (selected.length < 3) return;
    setSaving(true);
    await updatePreferences(selected);
    router.push("/");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-1">안녕하세요, {profile?.displayName?.split(" ")[0]}님</h1>
          <p className="text-gray-400 text-sm">좋아하는 스타일을 3개 이상 골라주세요</p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          {STYLES.map((s) => {
            const on = selected.includes(s.id);
            return (
              <button
                key={s.id}
                onClick={() => toggle(s.id)}
                className={`flex flex-col items-center gap-1 p-4 rounded-2xl border-2 transition-all ${
                  on ? "border-black bg-black text-white" : "border-gray-100 hover:border-gray-300"
                }`}
              >
                <span className="text-2xl">{s.emoji}</span>
                <span className="text-sm font-semibold">{s.label}</span>
                <span className={`text-xs ${on ? "text-gray-300" : "text-gray-400"}`}>{s.desc}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleDone}
          disabled={selected.length < 3 || saving}
          className={`w-full py-4 rounded-2xl text-sm font-semibold transition-all ${
            selected.length >= 3
              ? "bg-black text-white hover:bg-gray-800"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          {saving ? "저장 중..." : `시작하기 ${selected.length > 0 ? `(${selected.length}/3+)` : ""}`}
        </button>
      </div>
    </div>
  );
}
