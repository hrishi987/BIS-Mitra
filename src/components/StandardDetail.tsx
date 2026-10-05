"use client";

import Link from "next/link";
import { ArrowLeft, Boxes, GitBranch, Info, ListChecks, Workflow } from "lucide-react";

import { EvidencePanel } from "./EvidencePanel";
import { MatchBadge, PrototypeBadge, VerificationBadge } from "./ui";
import { t, type PhraseKey } from "@/lib/i18n";
import { useSession } from "@/lib/store";
import type { OfficialSource, ProductContext, RetrievalResult } from "@/lib/types";

export interface RelatedItem {
  id: string;
  is_number: string | null;
  title: string | null;
}

export function StandardDetail({
  result,
  related,
  linkedProducts,
  official,
  context,
}: {
  result: RetrievalResult;
  related: RelatedItem[];
  linkedProducts: { id: string; name: string }[];
  official: OfficialSource[];
  context?: ProductContext | null;
}) {
  const { language, packet } = useSession();

  // Pull the live match explanation if this standard is in the current session.
  const sessionResult = packet?.results.find((r) => r.standard_id === result.standard_id);
  const reasons = sessionResult?.match_reason ?? [];
  const matchType = sessionResult?.match_type;

  const info = result.certification;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/industry"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-bis-700"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t("common.back" as PhraseKey, language)}
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="mono text-2xl font-bold text-bis-800 sm:text-3xl">{result.is_number}</h1>
            {matchType && <MatchBadge type={matchType} />}
            <PrototypeBadge />
          </div>
          <p className="mt-2 max-w-3xl text-base font-medium leading-snug text-ink-900">
            {result.title}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
            {result.domain && <span>{result.domain}</span>}
            {result.standard_type && <span>· {result.standard_type}</span>}
            {result.iec_reference && <span>· {result.iec_reference}</span>}
            {result.amendments_count !== null && (
              <span>· {result.amendments_count} amendments recorded</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* ---------------- LEFT — standard information ---------------- */}
        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink-950">
              <Info className="h-4 w-4 text-bis-700" aria-hidden />
              {t("standards.detail" as PhraseKey, language)}
            </h2>
            <dl className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
              <Detail label="Standard number" value={result.is_number} mono />
              <Detail label="Domain" value={result.domain} />
              <Detail label="Standard type" value={result.standard_type} />
              <Detail label="International reference" value={result.iec_reference} />
              <Detail
                label="Amendments"
                value={
                  result.amendments_count !== null ? String(result.amendments_count) : null
                }
              />
              <Detail label="Version / status" value={result.notes} />
            </dl>
            {result.notes && (
              <p className="mt-3 border-t border-ink-100 pt-3 text-sm leading-relaxed text-ink-700">
                {result.notes}
              </p>
            )}
          </section>

          {/* Product relationship */}
          <section className="card p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink-950">
              <Boxes className="h-4 w-4 text-bis-700" aria-hidden />
              Product relationship
            </h2>
            {linkedProducts.length ? (
              <ul className="space-y-2">
                {linkedProducts.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-ink-200 bg-ink-50/50 px-3.5 py-2.5"
                  >
                    <span className="text-sm font-medium text-ink-900">{p.name}</span>
                    <span className="mono text-[11px] text-ink-400">{p.id}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-500">
                No product → standard relationship is recorded for this standard in the dataset.
              </p>
            )}

            {result.relationship && (
              <div className="mt-3 rounded-lg border border-ink-200 px-3.5 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
                  Relationship type
                </p>
                <p className="mt-1 text-sm font-medium text-ink-900">
                  {result.relationship.type}
                  {result.relationship.id && (
                    <span className="mono ml-2 text-xs text-ink-400">
                      {result.relationship.id}
                    </span>
                  )}
                </p>
                {result.relationship.original_text && (
                  <p className="mt-1 text-xs text-ink-600">
                    Dataset value: {result.relationship.original_text}
                  </p>
                )}
                {result.relationship.source_notes && (
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-500">
                    {result.relationship.source_notes}
                  </p>
                )}
              </div>
            )}
          </section>

          {/* Why retrieved */}
          <section className="card p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink-950">
              <GitBranch className="h-4 w-4 text-bis-700" aria-hidden />
              {t("results.why" as PhraseKey, language)}
            </h2>
            {reasons.length ? (
              <ul className="space-y-1.5">
                {reasons.map((r) => (
                  <li key={r} className="text-sm text-ink-800">
                    ✓ {r}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm leading-relaxed text-ink-600">
                This standard was opened directly rather than retrieved for a product query. Search
                for your product in the{" "}
                <Link href="/industry" className="font-medium text-bis-700 hover:underline">
                  Industry Assistant
                </Link>{" "}
                to see the full match reasoning.
              </p>
            )}
            {sessionResult?.contrast && (
              <p className="mt-3 rounded-md bg-sky-50 px-3 py-2 text-xs leading-relaxed text-ink-700">
                {sessionResult.contrast}
              </p>
            )}
          </section>

          {/* Certification / testing */}
          <section className="card p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink-950">
              <ListChecks className="h-4 w-4 text-bis-700" aria-hidden />
              {t("passport.cert" as PhraseKey, language)}
            </h2>
            {info?.qco || info?.certification || info?.testing?.length ? (
              <div className="space-y-3">
                {info?.qco && (
                  <div className="rounded-lg border border-ink-200 p-3.5">
                    <p className="text-xs font-semibold text-ink-900">
                      {info.qco.QCO_or_Certification_Status_Raw}
                    </p>
                    {info.qco.Key_Dates_Raw && (
                      <p className="mt-1 text-sm text-ink-700">{info.qco.Key_Dates_Raw}</p>
                    )}
                    {info.qco.Source_Raw && (
                      <p className="mt-1 text-xs text-ink-500">Source: {info.qco.Source_Raw}</p>
                    )}
                    {info.qco.Verification_Note && (
                      <p className="mt-1.5 rounded bg-amber-50 px-2 py-1 text-[11px] text-amber-900">
                        {info.qco.Verification_Note}
                      </p>
                    )}
                  </div>
                )}
                {info?.certification && (
                  <div className="rounded-lg border border-ink-200 p-3.5">
                    <p className="text-sm font-medium text-ink-900">
                      {info.certification.Certification_Relevance}
                    </p>
                    {info.certification.Scheme_Name && (
                      <p className="mt-1 text-sm text-ink-700">
                        Scheme: {info.certification.Scheme_Name}
                      </p>
                    )}
                    {info.certification.Note && (
                      <p className="mt-1 text-xs text-ink-500">{info.certification.Note}</p>
                    )}
                  </div>
                )}
                {info?.testing?.map((test) => (
                  <div key={test.Test_ID} className="rounded-lg border border-ink-200 p-3.5">
                    <p className="text-sm text-ink-800">{test.Source_Note_Raw}</p>
                    {test.Verification_Note && (
                      <p className="mt-1 text-xs text-ink-500">{test.Verification_Note}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-ink-200 bg-ink-50/50 px-4 py-4">
                <p className="text-sm text-ink-600">
                  {t("passport.none" as PhraseKey, language)} — the workbook records no
                  certification scheme, licence or test schedule for this standard.
                </p>
              </div>
            )}
          </section>

          {/* Related standards */}
          <section className="card p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink-950">
              <Workflow className="h-4 w-4 text-bis-700" aria-hidden />
              {t("standards.related" as PhraseKey, language)}
            </h2>
            {related.length ? (
              <ul className="divide-y divide-ink-100">
                {related.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/industry/standard/${r.id}`}
                      className="flex items-start gap-3 py-2.5 transition-colors hover:bg-ink-50"
                    >
                      <span className="mono mt-0.5 w-40 shrink-0 text-xs font-bold text-bis-800">
                        {r.is_number}
                      </span>
                      <span className="text-sm text-ink-700">{r.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-500">{t("a.noRelated" as PhraseKey, language)}</p>
            )}
          </section>

          {/* Limitations */}
          <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-5">
            <h2 className="mb-2 text-sm font-bold text-amber-900">Limitations of this record</h2>
            <ul className="space-y-1.5 text-sm leading-relaxed text-ink-700">
              <li>• Clause and page references are blank because the workbook did not supply them.</li>
              <li>• Verification status: {result.verification_status ?? "not stated"}.</li>
              <li>• This is not the text of the standard and not an official BIS statement.</li>
            </ul>
          </section>
        </div>

        {/* ---------------- RIGHT — evidence & provenance --------------- */}
        <div className="space-y-6">
          <EvidencePanel result={result} official={official} />

          <div className="card p-5">
            <h3 className="mb-3 text-sm font-bold text-ink-950">
              {t("passport.source" as PhraseKey, language)}
            </h3>
            <div className="mb-3">
              <VerificationBadge status={result.verification_status} />
            </div>
            <p className="text-xs leading-relaxed text-ink-600">
              {context?.rawQuery
                ? `Retrieved for: “${context.rawQuery}”`
                : "Open this standard from a product query to see why it was selected."}
            </p>
            <Link href="/sources" className="btn-secondary mt-3 w-full text-xs">
              {t("abstain.cta" as PhraseKey, language)}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  mono = false,
}: {
  label: string;
  value?: string | null;
  mono?: boolean;
}) {
  return (
    <div className="py-2">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">{label}</dt>
      <dd className={`mt-0.5 text-sm text-ink-900 ${mono ? "mono" : "font-medium"}`}>
        {value && value.trim() ? value : <span className="text-ink-400">not in dataset</span>}
      </dd>
    </div>
  );
}
