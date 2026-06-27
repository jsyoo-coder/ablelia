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

const BRANDS = [
  { id: "nike",            label: "나이키",        q: "나이키 Nike" },
  { id: "adidas",          label: "아디다스",      q: "아디다스 Adidas" },
  { id: "newbalance",      label: "뉴발란스",      q: "뉴발란스 New Balance" },
  { id: "northface",       label: "노스페이스",    q: "노스페이스 The North Face" },
  { id: "uniqlo",          label: "유니클로",      q: "유니클로 Uniqlo" },
  { id: "zara",            label: "자라",          q: "Zara 자라 패션" },
  { id: "musinsa",         label: "무신사스탠다드", q: "무신사 스탠다드" },
  { id: "covernat",        label: "커버낫",        q: "Covernat 커버낫" },
  { id: "stussy",          label: "스투시",        q: "Stussy 스투시" },
  { id: "levis",           label: "리바이스",      q: "Levis 리바이스" },
  { id: "polo",            label: "폴로",          q: "Polo Ralph Lauren" },
  { id: "patagonia",       label: "파타고니아",    q: "Patagonia 파타고니아" },
  { id: "adererror",       label: "아더에러",      q: "Ader Error 아더에러" },
  { id: "thisisneverthat", label: "디스이즈네버댓", q: "thisisneverthat 디스이즈네버댓" },
  { id: "arcteryx",        label: "아크테릭스",    q: "Arcteryx 아크테릭스" },
  { id: "spao",            label: "스파오",        q: "SPAO 스파오" },
  { id: "mahagrid",        label: "마하그리드",    q: "Mahagrid 마하그리드" },
  { id: "anderbell",       label: "앤더슨벨",      q: "Andersson Bell 앤더슨벨" },
  { id: "champion",        label: "챔피온",        q: "Champion 챔피온" },
  { id: "8seconds",        label: "에잇세컨즈",    q: "8seconds 에잇세컨즈" },
];

