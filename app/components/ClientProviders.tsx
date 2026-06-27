"use client";

import dynamic from "next/dynamic";

const AuthProvider = dynamic(
  () => import("@/contexts/AuthContext").then((m) => ({ default: m.AuthProvider })),
  { ssr: false }
);

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
