"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ProductCard from "./components/ProductCard";

const STYLE_QUERIES: Record<string, string> = {
  minimal: "미니멀 베이직 패션",
  street: "스트릿 그래픽 오버핏",
  casual: "캐주얼 데일리 룩",
  formal: "슬랙스 블레이저 포멀",
  vintage: "빈티지 레트로 데님",
  sporty: "스포티 트레이닝 애슬레저",
  feminine: "플로럴 원피스 페미닌",
  outdoor: "아웃도어 고어텍스",
  luxury: "하이엔드 럭셔리 패션",
  y2k: "Y2K 로우라이즈",
  amekaji: "아메카지 워크웨어",
  preppy: "프레피 컬리지룩",
};

const STYLE_LABELS: Record<string, string> = {
  minimal: "미니멀", street: "스트릿", casual: "캐주얼", formal: "포멀",
  vintage: "빈티지", sporty: "스포티", feminine: "페미닌", outdoor: "아웃도어",
  luxury: "럭셔리", y2k: "Y2K", amekaji: "아메카지", preppy: "프레피",
};

const TRENDING = [
  "린넨 셔츠 여름", "오버핏 반팔 티셔츠", "와이드 데님 팬츠",
  "크롭 자켓", "플랫폼 슈즈", "니트 조끼", "버킷햇", "스트링 백팩",
];

type Product = {
  title: string; link: string; image: string;
  lprice: string; mallName: string; brand: string; category2: string;
};

