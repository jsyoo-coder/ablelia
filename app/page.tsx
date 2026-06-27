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
    const newItems = data.items ?? [];

    if (append) setItems(prev => [...prev, ...newItems]);
    else setItems(newItems);

    setFetching(false);
    setLoadingMore(false);
  }, []);

  // 무한스크롤 IntersectionObserver
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
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
    </div>
  );

  async function handleSearch(q: string) {
    if (!q.trim()) return;
    setTab("search");
    fetchItems(q, 1, false);
  }

  return (
    <div className="min-h-screen bg-white pb-16">
      {/* Header */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 px-4 pt-3 pb-2 border-b border-gray-100">
        <div className="flex items-center gap-2 max-w-screen-xl mx-auto">
          {tab === "search" ? (
            <>
              <button onClick={() => { setTab("feed"); setQuery(""); }} className="shrink-0 text-gray-400 hover:text-black">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              </button>
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch(query)}
                placeholder="패션 아이템 검색..."
                className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none"
              />
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold tracking-tight flex-1">ablelia</h1>
              <button onClick={() => setTab("search")} className="text-gray-400 hover:text-black transition-colors">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </button>
            </>
          )}

          {user ? (
            <button onClick={() => router.push("/profile")} className="shrink-0 ml-1">
              {profile?.photoURL
                ? <img src={profile.photoURL} className="w-8 h-8 rounded-full" alt="" />
                : <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">{profile?.displayName?.[0]}</div>
              }
            </button>
          ) : (
            <button onClick={signInWithGoogle} className="shrink-0 ml-1 text-xs font-medium bg-black text-white px-3 py-1.5 rounded-full">
              시작하기
            </button>
          )}
        </div>

        {/* 취향 칩 */}
        {tab === "feed" && (profile?.preferences?.length ?? 0) > 0 && (
          <div className="flex gap-1.5 mt-2 overflow-x-auto scrollbar-hide max-w-screen-xl mx-auto">
            {profile!.preferences.map(p => (
              <button key={p} onClick={() => fetchItems(STYLE_QUERIES[p] ?? p, 1, false)}
                className="shrink-0 text-[11px] bg-gray-100 hover:bg-black hover:text-white rounded-full px-3 py-1.5 transition-colors">
                {p}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* 피드 */}
      <div className="px-2 pt-3 max-w-screen-xl mx-auto">
        {fetching ? (
          <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-2">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="break-inside-avoid mb-3 rounded-2xl bg-gray-100 animate-pulse"
                style={{ height: `${180 + (i % 4) * 60}px` }} />
            ))}
          </div>
        ) : (
          <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-2">
            {items.map((item, i) => <ProductCard key={`${item.link}-${i}`} product={item} />)}
          </div>
        )}

        {/* 무한스크롤 센티널 */}
        <div ref={sentinelRef} className="h-10 flex items-center justify-center mt-4">
          {loadingMore && (
            <div className="w-5 h-5 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
          )}
        </div>
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 flex">
        <button onClick={() => { setTab("feed"); setQuery(""); fetchItems(TRENDING[Math.floor(Math.random()*TRENDING.length)]); }}
          className={`flex-1 py-3 flex justify-center transition-colors ${tab === "feed" ? "text-black" : "text-gray-300"}`}>
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <rect x="3" y="3" width="8" height="8" rx="1.5"/>
            <rect x="13" y="3" width="8" height="8" rx="1.5"/>
            <rect x="3" y="13" width="8" height="8" rx="1.5"/>
            <rect x="13" y="13" width="8" height="8" rx="1.5"/>
          </svg>
        </button>
        <button onClick={() => setTab("search")}
          className={`flex-1 py-3 flex justify-center transition-colors ${tab === "search" ? "text-black" : "text-gray-300"}`}>
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>
          </svg>
        </button>
        <button onClick={() => user ? router.push("/profile") : signInWithGoogle()}
          className="flex-1 py-3 flex justify-center text-gray-300 hover:text-black transition-colors">
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
        </button>
      </nav>
    </div>
  );
}
