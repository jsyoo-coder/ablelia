"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import type { Product } from "./ProductCard";
import ProductCard from "./ProductCard";

const LIKES_KEY = "ablelia_likes";

function getLikes(): string[] {
  try { return JSON.parse(localStorage.getItem(LIKES_KEY) ?? "[]"); } catch { return []; }
}
function saveLikes(list: string[]) {
  localStorage.setItem(LIKES_KEY, JSON.stringify(list));
}

function buildSimilarQuery(product: Product): string {
  const clean = product.title.replace(/<[^>]+>/g, "").trim();
  const words = clean.split(/\s+/);
  const key = words.slice(1, 4).join(" ") || words.slice(0, 3).join(" ");
  return key || product.category2 || "패션 의류";
}

export default function ProductDetail({
  product, onClose, onSelect, onSearchOpen,
}: {
  product: Product; onClose: () => void; onSelect: (p: Product) => void; onSearchOpen?: () => void;
}) {
  const router = useRouter();
  const { user, profile, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const title = product.title.replace(/<[^>]+>/g, "");
  const price = product.lprice ? Number(product.lprice).toLocaleString() : null;
  const label = product.brand || product.mallName || "";

  const [liked, setLiked] = useState(false);
  const [similar, setSimilar] = useState<Product[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(true);
  const [masoncols, setMasoncols] = useState(2);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pcScrollRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    function update() {
      const w = window.innerWidth;
      setMasoncols(w >= 1280 ? 3 : 2);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // 오버레이가 열린 동안 body 스크롤 잠금 (브라우저 스크롤바 방지)
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // 프로필 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useLayoutEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
    pcScrollRef.current?.scrollTo(0, 0);
  }, [product.link]);

  useEffect(() => {
    setLiked(getLikes().includes(product.link));
    setLoadingSimilar(true);
    setSimilar([]);

    const q = buildSimilarQuery(product);
    fetch(`/api/search?q=${encodeURIComponent(q)}&display=20`)
      .then(r => r.json())
      .then(d => {
        setSimilar((d.items ?? []).filter((p: Product) => p.link !== product.link));
        setLoadingSimilar(false);
      })
      .catch(() => setLoadingSimilar(false));
  }, [product.link]);

  function toggleLike() {
    const current = getLikes();
    const updated = liked ? current.filter(l => l !== product.link) : [...current, product.link];
    saveLikes(updated);
    setLiked(!liked);
  }

  const headerBg = { background: "rgba(247,240,230,0.97)", backdropFilter: "blur(12px)", zIndex: 20 } as React.CSSProperties;

  const SimilarGrid = () => (
    <div className="px-3 pt-4">
      <p className="text-[10px] font-black tracking-widest text-[#FF3D7F] uppercase mb-3 px-1">유사 상품</p>
      {loadingSimilar ? (
        <div className="flex gap-3">
          {Array.from({ length: masoncols }, (_, col) => col).map(col => (
            <div key={col} className="flex-1 flex flex-col min-w-0">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="mb-3 rounded-3xl bg-white animate-pulse shadow-sm overflow-hidden">
                  <div className="rounded-3xl m-2" style={{ height: `${150 + (i % 3) * 40}px`, background: "#EDE6DA" }} />
                  <div className="px-3 py-2.5 space-y-1.5">
                    <div className="h-2 bg-gray-100 rounded-full w-16" />
                    <div className="h-3 bg-gray-100 rounded-full w-full" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : similar.length > 0 ? (
        <div className="flex gap-3">
          {Array.from({ length: masoncols }, (_, col) => col).map(col => (
            <div key={col} className="flex-1 flex flex-col min-w-0">
              {similar
                .map((item, i) => ({ item, i }))
                .filter(({ i }) => i % masoncols === col)
                .map(({ item, i }) => (
                  <ProductCard key={`${item.link}-${i}`} product={item} onSelect={onSelect} />
                ))}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 text-center py-8">유사 상품을 찾을 수 없어요</p>
      )}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "#F7F0E6", animation: "detailSlideUp 0.28s ease-out" }}
    >
      {/* ── Header ── */}
      <div className="shrink-0 flex items-center justify-between px-4 pt-4 pb-3" style={headerBg}>
        {/* 뒤로가기 */}
        <button onClick={onClose}
          className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm">
          <svg width="16" height="16" fill="none" stroke="#1A1A1A" strokeWidth="2.2" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>

        {/* 우측: 검색 + 프로필 */}
        <div className="flex items-center gap-3">
          <button onClick={onSearchOpen}
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

              {showProfileMenu && (
                <div className="absolute right-0 top-12 w-64 bg-white rounded-3xl shadow-2xl overflow-hidden z-50"
                  style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.15)" }}>
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
                  <div className="px-2 pb-3">
                    <button
                      onClick={() => {
                        sessionStorage.setItem("ablelia_detail_product", JSON.stringify(product));
                        setShowProfileMenu(false);
                        router.push("/profile");
                      }}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-[#F7F0E6] transition-colors text-left">
                      <div className="w-8 h-8 bg-[#F7F0E6] rounded-full flex items-center justify-center shrink-0">
                        <svg width="14" height="14" fill="none" stroke="#FF3D7F" strokeWidth="2" viewBox="0 0 24 24">
                          <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                        </svg>
                      </div>
                      <span className="text-sm font-semibold text-[#1A1A1A]">스타일 취향 설정</span>
                    </button>
                    <button
                      onClick={async () => { setShowProfileMenu(false); await logout(); onClose(); }}
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
          ) : null}
        </div>
      </div>

      {/* ── PC 2단 레이아웃 (md+) ── */}
      <div className="hidden md:flex flex-1 min-h-0">

        {/* 좌측: 이미지 + 상품정보 + 구매버튼 (스크롤) */}
        <div className="w-[52%] min-h-0 overflow-y-auto p-6 flex flex-col gap-5">
          {/* 이미지 — 높이 제한으로 하단 버튼 영역 확보, 가로값 auto로 여백 제거 */}
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm shrink-0 flex justify-center">
            {product.image && (
              <img
                src={product.image} alt={title}
                className="block"
                style={{
                  height: "auto",
                  maxHeight: "calc(100vh - 360px)",
                  width: "auto",
                  maxWidth: "100%",
                }}
              />
            )}
          </div>
          {/* 상품 정보 */}
          <div className="px-1">
            {label && (
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">{label}</p>
            )}
            <p className="text-xl font-bold text-[#1A1A1A] leading-snug mb-3">{title}</p>
            {price && (
              <p className="text-3xl font-black text-[#FF3D7F] mb-5">{price}원</p>
            )}
            {/* 좋아요 + 구매 버튼 */}
            <div className="flex gap-3">
              <button onClick={toggleLike}
                className={`shrink-0 w-14 rounded-2xl flex items-center justify-center shadow-md transition-colors ${
                  liked ? "bg-[#FF3D7F]" : "bg-white"
                }`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill={liked ? "white" : "none"}
                  stroke={liked ? "none" : "#FF3D7F"} strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </button>
              <a href={product.link} target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#FF3D7F] text-white rounded-2xl font-bold text-sm shadow-md hover:bg-[#d42d6e] transition-colors">
                구매하러 가기
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M7 17L17 7M7 7h10v10"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* 우측: 유사 상품 (독립 스크롤) */}
        <div ref={pcScrollRef} className="flex-1 min-h-0 overflow-y-auto pb-6">
          <SimilarGrid />
        </div>
      </div>

      {/* ── 모바일 단일 스크롤 (md 미만) ── */}
      <div ref={scrollRef} className="md:hidden flex-1 overflow-y-auto pb-24">
        {/* 이미지 */}
        <div className="bg-white mx-3 mt-1 rounded-3xl overflow-hidden shadow-sm">
          {product.image && (
            <img src={product.image} alt={title} className="w-full h-auto block" />
          )}
        </div>
        {/* 상품 정보 */}
        <div className="px-5 pt-5 pb-3">
          {label && (
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">{label}</p>
          )}
          <p className="text-lg font-bold text-[#1A1A1A] leading-snug mb-2">{title}</p>
          {price && (
            <p className="text-3xl font-black text-[#FF3D7F]">{price}원</p>
          )}
        </div>
        {/* 유사 상품 */}
        <SimilarGrid />
      </div>

      {/* 모바일 전용 하단 고정 — 좋아요 + 구매 버튼 */}
      <div className="md:hidden shrink-0 px-4 py-4 border-t border-black/5" style={headerBg}>
        <div className="flex gap-3">
          <button onClick={toggleLike}
            className={`shrink-0 w-14 rounded-2xl flex items-center justify-center shadow-md transition-colors ${
              liked ? "bg-[#FF3D7F]" : "bg-white"
            }`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill={liked ? "white" : "none"}
              stroke={liked ? "none" : "#FF3D7F"} strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
          <a href={product.link} target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#FF3D7F] text-white rounded-2xl font-bold text-sm shadow-md hover:bg-[#d42d6e] transition-colors">
            구매하러 가기
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M7 17L17 7M7 7h10v10"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
