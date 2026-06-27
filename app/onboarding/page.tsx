"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const STYLES = [
  { id: "minimal",  label: "미니멀",  desc: "깔끔하고 단순한",    q: "미니멀 베이직 패션" },
  { id: "street",   label: "스트릿",  desc: "그래픽·오버핏",      q: "스트릿 그래픽 오버핏" },
  { id: "casual",   label: "캐주얼",  desc: "편안한 일상룩",      q: "캐주얼 데일리 룩" },
  { id: "formal",   label: "포멀",    desc: "슬랙스·블레이저",    q: "슬랙스 블레이저 포멀" },
  { id: "vintage",  label: "빈티지",  desc: "레트로·데님",        q: "빈티지 레트로 데님" },
  { id: "sporty",   label: "스포티",  desc: "트레이닝·애슬레저",  q: "스포티 트레이닝 애슬레저" },
  { id: "feminine", label: "페미닌",  desc: "플로럴·원피스",      q: "플로럴 원피스 페미닌" },
  { id: "outdoor",  label: "아웃도어", desc: "고어텍스·트레킹",   q: "아웃도어 고어텍스" },
  { id: "luxury",   label: "럭셔리",  desc: "하이엔드·명품",      q: "하이엔드 럭셔리 패션" },
  { id: "y2k",      label: "Y2K",     desc: "2000년대 감성",      q: "Y2K 로우라이즈" },
  { id: "amekaji",  label: "아메카지", desc: "아메리칸 캐주얼",   q: "아메카지 워크웨어" },
  { id: "preppy",   label: "프레피",  desc: "컬리지·클래식",      q: "프레피 컬리지룩" },
];

export default function OnboardingPage() {
  const { profile, updatePreferences } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<Record<string, string>>({});

  // 각 스타일 키워드로 대표 상품 이미지 1장씩 미리 로드
  useEffect(() => {
    async function loadImages() {
      const entries = await Promise.allSettled(
        STYLES.map(async (s) => {
          const res = await fetch(`/api/search?q=${encodeURIComponent(s.q)}&display=5`);
          const data = await res.json();
          const items: { image?: string }[] = data.items ?? [];
          const img = items.find(i => i.image)?.image ?? "";
          return { id: s.id, img };
        })
      );
      const map: Record<string, string> = {};
      entries.forEach(r => {
        if (r.status === "fulfilled" && r.value.img) map[r.value.id] = r.value.img;
      });
      setImages(map);
    }
    loadImages();
  }, []);

  function toggle(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  }

  async function handleDone() {
    if (selected.length < 3) return;
    setSaving(true);
    try {
      await updatePreferences(selected);
    } catch (e) {
      console.error("preference save error:", e);
    }
    router.push("/");
  }

  return (
    <div className="min-h-screen flex flex-col px-5 py-10" style={{ background: "#F7F0E6" }}>
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col">
        {/* 로고 */}
        <h1 className="text-3xl text-[#1A1A1A] mb-8" style={{ fontFamily: "var(--font-keris)", letterSpacing: "0.01em" }}>
          Ablelia
        </h1>

        {/* 인사말 */}
        <div className="mb-6">
          <h2 className="text-xl font-black text-[#1A1A1A] leading-snug">
            안녕하세요,<br />
            <span className="text-[#FF5C1A]">{profile?.displayName?.split(" ")[0]}님</span>
          </h2>
          <p className="text-sm text-gray-500 mt-2">좋아하는 스타일을 <strong>3개 이상</strong> 골라주세요</p>
        </div>

        <p className="text-[10px] font-black tracking-widest text-[#FF5C1A] uppercase mb-3">CATEGORIES</p>

        {/* 스타일 그리드 */}
        <div className="grid grid-cols-3 gap-2.5 mb-8 flex-1">
          {STYLES.map((s) => {
            const on = selected.includes(s.id);
            const img = images[s.id];
            return (
              <button
                key={s.id}
                onClick={() => toggle(s.id)}
                className={`relative flex flex-col items-center justify-end overflow-hidden rounded-3xl transition-all aspect-square ${
                  on ? "ring-[3px] ring-[#FF5C1A] shadow-lg z-10" : "shadow-sm hover:shadow-md"
                }`}
                style={{ minHeight: "100px" }}
              >
                {/* 배경 이미지 */}
                {img ? (
                  <img
                    src={img}
                    alt={s.label}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[#EDE6DA] animate-pulse" />
                )}

                {/* 그라디언트 오버레이 */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: on
                      ? "linear-gradient(to top, rgba(255,92,26,0.85) 0%, rgba(255,92,26,0.3) 50%, rgba(0,0,0,0.1) 100%)"
                      : "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)",
                  }}
                />

                {/* 선택 체크 */}
                {on && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow">
                    <svg width="11" height="11" fill="none" stroke="#FF5C1A" strokeWidth="3" viewBox="0 0 24 24">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                  </div>
                )}

                {/* 텍스트 */}
                <div className="relative z-10 pb-2.5 px-1 text-center w-full">
                  <p className="text-white text-xs font-black leading-tight drop-shadow">{s.label}</p>
                  <p className="text-white/70 text-[9px] leading-tight drop-shadow">{s.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* 시작 버튼 */}
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
