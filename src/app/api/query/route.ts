import { NextResponse } from "next/server";

import { retrieve } from "@/lib/retrieval";
import type { Language } from "@/lib/types";

export const dynamic = "force-dynamic";

const LANGS: Language[] = ["en", "hi", "kn", "ta", "te"];

export async function POST(req: Request) {
  let body: { query?: string; language?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_request", message: "That request could not be read." },
      { status: 400 },
    );
  }

  const query = (body.query ?? "").trim();
  if (!query) {
    return NextResponse.json(
      { error: "empty_query", message: "Describe your product first." },
      { status: 400 },
    );
  }

  const language = (LANGS.includes(body.language as Language)
    ? body.language
    : "en") as Language;

  try {
    const packet = retrieve(query.slice(0, 600), language);
    return NextResponse.json({ packet });
  } catch {
    return NextResponse.json(
      {
        error: "knowledge_unavailable",
        message:
          "The structured knowledge layer could not be read. Run `python3 scripts/ingest.py` and try again.",
      },
      { status: 503 },
    );
  }
}
