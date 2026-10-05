"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Factory, Loader2, Sparkles, Wand2 } from "lucide-react";

import { ErrorState, PrototypeBadge } from "@/components/ui";
import { t, type PhraseKey } from "@/lib/i18n";
import { useSession } from "@/lib/store";
import type { RetrievalPacket } from "@/lib/types";

const EXAMPLES = ["industry.ex1", "industry.ex2", "industry.ex3", "industry.ex4", "industry.ex5"] as const;

export default function IndustryPage() {
  const router = useRouter();
  const { language, setPacket, setConsumer } = useSession();
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const submit = async (value?: string) => {
    const text = (value ?? query).trim();
    if (!text || busy) return;
    setBusy(true);
    setError(false);
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text, language }),
      });
      if (!res.ok) throw new Error("query failed");
      const data = (await res.json()) as { packet: RetrievalPacket };
      setPacket(data.packet);
      setConsumer(null); /* a new industry session drops any consumer record context */
      router.push("/industry/results");
    } catch {
      setError(true);
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-bis-700 text-white">
          <Factory className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-950 sm:text-3xl">
            {t("industry.title" as PhraseKey, language)}
          </h1>
          <p className="mt-1 text-sm text-ink-600">{t("industry.sub" as PhraseKey, language)}</p>
        </div>
        <span className="ml-auto">
          <PrototypeBadge />
        </span>
      </div>

      <div className="card p-5 sm:p-6">
        <label className="label" htmlFor="product-query">
          Describe your product or process
        </label>
        <textarea
          id="product-query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void submit();
          }}
          rows={4}
          placeholder={t("industry.placeholder" as PhraseKey, language)}
          className="input resize-none !text-[15px] !leading-relaxed"
        />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            <span className="self-center text-[11px] font-semibold uppercase tracking-wider text-ink-400">
              {t("industry.examples" as PhraseKey, language)}
            </span>
            {EXAMPLES.map((key) => {
              const label = t(key, language);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setQuery(label);
                    void submit(label);
                  }}
                  disabled={busy}
                  className="rounded-full border border-ink-200 bg-white px-2.5 py-1 text-[11px]
                    text-ink-600 transition-colors hover:border-bis-300 hover:bg-bis-50 hover:text-bis-800
                    disabled:opacity-50"
                >
                  {label.length > 46 ? `${label.slice(0, 44)}…` : label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => void submit()}
            disabled={busy || !query.trim()}
            className="btn-primary shrink-0"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Wand2 className="h-4 w-4" aria-hidden />
            )}
            {t("industry.cta" as PhraseKey, language)}
            {!busy && <ArrowRight className="h-4 w-4" aria-hidden />}
          </button>
        </div>

        <p className="mt-4 flex items-start gap-2 border-t border-ink-100 pt-3 text-[11px] leading-relaxed text-ink-500">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400" aria-hidden />
          Multilingual queries work the same way — try the Hindi or Kannada examples in the language
          menu. One knowledge base serves every language.
        </p>
      </div>

      {error && (
        <div className="mt-5">
          <ErrorState onRetry={() => void submit()} />
        </div>
      )}
    </div>
  );
}
