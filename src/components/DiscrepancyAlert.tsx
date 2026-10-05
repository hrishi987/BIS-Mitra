"use client";

import { AlertOctagon, ArrowLeftRight, CheckCircle2, HelpCircle } from "lucide-react";

import { CrossCheckBadge } from "./ui";
import { t, type PhraseKey } from "@/lib/i18n";
import { useSession } from "@/lib/store";
import type { CrossCheck } from "@/lib/types";

/**
 * Deterministic cross-check between what the user reports and what the
 * knowledge layer holds. The strongest verdict it can reach is
 * POTENTIAL DISCREPANCY — never a counterfeit claim.
 */
export function DiscrepancyAlert({ checks }: { checks: CrossCheck[] }) {
  const { language } = useSession();
  if (!checks.length) return null;

  const headline = checks.find((c) => c.status === "POTENTIAL DISCREPANCY");
  const allMatch = checks.every((c) => c.status === "MATCH");

  return (
    <div
      role="status"
      className={`overflow-hidden rounded-xl border ${
        headline
          ? "border-bis-300"
          : allMatch
            ? "border-emerald-200"
            : "border-ink-200"
      }`}
    >
      <div
        className={`flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 ${
          headline
            ? "bg-bis-50"
            : allMatch
              ? "bg-emerald-50/70"
              : "bg-ink-50"
        }`}
      >
        <div className="flex items-center gap-2.5">
          {headline ? (
            <AlertOctagon className="h-5 w-5 text-bis-700" aria-hidden />
          ) : allMatch ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden />
          ) : (
            <HelpCircle className="h-5 w-5 text-ink-500" aria-hidden />
          )}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
              {t("cross.title" as PhraseKey, language)}
            </p>
            <p className="text-sm font-bold text-ink-950">
              {headline
                ? t("cross.discrepancy" as PhraseKey, language)
                : allMatch
                  ? t("cross.match" as PhraseKey, language)
                  : checks[0].status}
            </p>
          </div>
        </div>
        <CrossCheckBadge
          status={headline ? headline.status : allMatch ? "MATCH" : checks[0].status}
        />
      </div>

      <ul className="divide-y divide-ink-100 bg-white">
        {checks.map((check) => (
          <li key={check.field} className="px-5 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <ArrowLeftRight className="h-3.5 w-3.5 text-ink-400" aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                {check.field}
              </span>
              <CrossCheckBadge status={check.status} />
            </div>
            <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="rounded-md border border-ink-200 bg-ink-50/60 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">
                  You entered
                </p>
                <p className="mt-0.5 text-sm text-ink-900">{check.supplied}</p>
              </div>
              <div className="rounded-md border border-ink-200 bg-white px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">
                  Retrieved record
                </p>
                <p className="mt-0.5 text-sm text-ink-900">
                  {check.recorded ?? <span className="text-ink-400">not in dataset</span>}
                </p>
              </div>
            </div>
            <ul className="mt-2.5 space-y-1">
              {check.messages.map((m) => (
                <li key={m} className="text-sm leading-relaxed text-ink-700">
                  {m}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      {headline && (
        <div className="border-t border-bis-200 bg-bis-50/70 px-5 py-3.5">
          <p className="text-sm font-semibold leading-relaxed text-bis-900">
            {t("cross.disclaimer" as PhraseKey, language)}
          </p>
        </div>
      )}
    </div>
  );
}
