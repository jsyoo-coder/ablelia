import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import ClientProviders from "@/app/components/ClientProviders";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ablelia",
  description: "국내 모든 쇼핑 플랫폼 패션 아이템 한눈에 비교",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${geist.variable} h-full antialiased`}>
      <body>
        <div id="phone-outer">
          <span id="phone-power" aria-hidden="true" />
          <div id="phone-inner">
            {/* 상태바: 시간 + 아이콘 (데스크탑 폰 프레임용) */}
            <div id="status-bar" aria-hidden="true">
              <span id="status-time">9:41</span>
              <div id="status-icons">
                <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor">
                  <rect x="0" y="8" width="3" height="4" rx="1"/>
                  <rect x="4.5" y="5" width="3" height="7" rx="1"/>
                  <rect x="9" y="2.5" width="3" height="9.5" rx="1"/>
                  <rect x="13.5" y="0" width="3" height="12" rx="1"/>
                </svg>
                <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M1 4C3.7 1.3 12.3 1.3 15 4"/>
                  <path d="M3 6.5C5 4.5 11 4.5 13 6.5"/>
                  <path d="M5.5 9C6.5 8 9.5 8 10.5 9"/>
                  <circle cx="8" cy="11.5" r="1" fill="currentColor" stroke="none"/>
                </svg>
                <svg width="25" height="12" viewBox="0 0 25 12" fill="currentColor">
                  <rect x="0" y="1" width="21" height="10" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.2"/>
                  <rect x="22" y="3.5" width="2" height="5" rx="1"/>
                  <rect x="1.5" y="2.5" width="16" height="7" rx="1.5"/>
                </svg>
              </div>
            </div>
            <div id="phone-screen">
              <ClientProviders>{children}</ClientProviders>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
