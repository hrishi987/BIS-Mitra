import { NextResponse } from "next/server";

import { lookupConsumer } from "@/lib/consumer";
import type { Language } from "@/lib/types";

export const dynamic = "force-dynamic";

const LANGS: Language[] = ["en", "hi", "kn", "ta", "te"];

export async function POST(req: Request) {
  let body: { identifier?: string; language?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_request", message: "That request could not be read." },
      { status: 400 },
    );
  }

  const identifier = (body.identifier ?? "").trim();
  if (!identifier) {
    return NextResponse.json(
      { error: "empty_identifier", message: "Enter an identifier first." },
      { status: 400 },
    );
  }

  const language = (LANGS.includes(body.language as Language)
    ? body.language
    : "en") as Language;

  try {
    const lookup = lookupConsumer(identifier.slice(0, 200), language);
    if (lookup.found && lookup.record) {
      return NextResponse.json({ found: true, recordId: lookup.record.id });
    }
    return NextResponse.json({
      found: false,
      identifierType: lookup.identifierType,
      standardId: lookup.standard?.id ?? null,
      note: lookup.note,
    });
  } catch {
    return NextResponse.json(
      {
        error: "knowledge_unavailable",
        message: "The knowledge layer could not be read right now. Please try again.",
      },
      { status: 503 },
    );
  }
}
