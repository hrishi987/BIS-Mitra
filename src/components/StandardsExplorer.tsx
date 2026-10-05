"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  CircleDot,
  FileText,
  Landmark,
  Loader2,
  Search,
} from "lucide-react";

import { PrototypeBadge, VerificationBadge } from "./ui";
import { t, type PhraseKey } from "@/lib/i18n";
import { useSession } from "@/lib/store";
import type { EvaluationCase, Product, ReferenceStandard, Relationship, Standard } from "@/lib/types";

interface Props {
  standards: Standard[];
  products: Product[];
  relationships: Relationship[];
  evaluationCases: EvaluationCase[];
}

export function StandardsExplorer({ standards, products, relationships, evaluationCases }: Props) {
  const { language } = useSession();
  const [tab, setTab] = useState<"kb" | "reference">("kb");
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState("all");
  const [selected, setSelected] = useState<string>(standards[0]?.id ?? "");

  const domains = useMemo(() => ["all", ...new Set(standards.map((s) => s.domain ?? "—"))], [standards]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return standards.filter((s) => {
      if (domain !== "all" && s.domain !== domain) return false;
      if (!q) return true;
      const productNames = relationships
        .filter((r) => r.standard_id === s.id)
        .map((r) => products.find((p) => p.id === r.product_id)?.name ?? "")
        .join(" ");
      const hay = `${s.is_number ?? ""} ${s.title ?? ""} ${s.domain ?? ""} ${
        s.standard_type ?? ""
      } ${s.notes ?? ""} ${productNames}`.toLowerCase();
      return hay.includes(q);
    });
  }, [standards, products, relationships, query, domain]);

  const current = standards.find((s) => s.id === selected) ?? filtered[0] ?? standards[0];

  const linkedProducts = current
    ? products.filter(
        (p) =>
          p.seed_standard_ids.includes(current.id) ||
          relationships.some((r) => r.standard_id === current.id && r.product_id === p.id),
      )
    : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Structured knowledge layer</p>
          <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-ink-950 sm:text-3xl">
            {t("standards.title" as PhraseKey, language)}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-600">
            {t("standards.sub" as PhraseKey, language)}
          </p>
        </div>
        <PrototypeBadge />
      </div>

      {/* Tabs */}
      <div className="mb-5 inline-flex rounded-lg border border-ink-200 bg-ink-50 p-0.5">
        {(
          [
            ["kb", t("standards.tab.kb" as PhraseKey, language)],
            ["reference", t("standards.tab.reference" as PhraseKey, language)],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-[6px] px-4 py-1.5 text-xs font-semibold transition-all ${
              tab === id ? "bg-white text-bis-800 shadow-sm ring-1 ring-ink-200" : "text-ink-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "kb" ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          {/* ------------------------------------------------ list */}
          <div>
            <div className="mb-3 flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("standards.search" as PhraseKey, language)}
                  className="input !pl-9"
                  aria-label={t("standards.search" as PhraseKey, language)}
                />
              </div>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="input sm:w-64"
                aria-label={t("standards.filter.domain" as PhraseKey, language)}
              >
                {domains.map((d) => (
                  <option key={d} value={d}>
                    {d === "all" ? t("standards.filter.all" as PhraseKey, language) : d}
                  </option>
                ))}
              </select>
            </div>

            <p className="mb-2 text-[11px] text-ink-500">
              <span className="font-bold tabular-nums text-ink-800">{filtered.length}</span>{" "}
              {t("standards.count" as PhraseKey, language)}
            </p>

            <ul className="space-y-1.5">
              {filtered.map((s) => {
                const active = current?.id === s.id;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(s.id)}
                      className={`w-full rounded-lg border px-4 py-3 text-left transition-all ${
                        active
                          ? "border-bis-300 bg-bis-50/60 ring-1 ring-bis-100"
                          : "border-ink-200 bg-white hover:border-ink-300"
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="mono text-sm font-bold text-bis-800">{s.is_number}</span>
                        <span className="text-[11px] text-ink-400">{s.domain}</span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-700">
                        {s.title}
                      </p>
                    </button>
                  </li>
                );
              })}
              {!filtered.length && (
                <li className="rounded-lg border border-dashed border-ink-200 px-4 py-8 text-center text-sm text-ink-500">
                  {t("standards.noResult" as PhraseKey, language)}
                </li>
              )}
            </ul>

            {/* Evaluation cases from the workbook */}
            <div className="mt-6 rounded-xl border border-ink-200 bg-white p-5">
              <h2 className="mb-3 text-sm font-bold text-ink-950">Evaluation cases in the dataset</h2>
              <ul className="space-y-2">
                {evaluationCases.slice(0, 6).map((c) => (
                  <li key={c.Case_ID} className="flex flex-wrap items-start gap-2 text-xs">
                    <span className="mono text-ink-400">{c.Case_ID}</span>
                    <span className="font-medium text-ink-900">{c.Input_Product_or_Query}</span>
                    <span className="text-ink-400">→</span>
                    <span className="text-bis-800">{c.Expected_or_Source_Mapped_Result}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ------------------------------------------------ detail + graph */}
          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            {current && (
              <>
                <div className="card overflow-hidden">
                  <div className="border-b border-ink-100 bg-ink-50/50 px-5 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
                      {t("standards.detail" as PhraseKey, language)}
                    </p>
                  </div>
                  <div className="p-5">
                    <h2 className="mono text-lg font-bold text-bis-800">{current.is_number}</h2>
                    <p className="mt-1.5 text-sm font-medium leading-snug text-ink-900">
                      {current.title}
                    </p>
                    <dl className="mt-3 space-y-2 border-t border-ink-100 pt-3 text-xs">
                      <div className="flex gap-2">
                        <dt className="w-28 shrink-0 font-semibold uppercase tracking-wider text-ink-400">
                          Domain
                        </dt>
                        <dd className="text-ink-800">{current.domain}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-28 shrink-0 font-semibold uppercase tracking-wider text-ink-400">
                          Type
                        </dt>
                        <dd className="text-ink-800">{current.standard_type}</dd>
                      </div>
                      {current.amendments_count !== null && (
                        <div className="flex gap-2">
                          <dt className="w-28 shrink-0 font-semibold uppercase tracking-wider text-ink-400">
                            Amendments
                          </dt>
                          <dd className="text-ink-800">{current.amendments_count}</dd>
                        </div>
                      )}
                    </dl>
                    {current.notes && (
                      <p className="mt-3 rounded-md bg-ink-50 px-3 py-2 text-xs leading-relaxed text-ink-700">
                        {current.notes}
                      </p>
                    )}
                    <div className="mt-3">
                      <VerificationBadge status={current.verification_status} />
                    </div>
                    <Link
                      href={`/industry/standard/${current.id}`}
                      className="btn-secondary mt-4 w-full text-xs"
                    >
                      {t("results.details" as PhraseKey, language)}
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  </div>
                </div>

                {/* Relationship map */}
                <div className="rounded-xl border border-ink-200 bg-white p-5">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-ink-950">
                    <Boxes className="h-4 w-4 text-bis-700" aria-hidden />
                    {t("graph.title" as PhraseKey, language)}
                  </h3>

                  {linkedProducts.length ? (
                    <div className="relative pl-6">
                      <span className="absolute left-[7px] top-3 bottom-0 w-px bg-ink-200" aria-hidden />
                      <span
                        className="absolute left-[3px] top-[13px] h-2 w-2 rounded-full border-2 border-bis-600 bg-white"
                        aria-hidden
                      />
                      <div className="inline-flex items-center gap-2 rounded-lg border border-bis-300 bg-bis-50 px-3 py-2">
                        <Boxes className="h-3.5 w-3.5 text-bis-700" aria-hidden />
                        <span className="text-xs font-bold text-bis-800">
                          {t("graph.product" as PhraseKey, language)}
                        </span>
                      </div>

                      <ul className="mt-3 space-y-3">
                        {linkedProducts.slice(0, 4).map((p, i, arr) => (
                          <li key={p.id} className="relative">
                            <span
                              className="absolute -left-[15px] top-1/2 h-px w-4 bg-ink-200"
                              aria-hidden
                            />
                            {i === arr.length - 1 && (
                              <span className="absolute -left-[17px] top-1/2 h-px w-2 bg-white" aria-hidden />
                            )}
                            <div className="rounded-lg border border-ink-200 bg-white px-3 py-2.5">
                              <div className="flex items-center gap-2">
                                <CircleDot className="h-3 w-3 text-ink-300" aria-hidden />
                                <span className="text-xs font-semibold text-ink-900">{p.name}</span>
                              </div>
                              <div className="mt-1.5 flex flex-wrap gap-1.5 text-[10px]">
                                {p.material && (
                                  <span className="rounded bg-ink-100 px-1.5 py-0.5 text-ink-700">
                                    {p.material}
                                  </span>
                                )}
                                {p.application && (
                                  <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-800">
                                    {p.application}
                                  </span>
                                )}
                                <span className="mono rounded bg-bis-50 px-1.5 py-0.5 text-bis-800">
                                  {current.is_number}
                                </span>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-4 flex items-center gap-2 rounded-lg border border-ink-200 bg-ink-50 px-3 py-2">
                        <FileText className="h-3.5 w-3.5 text-ink-500" aria-hidden />
                        <span className="text-xs text-ink-700">
                          {t("graph.application" as PhraseKey, language)}:{" "}
                          {linkedProducts.find((p) => p.application)?.application ?? "—"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs leading-relaxed text-ink-500">
                      {t("graph.empty" as PhraseKey, language)} This standard appears in the
                      knowledge layer through its domain rather than a product mapping.
                    </p>
                  )}

                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-3 py-2">
                    <Landmark className="h-3.5 w-3.5 text-ink-500" aria-hidden />
                    <span className="text-xs text-ink-700">
                      {t("graph.source" as PhraseKey, language)}:{" "}
                      <Link href="/sources" className="font-medium text-bis-700 hover:underline">
                        {t("sources.title" as PhraseKey, language)}
                      </Link>
                    </span>
                  </div>
                </div>
              </>
            )}
          </aside>
        </div>
      ) : (
        <ReferenceTab />
      )}
    </div>
  );
}

function ReferenceTab() {
  const { language } = useSession();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<ReferenceStandard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/reference?q=${encodeURIComponent(q)}&limit=40`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as { rows: ReferenceStandard[] };
        setRows(data.rows);
      } catch {
        /* aborted or offline — keep the previous rows */
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [q]);

  return (
    <div>
      <div className="mb-4 rounded-lg border border-sky-200 bg-sky-50/60 px-4 py-3 text-xs leading-relaxed text-ink-700">
        This catalogue is a broad list of published Indian Standards supplied with the project. It is
        searchable for exploration only — it carries no product mapping, no evidence and is never
        used to answer a question.
      </div>

      <div className="relative mb-4 max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("standards.search" as PhraseKey, language)}
          className="input !pl-9"
          aria-label={t("standards.search" as PhraseKey, language)}
        />
      </div>

      {loading && !rows.length ? (
        <div className="flex items-center gap-2 text-sm text-ink-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          {t("loading.body" as PhraseKey, language)}
        </div>
      ) : (
        <ul className="divide-y divide-ink-100 rounded-xl border border-ink-200 bg-white">
          {rows.map((r, i) => (
            <li key={`${r.is_number}-${i}`} className="px-4 py-3">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="mono text-sm font-bold text-bis-800">{r.is_number}</span>
                {r.published && <span className="text-[11px] text-ink-400">{r.published}</span>}
              </div>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-700">{r.title}</p>
              {r.aspect && <p className="mt-0.5 text-[11px] text-ink-400">{r.aspect}</p>}
            </li>
          ))}
          {!rows.length && (
            <li className="px-4 py-10 text-center text-sm text-ink-500">
              {t("standards.noResult" as PhraseKey, language)}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
