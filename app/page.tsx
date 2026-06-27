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

const SUGGESTIONS = [
  "린넨 셔츠", "오버핏 티셔츠", "와이드 팬츠", "버킷햇", "청자켓",
  "니트 조끼", "크롭 탑", "스트링 백팩", "플랫폼 슈즈", "데님 쇼츠",
  "트렌치코트", "슬링백", "카디건", "조거팬츠", "반집업",
];

type Product = {
  title: string; link: string; image: string;
  lprice: string; mallName: string; brand: string; category2: string;
};

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
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const currentQueryRef = useRef("");
  const startRef = useRef(1);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // localStorage 최근 검색어 로드
  useEffect(() => {
    setRecentSearches(loadRecent());
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
    ...(profile?.brands ?? []),
  ].join(",");
  useEffect(() => {
    if (tab !== "feed" || loading) return;
    if (!profile?.onboardingComplete) { fetchItems(TRENDING[Math.floor(Math.random() * TRENDING.length)], 1, false); return; }
    const stylePool = (profile.preferences ?? []).map(p => STYLE_QUERIES[p] ?? p);
    const brandPool = (profile.brands ?? []).map(b => b); // 브랜드명 그대로 검색
    const pool = [...stylePool, ...brandPool];
    const q = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : TRENDING[Math.floor(Math.random() * TRENDING.length)];
    setActiveStyle(null);
    fetchItems(q, 1, false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, loading, prefsKey]);


  // 드롭다운 외부 클릭 닫기
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
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
    setShowDropdown(false);
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
    setShowDropdown(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#F7F0E6" }}>
      <div className="w-6 h-6 border-2 border-[#FF3D7F] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const userPrefs = profile?.preferences ?? [];

  // 드롭다운에 보여줄 추천 목록 (쿼리 필터링)
  const filteredSuggestions = query.trim()
    ? SUGGESTIONS.filter(s => s.includes(query)).slice(0, 6)
    : SUGGESTIONS.slice(0, 8);

  return (
    <div className="min-h-screen pb-20" style={{ background: "#F7F0E6" }}>
      {/* Header */}
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3"
        style={{ background: "rgba(247,240,230,0.97)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center justify-between max-w-screen-xl mx-auto mb-3">
          {tab === "search" ? (
            <div className="flex items-center gap-2 w-full">
              <button
                onClick={() => { setTab("feed"); setQuery(""); setShowDropdown(false); }}
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
                  onChange={e => { setQuery(e.target.value); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  onKeyDown={e => e.key === "Enter" && submitSearch(query)}
                  placeholder="패션 아이템 검색..."
                  className="flex-1 text-sm outline-none bg-transparent"
                />
                {query && (
                  <button onClick={() => { setQuery(""); setShowDropdown(true); inputRef.current?.focus(); }}
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

        {/* 스타일 칩 */}
        {tab === "feed" && userPrefs.length > 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide max-w-screen-xl mx-auto">
            {userPrefs.map(p => (
              <button key={p}
                onClick={() => { setActiveStyle(p); fetchItems(STYLE_QUERIES[p], 1, false); }}
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

      {/* 검색 드롭다운 */}
      {tab === "search" && showDropdown && (
        <div
          ref={dropdownRef}
          className="fixed left-0 right-0 z-10 px-4 pt-2"
          style={{ top: "72px" }}>
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden max-w-screen-xl mx-auto">
            {/* 최근 검색어 */}
            {recentSearches.length > 0 && (
              <div className="px-4 pt-4 pb-2">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-black tracking-widest text-[#FF3D7F] uppercase">최근 검색</p>
                  <button
                    onClick={() => { setRecentSearches([]); saveRecent([]); }}
                    className="text-[10px] text-gray-400 hover:text-gray-600">
                    전체 삭제
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {recentSearches.map(r => (
                    <div key={r}
                      onClick={() => submitSearch(r)}
                      className="flex items-center gap-1 bg-[#F7F0E6] rounded-full px-3 py-1.5 cursor-pointer hover:bg-[#ede6da] transition-colors">
                      <svg width="11" height="11" fill="none" stroke="#999" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
                      </svg>
                      <span className="text-xs text-[#1A1A1A]">{r}</span>
                      <button
                        onClick={(e) => removeRecent(r, e)}
                        className="text-gray-300 hover:text-gray-500 ml-0.5">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 구분선 */}
            {recentSearches.length > 0 && (
              <div className="mx-4 my-2 border-t border-gray-100" />
            )}

            {/* 추천/검색 제안 */}
            <div className="px-4 pb-4 pt-2">
              <p className="text-[10px] font-black tracking-widest text-[#FF3D7F] uppercase mb-2">
                {query.trim() ? "검색 제안" : "추천 검색어"}
              </p>
              {filteredSuggestions.length > 0 ? (
                <div className="space-y-0">
                  {filteredSuggestions.map(s => (
                    <button
                      key={s}
                      onClick={() => submitSearch(s)}
                      className="w-full flex items-center gap-3 py-2.5 px-1 text-left hover:bg-[#F7F0E6] rounded-xl transition-colors">
                      <svg width="14" height="14" fill="none" stroke="#CCC" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>
                      </svg>
                      <span className="text-sm text-[#1A1A1A]">
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
                <p className="text-xs text-gray-400 py-2">
                  &ldquo;{query}&rdquo; — Enter 키로 검색
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 배경 딤 (드롭다운 오픈 시) */}
      {tab === "search" && showDropdown && (
        <div
          className="fixed inset-0 z-0"
          style={{ background: "rgba(0,0,0,0.08)", top: "72px" }}
          onClick={() => setShowDropdown(false)}
        />
      )}

      {/* Feed */}
      <div className="px-3 pt-4 max-w-screen-xl mx-auto relative z-0">
        {!fetching && items.length > 0 && (
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-black tracking-widest text-[#FF3D7F] uppercase">
              {tab === "search" ? "검색 결과" : (activeStyle ? STYLE_LABELS[activeStyle] : "NEW ITEMS")}
            </h2>
            <span className="text-[10px] text-gray-400">{items.length}개</span>
          </div>
        )}

        {fetching ? (
          <div className="columns-2 sm:columns-3 md:columns-4 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="break-inside-avoid mb-3 rounded-3xl bg-white animate-pulse shadow-sm overflow-hidden">
                <div className="rounded-3xl m-2" style={{ height: `${160 + (i % 4) * 50}px`, background: "#EDE6DA" }} />
                <div className="px-3 py-2.5 space-y-1.5">
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

        <div ref={sentinelRef} className="h-12 flex items-center justify-center mt-2">
          {loadingMore && (
            <div className="w-5 h-5 border-2 border-[#EDE6DA] border-t-[#FF3D7F] rounded-full animate-spin" />
          )}
        </div>
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 flex z-20"
        style={{ background: "rgba(247,240,230,0.97)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <button
          onClick={() => { setTab("feed"); setQuery(""); setActiveStyle(null); setShowDropdown(false); }}
          className="flex-1 py-3.5 flex justify-center items-center">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
            tab === "feed" ? "bg-[#FF3D7F] shadow-lg" : ""
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
          onClick={openSearch}
          className="flex-1 py-3.5 flex justify-center items-center">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
            tab === "search" ? "bg-[#FF3D7F] shadow-lg" : ""
          }`}>
            <svg width="20" height="20" fill="none" stroke={tab === "search" ? "#fff" : "#BBB"} strokeWidth="1.8" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </div>
        </button>
        <button
          onClick={() => user ? router.push("/profile") : handleLogin()}
          className="flex-1 py-3.5 flex justify-center items-center">
          <div className="w-11 h-11 rounded-full flex items-center justify-center">
            {user && profile?.photoURL
              ? <img src={profile.photoURL} className="w-8 h-8 rounded-full" alt="" referrerPolicy="no-referrer" />
              : <svg width="20" height="20" fill="none" stroke="#BBB" strokeWidth="1.8" viewBox="0 0 24 24">
                  <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
            }
          </div>
        </button>
      </nav>
    </div>
  );
}
