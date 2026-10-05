"use client";

import { ArrowLeftRight, CheckCircle2, ExternalLink, Layers } from "lucide-react";

import { PrototypeBadge } from "./ui";
import { t, type PhraseKey } from "@/lib/i18n";
import { useSession } from "@/lib/store";
import type { Source } from "@/lib/types";

export interface SourceUsage {
  standards: number;
  evidence: number;
  qcos: number;
  consumer: number;
  total: number;
}

export interface SourceCardData {
  source: Source;
  usage: SourceUsage;
}

const CATEGORY_STYLE: Record<string, string> = {
  "Official BIS": "border-bis-200 bg-bis-50 text-bis-800",
  Reference: "border-sky-200 bg-sky-50 text-sky-800",
  "Seed / Prototype": "border-ink-200 bg-ink-50 text-ink-700",
  Demo: "border-amber-200 bg-amber-50 text-amber-800",
};

export function SourceCard({ source, usage }: { source: Source; usage: SourceUsage }) {
  const { language } = useSession();

  return (
    <article className="card card-hover flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              CATEGORY_STYLE[source.category] ?? CATEGORY_STYLE["Seed / Prototype"]
            }`}
          >
            {source.category}
          </span>
          <h3 className="mt-2.5 text-sm font-bold leading-snug text-ink-950">{source.name}</h3>
          <p className="mono mt-1 text-[11px] text-ink-400">{source.id}</p>
        </div>
        <Layers className="h-4 w-4 shrink-0 text-ink-300" aria-hidden />
      </div>

      <div className="mt-3 flex-1">
        {source.url ? (
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-start gap-1.5 break-all text-xs text-bis-700 underline-offset-2 hover:underline"
          >
            <ExternalLink className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
            {source.url}
          </a>
        ) : (
          <p className="text-xs text-ink-500">{t("sources.noUrl" as PhraseKey, language)}</p>
        )}

        {source.what_it_gives ? (
          <p className="mt-2 text-xs leading-relaxed text-ink-600">{source.what_it_gives}</p>
        ) : (
          source.raw_text && (
            <p className="mt-2 text-xs leading-relaxed text-ink-600">{source.raw_text}</p>
          )
        )}
      </div>

      <dl className="mt-4 space-y-2 border-t border-ink-100 pt-3 text-[11px]">
        <div>
          <dt className="font-semibold uppercase tracking-wider text-ink-400">
            {t("sources.verified" as PhraseKey, language)}
          </dt>
          <dd className="mt-0.5 leading-relaxed text-ink-700">{source.verification_status ?? "—"}</dd>
        </div>
        <div>
          <dt className="font-semibold uppercase tracking-wider text-ink-400">{source.authority}</dt>
          <dd className="mt-1 flex flex-wrap gap-1.5 text-ink-700">
            <span className="inline-flex items-center gap-1 rounded border border-ink-200 bg-ink-50 px-1.5 py-0.5">
              <CheckCircle2 className="h-3 w-3 text-ink-400" aria-hidden />
              {usage.standards} std
            </span>
            <span className="inline-flex items-center gap-1 rounded border border-ink-200 bg-ink-50 px-1.5 py-0.5">
              <ArrowLeftRight className="h-3 w-3 text-ink-400" aria-hidden />
              {usage.evidence} evidence
            </span>
            {usage.qcos > 0 && (
              <span className="inline-flex items-center rounded border border-ink-200 bg-ink-50 px-1.5 py-0.5">
                {usage.qcos} qco
              </span>
            )}
            {usage.consumer > 0 && (
              <span className="inline-flex items-center rounded border border-ink-200 bg-ink-50 px-1.5 py-0.5">
                {usage.consumer} consumer
              </span>
            )}
            {usage.total === 0 && <span className="text-ink-400">no linked records</span>}
          </dd>
        </div>
      </dl>
    </article>
  );
}

export function SourceGrid({ cards }: { cards: SourceCardData[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map(({ source, usage }) => (
        <SourceCard key={source.id} source={source} usage={usage} />
      ))}
    </div>
  );
}

export function SourceCategoryLegend({ counts }: { counts: Record<string, number> }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {(["Official BIS", "Reference", "Seed / Prototype", "Demo"] as const).map((cat) => (
        <span
          key={cat}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${CATEGORY_STYLE[cat]}`}
        >
          {cat}
          <span className="tabular-nums opacity-70">{counts[cat] ?? 0}</span>
        </span>
      ))}
      <PrototypeBadge />
    </div>
  );
}
