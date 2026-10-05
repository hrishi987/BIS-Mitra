"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Eraser, ExternalLink, FileQuestion, Send, Sparkles, Target } from "lucide-react";

import { t, type PhraseKey } from "@/lib/i18n";
import { useSession } from "@/lib/store";
import type { ChatMessage } from "@/lib/types";

const INDUSTRY_Q: PhraseKey[] = ["chat.q1", "chat.q2", "chat.q3", "chat.q4"];
const CONSUMER_Q: PhraseKey[] = [
  "consumer.meaning",
  "consumer.assoc",
  "consumer.cross",
];

const ASK_EVENT = "bis-mitra:ask";

/** Other components can push a question into the panel without prop drilling. */
export function askInPanel(question: string) {
  window.dispatchEvent(new CustomEvent(ASK_EVENT, { detail: question }));
}

export function ChatPanel({
  variant = "panel",
  suggested,
}: {
  variant?: "panel" | "page";
  suggested?: "industry" | "consumer";
}) {
  const {
    language,
    packet,
    consumer,
    messages,
    pushMessage,
    setPacket,
    clearConversation,
    hydrated,
  } = useSession();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const mode = suggested ?? (consumer?.record ? "consumer" : "industry");
  const questions = mode === "consumer" ? CONSUMER_Q : INDUSTRY_Q;

  /* The consumer record only grounds the consumer panel — an industry panel
     keeps its product/standard context even if a record was retrieved earlier. */
  const scopedConsumer = mode === "consumer" ? consumer : null;

  const contextLabel = scopedConsumer?.record
    ? scopedConsumer.record.identifier
    : packet?.context.product || null;

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || busy) return;

      const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
      pushMessage({ role: "user", content: text });
      setInput("");
      setBusy(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: nextMessages,
            language,
            productId: packet?.context.matchedProductId ?? null,
            productName: packet?.context.product ?? null,
            productMaterial: packet?.context.material ?? null,
            productUse: packet?.context.intendedUse ?? null,
            standardIds: packet?.results.map((r) => r.standard_id) ?? [],
            primaryStandardId: packet?.primary?.standard_id ?? null,
            consumerRecordId: scopedConsumer?.record?.id ?? null,
          }),
        });
        if (!res.ok) throw new Error("request failed");
        const data = (await res.json()) as {
          reply: string;
          abstained: boolean;
          mode: "llm" | "fallback";
          officialHint?: { label: string; url: string } | null;
          packet?: typeof packet;
        };
        pushMessage({
          role: "assistant",
          content: data.reply,
          abstained: data.abstained,
          mode: data.mode,
          hint: data.officialHint ?? null,
        });
        if (data.packet) setPacket(data.packet);
      } catch {
        pushMessage({
          role: "assistant",
          content: t("error.body" as PhraseKey, language),
          abstained: true,
          mode: "fallback",
          hint: null,
        });
      } finally {
        setBusy(false);
      }
    },
    [busy, scopedConsumer, language, messages, packet, pushMessage, setPacket],
  );

  /* External "What does this mean?" triggers. */
  useEffect(() => {
    const onAsk = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail) void send(detail);
    };
    window.addEventListener(ASK_EVENT, onAsk);
    return () => window.removeEventListener(ASK_EVENT, onAsk);
  }, [send]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const isPage = variant === "page";

  return (
    <div
      className={`card flex flex-col overflow-hidden ${
        isPage ? "min-h-[640px]" : "max-h-[720px]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-ink-100 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-bis-700 text-white">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
          </span>
          <div>
            <h3 className="text-sm font-bold text-ink-950">{t("chat.title" as PhraseKey, language)}</h3>
            <p className="text-[11px] text-ink-500">{t("chat.sub" as PhraseKey, language)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hydrated && messages.length > 0 && (
            <button
              type="button"
              onClick={clearConversation}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-ink-500 hover:bg-ink-100"
              title={t("chat.clear" as PhraseKey, language)}
            >
              <Eraser className="h-3.5 w-3.5" aria-hidden />
            </button>
          )}
        </div>
      </div>

      {/* Context strip */}
      <div className="flex flex-wrap items-center gap-2 border-b border-ink-100 bg-ink-50/60 px-4 py-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-ink-500">
          <Target className="h-3.5 w-3.5" aria-hidden />
          {t("chat.context" as PhraseKey, language)}
        </span>
        {contextLabel ? (
          <span className="mono rounded-md border border-ink-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-ink-800">
            {contextLabel}
          </span>
        ) : (
          <span className="text-[11px] text-ink-400">—</span>
        )}
        {packet?.primary && mode !== "consumer" && (
          <span className="mono rounded-md border border-bis-200 bg-bis-50 px-2 py-0.5 text-[11px] font-semibold text-bis-800">
            {packet.primary.is_number}
          </span>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className={`scrollbar-thin flex-1 space-y-4 overflow-y-auto px-4 py-4 ${
          isPage ? "max-h-[520px]" : "min-h-[280px]"
        }`}
      >
        {hydrated && messages.length === 0 && (
          <div className="rounded-lg border border-dashed border-ink-200 bg-ink-50/40 px-4 py-5">
            <p className="text-sm leading-relaxed text-ink-600">
              {mode === "consumer"
                ? "Ask about the record you just retrieved. BIS Mitra answers only from that record."
                : "Ask a follow-up about the standards just retrieved. BIS Mitra keeps the current product context, so you do not need to repeat it."}
            </p>
          </div>
        )}

        {hydrated &&
          messages.map((m, i) => (
            <Message key={`${i}-${m.role}`} message={m} />
          ))}

        {busy && (
          <div className="flex items-center gap-2 text-xs text-ink-500">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-bis-600" aria-hidden />
            {t("loading.chat" as PhraseKey, language)}
          </div>
        )}
      </div>

      {/* Suggestions */}
      {hydrated && messages.length < 4 && (
        <div className="border-t border-ink-100 px-4 py-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
            {t("chat.suggested" as PhraseKey, language)}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {questions.map((key) => {
              const label = t(key, language);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => void send(label)}
                  disabled={busy}
                  className="rounded-full border border-ink-200 bg-white px-3 py-1.5 text-[11px]
                    font-medium text-ink-700 transition-colors hover:border-bis-300 hover:bg-bis-50
                    hover:text-bis-800 disabled:opacity-50"
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="border-t border-ink-100 bg-white p-3"
      >
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
            rows={1}
            placeholder={t("chat.placeholder" as PhraseKey, language)}
            className="input max-h-32 min-h-[44px] resize-none !py-3"
            aria-label={t("chat.placeholder" as PhraseKey, language)}
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="btn-primary h-11 w-11 shrink-0 !p-0"
            aria-label={t("chat.send" as PhraseKey, language)}
          >
            <Send className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <p className="mt-2 px-1 text-[11px] leading-relaxed text-ink-400">
          {t("chat.footnote" as PhraseKey, language)}
        </p>
      </form>
    </div>
  );
}

function Message({ message }: { message: ChatMessage }) {
  const { language } = useSession();
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end animate-fade-up">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-ink-900 px-4 py-2.5 text-sm leading-relaxed text-white">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start animate-fade-up">
      <div className="max-w-[92%] space-y-2">
        {message.abstained ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3">
            <div className="mb-1.5 flex items-center gap-1.5">
              <FileQuestion className="h-3.5 w-3.5 text-amber-700" aria-hidden />
              <span className="text-xs font-bold text-amber-900">
                {t("abstain.title" as PhraseKey, language)}
              </span>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-800">
              {message.content}
            </p>
            {message.hint?.url && (
              <a
                href={message.hint.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2.5 inline-flex items-center gap-1.5 rounded-md border border-amber-300
                  bg-white px-2.5 py-1.5 text-xs font-semibold text-bis-800 hover:bg-bis-50"
              >
                {t("abstain.cta" as PhraseKey, language)}
                <ExternalLink className="h-3 w-3" aria-hidden />
              </a>
            )}
          </div>
        ) : (
          <div className="rounded-xl rounded-tl-sm border border-ink-200 bg-white px-4 py-3 shadow-card">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-800">
              {message.content}
            </p>
          </div>
        )}

        <div className="flex items-center gap-2 px-1">
          <span className="text-[10px] font-medium uppercase tracking-wider text-ink-400">
            {message.mode === "llm"
              ? t("chat.mode.llm" as PhraseKey, language)
              : t("chat.mode.fallback" as PhraseKey, language)}
          </span>
          {message.hint?.url && !message.abstained && (
            <a
              href={message.hint.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-medium text-bis-700 hover:underline"
            >
              {message.hint.label}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
