"use client";

import Link from "next/link";
import { Boxes, CircleDot, FileText, Landmark, Tag } from "lucide-react";

import { MatchBadge } from "./ui";
import { t, type PhraseKey } from "@/lib/i18n";
import { useSession } from "@/lib/store";
import type { ProductContext, RetrievalResult } from "@/lib/types";

/**
 * Connected-cards relationship map: product → standards → application/source.
 *
 * Deliberately CSS-only (spines and stubs instead of a canvas graph) so it
 * stays crisp, responsive and dependency-free.
 */
export function RelationshipGraph({
  context,
  results,
  primary,
}: {
  context: ProductContext;
  results: RetrievalResult[];
  primary: RetrievalResult | null;
}) {
  const { language } = useSession();
  const branches = results.slice(0, 5);

  if (!branches.length) {
    return (
      <p className="rounded-lg border border-dashed border-ink-200 px-4 py-6 text-center text-sm text-ink-500">
        {t("graph.empty" as PhraseKey, language)}
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-ink-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <Tag className="h-4 w-4 text-bis-700" aria-hidden />
        <h3 className="text-sm font-bold text-ink-900">{t("graph.title" as PhraseKey, language)}</h3>
      </div>

      {/* Level 1 — the product */}
      <div className="relative pl-6">
        <span
          className="absolute left-[7px] top-3 bottom-0 w-px bg-ink-200"
          aria-hidden
        />
        <div className="relative inline-flex items-center gap-2 rounded-lg border border-bis-300 bg-bis-50 px-3.5 py-2">
          <span
            className="absolute -left-[21px] top-1/2 h-2 w-2 -translate-y-1/2 rounded-full border-2 border-bis-600 bg-white"
            aria-hidden
          />
          <Boxes className="h-4 w-4 text-bis-700" aria-hidden />
          <span className="text-xs font-bold uppercase tracking-wider text-bis-800">
            {t("graph.product" as PhraseKey, language)}: {context.product}
          </span>
        </div>

        {/* Level 2 — standards */}
        <ul className="mt-4 space-y-3">
          {branches.map((r, index) => {
            const isPrimary = primary?.standard_id === r.standard_id;
            return (
              <li key={r.standard_id} className="relative">
                <span className="absolute -left-[15px] top-1/2 h-px w-4 bg-ink-200" aria-hidden />
                {index === branches.length - 1 && (
                  <span
                    className="absolute -left-[17px] top-1/2 h-px w-0"
                    aria-hidden
                  />
                )}

                <div
                  className={`flex flex-wrap items-center gap-2 rounded-lg border px-3.5 py-2.5 transition-colors ${
                    isPrimary
                      ? "border-bis-300 bg-white shadow-card ring-1 ring-bis-100"
                      : "border-ink-200 bg-white hover:border-ink-300"
                  }`}
                >
                  <CircleDot
                    className={`h-3 w-3 shrink-0 ${isPrimary ? "text-bis-600" : "text-ink-300"}`}
                    aria-hidden
                  />
                  <Link
                    href={`/industry/standard/${r.standard_id}`}
                    className="mono font-bold text-ink-900 hover:text-bis-700"
                  >
                    {r.is_number}
                  </Link>
                  <span className="hidden truncate text-xs text-ink-500 sm:inline">
                    {r.title}
                  </span>
                  <MatchBadge type={r.match_type} className="ml-auto" />
                </div>

                {/* Level 3 — what the primary standard connects to */}
                {isPrimary && (
                  <ul className="relative mt-3 space-y-2 pl-6">
                    <span
                      className="absolute left-[7px] top-0 h-[calc(100%-1rem)] w-px bg-ink-200"
                      aria-hidden
                    />
                    <li className="relative">
                      <span className="absolute -left-[15px] top-1/2 h-px w-4 bg-ink-200" aria-hidden />
                      <div className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-900">
                        <FileText className="h-3.5 w-3.5" aria-hidden />
                        {t("graph.application" as PhraseKey, language)}:{" "}
                        {context.intendedUse ?? r.domain ?? "—"}
                      </div>
                    </li>
                    <li className="relative">
                      <span className="absolute -left-[15px] top-1/2 h-px w-4 bg-ink-200" aria-hidden />
                      <div className="inline-flex items-center gap-2 rounded-md border border-ink-200 bg-ink-50 px-3 py-1.5 text-xs font-medium text-ink-700">
                        <Landmark className="h-3.5 w-3.5" aria-hidden />
                        {t("graph.source" as PhraseKey, language)}:{" "}
                        {r.source?.name ?? t("evidence.missing" as PhraseKey, language)}
                      </div>
                    </li>
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
