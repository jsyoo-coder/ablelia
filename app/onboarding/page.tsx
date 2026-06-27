"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

// Clearbit 로고 API 사용 (국제 브랜드)
// 로고 없는 브랜드는 텍스트 폴백
const BRANDS = [
  { id: "nike",            label: "Nike",           logo: "https://logo.clearbit.com/nike.com" },
  { id: "adidas",          label: "Adidas",         logo: "https://logo.clearbit.com/adidas.com" },
  { id: "newbalance",      label: "New Balance",    logo: "https://logo.clearbit.com/newbalance.com" },
  { id: "northface",       label: "North Face",     logo: "https://logo.clearbit.com/thenorthface.com" },
  { id: "uniqlo",          label: "Uniqlo",         logo: "https://logo.clearbit.com/uniqlo.com" },
  { id: "zara",            label: "Zara",           logo: "https://logo.clearbit.com/zara.com" },
  { id: "stussy",          label: "Stüssy",         logo: "https://logo.clearbit.com/stussy.com" },
  { id: "levis",           label: "Levi's",         logo: "https://logo.clearbit.com/levi.com" },
  { id: "polo",            label: "Polo RL",        logo: "https://logo.clearbit.com/ralphlauren.com" },
  { id: "patagonia",       label: "Patagonia",      logo: "https://logo.clearbit.com/patagonia.com" },
  { id: "arcteryx",        label: "Arc'teryx",      logo: "https://logo.clearbit.com/arcteryx.com" },
  { id: "champion",        label: "Champion",       logo: "https://logo.clearbit.com/champion.com" },
  { id: "musinsa",         label: "무신사 스탠다드", logo: "https://logo.clearbit.com/musinsa.com" },
  { id: "covernat",        label: "Covernat",       logo: "https://logo.clearbit.com/covernat.com" },
  { id: "adererror",       label: "Ader Error",     logo: "https://logo.clearbit.com/adererror.com" },
  { id: "thisisneverthat", label: "thisisneverthat", logo: "https://logo.clearbit.com/thisisneverthat.com" },
  { id: "mahagrid",        label: "Mahagrid",       logo: "https://logo.clearbit.com/mahagrid.com" },
  { id: "anderbell",       label: "Andersson Bell", logo: "https://logo.clearbit.com/anderssonbell.com" },
  { id: "spao",            label: "SPAO",           logo: "https://logo.clearbit.com/spao.com" },
  { id: "8seconds",        label: "8seconds",       logo: "https://logo.clearbit.com/8seconds.co.kr" },
  { id: "other",           label: "기타",            logo: "" },
];

const STYLES = [
  { id: "minimal",  label: "미니멀",   desc: "깔끔하고 단순한",   q: "미니멀 베이직 패션" },
  { id: "street",   label: "스트릿",   desc: "그래픽·오버핏",     q: "스트릿 그래픽 오버핏" },
  { id: "casual",   label: "캐주얼",   desc: "편안한 일상룩",     q: "캐주얼 데일리 룩" },
  { id: "formal",   label: "포멀",     desc: "슬랙스·블레이저",   q: "슬랙스 블레이저 포멀" },
  { id: "vintage",  label: "빈티지",   desc: "레트로·데님",       q: "빈티지 레트로 데님" },
  { id: "sporty",   label: "스포티",   desc: "트레이닝·애슬레저", q: "스포티 트레이닝 애슬레저" },
  { id: "feminine", label: "페미닌",   desc: "플로럴·원피스",     q: "플로럴 원피스 페미닌" },
  { id: "outdoor",  label: "아웃도어", desc: "고어텍스·트레킹",   q: "아웃도어 고어텍스" },
  { id: "luxury",   label: "럭셔리",   desc: "하이엔드·명품",     q: "하이엔드 럭셔리 패션" },
  { id: "y2k",      label: "Y2K",      desc: "2000년대 감성",     q: "Y2K 로우라이즈" },
  { id: "amekaji",  label: "아메카지", desc: "아메리칸 캐주얼",   q: "아메카지 워크웨어" },
  { id: "preppy",   label: "프레피",   desc: "컬리지·클래식",     q: "프레피 컬리지룩" },
];

function BrandCard({ id, label, on, onClick }: {
  id: string; label: string; on: boolean; onClick: () => void;
}) {
  const fontSize = label.length <= 4 ? "text-sm" : label.length <= 9 ? "text-xs" : "text-[9px]";
  return (
    <button onClick={onClick}
      className={`relative flex items-center justify-center rounded-2xl aspect-square transition-all p-2 ${
        on ? "bg-[#FFF0EA] ring-[2.5px] ring-[#FF5C1A] shadow-md z-10" : "bg-white shadow-sm hover:shadow-md"
      }`}>
      <p className={`${fontSize} font-black text-center leading-tight ${on ? "text-[#FF5C1A]" : "text-[#1A1A1A]"}`}>
        {label}
      </p>
      {on && (
        <div className="absolute top-1 right-1 w-4 h-4 bg-[#FF5C1A] rounded-full flex items-center justify-center">
          <svg width="8" height="8" fill="none" stroke="white" strokeWidth="3" viewBox="0 0 24 24">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </div>
      )}
    </button>
  );
}

