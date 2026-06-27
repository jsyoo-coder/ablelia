"use client";

import { useState, useRef, useEffect } from "react";

interface OnboardingProps {
  onLogin: () => Promise<void>;
  onSkip: () => void;
  signingIn?: boolean;
}

const SLIDES = [
  {
    bgFrom: "#9EC4A1",
    bgTo: "#4E7851",
    keyword: "MINIMAL",
    title: "국내 모든 패션\n한눈에 비교",
    desc: "무신사·에이블리·지그재그\n가격을 앱 하나로 비교하세요",
  },
  {
    bgFrom: "#F0AE90",
    bgTo: "#C4614A",
    keyword: "TRENDY",
    title: "지금 인기 있는\n아이템 먼저",
    desc: "가장 많이 찜 받은 상품을\n실시간으로 발견하세요",
  },
  {
    bgFrom: "#B5A8DE",
    bgTo: "#6B5EA0",
    keyword: "MY STYLE",
    title: "로그인하고\n내 스타일 저장",
    desc: "취향에 맞는 상품 추천과\n찜 목록을 언제나 확인하세요",
  },
];

const R = 80; // 코너 반지름

export default function Onboarding({ onLogin, onSkip, signingIn }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const touchStartX = useRef(0);

  // 온보딩 표시 중 배경 스크롤 전면 차단
  useEffect(() => {
    const targets = [
      document.getElementById("phone-screen"),
      document.body,
      document.documentElement,
    ].filter(Boolean) as HTMLElement[];
    const prevs = targets.map(el => el.style.overflow);
    targets.forEach(el => { el.style.overflow = "hidden"; });
    return () => { targets.forEach((el, i) => { el.style.overflow = prevs[i]; }); };
  }, []);
  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e: React.TouchEvent) {
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    if (dx > 50 && !isLast) setStep(s => s + 1);
    else if (dx < -50 && step > 0) setStep(s => s - 1);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        background: `linear-gradient(160deg, ${slide.bgFrom} 0%, ${slide.bgTo} 100%)`,
        transition: "background 0.6s ease",
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={e => e.stopPropagation()}
    >
      {/* 상단 일러스트 영역 */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden min-h-0">
        <div className="absolute rounded-full pointer-events-none" style={{
          width: 300, height: 300,
          background: "rgba(255,255,255,0.10)",
          top: -80, right: -60,
        }} />
        <div className="absolute rounded-full pointer-events-none" style={{
          width: 200, height: 200,
          background: "rgba(255,255,255,0.07)",
          bottom: 20, left: -50,
        }} />

        <div
          className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none select-none"
          style={{
            writingMode: "vertical-lr",
            fontSize: 72,
            fontWeight: 900,
            fontStyle: "italic",
            color: "rgba(255,255,255,0.22)",
            letterSpacing: "-3px",
            lineHeight: 1,
          }}
        >
          {slide.keyword}
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-4 h-4 rounded-full bg-white opacity-80 mb-2" />
          <div className="w-px h-4 bg-white opacity-40 mb-1" />
          <div className="bg-white rounded-3xl px-8 py-6 text-center"
            style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}>
            <p className="text-[10px] font-black tracking-[0.2em] text-gray-300 mb-2 uppercase">ablelia</p>
            <h3 className="font-black italic text-[#1A1A1A] leading-none" style={{ fontSize: 44 }}>
              {slide.keyword}
            </h3>
          </div>
        </div>

        <div className="absolute w-3 h-3 rounded-full bg-white opacity-30 pointer-events-none" style={{ top: "22%", left: "18%" }} />
        <div className="absolute w-4 h-4 rounded-full bg-white opacity-20 pointer-events-none" style={{ bottom: "20%", right: "22%" }} />
        <div className="absolute w-2 h-2 rounded-full bg-white opacity-40 pointer-events-none" style={{ top: "55%", left: "12%" }} />
      </div>

      {/* 하단 흰색 카드 */}
      <div
        className="relative bg-white px-6 pt-7 shrink-0"
        style={{
          borderRadius: `${R}px 0 0 0`,
          paddingBottom: "max(env(safe-area-inset-bottom, 0px), 12px)",
        }}
      >
        {/* 우측 상단에만 오목 SVG (R×R) — 좌측 상단 라운드는 CSS border-radius 처리 */}
        <svg
          className="absolute right-0 pointer-events-none"
          style={{ top: -R, height: R, width: R }}
          viewBox={`0 0 ${R} ${R}`}
          fill="white"
        >
          {/* sweep=0 → center(0,0) → arc가 중심쪽으로 오목, 녹색 대면적/흰색 소면적 */}
          <path d={`M0 ${R} A${R} ${R} 0 0 0 ${R} 0 L${R} ${R} Z`} />
        </svg>

        {/* 닷 인디케이터 */}
        <div className="flex justify-center gap-2 mb-5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === step ? 20 : 8,
                height: 8,
                background: i === step ? "#FF3D7F" : "#EDE6DA",
              }}
            />
          ))}
        </div>

        {/* 제목 */}
        <h2 className="text-[22px] font-black text-[#1A1A1A] text-center mb-2 leading-snug whitespace-pre-line">
          {slide.title}
        </h2>

        {/* 설명 */}
        <p className="text-[13px] text-gray-400 text-center leading-relaxed whitespace-pre-line">
          {slide.desc}
        </p>

        {/* 버튼 영역 — minHeight 고정으로 슬라이드 전환 시 카드 높이 불변 */}
        <div className="mt-5" style={{ minHeight: 110 }}>
          {isLast ? (
            <>
              <button
                onClick={onLogin}
                disabled={signingIn}
                className="w-full py-4 rounded-2xl font-bold text-white text-[14px] transition-opacity disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #FF3D7F 0%, #ff6fa3 100%)" }}
              >
                {signingIn ? "연결 중..." : "Google로 시작하기"}
              </button>
              <button
                onClick={onSkip}
                className="w-full py-3 text-[13px] font-semibold text-gray-400"
              >
                일단 둘러볼게요
              </button>
            </>
          ) : (
            <button
              onClick={() => setStep(s => s + 1)}
              className="w-full py-4 rounded-2xl font-bold text-[14px] text-[#1A1A1A]"
              style={{ background: "#F7F0E6" }}
            >
              다음
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
