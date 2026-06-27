"use client";

import { useState, useEffect } from "react";
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
  product, onClose, onSelect,
}: {
  product: Product; onClose: () => void; onSelect: (p: Product) => void;
}) {
  const title = product.title.replace(/<[^>]+>/g, "");
  const price = product.lprice ? Number(product.lprice).toLocaleString() : null;
  const label = product.brand || product.mallName || "";

  const [liked, setLiked] = useState(false);
  const [similar, setSimilar] = useState<Product[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(true);

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

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "#F7F0E6", animation: "detailSlideUp 0.28s ease-out" }}
    >
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 pt-4 pb-3"
        style={{ background: "rgba(247,240,230,0.97)", backdropFilter: "blur(12px)" }}>
        <button onClick={onClose}
          className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm">
          <svg width="16" height="16" fill="none" stroke="#1A1A1A" strokeWidth="2.2" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <button onClick={toggleLike}
          className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm transition-colors ${
            liked ? "bg-[#FF3D7F]" : "bg-white"
          }`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? "white" : "none"}
            stroke={liked ? "none" : "#FF3D7F"} strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto pb-24">
        {/* Product image */}
        <div className="bg-white mx-3 mt-1 rounded-3xl overflow-hidden shadow-sm">
          {product.image && (
            <img src={product.image} alt={title} className="w-full h-auto block" />
          )}
        </div>

        {/* Product info */}
        <div className="px-4 pt-4 pb-2">
          {label && (
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">{label}</p>
          )}
          <p className="text-base font-bold text-[#1A1A1A] leading-snug mb-2">{title}</p>
          {price && (
            <p className="text-2xl font-black text-[#FF3D7F]">{price}원</p>
          )}
        </div>

        {/* Similar products */}
        <div className="px-3 pt-4">
          <p className="text-[10px] font-black tracking-widest text-[#FF3D7F] uppercase mb-3">유사 상품</p>
          {loadingSimilar ? (
            <div className="flex gap-3">
              {[0, 1].map(col => (
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
              {[0, 1].map(col => (
                <div key={col} className="flex-1 flex flex-col min-w-0">
                  {similar
                    .map((item, i) => ({ item, i }))
                    .filter(({ i }) => i % 2 === col)
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
      </div>

      {/* Sticky buy button */}
      <div className="shrink-0 px-4 py-4 border-t border-black/5"
        style={{ background: "rgba(247,240,230,0.97)", backdropFilter: "blur(12px)" }}>
        <a href={product.link} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-4 bg-[#FF3D7F] text-white rounded-2xl font-bold text-sm shadow-md hover:bg-[#d42d6e] transition-colors">
          구매하러 가기
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M7 17L17 7M7 7h10v10"/>
          </svg>
        </a>
      </div>
    </div>
  );
}
