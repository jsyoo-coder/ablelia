"use client";

import { useState, useEffect, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ProductCard from "@/app/components/ProductCard";
import type { Product } from "@/app/components/ProductCard";
import ProductDetail from "@/app/components/ProductDetail";

export default function LikesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [likedProducts, setLikedProducts] = useState<Product[]>([]);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [masoncols, setMasoncols] = useState(2);

  useLayoutEffect(() => {
    function update() {
      const w = window.innerWidth;
      setMasoncols(w >= 1024 ? 4 : w >= 640 ? 3 : 2);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/"); return; }

    let unsubscribe: (() => void) | undefined;

    async function setup() {
      const { getFirestore, collection, query, orderBy, onSnapshot } = await import("firebase/firestore");
      const { app } = await import("@/lib/firebase");
      const db = getFirestore(app);
      const q = query(
        collection(db, "users", user!.uid, "liked_products"),
        orderBy("likedAt", "desc")
      );
      unsubscribe = onSnapshot(q, snap => {
        setLikedProducts(snap.docs.map(d => d.data() as Product));
        setFetching(false);
      }, (err) => {
        console.error("찜 목록 로드 실패:", err);
        setFetchError(true);
        setFetching(false);
      });
    }

    setup();
    return () => unsubscribe?.();
  }, [user, loading]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#F7F0E6" }}>
      <div className="w-6 h-6 border-2 border-[#FF3D7F] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const headerBg = { background: "rgba(247,240,230,0.97)", backdropFilter: "blur(12px)" };

  return (
    <div className="min-h-screen pb-10" style={{ background: "#F7F0E6" }}>
      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onSelect={setSelectedProduct}
          onSearchOpen={() => { setSelectedProduct(null); router.push("/"); }}
        />
      )}

      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 flex items-center gap-3" style={headerBg}>
        <button onClick={() => router.push("/profile")}
          className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0">
          <svg width="16" height="16" fill="none" stroke="#1A1A1A" strokeWidth="2.2" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <h1 className="text-sm font-black tracking-widest uppercase text-[#1A1A1A]">찜한 상품</h1>
        {!fetching && likedProducts.length > 0 && (
          <span className="ml-auto text-xs font-bold text-gray-400">{likedProducts.length}개</span>
        )}
      </header>

      <div className="px-3 pt-4 max-w-screen-xl mx-auto">
        {fetching ? (
          <div className="flex gap-3">
            {Array.from({ length: masoncols }, (_, col) => col).map(col => (
              <div key={col} className="flex-1 flex flex-col min-w-0">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="mb-3 rounded-3xl bg-white animate-pulse shadow-sm overflow-hidden">
                    <div className="rounded-3xl m-2" style={{ height: `${160 + (i % 3) * 50}px`, background: "#EDE6DA" }} />
                    <div className="px-3 py-2.5 space-y-1.5">
                      <div className="h-2 bg-gray-100 rounded-full w-16" />
                      <div className="h-3 bg-gray-100 rounded-full w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <p className="text-sm font-semibold text-gray-400">데이터를 불러올 수 없어요</p>
            <p className="text-xs text-gray-300 text-center px-6">Firebase Console → Firestore → 규칙에서<br/>liked_products 서브컬렉션 접근을 허용해주세요</p>
          </div>
        ) : likedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-400">아직 찜한 상품이 없어요</p>
            <button onClick={() => router.push("/")}
              className="text-xs font-bold text-[#FF3D7F] px-5 py-2.5 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow">
              상품 둘러보기
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            {Array.from({ length: masoncols }, (_, col) => col).map(col => (
              <div key={col} className="flex-1 flex flex-col min-w-0">
                {likedProducts
                  .map((item, i) => ({ item, i }))
                  .filter(({ i }) => i % masoncols === col)
                  .map(({ item, i }) => (
                    <ProductCard key={`${item.link}-${i}`} product={item} onSelect={setSelectedProduct} />
                  ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
