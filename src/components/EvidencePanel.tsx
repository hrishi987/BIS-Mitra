"use client";

import { ExternalLink, FileSearch, FileX, Landmark, Link2 } from "lucide-react";

import { PrototypeBadge, VerificationBadge } from "./ui";
import { t, type PhraseKey } from "@/lib/i18n";
import { useSession } from "@/lib/store";
import type { EvidenceRef, OfficialSource, RetrievalResult, SourceSummary } from "@/lib/types";

function SourceBody({ source }: { source: SourceSummary }) {
  const { language } = useSession();
  return (
    <dl className="divide-y divide-ink-100">
      <div className="flex flex-col gap-1 py-2.5">
        <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
          {t("evidence.source" as PhraseKey, language)}
        </dt>
        <dd className="text-sm font-medium text-ink-900">{source.name ?? "—"}</dd>
      </div>
      <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
        <div className="flex flex-col gap-1 py-2.5">
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
            {t("evidence.sourceType" as PhraseKey, language)}
          </dt>
          <dd>
            <span className="inline-flex items-center rounded-full border border-ink-200 bg-ink-50 px-2.5 py-0.5 text-[11px] font-semibold text-ink-700">
              {source.category}
            </span>
          </dd>
        </div>
        <div className="flex flex-col gap-1 py-2.5">
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
            {t("evidence.authority" as PhraseKey, language)}
          </dt>
          <dd className="text-sm text-ink-800">{source.authority}</dd>
        </div>
      </div>
      <div className="flex flex-col gap-1 py-2.5">
        <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
          {t("evidence.url" as PhraseKey, language)}
        </dt>
        <dd className="text-sm">
          {source.url ? (
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 break-all text-bis-700 underline-offset-2 hover:underline"
            >
              <Link2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {source.url}
              <ExternalLink className="h-3 w-3 shrink-0 opacity-60" aria-hidden />
            </a>
          ) : (
            <span className="text-ink-500">{t("sources.noUrl" as PhraseKey, language)}</span>
          )}
        </dd>
      </div>
      <div className="flex flex-col gap-1.5 py-2.5">
        <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
          {t("evidence.verification" as PhraseKey, language)}
        </dt>
        <dd>
          <VerificationBadge status={source.verification_status} />
        </dd>
      </div>
      {source.what_it_gives && (
        <div className="flex flex-col gap-1 py-2.5">
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
            Notes
          </dt>
          <dd className="text-sm leading-relaxed text-ink-700">{source.what_it_gives}</dd>
        </div>
      )}
    </dl>
  );
}

function EvidenceBody({ evidence }: { evidence: EvidenceRef[] }) {
  const { language } = useSession();

  if (!evidence.length) {
    return (
      <div className="rounded-lg border border-dashed border-ink-200 bg-ink-50/50 px-4 py-5">
        <div className="flex items-start gap-2.5">
          <FileX className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" aria-hidden />
          <p className="text-sm leading-relaxed text-ink-600">
            {t("evidence.missing" as PhraseKey, language)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {evidence.map((e) => (
        <div key={e.evidence_id} className="rounded-lg border border-ink-200 bg-white p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="mono font-semibold text-ink-900">{e.evidence_id}</span>
            <span className="text-[11px] text-ink-400">
              {t("evidence.clause" as PhraseKey, language)}:{" "}
              <span className="text-ink-500">{e.clause ?? "—"}</span> ·{" "}
              {t("evidence.page" as PhraseKey, language)}:{" "}
              <span className="text-ink-500">{e.page ?? "—"}</span>
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-ink-800">{e.text}</p>
          {e.limitation && (
            <p className="mt-2 rounded-md bg-amber-50 px-2.5 py-1.5 text-[11px] leading-relaxed text-amber-900">
              <span className="font-semibold">{t("evidence.limit" as PhraseKey, language)}:</span>{" "}
              {e.limitation}
            </p>
          )}
          {e.source && (
            <div className="mt-2.5 border-t border-ink-100 pt-2.5">
              <SourceBody source={e.source} />
            </div>
          )}
        </div>
      ))}
      <p className="text-[11px] leading-relaxed text-ink-500">
        {t("evidence.noClause" as PhraseKey, language)}
      </p>
    </div>
  );
}

export function EvidencePanel({
  result,
  official = [],
  compact = false,
}: {
  result: RetrievalResult;
  official?: OfficialSource[];
  compact?: boolean;
}) {
  const { language } = useSession();
  const sources = official.slice(0, 4);

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-ink-100 bg-ink-50/50 px-5 py-3">
        <div className="flex items-center gap-2">
          <FileSearch className="h-4 w-4 text-bis-700" aria-hidden />
          <h3 className="text-sm font-bold text-ink-900">{t("evidence.title" as PhraseKey, language)}</h3>
        </div>
        <PrototypeBadge />
      </div>

      <div className="space-y-5 p-5">
        {/* Source — or an honest admission that there is none */}
        {result.source ? (
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
              {t("evidence.title" as PhraseKey, language)}
            </p>
            <SourceBody source={result.source} />
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-ink-200 bg-ink-50/50 px-4 py-4">
            <div className="flex items-start gap-2.5">
              <FileX className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" aria-hidden />
              <div>
                <p className="text-sm font-medium text-ink-800">
                  {t("evidence.missing" as PhraseKey, language)}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-ink-500">
                  BIS Mitra will not generate a URL, clause or page to fill this gap.
                </p>
              </div>
            </div>
          </div>
        )}

        {!compact && <div className="divider" />}

        {/* Evidence records */}
        {!compact && (
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
              {t("evidence.title" as PhraseKey, language)} · {result.evidence.length}
            </p>
            <EvidenceBody evidence={result.evidence} />
          </div>
        )}

        {/* Official destinations the dataset itself lists */}
        {sources.length > 0 && (
          <>
            <div className="divider" />
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
                <Landmark className="h-3.5 w-3.5" aria-hidden />
                {t("evidence.official" as PhraseKey, language)}
              </p>
              <ul className="space-y-1.5">
                {sources.map((s) => (
                  <li key={s.id}>
                    <a
                      href={s.url ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-2 text-xs text-ink-700 hover:text-bis-700"
                    >
                      <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-ink-400 group-hover:text-bis-600" aria-hidden />
                      <span>
                        <span className="font-medium">{s.name}</span>
                        {s.what_it_gives && (
                          <span className="block text-ink-500">{s.what_it_gives}</span>
                        )}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* Provenance */}
        <div className="divider" />
        <dl className="space-y-2 text-xs">
          <div className="flex flex-wrap items-baseline gap-2">
            <dt className="font-semibold uppercase tracking-wider text-ink-400">
              {t("evidence.provenance" as PhraseKey, language)}:
            </dt>
            <dd className="mono text-ink-600">{result.provenance ?? "—"}</dd>
          </div>
          {result.data_basis && (
            <div className="flex flex-wrap items-baseline gap-2">
              <dt className="font-semibold uppercase tracking-wider text-ink-400">Data basis:</dt>
              <dd className="text-ink-600">{result.data_basis}</dd>
            </div>
          )}
          <div className="flex flex-wrap items-baseline gap-2">
            <dt className="font-semibold uppercase tracking-wider text-ink-400">
              {t("evidence.verification" as PhraseKey, language)}:
            </dt>
            <dd>
              <VerificationBadge status={result.verification_status} />
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
