"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const BRANDS = [
  { id: "nike",             label: "나이키",       q: "나이키 Nike" },
  { id: "adidas",           label: "아디다스",     q: "아디다스 Adidas" },
  { id: "newbalance",       label: "뉴발란스",     q: "뉴발란스 New Balance" },
  { id: "northface",        label: "노스페이스",   q: "노스페이스 The North Face" },
  { id: "uniqlo",           label: "유니클로",     q: "유니클로 Uniqlo" },
  { id: "zara",             label: "자라",         q: "Zara 자라 패션" },
  { id: "musinsa",          label: "무신사스탠다드", q: "무신사 스탠다드" },
  { id: "covernat",         label: "커버낫",       q: "Covernat 커버낫" },
  { id: "stussy",           label: "스투시",       q: "Stussy 스투시" },
  { id: "levis",            label: "리바이스",     q: "Levis 리바이스" },
  { id: "polo",             label: "폴로",         q: "Polo Ralph Lauren" },
  { id: "patagonia",        label: "파타고니아",   q: "Patagonia 파타고니아" },
  { id: "adererror",        label: "아더에러",     q: "Ader Error 아더에러" },
  { id: "thisisneverthat",  label: "디스이즈네버댓", q: "thisisneverthat 디스이즈네버댓" },
  { id: "arcteryx",         label: "아크테릭스",   q: "Arcteryx 아크테릭스" },
  { id: "spao",             label: "스파오",       q: "SPAO 스파오" },
  { id: "mahagrid",         label: "마하그리드",   q: "Mahagrid 마하그리드" },
  { id: "anderbell",        label: "앤더슨벨",     q: "Andersson Bell 앤더슨벨" },
  { id: "champion",         label: "챔피온",       q: "Champion 챔피온" },
  { id: "8seconds",         label: "에잇세컨즈",   q: "8seconds 에잇세컨즈" },
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

type ImgMap = Record<string, string>;

function StyleCard({
  id, label, desc, on, img, onClick,
}: { id: string; label: string; desc?: string; on: boolean; img?: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-end justify-end overflow-hidden rounded-3xl transition-all aspect-square ${
        on ? "ring-[3px] ring-[#FF5C1A] shadow-lg z-10" : "shadow-sm hover:shadow-md"
      }`}
    >
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
  const [brandImgs, setBrandImgs] = useState<ImgMap>({});
  const [styleImgs, setStyleImgs] = useState<ImgMap>({});

  // 브랜드 이미지 로드
  useEffect(() => {
    async function load() {
      const entries = await Promise.allSettled(
        BRANDS.map(async (b) => {
          const res = await fetch(`/api/search?q=${encodeURIComponent(b.q)}&display=5`);
          const data = await res.json();
          const img = (data.items ?? []).find((i: { image?: string }) => i.image)?.image ?? "";
          return { id: b.id, img };
        })
      );
      const map: ImgMap = {};
      entries.forEach(r => { if (r.status === "fulfilled" && r.value.img) map[r.value.id] = r.value.img; });
      setBrandImgs(map);
    }
    load();
  }, []);

  // 스타일 이미지는 step 2 진입 시 로드
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
      const map: ImgMap = {};
      entries.forEach(r => { if (r.status === "fulfilled" && r.value.img) map[r.value.id] = r.value.img; });
      setStyleImgs(map);
    }
    load();
  }, [step]);

  function toggleBrand(id: string) {
    setBrands(p => p.includes(id) ? p.filter(b => b !== id) : [...p, id]);
  }
  function toggleStyle(id: string) {
    setStyles(p => p.includes(id) ? p.filter(s => s !== id) : [...p, id]);
  }

  async function handleDone() {
    if (styles.length < 3) return;
    setSaving(true);
    try { await updatePreferences(styles, brands); } catch (e) { console.error(e); }
    router.push("/");
  }

  const firstName = profile?.displayName?.split(" ")[0] ?? "";

  return (
    <div className="min-h-screen flex flex-col px-5 py-10" style={{ background: "#F7F0E6" }}>
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col">

        {/* 로고 */}
        <h1 className="text-3xl text-[#1A1A1A] mb-6" style={{ fontFamily: "var(--font-keris)", letterSpacing: "0.01em" }}>
          Ablelia
        </h1>

        {/* 인사말 */}
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

        {/* ── STEP 1: 브랜드 ── */}
        {step === 1 && (
          <>
            <p className="text-[10px] font-black tracking-widest text-[#FF5C1A] uppercase mb-1">BRANDS</p>
            <p className="text-sm text-gray-500 mb-4">좋아하는 브랜드를 골라주세요 <span className="text-gray-400">(선택)</span></p>

            <div className="grid grid-cols-4 gap-2 mb-8 flex-1">
              {BRANDS.map(b => (
                <StyleCard
                  key={b.id} id={b.id} label={b.label}
                  on={brands.includes(b.id)} img={brandImgs[b.id]}
                  onClick={() => toggleBrand(b.id)}
                />
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-4 rounded-2xl text-sm font-bold bg-[#FF5C1A] text-white hover:bg-[#e04e10] shadow-md transition-colors">
                {brands.length > 0 ? `다음 (${brands.length}개 선택)` : "건너뛰기"}
              </button>
            </div>
          </>
        )}

        {/* ── STEP 2: 스타일 ── */}
        {step === 2 && (
          <>
            <p className="text-[10px] font-black tracking-widest text-[#FF5C1A] uppercase mb-1">CATEGORIES</p>
            <p className="text-sm text-gray-500 mb-4">좋아하는 스타일을 <strong>3개 이상</strong> 골라주세요</p>

            <div className="grid grid-cols-3 gap-2.5 mb-8 flex-1">
              {STYLES.map(s => (
                <StyleCard
                  key={s.id} id={s.id} label={s.label} desc={s.desc}
                  on={styles.includes(s.id)} img={styleImgs[s.id]}
                  onClick={() => toggleStyle(s.id)}
                />
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="w-12 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0 hover:shadow-md transition-shadow">
                <svg width="16" height="16" fill="none" stroke="#1A1A1A" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path d="M19 12H5M12 5l-7 7 7 7"/>
                </svg>
              </button>
              <button
                onClick={handleDone}
                disabled={styles.length < 3 || saving}
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
