"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowLeftRight, CircleHelp } from "lucide-react";

import { ChatPanel, askInPanel } from "./ChatPanel";
import { ConsumerVerificationCard } from "./ConsumerVerificationCard";
import { CrossCheckBadge, DemoBadge } from "./ui";
import { DiscrepancyAlert } from "./DiscrepancyAlert";
import { overallStatus } from "@/lib/crosscheck";
import { t, type PhraseKey } from "@/lib/i18n";
import { useSession } from "@/lib/store";
import type { ConsumerLookup, OfficialSource } from "@/lib/types";

export function ConsumerResultView({
  lookup,
  official,
}: {
  lookup: ConsumerLookup;
  official: OfficialSource[];
}) {
  const { language, setConsumer, hydrated } = useSession();
  const recordId = lookup.record?.id ?? "";

  /* Publish the retrieved record to the session so the chat panel can ground
     follow-ups ("What does this mean?") on this record, and clear it again
     when navigating away. Waits for storage hydration — the provider's
     restore effect replaces the whole session and would otherwise clobber
     this write. */
  useEffect(() => {
    if (!hydrated) return;
    setConsumer(lookup);
    return () => setConsumer(null);
  }, [hydrated, lookup, setConsumer]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/consumer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-bis-700"
          >
            <ArrowLeftRight className="h-4 w-4" aria-hidden />
            {t("common.back" as PhraseKey, language)}
          </Link>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink-950">
            {t("consumer.result" as PhraseKey, language)}
          </h1>
          <p className="mono mt-1 text-sm text-ink-500">{lookup.record?.identifier}</p>
        </div>
        <div className="flex items-center gap-2">
          {lookup.record?.demo && <DemoBadge />}
          {lookup.crossChecks.length > 0 && (
            <CrossCheckBadge status={overallStatus(lookup.crossChecks)} />
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div className="animate-fade-up">
            <ConsumerVerificationCard lookup={lookup} official={official} />
          </div>

          {/* ------------------------------------------------ cross-check */}
          <section className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-ink-950">
              <ArrowLeftRight className="h-4 w-4 text-bis-700" aria-hidden />
              {t("consumer.cross" as PhraseKey, language)}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-ink-600">
              {t("consumer.cross.sub" as PhraseKey, language)}
            </p>

            <form
              method="GET"
              action={`/consumer/result/${recordId}`}
              className="mt-4 grid gap-3 sm:grid-cols-3"
            >
              <div>
                <label className="label" htmlFor="manufacturer">
                  {t("consumer.cross.manufacturer" as PhraseKey, language)}
                </label>
                <input
                  id="manufacturer"
                  name="manufacturer"
                  className="input"
                  placeholder="ABC Industries"
                  defaultValue={lookup.crossChecks.find((c) => c.field === "Manufacturer")?.supplied ?? ""}
                />
              </div>
              <div>
                <label className="label" htmlFor="product">
                  {t("consumer.cross.product" as PhraseKey, language)}
                </label>
                <input
                  id="product"
                  name="product"
                  className="input"
                  placeholder="Demo Electric Appliance"
                  defaultValue={lookup.crossChecks.find((c) => c.field === "Product")?.supplied ?? ""}
                />
              </div>
              <div>
                <label className="label" htmlFor="is">
                  {t("consumer.cross.is" as PhraseKey, language)}
                </label>
                <input
                  id="is"
                  name="is"
                  className="input"
                  placeholder="IS 302 (Part 1):2024"
                  defaultValue={lookup.crossChecks.find((c) => c.field === "Associated standard")?.supplied ?? ""}
                />
              </div>
              <div className="sm:col-span-3">
                <button type="submit" className="btn-primary w-full sm:w-auto">
                  {t("consumer.cross.run" as PhraseKey, language)}
                </button>
              </div>
            </form>
          </section>

          {lookup.crossChecks.length > 0 && (
            <div className="animate-fade-up">
              <DiscrepancyAlert checks={lookup.crossChecks} />
            </div>
          )}

          {/* ------------------------------------------------- explanation */}
          <section className="card flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <h2 className="text-sm font-bold text-ink-950">
                {t("consumer.meaning" as PhraseKey, language)}
              </h2>
              <p className="mt-1 text-xs text-ink-600">
                BIS Mitra explains what the record can and cannot establish — from the record only.
              </p>
            </div>
            <button
              type="button"
              className="btn-primary"
              onClick={() =>
                askInPanel(t("consumer.meaning" as PhraseKey, language))
              }
            >
              <CircleHelp className="h-4 w-4" aria-hidden />
              {t("consumer.meaning" as PhraseKey, language)}
            </button>
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <ChatPanel variant="panel" suggested="consumer" />
        </aside>
      </div>
    </div>
  );
}
