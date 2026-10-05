import { NextResponse } from "next/server";

import { answer } from "@/lib/llm";
import type { ChatRequest, Language } from "@/lib/types";

export const dynamic = "force-dynamic";

const LANGS: Language[] = ["en", "hi", "kn", "ta", "te"];

export async function POST(req: Request) {
  let body: Partial<ChatRequest>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_request", message: "That message could not be read." },
      { status: 400 },
    );
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  const cleaned = messages
    .filter((m) => m && (m.role === "user" || m.role === "assistant"))
    .slice(-16)
    .map((m) => ({ role: m.role, content: String(m.content ?? "").slice(0, 2000) }));

  if (!cleaned.some((m) => m.role === "user")) {
    return NextResponse.json(
      { error: "empty_message", message: "Type a question first." },
      { status: 400 },
    );
  }

  const request: ChatRequest = {
    messages: cleaned,
    language: (LANGS.includes(body.language as Language) ? body.language : "en") as Language,
    productId: body.productId ?? null,
    productName: body.productName ?? null,
    productMaterial: body.productMaterial ?? null,
    productUse: body.productUse ?? null,
    standardIds: Array.isArray(body.standardIds) ? body.standardIds.slice(0, 12) : [],
    primaryStandardId: body.primaryStandardId ?? null,
    consumerRecordId: body.consumerRecordId ?? null,
  };

  try {
    const response = await answer(request);
    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      {
        reply:
          "Something went wrong while preparing an answer. Please try again — nothing was lost.",
        intent: "general",
        abstained: true,
        mode: "fallback",
        officialHint: null,
        usedIds: [],
      },
      { status: 200 },
    );
  }
}
