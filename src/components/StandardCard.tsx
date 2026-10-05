"use client";

import Link from "next/link";
import { ArrowRight, Check, FileText, Minus } from "lucide-react";

import { MatchBadge, PrototypeBadge } from "./ui";
import { t, type PhraseKey } from "@/lib/i18n";
import { useSession } from "@/lib/store";
import type { RetrievalResult } from "@/lib/types";

export function StandardCard({
  result,
  primary = false,
}: {
  result: RetrievalResult;
  primary?: boolean;
}) {
  const { language } = useSession();

  return (
    <article
      className={`card card-hover overflow-hidden ${primary ? "ring-1 ring-bis-200" : ""}`}
      aria-label={`${result.is_number ?? ""} ${result.title ?? ""}`}
    >
      {primary && <div className="h-1 w-full bg-bis-700" aria-hidden />}

      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold tabular-nums text-ink-400">
                #{result.rank}
              </span>
              <h3 className="mono text-lg font-bold text-bis-800">{result.is_number ?? "—"}</h3>
              <MatchBadge type={result.match_type} />
            </div>
            <p className="mt-1.5 text-sm font-medium leading-snug text-ink-900">{result.title}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-500">
              {result.domain && <span className="text-ink-600">{result.domain}</span>}
              {result.standard_type && <span>· {result.standard_type}</span>}
              {result.iec_reference && <span>· {result.iec_reference}</span>}
            </div>
          </div>

          <Link
            href={`/industry/standard/${result.standard_id}`}
            className="btn-secondary shrink-0 !px-3 !py-2 text-xs"
          >
            {t("results.details" as PhraseKey, language)}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>

        {/* Why it appeared */}
        {result.match_reason.length > 0 && (
          <div className="mt-4 rounded-lg border border-ink-100 bg-ink-50/60 p-3.5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
              {t("results.why" as PhraseKey, language)}
            </p>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {result.match_reason.map((reason) => (
                <li key={reason} className="flex items-start gap-2 text-[13px] leading-snug text-ink-800">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* How it differs — never hide the weaker signals */}
        {result.contrast && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-sky-100 bg-sky-50/60 px-3.5 py-2.5">
            <Minus className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-700" aria-hidden />
            <p className="text-xs leading-relaxed text-ink-700">
              <span className="font-semibold text-ink-900">{t("results.contrast" as PhraseKey, language)}:</span>{" "}
              {result.contrast}
            </p>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-3">
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-ink-500">
            <span className="inline-flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" aria-hidden />
              {result.evidence.length} evidence record{result.evidence.length === 1 ? "" : "s"}
            </span>
            {result.relationship?.id && <span className="mono text-ink-400">{result.relationship.id}</span>}
            <PrototypeBadge />
          </div>
          <span className="text-[11px] tabular-nums text-ink-400">
            score {result.score}
          </span>
        </div>
      </div>
    </article>
  );
}
