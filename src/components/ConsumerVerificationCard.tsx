"use client";

import { ExternalLink, FileSearch, ShieldQuestion, UserRound } from "lucide-react";

import { DemoBadge, PrototypeBadge, VerificationBadge } from "./ui";
import { t, type PhraseKey } from "@/lib/i18n";
import { useSession } from "@/lib/store";
import type { ConsumerLookup, OfficialSource, RetrievalResult } from "@/lib/types";

function Row({ label, value, mono = false }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-1 px-5 py-3">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">{label}</dt>
      <dd className={`text-sm text-ink-900 ${mono ? "mono font-semibold" : "font-medium"}`}>
        {value && value.trim() ? value : <span className="text-ink-400">—</span>}
      </dd>
    </div>
  );
}

export function ConsumerVerificationCard({
  lookup,
  official = [],
}: {
  lookup: ConsumerLookup;
  official?: OfficialSource[];
}) {
  const { language } = useSession();
  const record = lookup.record;
  if (!record) return null;

  const standardLabel = lookup.standard
    ? `${lookup.standard.is_number ?? ""} — ${lookup.standard.title ?? ""}`
    : record.associated_is_number;

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 bg-emerald-50/60 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
            <ShieldQuestion className="h-4 w-4 text-emerald-700" aria-hidden />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
              {t("consumer.result" as PhraseKey, language)}
            </p>
            <p className="text-sm font-bold text-ink-950">{t("consumer.found" as PhraseKey, language)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {record.demo && <DemoBadge />}
          <PrototypeBadge />
        </div>
      </div>

      <dl className="grid grid-cols-1 divide-y divide-ink-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <Row label={t("consumer.product" as PhraseKey, language)} value={record.product} />
        <Row label={t("consumer.manufacturer" as PhraseKey, language)} value={record.manufacturer} />
        <Row label={t("consumer.identifier" as PhraseKey, language)} value={record.identifier ?? undefined} mono />
        <Row label={t("consumer.idType" as PhraseKey, language)} value={lookup.identifierType} />
        <Row label={t("consumer.assoc" as PhraseKey, language)} value={standardLabel} />
        <Row label={t("consumer.status" as PhraseKey, language)} value={record.status} />
        <Row label={t("consumer.authority" as PhraseKey, language)} value={record.authority_level} />
        <Row label={t("consumer.certContext" as PhraseKey, language)} value={record.certification_context} />
      </dl>

      <div className="space-y-3 border-t border-ink-100 px-5 py-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
            {t("consumer.source" as PhraseKey, language)}
          </span>
          {lookup.source ? (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium text-ink-900">{lookup.source.name}</span>
              <span className="rounded-full border border-ink-200 bg-ink-50 px-2 py-0.5 text-[11px] font-semibold text-ink-600">
                {lookup.source.category}
              </span>
              {lookup.source.url && (
                <a
                  href={lookup.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-bis-700 hover:underline"
                >
                  {t("evidence.url" as PhraseKey, language)}
                  <ExternalLink className="h-3 w-3" aria-hidden />
                </a>
              )}
            </div>
          ) : (
            <p className="text-sm text-ink-500">{t("evidence.missing" as PhraseKey, language)}</p>
          )}
          <div className="mt-1">
            <VerificationBadge status={record.verification_status} />
          </div>
        </div>

        {record.notes && (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
            {record.notes}
          </p>
        )}

        {lookup.standard && (
          <div className="rounded-lg border border-ink-200 bg-ink-50/50 px-3.5 py-3">
            <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
              <FileSearch className="h-3.5 w-3.5" aria-hidden />
              Associated standard record
            </p>
            <p className="text-sm font-medium text-ink-900">{lookup.standard.title}</p>
            <p className="mt-1 text-xs text-ink-600">{lookup.standard.domain}</p>
            {lookup.standard.notes && (
              <p className="mt-1.5 text-xs leading-relaxed text-ink-500">{lookup.standard.notes}</p>
            )}
          </div>
        )}

        {official.length > 0 && (
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
              {t("evidence.official" as PhraseKey, language)}
            </p>
            <div className="flex flex-wrap gap-2">
              {official.slice(0, 3).map((s) => (
                <a
                  key={s.id}
                  href={s.url ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 bg-white px-2.5 py-1.5 text-xs font-medium text-ink-700 hover:border-bis-300 hover:text-bis-700"
                >
                  <UserRound className="h-3.5 w-3.5" aria-hidden />
                  {s.name}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
