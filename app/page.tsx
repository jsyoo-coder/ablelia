"use client";

import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ProductCard from "./components/ProductCard";
import type { Product as ProductType } from "./components/ProductCard";
import ProductDetail from "./components/ProductDetail";

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

const STYLE_ITEMS: Record<string, string[]> = {
  minimal:  ["베이직 티셔츠", "린넨 셔츠", "슬랙스", "미니멀 자켓", "흰 셔츠"],
  street:   ["그래픽 티셔츠", "오버핏 후드", "카고팬츠", "스트릿 자켓", "조거팬츠"],
  casual:   ["청자켓", "와이드 팬츠", "데님 쇼츠", "캐주얼 원피스", "반팔 티셔츠"],
  formal:   ["슬랙스", "블레이저", "포멀 셔츠", "트렌치코트", "정장 스커트"],
  vintage:  ["빈티지 데님", "레트로 자켓", "빈티지 셔츠", "와이드 청바지", "빈티지 코트"],
  sporty:   ["트레이닝 팬츠", "레깅스", "스포츠 자켓", "후디", "반집업"],
  feminine: ["플로럴 원피스", "미니스커트", "블라우스", "플리츠 스커트", "크롭 자켓"],
  outdoor:  ["고어텍스 자켓", "아웃도어 팬츠", "플리스 자켓", "등산화", "조끼"],
  luxury:   ["명품 가방", "하이엔드 코트", "디자이너 원피스", "럭셔리 슈즈", "명품 벨트"],
  y2k:      ["로우라이즈 청바지", "크롭 탑", "Y2K 자켓", "체인 액세서리", "미니스커트"],
  amekaji:  ["워크웨어 자켓", "체크 셔츠", "데님 팬츠", "아메카지 코트", "부츠"],
  preppy:   ["체크 스커트", "카디건", "니트 조끼", "로퍼", "컬리지 셔츠"],
};

type Product = ProductType;

const RECENT_KEY = "ablelia_recent_searches";

function loadRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]"); } catch { return []; }
}
function saveRecent(list: string[]) {
  localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 8)));
}

