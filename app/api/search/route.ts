import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  if (!query) return NextResponse.json({ items: [] });

  const start = Math.min(Number(request.nextUrl.searchParams.get("start") ?? "1"), 961);
  const display = Math.min(Number(request.nextUrl.searchParams.get("display") ?? "40"), 100);

  const res = await fetch(
    `https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(query)}&display=${display}&start=${start}&sort=sim`,
    {
      headers: {
        "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID!,
        "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET!,
      },
    }
  );

  if (!res.ok) return NextResponse.json({ error: "검색 실패" }, { status: res.status });

  const data = await res.json();
  return NextResponse.json(data);
}
