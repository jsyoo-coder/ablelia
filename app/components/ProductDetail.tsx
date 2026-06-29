"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
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

function productDocId(link: string): string {
  let h = 5381;
  for (let i = 0; i < link.length; i++) {
    h = ((h << 5) + h) ^ link.charCodeAt(i);
    h = h >>> 0;
  }
  return h.toString(36);
}

function buildSimilarQuery(product: Product): string {
  const clean = product.title.replace(/<[^>]+>/g, "").trim();
  const words = clean.split(/\s+/);
  const key = words.slice(1, 4).join(" ") || words.slice(0, 3).join(" ");
  return key || product.category2 || "패션 의류";
}

export default function ProductDetail({
  product, onClose, onSelect, onSearchOpen, likeCount: initialLikeCount,
}: {
  product: Product; onClose: () => void; onSelect: (p: Product) => void; onSearchOpen?: () => void; likeCount?: number;
}) {
  const { user } = useAuth();
  const title = product.title.replace(/<[^>]+>/g, "");
  const price = product.lprice ? Number(product.lprice).toLocaleString() : null;
  const label = product.brand || product.mallName || "";

  const [liked, setLiked] = useState(false);
  const [globalLikeCount, setGlobalLikeCount] = useState(initialLikeCount ?? 0);
  const [similar, setSimilar] = useState<Product[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(true);
  const masoncols = 2;
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prevBody = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const screen = document.getElementById("phone-screen");
    const savedScrollTop = screen?.scrollTop ?? 0;
    const prevOverflow = screen?.style.overflowY ?? "";
    if (screen) { screen.scrollTop = 0; screen.style.overflowY = "hidden"; }
    return () => {
      document.body.style.overflow = prevBody;
      if (screen) { screen.style.overflowY = prevOverflow; screen.scrollTop = savedScrollTop; }
    };
  }, []);

  useLayoutEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
  }, [product.link]);

  useEffect(() => {
    setGlobalLikeCount(initialLikeCount ?? 0);
    let unsubscribe: (() => void) | undefined;
    async function subscribe() {
      try {
        const { getFirestore, doc, onSnapshot } = await import("firebase/firestore");
        const { app } = await import("@/lib/firebase");
        const db = getFirestore(app);
        unsubscribe = onSnapshot(
          doc(db, "product_likes", productDocId(product.link)),
          (snap) => { if (snap.exists()) setGlobalLikeCount(snap.data().count ?? 0); },
          (e) => console.error("product_likes 구독 실패:", e)
        );
      } catch (e) { console.error("product_likes 구독 초기화 실패:", e); }
    }
    subscribe();
    return () => unsubscribe?.();
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

  async function toggleLike() {
    const nowLiked = !liked;
    const current = getLikes();
    const updated = liked ? current.filter(l => l !== product.link) : [...current, product.link];
    saveLikes(updated);
    setLiked(nowLiked);
    setGlobalLikeCount(prev => Math.max(0, prev + (nowLiked ? 1 : -1)));

    if (user) {
      try {
        const { getFirestore, doc, setDoc, deleteDoc, increment, serverTimestamp } = await import("firebase/firestore");
        const { app } = await import("@/lib/firebase");
        const db = getFirestore(app);
        const docId = productDocId(product.link);
        await setDoc(doc(db, "product_likes", docId), {
          link: product.link, title: product.title, image: product.image,
          lprice: product.lprice, brand: product.brand, mallName: product.mallName,
          category2: product.category2, count: increment(nowLiked ? 1 : -1),
        }, { merge: true });
        const userRef = doc(db, "users", user.uid, "liked_products", docId);
        if (nowLiked) {
          await setDoc(userRef, {
            link: product.link, title: product.title, image: product.image,
            lprice: product.lprice, brand: product.brand, mallName: product.mallName,
            category2: product.category2, likedAt: serverTimestamp(),
          });
        } else {
          await deleteDoc(userRef);
        }
      } catch (e) { console.error("좋아요 동기화 실패:", e); }
    }
  }

  const SimilarGrid = () => (
    <div className="px-3 pt-4 pb-6">
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
      style={{ background: "#1A1A1A", animation: "detailSlideUp 0.28s ease-out" }}
    >
      {/* 이미지 영역 */}
      <div className="relative shrink-0" style={{ height: "55%" }}>
        {product.image ? (
          <img src={product.image} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[#EDE6DA]" />
        )}

        {/* 뒤로가기 */}
        <button onClick={onClose}
          className="absolute top-4 left-4 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md">
          <svg width="16" height="16" fill="none" stroke="#1A1A1A" strokeWidth="2.2" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>

        {/* 찜 버튼 */}
        <button onClick={toggleLike}
          className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center shadow-md backdrop-blur-sm transition-colors ${
            liked ? "bg-[#FF3D7F]" : "bg-white/80"
          }`}>
          <svg width="18" height="18" viewBox="0 0 24 24"
            fill={liked ? "white" : "none"}
            stroke={liked ? "white" : "#FF3D7F"} strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>

      {/* 바텀 카드 */}
      <div
        className="flex-1 bg-white flex flex-col overflow-hidden"
        style={{ borderRadius: "2rem 2rem 0 0", marginTop: "-1.5rem", boxShadow: "0 -8px 32px rgba(0,0,0,0.12)" }}
      >
        {/* 스크롤 영역 */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="px-6 pt-6 pb-4">
            {/* 상품명 + 가격 */}
            <div className="flex items-start justify-between gap-3 mb-1.5">
              <p className="text-xl font-black text-[#1A1A1A] leading-snug flex-1">{title}</p>
              {price && (
                <p className="text-lg font-black text-[#1A1A1A] shrink-0 pt-0.5">{price}원</p>
              )}
            </div>
            {label && (
              <p className="text-sm text-gray-400 mb-3">{label}</p>
            )}
            {globalLikeCount > 0 && (
              <div className="inline-flex items-center gap-1.5 bg-[#FFF0F5] px-3 py-1.5 rounded-full">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="#FF3D7F">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                <span className="text-xs font-bold text-[#FF3D7F]">{globalLikeCount}명이 찜했어요</span>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100">
            <SimilarGrid />
          </div>
        </div>

        {/* 하단 구매 버튼 */}
        <div className="shrink-0 px-4 py-4 border-t border-black/5 bg-white">
          <a href={product.link} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-4 bg-[#FF3D7F] text-white rounded-2xl font-bold text-base shadow-md hover:bg-[#d42d6e] transition-colors">
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