export default function Home() {
  const { user, profile, loading, signInWithGoogle, logout } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<Product[]>([]);
  const [fetching, setFetching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<"feed" | "search">("feed");
  const [query, setQuery] = useState("");
  const [activeStyle, setActiveStyle] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [searchSubmitted, setSearchSubmitted] = useState(false);
  const [masoncols, setMasoncols] = useState(2);
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(null);
  const currentQueryRef = useRef("");
  const startRef = useRef(1);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchImgCacheRef = useRef<Record<string, string>>({});
  const [searchImgs, setSearchImgs] = useState<Record<string, string>>({});

  // localStorage 최근 검색어 로드
  useEffect(() => {
    setRecentSearches(loadRecent());
  }, []);

  // 화면 너비에 따른 컬럼 수 (2/3/4)
  useLayoutEffect(() => {
    function update() {
      const w = window.innerWidth;
      setMasoncols(w >= 1024 ? 4 : w >= 640 ? 3 : 2);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

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

  // 초기 피드 + 관심사/브랜드 변경 시 재요청
  const prefsKey = [
    ...(profile?.preferences ?? []),
    ...(profile?.genders ?? []),
    ...(profile?.ageGroups ?? []),
  ].join(",");

  function buildQuery(base: string): string {
    const userGenders = profile?.genders ?? [];
    const userAgeGroups = profile?.ageGroups ?? [];
    const g = userGenders.length === 1
      ? (userGenders[0] === "여성" ? "여성의류" : "남성의류")
      : "";
    const a = userAgeGroups.length === 1
      ? userAgeGroups[0].replace(" 이상", "")
      : "";
    return [a, g, base].filter(Boolean).join(" ");
  }

  useEffect(() => {
    if (tab !== "feed" || loading) return;
    const stylePool = (profile?.preferences ?? []).map(p => STYLE_QUERIES[p] ?? p);
    const base = stylePool.length > 0
      ? stylePool[Math.floor(Math.random() * stylePool.length)]
      : TRENDING[Math.floor(Math.random() * TRENDING.length)];
    setActiveStyle(null);

    const q = buildQuery(base);
    async function loadWithFallback() {
      setFetching(true);
      setItems([]);
      currentQueryRef.current = q;
      startRef.current = 41;
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&start=1`);
      const data = await res.json();
      const result: Product[] = data.items ?? [];
      if (result.length === 0 && q !== base) {
        // 성별/나이 조합이 결과 없으면 스타일 단독 쿼리로 재시도
        const res2 = await fetch(`/api/search?q=${encodeURIComponent(base)}&start=1`);
        const data2 = await res2.json();
        currentQueryRef.current = base;
        setItems(data2.items ?? []);
      } else {
        setItems(result);
      }
      setFetching(false);
    }
    loadWithFallback();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, loading, prefsKey]);


  // 취향 기반 추천 검색어 (없으면 트렌딩)
  const personalizedSuggestions = useMemo(() => {
    const prefs = profile?.preferences ?? [];
    const genders = profile?.genders ?? [];
    const ageGroups = profile?.ageGroups ?? [];
    const hasPrefs = prefs.length > 0 || genders.length > 0 || ageGroups.length > 0;
    if (!hasPrefs) return TRENDING;

    const gPrefix = genders.length === 1 ? genders[0] : "";
    const aPrefix = ageGroups.length === 1 ? ageGroups[0].replace(" 이상", "") : "";
    const stylePool = prefs.length > 0 ? prefs : Object.keys(STYLE_ITEMS);
    const result: string[] = [];

    for (const style of stylePool) {
      for (const item of (STYLE_ITEMS[style] ?? []).slice(0, 3)) {
        const parts = [aPrefix, gPrefix, item].filter(Boolean);
        result.push(parts.join(" "));
        if (result.length >= 12) break;
      }
      if (result.length >= 12) break;
    }
    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.preferences?.join(","), profile?.genders?.join(","), profile?.ageGroups?.join(",")]);

  // 검색 홈 열릴 때 검색어별 썸네일 로드 (캐시)
  useEffect(() => {
    if (tab !== "search" || searchSubmitted) return;
    const targets = [...new Set([...personalizedSuggestions, ...recentSearches])];
    const toLoad = targets.filter(s => !searchImgCacheRef.current[s]);
    if (!toLoad.length) return;
    (async () => {
      const results = await Promise.allSettled(
        toLoad.map(async s => {
          const res = await fetch(`/api/search?q=${encodeURIComponent(s)}&display=3`);
          const data = await res.json();
          const img = (data.items ?? []).find((i: { image?: string }) => i.image)?.image ?? "";
          return { s, img };
        })
      );
      const updates: Record<string, string> = {};
      results.forEach(r => { if (r.status === "fulfilled" && r.value.img) updates[r.value.s] = r.value.img; });
      Object.assign(searchImgCacheRef.current, updates);
      setSearchImgs({ ...searchImgCacheRef.current });
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, searchSubmitted, personalizedSuggestions]);

  // 프로필 메뉴 외부 클릭 닫기
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function submitSearch(q: string) {
    if (!q.trim()) return;
    const updated = [q, ...recentSearches.filter(r => r !== q)];
    setRecentSearches(updated);
    saveRecent(updated);
    setQuery(q);
    setSearchSubmitted(true);
    setTab("search");
    setActiveStyle(null);
    fetchItems(q, 1, false);
  }

  function removeRecent(q: string, e: React.MouseEvent) {
    e.stopPropagation();
    const updated = recentSearches.filter(r => r !== q);
    setRecentSearches(updated);
    saveRecent(updated);
  }

  async function handleLogin() {
    setSigningIn(true);
    setLoginError(null);
    const err = await signInWithGoogle();
    if (err) setLoginError(err);
    setSigningIn(false);
  }

  function openSearch() {
    setTab("search");
    setSearchSubmitted(false);
    setQuery("");
    setItems([]);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#F7F0E6" }}>
      <div className="w-6 h-6 border-2 border-[#FF3D7F] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const userPrefs = profile?.preferences ?? [];

  const filteredSuggestions = query.trim()
    ? personalizedSuggestions.filter(s => s.includes(query)).slice(0, 8)
    : personalizedSuggestions.slice(0, 10);

  return (
    <div className="min-h-screen pb-6" style={{ background: "#F7F0E6" }}>
      {selectedProduct && tab !== "search" && (
        <ProductDetail
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onSelect={setSelectedProduct}
          onSearchOpen={() => setTab("search")}
        />
      )}
      {/* Header */}
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3"
        style={{ background: "rgba(247,240,230,0.97)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center justify-between max-w-screen-xl mx-auto mb-3">
          {tab === "search" ? (
            <div className="flex items-center gap-2 w-full">
              <button
                onClick={() => {
                  if (searchSubmitted) { setSearchSubmitted(false); setQuery(""); setItems([]); }
                  else { setTab("feed"); setQuery(""); }
                }}
                className="text-gray-500 hover:text-[#FF3D7F] transition-colors shrink-0">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path d="M19 12H5M12 5l-7 7 7 7"/>
                </svg>
              </button>
              <div className="flex-1 flex items-center bg-white rounded-full px-4 py-2.5 gap-2 shadow-sm">
                <svg width="15" height="15" fill="none" stroke="#999" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => { setQuery(e.target.value); if (searchSubmitted) setSearchSubmitted(false); }}
                  onKeyDown={e => e.key === "Enter" && submitSearch(query)}
                  placeholder="패션 아이템 검색..."
                  className="flex-1 outline-none bg-transparent"
                  style={{ fontSize: "16px" }}
                />
                {query && (
                  <button onClick={() => { setQuery(""); setSearchSubmitted(false); setItems([]); inputRef.current?.focus(); }}
                    className="text-gray-300 hover:text-gray-500 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <h1 className="font-keris text-3xl text-[#1A1A1A]" style={{ fontFamily: "var(--font-keris)", letterSpacing: "0.01em" }}>
                Ablelia
              </h1>
              <div className="flex items-center gap-3">
                <button onClick={openSearch}
                  className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                  <svg width="16" height="16" fill="none" stroke="#1A1A1A" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                </button>
                {user ? (
                  <div ref={profileMenuRef} className="relative">
                    <button
                      onClick={() => setShowProfileMenu(v => !v)}
                      className="flex items-center gap-1.5 bg-white rounded-full pl-1 pr-2.5 py-1 shadow-sm hover:shadow-md transition-shadow">
                      <div className="w-7 h-7 rounded-full overflow-hidden shrink-0">
                        {profile?.photoURL
                          ? <img src={profile.photoURL} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                          : <div className="w-full h-full bg-[#FF3D7F] flex items-center justify-center text-white text-xs font-bold">
                              {profile?.displayName?.[0]}
                            </div>
                        }
                      </div>
                      <svg width="12" height="12" fill="none" stroke="#999" strokeWidth="2.5" viewBox="0 0 24 24"
                        className={`transition-transform ${showProfileMenu ? "rotate-180" : ""}`}>
                        <path d="M6 9l6 6 6-6"/>
                      </svg>
                    </button>

                    {/* 프로필 드롭다운 */}
                    {showProfileMenu && (
                      <div className="absolute right-0 top-12 w-64 bg-white rounded-3xl shadow-2xl overflow-hidden z-50"
                        style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.15)" }}>
                        {/* 현재 계정 */}
                        <div className="px-4 pt-4 pb-2">
                          <p className="text-[10px] text-gray-400 font-semibold mb-2">현재 로그인 계정</p>
                          <div className="flex items-center gap-3 bg-[#F7F0E6] rounded-2xl p-3">
                            <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 ring-2 ring-[#FF3D7F]">
                              {profile?.photoURL
                                ? <img src={profile.photoURL} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                                : <div className="w-full h-full bg-[#FF3D7F] flex items-center justify-center text-white font-bold">
                                    {profile?.displayName?.[0]}
                                  </div>
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm text-[#1A1A1A] truncate">{profile?.displayName}</p>
                              <p className="text-[11px] text-gray-400 truncate">{profile?.email}</p>
                            </div>
                            <svg width="14" height="14" fill="none" stroke="#FF3D7F" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path d="M20 6L9 17l-5-5"/>
                            </svg>
                          </div>
                        </div>

                        <div className="mx-4 my-1 border-t border-gray-100" />

                        {/* 메뉴 항목 */}
                        <div className="px-2 pb-3">
                          <button
                            onClick={() => { setShowProfileMenu(false); router.push("/profile"); }}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-[#F7F0E6] transition-colors text-left">
                            <div className="w-8 h-8 bg-[#F7F0E6] rounded-full flex items-center justify-center shrink-0">
                              <svg width="14" height="14" fill="none" stroke="#FF3D7F" strokeWidth="2" viewBox="0 0 24 24">
                                <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                              </svg>
                            </div>
                            <span className="text-sm font-semibold text-[#1A1A1A]">스타일 취향 설정</span>
                          </button>
                          <button
                            onClick={async () => { setShowProfileMenu(false); await logout(); }}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-red-50 transition-colors text-left">
                            <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center shrink-0">
                              <svg width="14" height="14" fill="none" stroke="#ef4444" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
                              </svg>
                            </div>
                            <span className="text-sm font-semibold text-red-500">로그아웃</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={handleLogin}
                    disabled={signingIn}
                    className="bg-[#FF3D7F] text-white text-xs font-bold px-4 py-2 rounded-full shadow-sm hover:bg-[#d42d6e] transition-colors disabled:opacity-60">
                    {signingIn ? "..." : "시작하기"}
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* 로그인 에러 메시지 */}
        {loginError && (
          <div className="mx-auto max-w-screen-xl mb-2 bg-red-50 border border-red-200 text-red-600 text-xs rounded-2xl px-4 py-2.5 flex items-start gap-2">
            <span className="shrink-0 mt-0.5">⚠️</span>
            <span>{loginError}</span>
            <button onClick={() => setLoginError(null)} className="ml-auto shrink-0 text-red-400">✕</button>
          </div>
        )}

        {/* 스타일·성별·나이 칩 */}
        {tab === "feed" && (userPrefs.length > 0 || (profile?.genders ?? []).length > 0 || (profile?.ageGroups ?? []).length > 0) && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide max-w-screen-xl mx-auto">
            {(profile?.genders ?? []).map(g => (
              <span key={`g-${g}`} className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-full bg-[#FF3D7F] text-white">
                {g}
              </span>
            ))}
            {(profile?.ageGroups ?? []).map(a => (
              <span key={`a-${a}`} className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-full bg-[#FF3D7F] text-white">
                {a}
              </span>
            ))}
            {userPrefs.map(p => (
              <button key={p}
                onClick={() => { setActiveStyle(p); fetchItems(buildQuery(STYLE_QUERIES[p]), 1, false); }}
                className={`shrink-0 text-xs font-semibold px-4 py-1.5 rounded-full transition-all ${
                  activeStyle === p
                    ? "bg-[#FF3D7F] text-white shadow-sm"
                    : "bg-white text-[#1A1A1A] shadow-sm hover:shadow-md"
                }`}>
                {STYLE_LABELS[p] ?? p}
              </button>
            ))}
          </div>
        )}
      </header>

      {tab === "feed" ? (
        /* ── 피드 ── */
        <div className="px-3 pt-4 max-w-screen-xl mx-auto">
          {!fetching && items.length > 0 && (
            <div className="mb-3">
              <h2 className="text-xs font-black tracking-widest text-[#FF3D7F] uppercase">
                {activeStyle ? STYLE_LABELS[activeStyle] : "NEW ITEMS"}
              </h2>
            </div>
          )}
          {fetching ? (
            <div className="flex gap-3">
              {Array.from({ length: masoncols }, (_, col) => col).map(col => (
                <div key={col} className="flex-1 flex flex-col min-w-0">
                  {Array.from({ length: 6 }).map((_, i) => {
                    const idx = col + i * masoncols;
                    return (
                      <div key={idx} className="mb-3 rounded-3xl bg-white animate-pulse shadow-sm overflow-hidden">
                        <div className="rounded-3xl m-2" style={{ height: `${160 + (idx % 4) * 50}px`, background: "#EDE6DA" }} />
                        <div className="px-3 py-2.5 space-y-1.5">
                          <div className="h-2 bg-gray-100 rounded-full w-16" />
                          <div className="h-3 bg-gray-100 rounded-full w-full" />
                          <div className="h-3 bg-gray-100 rounded-full w-3/4" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-3">
              {Array.from({ length: masoncols }, (_, col) => col).map(col => (
                <div key={col} className="flex-1 flex flex-col min-w-0">
                  {items.map((item, i) => ({ item, i })).filter(({ i }) => i % masoncols === col).map(({ item, i }) => (
                    <ProductCard key={`${item.link}-${i}`} product={item} isNew={i < 6} onSelect={setSelectedProduct} />
                  ))}
                </div>
              ))}
            </div>
          )}
          <div ref={sentinelRef} className="h-12 flex items-center justify-center mt-2">
            {loadingMore && <div className="w-5 h-5 border-2 border-[#EDE6DA] border-t-[#FF3D7F] rounded-full animate-spin" />}
          </div>
        </div>
      ) : !searchSubmitted ? (
        /* ── 검색 홈: 최근·추천 그리드 ── */
        <div className="px-4 pt-5 pb-10 max-w-screen-xl mx-auto">
          {recentSearches.length > 0 && !query.trim() && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-black text-[#1A1A1A]">최근 검색 기록</h2>
                <button onClick={() => { setRecentSearches([]); saveRecent([]); }}
                  className="text-xs text-gray-400 hover:text-gray-600">전체 삭제</button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {recentSearches.map(r => (
                  <button key={r} onClick={() => submitSearch(r)}
                    className="flex items-center gap-3 bg-white rounded-2xl p-2.5 shadow-sm hover:shadow-md transition-shadow text-left">
                    <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-[#EDE6DA]">
                      {searchImgs[r]
                        ? <img src={searchImgs[r]} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full animate-pulse bg-[#EDE6DA]" />}
                    </div>
                    <span className="flex-1 text-xs font-semibold text-[#1A1A1A] leading-tight line-clamp-2 min-w-0">{r}</span>
                    <button onClick={(e) => removeRecent(r, e)} className="p-1 text-gray-300 hover:text-gray-500 shrink-0">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                    </button>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-sm font-black text-[#1A1A1A] mb-3">
              {query.trim() ? "검색 제안" : "추천 아이템"}
            </h2>
            {filteredSuggestions.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {filteredSuggestions.map(s => (
                  <button key={s} onClick={() => submitSearch(s)}
                    className="flex items-center gap-3 bg-white rounded-2xl p-2.5 shadow-sm hover:shadow-md transition-shadow text-left">
                    <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-[#EDE6DA]">
                      {searchImgs[s]
                        ? <img src={searchImgs[s]} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full animate-pulse bg-[#EDE6DA]" />}
                    </div>
                    <span className="flex-1 text-xs font-semibold text-[#1A1A1A] leading-tight line-clamp-2 min-w-0">
                      {query.trim()
                        ? s.split(query).flatMap((part, i) =>
                            i === 0 ? [part] : [<strong key={i} className="text-[#FF3D7F]">{query}</strong>, part]
                          )
                        : s}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 mt-2">
                &ldquo;{query}&rdquo; — Enter 키로 검색
              </p>
            )}
          </div>
        </div>
      ) : (
        /* ── 검색 결과 ── */
        <div className="px-3 pt-4 max-w-screen-xl mx-auto">
          {!fetching && items.length > 0 && (
            <div className="mb-3">
              <h2 className="text-xs font-black tracking-widest text-[#FF3D7F] uppercase">검색 결과</h2>
            </div>
          )}
          {fetching ? (
            <div className="flex gap-3">
              {Array.from({ length: masoncols }, (_, col) => col).map(col => (
                <div key={col} className="flex-1 flex flex-col min-w-0">
                  {Array.from({ length: 6 }).map((_, i) => {
                    const idx = col + i * masoncols;
                    return (
                      <div key={idx} className="mb-3 rounded-3xl bg-white animate-pulse shadow-sm overflow-hidden">
                        <div className="rounded-3xl m-2" style={{ height: `${160 + (idx % 4) * 50}px`, background: "#EDE6DA" }} />
                        <div className="px-3 py-2.5 space-y-1.5">
                          <div className="h-2 bg-gray-100 rounded-full w-16" />
                          <div className="h-3 bg-gray-100 rounded-full w-full" />
                          <div className="h-3 bg-gray-100 rounded-full w-3/4" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-3">
              {Array.from({ length: masoncols }, (_, col) => col).map(col => (
                <div key={col} className="flex-1 flex flex-col min-w-0">
                  {items.map((item, i) => ({ item, i })).filter(({ i }) => i % masoncols === col).map(({ item, i }) => (
                    <ProductCard key={`${item.link}-${i}`} product={item} isNew={i < 6} onSelect={setSelectedProduct} />
                  ))}
                </div>
              ))}
            </div>
          )}
          <div ref={sentinelRef} className="h-12 flex items-center justify-center mt-2">
            {loadingMore && <div className="w-5 h-5 border-2 border-[#EDE6DA] border-t-[#FF3D7F] rounded-full animate-spin" />}
          </div>
        </div>
      )}
    </div>
  );
}
