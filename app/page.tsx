"use client";

import { useState, useEffect } from "react";
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
  outdoor: "아웃도어 고어텍스 등산",
  luxury: "하이엔드 럭셔리 패션",
  y2k: "Y2K 로우라이즈 2000년대",
  amekaji: "아메카지 워크웨어 데님",
  preppy: "프레피 컬리지 클래식",
};

type Product = {
  title: string;
  link: string;
  image: string;
  lprice: string;
  mallName: string;
  brand: string;
  category2: string;
};

export default function Home() {
  const { user, profile, loading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [fetching, setFetching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [activeTab, setActiveTab] = useState<"feed" | "search">("feed");

  useEffect(() => {
    if (!loading && user && profile && !profile.onboardingComplete) {
      router.push("/onboarding");
    }
  }, [loading, user, profile, router]);

  useEffect(() => {
    if (profile?.onboardingComplete && profile.preferences.length > 0 && activeTab === "feed") {
      loadFeed(profile.preferences);
    }
  }, [profile?.onboardingComplete, activeTab]);

  async function loadFeed(preferences: string[]) {
    setFetching(true);
    const pick = preferences[Math.floor(Math.random() * preferences.length)];
    const q = STYLE_QUERIES[pick] ?? pick;
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setResults(data.items ?? []);
    setFetching(false);
  }

  async function handleSearch(q?: string) {
    const sq = q ?? query;
    if (!sq.trim()) return;
    setFetching(true);
    setSearched(true);
    if (q) setQuery(q);
    const res = await fetch(`/api/search?q=${encodeURIComponent(sq)}`);
    const data = await res.json();
    setResults(data.items ?? []);
    setFetching(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  /* ── 비로그인 랜딩 ── */
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-3xl font-bold mb-2">ablelia</h1>
        <p className="text-gray-400 text-sm mb-10">나만의 취향으로 모든 플랫폼 패션을 한눈에</p>
        <button
          onClick={signInWithGoogle}
          className="flex items-center gap-3 border border-gray-200 rounded-2xl px-6 py-4 text-sm font-medium hover:border-black transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
          </svg>
          Google로 시작하기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between z-10">
        <h1 className="text-xl font-bold">ablelia</h1>
        {activeTab === "search" && (
          <div className="flex-1 mx-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="검색..."
              className="w-full bg-gray-100 rounded-xl px-4 py-2 text-sm outline-none"
            />
          </div>
        )}
        <button onClick={() => router.push("/profile")}>
          {profile?.photoURL ? (
            <img src={profile.photoURL} alt="" className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold">
              {profile?.displayName?.[0]}
            </div>
          )}
        </button>
      </header>

      {/* Style chips — feed tab only */}
      {activeTab === "feed" && profile?.preferences && (
        <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide border-b border-gray-50">
          {profile.preferences.map((p) => (
            <button
              key={p}
              onClick={() => loadFeed([p])}
              className="shrink-0 text-xs border border-gray-200 rounded-full px-3 py-1.5 hover:border-black hover:text-black transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {fetching ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="px-3 pt-3">
          {activeTab === "search" && searched && (
            <p className="text-xs text-gray-400 mb-3 px-1">{results.length}개 결과</p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {results.map((item, i) => (
              <ProductCard key={i} product={item} />
            ))}
          </div>
          {activeTab === "feed" && results.length === 0 && !fetching && (
            <p className="text-center text-gray-300 py-20 text-sm">피드를 불러오는 중...</p>
          )}
        </div>
      )}

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex">
        <button
          onClick={() => { setActiveTab("feed"); setSearched(false); }}
          className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors ${activeTab === "feed" ? "text-black" : "text-gray-400"}`}
        >
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
          <span className="text-[10px] font-medium">피드</span>
        </button>
        <button
          onClick={() => { setActiveTab("search"); setResults([]); setSearched(false); }}
          className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors ${activeTab === "search" ? "text-black" : "text-gray-400"}`}
        >
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <span className="text-[10px] font-medium">검색</span>
        </button>
        <button
          onClick={() => router.push("/profile")}
          className="flex-1 flex flex-col items-center py-3 gap-0.5 text-gray-400 hover:text-black transition-colors"
        >
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
          <span className="text-[10px] font-medium">프로필</span>
        </button>
      </nav>
    </div>
  );
}
