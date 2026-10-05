"use client";

import { useMemo, useState } from "react";
import { Database, Search, ShieldCheck } from "lucide-react";

import { SourceCategoryLegend, SourceGrid, type SourceCardData } from "./SourceCard";
import { PrototypeBadge, Section } from "./ui";
import { t, type PhraseKey } from "@/lib/i18n";
import { useSession } from "@/lib/store";

const CATEGORIES = ["All", "Official BIS", "Reference", "Seed / Prototype", "Demo"] as const;

export function SourcesClient({
  cards,
  counts,
  qa,
}: {
  cards: SourceCardData[];
  counts: Record<string, number>;
  qa: { id: string; check: string; status: string; explanation: string }[];
}) {
  const { language } = useSession();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cards.filter(({ source }) => {
      if (category !== "All" && source.category !== category) return false;
      if (!q) return true;
      const hay = `${source.name ?? ""} ${source.id} ${source.what_it_gives ?? ""} ${
        source.raw_text ?? ""
      } ${source.url ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [cards, category, query]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Provenance</p>
          <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-ink-950 sm:text-3xl">
            {t("sources.title" as PhraseKey, language)}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-600">
            {t("sources.sub" as PhraseKey, language)}
          </p>
        </div>
        <PrototypeBadge />
      </div>

      <Section title={t("sources.cat.official" as PhraseKey, language)} className="mb-5">
        <SourceCategoryLegend counts={counts} />
      </Section>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("common.search" as PhraseKey, language)}
            className="input !pl-9"
            aria-label={t("common.search" as PhraseKey, language)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                category === c
                  ? "border-bis-300 bg-bis-50 text-bis-800"
                  : "border-ink-200 bg-white text-ink-600 hover:border-ink-300"
              }`}
            >
              {c === "All" ? t("common.viewAll" as PhraseKey, language) : c}
            </button>
          ))}
        </div>
      </div>

      {filtered.length ? (
        <SourceGrid cards={filtered} />
      ) : (
        <p className="rounded-lg border border-dashed border-ink-200 px-4 py-10 text-center text-sm text-ink-500">
          {t("standards.noResult" as PhraseKey, language)}
        </p>
      )}

      {/* QA register straight from the workbook */}
      <Section
        eyebrow="Workbook"
        title="Data quality register"
        subtitle="Reported by the supplied workbook itself. NOT DONE entries are real gaps, not oversights of this UI."
        className="py-10"
      >
        <div className="card overflow-hidden">
          <ul className="divide-y divide-ink-100">
            {qa.map((row) => (
              <li key={row.id} className="flex flex-wrap items-start gap-3 px-5 py-3.5">
                <span className="mono w-20 shrink-0 text-xs text-ink-400">{row.id}</span>
                <span className="min-w-[180px] flex-1 text-sm font-medium text-ink-900">
                  {row.check}
                </span>
                <span
                  className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    row.status === "PASS"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-amber-200 bg-amber-50 text-amber-800"
                  }`}
                >
                  <ShieldCheck className="h-3 w-3" aria-hidden />
                  {row.status}
                </span>
                <span className="w-full text-xs leading-relaxed text-ink-600 sm:w-auto sm:flex-[2]">
                  {row.explanation}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-lg border border-ink-200 bg-white px-4 py-3">
          <Database className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" aria-hidden />
          <p className="text-xs leading-relaxed text-ink-600">
            Sources are grouped by how the application is allowed to treat them:{" "}
            <span className="font-semibold text-ink-800">Official BIS</span> is authoritative,{" "}
            <span className="font-semibold text-ink-800">Reference</span> is third-party context,{" "}
            <span className="font-semibold text-ink-800">Seed / Prototype</span> is workbook
            metadata, and <span className="font-semibold text-ink-800">Demo</span> marks synthetic
            fixtures that must never be presented as real records.
          </p>
        </div>
      </Section>
    </div>
  );
}
