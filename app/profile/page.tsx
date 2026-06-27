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

const GENDERS = ["남성", "여성"];
const AGE_GROUPS = ["10대", "20대", "30대", "40대 이상"];

function PillButton({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-bold transition-all border-2 ${
        on
          ? "bg-[#FF3D7F] text-white border-[#FF3D7F] shadow-sm"
          : "bg-white text-[#555] border-transparent shadow-sm hover:border-[#FF3D7F] hover:text-[#FF3D7F]"
      }`}>
      {label}
    </button>
  );
}

export default function ProfilePage() {
  const { user, profile, loading, logout, updatePreferences } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [gender, setGender] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [styleImgs, setStyleImgs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (loading) return;
    if (!user || !profile) { router.push("/"); return; }
    setSelected(profile.preferences ?? []);
    setGender(profile.gender ?? "");
    setAgeGroup(profile.ageGroup ?? "");
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
  }

  async function handleSave() {
    setSaveError("");
    try {
      await updatePreferences(selected, [], gender, ageGroup);
      setShowPopup(true);
      setTimeout(() => { setShowPopup(false); router.push("/"); }, 1500);
    } catch (e: unknown) {
      const msg = (e as { code?: string })?.code ?? String(e);
      setSaveError(msg);
      console.error("저장 실패:", e);
    }
  }

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <div className="min-h-screen pb-10" style={{ background: "#F7F0E6" }}>

      {/* 저장 완료 팝업 */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative bg-white rounded-3xl px-8 py-8 flex flex-col items-center gap-3 shadow-2xl mx-6">
            <div className="w-14 h-14 bg-[#FF3D7F] rounded-full flex items-center justify-center">
              <svg width="28" height="28" fill="none" stroke="white" strokeWidth="3" viewBox="0 0 24 24">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
            <p className="text-lg font-black text-[#1A1A1A]">취향 저장 완료!</p>
            <p className="text-sm text-gray-400 text-center">선택한 취향으로 피드가 업데이트됩니다</p>
          </div>
        </div>
      )}

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
        {/* 유저 카드 */}
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
          </div>
        </div>

        {/* 성별 */}
        <p className="text-[10px] font-black tracking-widest text-[#FF3D7F] uppercase mb-2">GENDER</p>
        <div className="flex gap-2 mb-6">
          {GENDERS.map(g => (
            <PillButton key={g} label={g} on={gender === g} onClick={() => setGender(prev => prev === g ? "" : g)} />
          ))}
        </div>

        {/* 나이대 */}
        <p className="text-[10px] font-black tracking-widest text-[#FF3D7F] uppercase mb-2">AGE</p>
        <div className="flex flex-wrap gap-2 mb-6">
          {AGE_GROUPS.map(a => (
            <PillButton key={a} label={a} on={ageGroup === a} onClick={() => setAgeGroup(prev => prev === a ? "" : a)} />
          ))}
        </div>

        {/* 스타일 카테고리 */}
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

        {saveError && (
          <p className="text-xs text-red-500 text-center mb-3">
            저장 실패: {saveError}
          </p>
        )}
        <button onClick={handleSave}
          className="w-full py-4 rounded-2xl text-sm font-bold transition-all bg-[#FF3D7F] text-white hover:bg-[#d42d6e] shadow-md">
          취향 저장
        </button>
      </div>
    </div>
  );
}
