import { NextResponse } from "next/server";

import { searchReferenceStandards } from "@/lib/repository";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 40) || 40, 100);

  try {
    const rows = searchReferenceStandards(q, limit);
    return NextResponse.json({ rows });
  } catch {
    return NextResponse.json(
      { error: "knowledge_unavailable", message: "The reference catalogue is unavailable." },
      { status: 503 },
    );
  }
}
