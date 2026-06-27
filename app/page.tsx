"use client";

import { useState, useEffect, useCallback } from "react";
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
  "린넨 셔츠 여름",
  "오버핏 반팔 티셔츠",
  "와이드 데님 팬츠",
  "크롭 자켓",
  "플랫폼 슈즈",
  "니트 조끼",
  "버킷햇",
  "스트링 백팩",
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
  const [tab, setTab] = useState<"feed" | "search">("feed");
  const [query, setQuery] = useState("");

  const fetchItems = useCallback(async (q: string) => {
    setFetching(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setItems(data.items ?? []);
    setFetching(false);
  }, []);

  // 피드 로드
  useEffect(() => {
    if (tab !== "feed") return;
    if (!loading && user && profile?.onboardingComplete && profile.preferences.length > 0) {
      const pick = profile.preferences[Math.floor(Math.random() * profile.preferences.length)];
      fetchItems(STYLE_QUERIES[pick] ?? pick);
    } else if (!loading) {
      const pick = TRENDING[Math.floor(Math.random() * TRENDING.length)];
      fetchItems(pick);
    }
  }, [tab, loading, profile?.onboardingComplete]);

  // 온보딩 리다이렉트
  useEffect(() => {
    if (!loading && user && profile && !profile.onboardingComplete) {
      router.push("/onboarding");
    }
  }, [loading, user, profile]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-white pb-20">

      {/* Header */}
      <header className="sticky top-0 bg-white/90 backdrop-blur-sm z-10 px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          {tab === "search" ? (
            <input
              autoFocus
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && fetchItems(query)}
              placeholder="검색..."
              className="flex-1 bg-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none"
            />
          ) : (
            <h1 className="flex-1 text-xl font-bold tracking-tight">ablelia</h1>
          )}

          {user ? (
            <button onClick={() => router.push("/profile")} className="shrink-0">
              {profile?.photoURL
                ? <img src={profile.photoURL} className="w-8 h-8 rounded-full" alt="" />
                : <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold">{profile?.displayName?.[0]}</div>
              }
            </button>
          ) : (
            <button onClick={signInWithGoogle} className="shrink-0 text-xs font-medium text-gray-400 hover:text-black transition-colors">
              로그인
            </button>
          )}
        </div>

        {/* 취향 칩 — 로그인+피드 탭 */}
        {tab === "feed" && profile?.preferences?.length ? (
          <div className="flex gap-1.5 mt-2 overflow-x-auto scrollbar-hide">
            {profile.preferences.map(p => (
              <button
                key={p}
                onClick={() => fetchItems(STYLE_QUERIES[p] ?? p)}
                className="shrink-0 text-[11px] bg-gray-100 hover:bg-black hover:text-white rounded-full px-3 py-1 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        ) : null}
      </header>

      {/* 피드 */}
      {fetching ? (
        <div className="flex justify-center py-32">
          <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-2 px-2 pt-2">
          {items.map((item, i) => <ProductCard key={i} product={item} />)}
        </div>
      )}

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-100 flex">
        <button
          onClick={() => { setTab("feed"); setQuery(""); }}
          className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors ${tab === "feed" ? "text-black" : "text-gray-300"}`}
        >
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <rect x="3" y="3" width="8" height="8" rx="1.5"/>
            <rect x="13" y="3" width="8" height="8" rx="1.5"/>
            <rect x="3" y="13" width="8" height="8" rx="1.5"/>
            <rect x="13" y="13" width="8" height="8" rx="1.5"/>
          </svg>
        </button>
        <button
          onClick={() => { setTab("search"); setItems([]); }}
          className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors ${tab === "search" ? "text-black" : "text-gray-300"}`}
        >
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>
          </svg>
        </button>
        <button
          onClick={() => user ? router.push("/profile") : signInWithGoogle()}
          className="flex-1 flex flex-col items-center py-3 gap-0.5 text-gray-300 hover:text-black transition-colors"
        >
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
        </button>
      </nav>
    </div>
  );
}
