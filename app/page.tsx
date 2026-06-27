"use client";

import { useState } from "react";
import ProductCard from "./components/ProductCard";

const QUICK_SEARCHES = ["오버사이즈 티셔츠", "린넨 셔츠", "와이드 팬츠", "미니 크로스백", "스니커즈", "니트 가디건"];

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
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(q?: string) {
    const searchQuery = q ?? query;
    if (!searchQuery.trim()) return;
    setLoading(true);
    setSearched(true);
    if (q) setQuery(q);
    const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
    const data = await res.json();
    setResults(data.items ?? []);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
        <h1 className="text-2xl font-bold tracking-tight cursor-pointer" onClick={() => { setSearched(false); setQuery(""); setResults([]); }}>
          ablelia
        </h1>
        <div className="flex gap-3 text-sm">
          <button className="text-gray-500 hover:text-black transition-colors">로그인</button>
          <button className="bg-black text-white px-4 py-1.5 rounded-full hover:bg-gray-800 transition-colors">찜목록</button>
        </div>
      </header>

      {/* Search Bar */}
      <section className={`flex flex-col items-center px-6 transition-all ${searched ? "py-6" : "py-24"}`}>
        {!searched && (
          <>
            <p className="text-sm text-gray-400 mb-3 tracking-widest uppercase">All Platforms. One Search.</p>
            <h2 className="text-4xl font-bold mb-2">국내 모든 쇼핑 플랫폼</h2>
            <h2 className="text-4xl font-bold text-gray-400 mb-10">한눈에 비교</h2>
          </>
        )}

        <div className="w-full max-w-2xl flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="패션 아이템, 브랜드, 상품명 검색..."
            className="flex-1 border border-gray-200 rounded-xl px-5 py-3.5 text-sm outline-none focus:border-black transition-colors"
          />
          <button
            onClick={() => handleSearch()}
            className="bg-black text-white px-6 py-3.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            검색
          </button>
        </div>

        {!searched && (
          <div className="flex flex-wrap gap-2 mt-6 justify-center">
            {QUICK_SEARCHES.map((tag) => (
              <button
                key={tag}
                onClick={() => handleSearch(tag)}
                className="text-xs border border-gray-200 rounded-full px-3 py-1 text-gray-500 hover:border-black hover:text-black cursor-pointer transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Results */}
      {loading && (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && searched && (
        <section className="px-6 pb-16 max-w-7xl mx-auto">
          <p className="text-sm text-gray-400 mb-6">{results.length}개 결과</p>
          {results.length === 0 ? (
            <p className="text-center text-gray-400 py-20">검색 결과가 없습니다.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {results.map((item, i) => (
                <ProductCard key={i} product={item} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Landing — shown only before search */}
      {!searched && (
        <>
          <section className="bg-gray-50 px-6 py-16">
            <div className="max-w-4xl mx-auto grid grid-cols-4 gap-6 text-center">
              {[
                { name: "네이버쇼핑", count: "수천만 개" },
                { name: "쿠팡", count: "파트너 연동" },
                { name: "11번가", count: "공식 API" },
                { name: "G마켓", count: "제휴 연동" },
              ].map((p) => (
                <div key={p.name} className="bg-white rounded-2xl p-6 shadow-sm">
                  <p className="font-semibold text-sm">{p.name}</p>
                  <p className="text-xs text-gray-400 mt-1">{p.count}</p>
                </div>
              ))}
            </div>
          </section>
          <section className="px-6 py-16 max-w-4xl mx-auto">
            <div className="grid grid-cols-3 gap-8">
              {[
                { icon: "🔍", title: "통합 검색", desc: "한 번의 검색으로 모든 플랫폼 결과를 동시에" },
                { icon: "📊", title: "가격 비교", desc: "같은 상품의 플랫폼별 최저가를 한눈에" },
                { icon: "🤍", title: "찜하기", desc: "마음에 드는 상품을 저장하고 가격 변동 알림" },
              ].map((f) => (
                <div key={f.title} className="text-center">
                  <div className="text-3xl mb-3">{f.icon}</div>
                  <h4 className="font-semibold mb-1">{f.title}</h4>
                  <p className="text-sm text-gray-400">{f.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
