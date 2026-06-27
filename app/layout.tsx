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
      <body className="min-h-full" style={{ background: "#D9CEBF" }}>
        <div
          className="mx-auto relative min-h-screen overflow-x-hidden"
          style={{ maxWidth: "390px", background: "#F7F0E6" }}
        >
          <ClientProviders>{children}</ClientProviders>
        </div>
      </body>
    </html>
  );
}