function StyleCard({ id, label, desc, on, img, onClick }: {
  id: string; label: string; desc?: string; on: boolean; img?: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className={`relative flex flex-col items-end justify-end overflow-hidden rounded-3xl transition-all aspect-square ${
        on ? "ring-[3px] ring-[#FF5C1A] shadow-lg z-10" : "shadow-sm hover:shadow-md"
      }`}>
      {img
        ? <img src={img} alt={label} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
        : <div className="absolute inset-0 bg-[#EDE6DA] animate-pulse" />
      }
      <div className="absolute inset-0" style={{
        background: on
          ? "linear-gradient(to top, rgba(255,92,26,0.85) 0%, rgba(255,92,26,0.3) 50%, rgba(0,0,0,0.1) 100%)"
          : "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)",
      }} />
      {on && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow">
          <svg width="11" height="11" fill="none" stroke="#FF5C1A" strokeWidth="3" viewBox="0 0 24 24">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </div>
      )}
      <div className="relative z-10 pb-2.5 px-2 text-left w-full">
        <p className="text-white text-xs font-black drop-shadow leading-tight">{label}</p>
        {desc && <p className="text-white/70 text-[9px] drop-shadow leading-tight">{desc}</p>}
      </div>
    </button>
  );
}

export default function OnboardingPage() {
  const { profile, updatePreferences } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [brands, setBrands] = useState<string[]>([]);
  const [styles, setStyles] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [styleImgs, setStyleImgs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (step !== 2) return;
    async function load() {
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
    load();
  }, [step]);

  function toggleBrand(id: string) {
    setBrands(p => p.includes(id) ? p.filter(b => b !== id) : [...p, id]);
  }

  async function handleDone() {
    if (styles.length < 3) return;
    setSaving(true);
    try { await updatePreferences(styles, brands.filter(b => b !== "other")); } catch (e) { console.error(e); }
    router.push("/");
  }

  const firstName = profile?.displayName?.split(" ")[0] ?? "";

  return (
    <div className="min-h-screen flex flex-col px-5 py-10" style={{ background: "#F7F0E6" }}>
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col">

        <h1 className="text-3xl text-[#1A1A1A] mb-6" style={{ fontFamily: "var(--font-keris)", letterSpacing: "0.01em" }}>
          Ablelia
        </h1>

        <div className="mb-5">
          <h2 className="text-xl font-black text-[#1A1A1A] leading-snug">
            안녕하세요,<br />
            <span className="text-[#FF5C1A]">{firstName}님</span>
          </h2>
        </div>

        {/* 스텝 인디케이터 */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2].map(n => (
            <div key={n} className={`h-1.5 rounded-full flex-1 transition-all ${n <= step ? "bg-[#FF5C1A]" : "bg-[#EDE6DA]"}`} />
          ))}
          <span className="text-xs text-gray-400 shrink-0">{step} / 2</span>
        </div>

        {/* STEP 1: 브랜드 */}
        {step === 1 && (
          <>
            <p className="text-[10px] font-black tracking-widest text-[#FF5C1A] uppercase mb-1">BRANDS</p>
            <p className="text-sm text-gray-500 mb-4">
              선호 브랜드를 골라주세요 <span className="text-gray-400">· 없으면 기타 선택</span>
            </p>

            <div className="grid grid-cols-4 gap-2 mb-8 flex-1">
              {BRANDS.map(b => (
                <BrandCard
                  key={b.id} id={b.id} label={b.label}
                  on={brands.includes(b.id)}
                  onClick={() => toggleBrand(b.id)}
                />
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={brands.length === 0}
              className={`w-full py-4 rounded-2xl text-sm font-bold transition-all ${
                brands.length > 0
                  ? "bg-[#FF5C1A] text-white hover:bg-[#e04e10] shadow-md"
                  : "bg-white text-gray-300 cursor-not-allowed"
              }`}>
              {brands.length > 0
                ? brands.includes("other")
                  ? "다음"
                  : `다음 (${brands.length}개 선택)`
                : "브랜드 또는 기타를 선택해주세요"}
            </button>
          </>
        )}

        {/* STEP 2: 스타일 */}
        {step === 2 && (
          <>
            <p className="text-[10px] font-black tracking-widest text-[#FF5C1A] uppercase mb-1">CATEGORIES</p>
            <p className="text-sm text-gray-500 mb-4">좋아하는 스타일을 <strong>3개 이상</strong> 골라주세요</p>

            <div className="grid grid-cols-3 gap-2.5 mb-8 flex-1">
              {STYLES.map(s => (
                <StyleCard
                  key={s.id} id={s.id} label={s.label} desc={s.desc}
                  on={styles.includes(s.id)} img={styleImgs[s.id]}
                  onClick={() => setStyles(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])}
                />
              ))}
            </div>

            <div className="flex gap-2">
              <button onClick={() => setStep(1)}
                className="w-12 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center hover:shadow-md transition-shadow">
                <svg width="16" height="16" fill="none" stroke="#1A1A1A" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path d="M19 12H5M12 5l-7 7 7 7"/>
                </svg>
              </button>
              <button onClick={handleDone} disabled={styles.length < 3 || saving}
                className={`flex-1 py-4 rounded-2xl text-sm font-bold transition-all ${
                  styles.length >= 3
                    ? "bg-[#FF5C1A] text-white hover:bg-[#e04e10] shadow-md"
                    : "bg-white text-gray-300 cursor-not-allowed"
                }`}>
                {saving ? "저장 중..." : `시작하기 ${styles.length > 0 ? `(${styles.length}개)` : ""}`}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
