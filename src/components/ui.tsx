"use client";

import type { ReactNode } from "react";
import { AlertTriangle, FileQuestion, Loader2, RefreshCw, ShieldCheck } from "lucide-react";

import { t, type PhraseKey } from "@/lib/i18n";
import { useSession } from "@/lib/store";
import type { CrossCheckStatus, MatchType } from "@/lib/types";

/* -------------------------------------------------------------------------- */
/* Badges                                                                      */
/* -------------------------------------------------------------------------- */

export function PrototypeBadge({ label }: { label?: string }) {
  const { language } = useSession();
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-ink-50
        px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink-600"
      title="Content comes from the supplied prototype workbook"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-ink-400" aria-hidden />
      {label ?? t("badge.proto" as PhraseKey, language)}
    </span>
  );
}

export function DemoBadge() {
  const { language } = useSession();
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50
        px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-800"
      title="Synthetic record supplied with the prototype dataset — not an official BIS record"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
      {t("badge.demo" as PhraseKey, language)}
    </span>
  );
}

const MATCH_STYLES: Record<MatchType, string> = {
  "DIRECT MATCH": "border-bis-700 bg-bis-700 text-white",
  RELATED: "border-ink-300 bg-white text-ink-700",
  ALTERNATIVE: "border-sky-200 bg-sky-50 text-sky-800",
  "NEEDS CLARIFICATION": "border-amber-300 bg-amber-50 text-amber-800",
};

const MATCH_KEY: Record<MatchType, PhraseKey> = {
  "DIRECT MATCH": "badge.direct",
  RELATED: "badge.related",
  ALTERNATIVE: "badge.alternative",
  "NEEDS CLARIFICATION": "badge.clarification",
};

export function MatchBadge({ type, className = "" }: { type: MatchType; className?: string }) {
  const { language } = useSession();
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold
        uppercase tracking-[0.08em] ${MATCH_STYLES[type]} ${className}`}
    >
      {t(MATCH_KEY[type], language)}
    </span>
  );
}

const CROSS_STYLES: Record<CrossCheckStatus, string> = {
  MATCH: "border-emerald-200 bg-emerald-50 text-emerald-800",
  "PARTIAL MATCH": "border-amber-200 bg-amber-50 text-amber-800",
  "POTENTIAL DISCREPANCY": "border-bis-300 bg-bis-50 text-bis-800",
  "INSUFFICIENT INFORMATION": "border-ink-200 bg-ink-50 text-ink-700",
};

const CROSS_KEY: Record<CrossCheckStatus, PhraseKey> = {
  MATCH: "cross.match",
  "PARTIAL MATCH": "cross.partial",
  "POTENTIAL DISCREPANCY": "cross.discrepancy",
  "INSUFFICIENT INFORMATION": "cross.insufficient",
};

export function CrossCheckBadge({ status }: { status: CrossCheckStatus }) {
  const { language } = useSession();
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold
        uppercase tracking-[0.08em] ${CROSS_STYLES[status]}`}
    >
      {t(CROSS_KEY[status], language)}
    </span>
  );
}

/** Verification status from the dataset, rendered honestly. */
export function VerificationBadge({ status }: { status?: string | null }) {
  const { language } = useSession();
  if (!status) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-ink-50 px-2.5 py-0.5 text-[11px] font-medium text-ink-600">
        <FileQuestion className="h-3 w-3" aria-hidden />
        {t("evidence.missing" as PhraseKey, language)}
      </span>
    );
  }
  const needsWork = /needs|not independently|demo/i.test(status);
  return (
    <span
      className={`inline-flex items-start gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium leading-snug ${
        needsWork
          ? "border-amber-200 bg-amber-50 text-amber-900"
          : "border-emerald-200 bg-emerald-50 text-emerald-800"
      }`}
    >
      <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
      {status}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Layout                                                                      */
/* -------------------------------------------------------------------------- */

export function Section({
  eyebrow,
  title,
  subtitle,
  action,
  children,
  className = "",
  id,
}: {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={className}>
      {(title || eyebrow || action) && (
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
            {title && <h2 className="text-xl font-bold text-ink-950">{title}</h2>}
            {subtitle && <p className="mt-1 max-w-2xl text-sm text-ink-600">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function KeyValue({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 py-2">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">{label}</dt>
      <dd className={`text-sm text-ink-900 ${mono ? "mono" : ""}`}>{value}</dd>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* States                                                                      */
/* -------------------------------------------------------------------------- */

export function LoadingState({ label }: { label?: string }) {
  const { language } = useSession();
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-ink-200 bg-white px-6 py-14 text-center">
      <Loader2 className="h-6 w-6 animate-spin text-bis-700" aria-hidden />
      <p className="text-sm font-medium text-ink-700">{label ?? t("loading.body" as PhraseKey, language)}</p>
      <div className="mt-1 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-ink-300 animate-pulse-soft"
            style={{ animationDelay: `${i * 0.18}s` }}
            aria-hidden
          />
        ))}
      </div>
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  const { language } = useSession();
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-bis-200 bg-bis-50/50 px-6 py-12 text-center">
      <AlertTriangle className="h-6 w-6 text-bis-700" aria-hidden />
      <p className="text-sm font-semibold text-ink-900">{t("error.title" as PhraseKey, language)}</p>
      <p className="max-w-md text-sm text-ink-600">{t("error.body" as PhraseKey, language)}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary mt-1">
          <RefreshCw className="h-4 w-4" aria-hidden />
          {t("error.retry" as PhraseKey, language)}
        </button>
      )}
    </div>
  );
}

export function AbstentionCard({
  onOpenSources,
  compact = false,
}: {
  onOpenSources?: () => void;
  compact?: boolean;
}) {
  const { language } = useSession();
  return (
    <div
      className={`rounded-xl border border-amber-200 bg-amber-50/70 ${
        compact ? "p-4" : "p-5"
      }`}
      role="status"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100">
          <FileQuestion className="h-4 w-4 text-amber-700" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-amber-900">{t("abstain.title" as PhraseKey, language)}</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-700">
            {t("abstain.body" as PhraseKey, language)}
          </p>
          <button
            type="button"
            onClick={onOpenSources ?? (() => window.location.assign("/sources"))}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-bis-700 underline-offset-2 hover:underline"
          >
            {t("abstain.cta" as PhraseKey, language)} →
          </button>
        </div>
      </div>
    </div>
  );
}

export function ClarificationCard({ questions }: { questions: string[] }) {
  const { language } = useSession();
  if (!questions.length) return null;
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100">
          <AlertTriangle className="h-4 w-4 text-amber-700" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-bold text-amber-900">{t("clarify.title" as PhraseKey, language)}</p>
          <p className="mt-1 text-sm text-ink-700">{t("clarify.body" as PhraseKey, language)}</p>
          <ul className="mt-3 space-y-1.5">
            {questions.map((q) => (
              <li key={q} className="flex items-start gap-2 text-sm text-ink-800">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber-600" aria-hidden />
                {q}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
