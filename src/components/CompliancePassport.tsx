"use client";

import { useState } from "react";
import { BadgeCheck, BookOpenCheck, CircleHelp, Loader2, Stamp } from "lucide-react";

import { MatchBadge, PrototypeBadge, VerificationBadge } from "./ui";
import { t, type PhraseKey } from "@/lib/i18n";
import { useSession } from "@/lib/store";
import type { ProductContext, RetrievalResult } from "@/lib/types";

/**
 * Standards Passport — the one-screen summary of the current product context.
 * Every field is either present in the dataset or explicitly marked missing.
 */
export function CompliancePassport({
  context,
  primary,
  onExplain,
}: {
  context: ProductContext;
  primary: RetrievalResult | null;
  onExplain?: () => void;
}) {
  const { language } = useSession();
  const [busy, setBusy] = useState(false);

  const info = primary?.certification;
  const certLines: string[] = [];
  if (info?.qco?.QCO_or_Certification_Status_Raw)
    certLines.push(info.qco.QCO_or_Certification_Status_Raw);
  if (info?.qco?.Key_Dates_Raw) certLines.push(info.qco.Key_Dates_Raw);
  if (info?.certification?.Certification_Relevance)
    certLines.push(info.certification.Certification_Relevance);
  if (info?.certification?.Note) certLines.push(info.certification.Note);
  if (info?.testing?.length) {
    for (const test of info.testing) if (test.Source_Note_Raw) certLines.push(test.Source_Note_Raw);
  }

  const none = t("passport.none" as PhraseKey, language);

  const handleExplain = () => {
    setBusy(true);
    onExplain?.();
    window.setTimeout(() => setBusy(false), 900);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-ink-200 bg-white shadow-lift">
      {/* Header band */}
      <div className="relative overflow-hidden bg-ink-950 px-5 py-4 text-white sm:px-6">
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-40 opacity-[0.14]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, #fff 0 1px, transparent 1px 9px)",
          }}
          aria-hidden
        />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-bis-700">
              <Stamp className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                {t("passport.title" as PhraseKey, language)}
              </h2>
              <p className="text-[11px] text-ink-300">
                {t("passport.sub" as PhraseKey, language)}
              </p>
            </div>
          </div>
          <PrototypeBadge />
        </div>
      </div>

      <div className="grid grid-cols-1 divide-y divide-ink-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <Field label={t("passport.product" as PhraseKey, language)} value={context.product} accent />
        <Field
          label={t("passport.application" as PhraseKey, language)}
          value={context.intendedUse ?? none}
          muted={!context.intendedUse}
        />
        <Field
          label={t("passport.standard" as PhraseKey, language)}
          value={primary?.is_number ?? none}
          mono
          muted={!primary}
          accent={Boolean(primary)}
        />
        <div className="flex flex-col gap-1.5 px-5 py-3.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
            {t("passport.relationship" as PhraseKey, language)}
          </span>
          {primary ? (
            <div className="flex flex-wrap items-center gap-2">
              <MatchBadge type={primary.match_type} />
              <span className="text-xs text-ink-600">
                {primary.relationship?.type ?? (primary.match_reason[0] ?? "—")}
              </span>
            </div>
          ) : (
            <span className="text-sm text-ink-400">{none}</span>
          )}
        </div>
        <div className="flex flex-col gap-1.5 px-5 py-3.5 sm:col-span-2 sm:border-t sm:border-ink-100">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
            {t("passport.cert" as PhraseKey, language)}
          </span>
          {certLines.length ? (
            <ul className="space-y-1">
              {certLines.map((line) => (
                <li key={line} className="flex items-start gap-2 text-sm text-ink-800">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-bis-600" aria-hidden />
                  {line}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-500">
              {none} — the workbook records no certification scheme, licence or test schedule for
              this standard.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5 border-t border-ink-100 px-5 py-3.5 sm:col-span-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
            {t("passport.source" as PhraseKey, language)}
          </span>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-sm text-ink-800">
              {primary?.source?.name ?? t("evidence.missing" as PhraseKey, language)}
            </span>
            <VerificationBadge status={primary?.verification_status ?? null} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 bg-ink-50/50 px-5 py-3.5">
        <p className="text-[11px] leading-relaxed text-ink-500">
          Fields are filled only where the workbook supplies them. Nothing here is inferred.
        </p>
        <button type="button" onClick={handleExplain} className="btn-primary !py-2 text-xs">
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <CircleHelp className="h-3.5 w-3.5" aria-hidden />
          )}
          {t("passport.what" as PhraseKey, language)}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  mono = false,
  muted = false,
  accent = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  muted?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5 px-5 py-3.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">{label}</span>
      <span
        className={`flex items-center gap-2 text-sm font-semibold ${
          mono ? "mono" : ""
        } ${muted ? "text-ink-400" : accent ? "text-bis-800" : "text-ink-900"}`}
      >
        {!muted && accent && <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />}
        <span className="break-words">{value}</span>
      </span>
    </div>
  );
}