export default function ProfilePage() {
  const { user, profile, loading, logout, updatePreferences } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [styleImgs, setStyleImgs] = useState<Record<string, string>>({});
  const [brandImgs, setBrandImgs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (loading) return;
    if (!user || !profile) { router.push("/"); return; }
    setSelected(profile.preferences ?? []);
    setSelectedBrands(profile.brands ?? []);
  }, [loading, user, profile]);

  useEffect(() => {
    async function loadImages() {
      const allItems = [...STYLES, ...BRANDS];
      const entries = await Promise.allSettled(
        allItems.map(async (s) => {
          const res = await fetch(`/api/search?q=${encodeURIComponent(s.q)}&display=5`);
          const data = await res.json();
          const items: { image?: string }[] = data.items ?? [];
          const img = items.find(i => i.image)?.image ?? "";
          return { id: s.id, img };
        })
      );
      const styleMap: Record<string, string> = {};
      const brandMap: Record<string, string> = {};
      entries.forEach((r, i) => {
        if (r.status === "fulfilled" && r.value.img) {
          if (i < STYLES.length) styleMap[r.value.id] = r.value.img;
          else brandMap[r.value.id] = r.value.img;
        }
      });
      setStyleImgs(styleMap);
      setBrandImgs(brandMap);
    }
    loadImages();
  }, []);

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
  function toggleBrand(id: string) {
    setSelectedBrands(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]);
    setSaved(false);
  }

  async function handleSave() {
    if (selected.length < 3) return;
    setSaving(true);
    try {
      await updatePreferences(selected, selectedBrands);
      setSaved(true);
      setTimeout(() => router.push("/"), 800);
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
        {/* 유저 카드 */}
        <div className="bg-white rounded-3xl p-4 flex items-center gap-3 mb-6 shadow-sm">
          {profile.photoURL ? (
            <img src={profile.photoURL} alt="" className="w-14 h-14 rounded-full shrink-0" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-[#FF5C1A] flex items-center justify-center text-white text-xl font-black shrink-0">
              {profile.displayName?.[0]}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-bold text-[#1A1A1A] truncate">{profile.displayName}</p>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{profile.email}</p>
            <p className="text-xs text-[#FF5C1A] font-semibold mt-1">스타일 {selected.length}개 · 브랜드 {selectedBrands.length}개</p>
          </div>
        </div>

        {/* 브랜드 */}
        <p className="text-[10px] font-black tracking-widest text-[#FF5C1A] uppercase mb-1">BRANDS</p>
        <p className="text-xs text-gray-400 mb-3">선호 브랜드 선택 (선택사항)</p>
        <div className="grid grid-cols-4 gap-2 mb-6">
          {BRANDS.map(b => {
            const on = selectedBrands.includes(b.id);
            const img = brandImgs[b.id];
            return (
              <button key={b.id} onClick={() => toggleBrand(b.id)}
                className={`relative flex flex-col items-end justify-end overflow-hidden rounded-2xl transition-all aspect-square ${
                  on ? "ring-[3px] ring-[#FF5C1A] shadow-lg z-10" : "shadow-sm hover:shadow-md"
                }`}>
                {img ? <img src={img} alt={b.label} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                  : <div className="absolute inset-0 bg-[#EDE6DA] animate-pulse" />}
                <div className="absolute inset-0" style={{ background: on ? "linear-gradient(to top, rgba(255,92,26,0.85) 0%, rgba(255,92,26,0.3) 55%, rgba(0,0,0,0.1) 100%)" : "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)" }} />
                {on && <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow">
                  <svg width="9" height="9" fill="none" stroke="#FF5C1A" strokeWidth="3" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                </div>}
                <div className="relative z-10 pb-2 px-1.5 w-full">
                  <p className="text-white text-[10px] font-black drop-shadow leading-tight">{b.label}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* 스타일 */}
        <p className="text-[10px] font-black tracking-widest text-[#FF5C1A] uppercase mb-1">CATEGORIES</p>
        <p className="text-xs text-gray-400 mb-3">최소 3개 선택 · 홈 피드에 반영됩니다</p>
        <div className="grid grid-cols-3 gap-2.5 mb-6">
          {STYLES.map(s => {
            const on = selected.includes(s.id);
            const img = styleImgs[s.id];
            return (
              <button key={s.id} onClick={() => toggle(s.id)}
                className={`relative flex flex-col items-end justify-end overflow-hidden rounded-3xl transition-all aspect-square ${
                  on ? "ring-[3px] ring-[#FF5C1A] shadow-lg z-10" : "shadow-sm hover:shadow-md"
                }`}>
                {img ? <img src={img} alt={s.label} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                  : <div className="absolute inset-0 bg-[#EDE6DA] animate-pulse" />}
                <div className="absolute inset-0" style={{ background: on ? "linear-gradient(to top, rgba(255,92,26,0.85) 0%, rgba(255,92,26,0.3) 50%, rgba(0,0,0,0.1) 100%)" : "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)" }} />
                {on && <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow">
                  <svg width="11" height="11" fill="none" stroke="#FF5C1A" strokeWidth="3" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                </div>}
                <div className="relative z-10 pb-2.5 px-2 w-full">
                  <p className="text-white text-xs font-black drop-shadow">{s.label}</p>
                </div>
              </button>
            );
          })}
        </div>

        <button onClick={handleSave} disabled={selected.length < 3 || saving}
          className={`w-full py-4 rounded-2xl text-sm font-bold transition-all ${
            selected.length >= 3 ? "bg-[#FF5C1A] text-white hover:bg-[#e04e10] shadow-md" : "bg-white text-gray-300 cursor-not-allowed"
          }`}>
          {saving ? "저장 중..." : saved ? "저장됨 ✓" : "취향 저장"}
        </button>
      </div>
    </div>
  );
}
