"use client";

import { CheckCircle2, CircleDashed, Info } from "lucide-react";

import { t, type PhraseKey } from "@/lib/i18n";
import { useSession } from "@/lib/store";
import type { ProductContext } from "@/lib/types";

const CONFIDENCE_STYLE: Record<ProductContext["confidence"], string> = {
  high: "border-emerald-200 bg-emerald-50 text-emerald-800",
  medium: "border-ink-200 bg-ink-50 text-ink-700",
  low: "border-amber-200 bg-amber-50 text-amber-800",
};

export function ProductContextCard({ context }: { context: ProductContext }) {
  const { language } = useSession();
  const gapSet = new Set(context.gaps);

  const rows: { label: string; value: string | null; key: string }[] = [
    { label: t("understand.product" as PhraseKey, language), value: context.product, key: "product" },
    { label: t("understand.material" as PhraseKey, language), value: context.material, key: "material" },
    { label: t("understand.use" as PhraseKey, language), value: context.intendedUse, key: "use" },
    { label: t("understand.domain" as PhraseKey, language), value: context.domain, key: "domain" },
  ];

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 bg-ink-50/50 px-5 py-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden />
          <h3 className="text-sm font-bold text-ink-900">{t("understand.title" as PhraseKey, language)}</h3>
        </div>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${CONFIDENCE_STYLE[context.confidence]}`}
        >
          {t("understand.confidence" as PhraseKey, language)}: {context.confidence}
        </span>
      </div>

      <dl className="grid grid-cols-1 divide-y divide-ink-100 sm:grid-cols-2 sm:divide-y-0 sm:divide-x">
        {rows.map((row) => {
          const missing = !row.value || gapSet.has(`${row.key} not stated`);
          return (
            <div key={row.key} className="px-5 py-3.5">
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
                {row.label}
              </dt>
              <dd className="mt-1 flex items-center gap-2 text-sm font-medium text-ink-900">
                {row.value ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
                    <span className="break-words">{row.value}</span>
                  </>
                ) : (
                  <>
                    <CircleDashed className="h-3.5 w-3.5 shrink-0 text-ink-300" aria-hidden />
                    <span className="text-ink-400">{t("understand.gaps" as PhraseKey, language)}</span>
                  </>
                )}
              </dd>
            </div>
          );
        })}
      </dl>

      <div className="flex items-start gap-2 border-t border-ink-100 bg-white px-5 py-3">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400" aria-hidden />
        <p className="text-[11px] leading-relaxed text-ink-500">
          {t("understand.method" as PhraseKey, language)}
          {context.rawQuery && (
            <>
              {" "}
              Query: <span className="font-medium text-ink-700">“{context.rawQuery}”</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