export default function Home() {
  const { user, profile, loading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<Product[]>([]);
  const [fetching, setFetching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [tab, setTab] = useState<"feed" | "search">("feed");
  const [query, setQuery] = useState("");
  const [activeStyle, setActiveStyle] = useState<string | null>(null);
  const currentQueryRef = useRef("");
  const startRef = useRef(1);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchItems = useCallback(async (q: string, start = 1, append = false) => {
    if (start === 1) setFetching(true);
    else setLoadingMore(true);
    currentQueryRef.current = q;
    startRef.current = start + 40;

    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&start=${start}`);
    const data = await res.json();
    const newItems: Product[] = data.items ?? [];

    if (append) setItems(prev => [...prev, ...newItems]);
    else setItems(newItems);

    setFetching(false);
    setLoadingMore(false);
  }, []);

  // 무한스크롤
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && !fetching && items.length > 0) {
          fetchItems(currentQueryRef.current, startRef.current, true);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadingMore, fetching, items.length, fetchItems]);

  // 초기 피드
  useEffect(() => {
    if (tab !== "feed" || loading) return;
    const prefs = profile?.onboardingComplete ? profile.preferences : [];
    const pool = prefs.length > 0 ? prefs.map(p => STYLE_QUERIES[p] ?? p) : TRENDING;
    const q = pool[Math.floor(Math.random() * pool.length)];
    fetchItems(q, 1, false);
  }, [tab, loading, profile?.onboardingComplete]);

  // 온보딩
  useEffect(() => {
    if (!loading && user && profile && !profile.onboardingComplete) router.push("/onboarding");
  }, [loading, user, profile]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#F7F0E6" }}>
      <div className="w-6 h-6 border-3 border-[#FF5C1A] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  function handleStyleChip(id: string) {
    setActiveStyle(id);
    fetchItems(STYLE_QUERIES[id], 1, false);
  }

  async function handleSearch(q: string) {
    if (!q.trim()) return;
    setTab("search");
    setActiveStyle(null);
    fetchItems(q, 1, false);
  }

  const userPrefs = profile?.preferences ?? [];

  return (
    <div className="min-h-screen pb-20" style={{ background: "#F7F0E6" }}>
      {/* Header */}
      <header className="sticky top-0 z-10 px-4 pt-4 pb-3"
        style={{ background: "rgba(247,240,230,0.95)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center justify-between max-w-screen-xl mx-auto mb-3">
          {tab === "search" ? (
            <div className="flex items-center gap-2 w-full">
              <button onClick={() => { setTab("feed"); setQuery(""); }}
                className="text-gray-500 hover:text-[#FF5C1A] transition-colors shrink-0">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path d="M19 12H5M12 5l-7 7 7 7"/>
                </svg>
              </button>
              <div className="flex-1 flex items-center bg-white rounded-full px-4 py-2.5 gap-2 shadow-sm">
                <svg width="15" height="15" fill="none" stroke="#999" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  autoFocus
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSearch(query)}
                  placeholder="패션 아이템 검색..."
                  className="flex-1 text-sm outline-none bg-transparent"
                />
              </div>
            </div>
          ) : (
            <>
              {/* Logo */}
              <h1 className="text-2xl font-black tracking-tight text-[#1A1A1A]" style={{ letterSpacing: "-0.03em" }}>
                ablelia
              </h1>
              <div className="flex items-center gap-3">
                <button onClick={() => setTab("search")}
                  className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                  <svg width="16" height="16" fill="none" stroke="#1A1A1A" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                </button>
                {user ? (
                  <button onClick={() => router.push("/profile")}
                    className="w-9 h-9 rounded-full overflow-hidden shadow-sm">
                    {profile?.photoURL
                      ? <img src={profile.photoURL} className="w-full h-full object-cover" alt="" />
                      : <div className="w-full h-full bg-[#FF5C1A] flex items-center justify-center text-white text-sm font-bold">
                          {profile?.displayName?.[0]}
                        </div>
                    }
                  </button>
                ) : (
                  <button onClick={signInWithGoogle}
                    className="bg-[#FF5C1A] text-white text-xs font-bold px-4 py-2 rounded-full shadow-sm hover:bg-[#e04e10] transition-colors">
                    시작하기
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Style chips — 로그인 유저 */}
        {tab === "feed" && userPrefs.length > 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide max-w-screen-xl mx-auto">
            {userPrefs.map(p => (
              <button key={p}
                onClick={() => handleStyleChip(p)}
                className={`shrink-0 text-xs font-semibold px-4 py-1.5 rounded-full transition-all ${
                  activeStyle === p
                    ? "bg-[#FF5C1A] text-white shadow-sm"
                    : "bg-white text-[#1A1A1A] shadow-sm hover:shadow-md"
                }`}>
                {STYLE_LABELS[p] ?? p}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Feed section */}
      <div className="px-3 pt-4 max-w-screen-xl mx-auto">
        {/* Section header */}
        {!fetching && items.length > 0 && (
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-black tracking-widest text-[#FF5C1A] uppercase">
              {tab === "search" ? "검색 결과" : (activeStyle ? STYLE_LABELS[activeStyle] : "NEW ITEMS")}
            </h2>
            <span className="text-[10px] text-gray-400">{items.length}개</span>
          </div>
        )}

        {/* Skeleton */}
        {fetching ? (
          <div className="columns-2 sm:columns-3 md:columns-4 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="break-inside-avoid mb-3 rounded-3xl bg-white animate-pulse shadow-sm overflow-hidden">
                <div className="rounded-3xl m-2" style={{ height: `${160 + (i % 4) * 50}px`, background: "#EDE6DA" }} />
                <div className="px-3 py-2 space-y-1.5">
                  <div className="h-2 bg-gray-100 rounded-full w-16" />
                  <div className="h-3 bg-gray-100 rounded-full w-full" />
                  <div className="h-3 bg-gray-100 rounded-full w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="columns-2 sm:columns-3 md:columns-4 gap-3">
            {items.map((item, i) => (
              <ProductCard key={`${item.link}-${i}`} product={item} isNew={i < 6} />
            ))}
          </div>
        )}

        {/* 무한스크롤 센티널 */}
        <div ref={sentinelRef} className="h-12 flex items-center justify-center mt-2">
          {loadingMore && (
            <div className="w-5 h-5 border-2 border-[#EDE6DA] border-t-[#FF5C1A] rounded-full animate-spin" />
          )}
        </div>
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 flex"
        style={{ background: "rgba(247,240,230,0.97)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <button
          onClick={() => { setTab("feed"); setQuery(""); setActiveStyle(null); }}
          className="flex-1 py-3.5 flex justify-center items-center">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
            tab === "feed" ? "bg-[#FF5C1A] shadow-lg" : ""
          }`}>
            <svg width="20" height="20" fill="none" stroke={tab === "feed" ? "#fff" : "#BBB"} strokeWidth="1.8" viewBox="0 0 24 24">
              <rect x="3" y="3" width="8" height="8" rx="2"/>
              <rect x="13" y="3" width="8" height="8" rx="2"/>
              <rect x="3" y="13" width="8" height="8" rx="2"/>
              <rect x="13" y="13" width="8" height="8" rx="2"/>
            </svg>
          </div>
        </button>
        <button
          onClick={() => setTab("search")}
          className="flex-1 py-3.5 flex justify-center items-center">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
            tab === "search" ? "bg-[#FF5C1A] shadow-lg" : ""
          }`}>
            <svg width="20" height="20" fill="none" stroke={tab === "search" ? "#fff" : "#BBB"} strokeWidth="1.8" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </div>
        </button>
        <button
          onClick={() => user ? router.push("/profile") : signInWithGoogle()}
          className="flex-1 py-3.5 flex justify-center items-center">
          <div className="w-11 h-11 rounded-full flex items-center justify-center">
            <svg width="20" height="20" fill="none" stroke="#BBB" strokeWidth="1.8" viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
          </div>
        </button>
      </nav>
    </div>
  );
}
