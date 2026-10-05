"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, SearchX, SlidersHorizontal } from "lucide-react";

import { ChatPanel } from "@/components/ChatPanel";
import { CompliancePassport } from "@/components/CompliancePassport";
import { EvidencePanel } from "@/components/EvidencePanel";
import { ProductContextCard } from "@/components/ProductContextCard";
import { RelationshipGraph } from "@/components/RelationshipGraph";
import { StandardCard } from "@/components/StandardCard";
import {
  AbstentionCard,
  ClarificationCard,
  LoadingState,
  Section,
} from "@/components/ui";
import { t, type PhraseKey } from "@/lib/i18n";
import { useSession } from "@/lib/store";

export default function IndustryResultsPage() {
  const router = useRouter();
  const { language, packet, hydrated } = useSession();

  useEffect(() => {
    if (hydrated && !packet) router.replace("/industry");
  }, [hydrated, packet, router]);

  if (!hydrated || !packet) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <LoadingState />
      </div>
    );
  }

  const { context, results, primary, clarification, empty, searched } = packet;
  const related = results.filter((r) => r.match_type === "RELATED");
  const alternatives = results.filter((r) => r.match_type === "ALTERNATIVE");
  const unclear = results.filter((r) => r.match_type === "NEEDS CLARIFICATION");
  const direct = results.filter((r) => r.match_type === "DIRECT MATCH");

  const ordered = [...direct, ...related, ...alternatives, ...unclear];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Industry / Manufacturer</p>
          <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-ink-950">
            {t("results.title" as PhraseKey, language)}
          </h1>
          <p className="mt-1 text-sm text-ink-600">{t("results.sub" as PhraseKey, language)}</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-ink-500">
          <span className="rounded-md border border-ink-200 bg-white px-2.5 py-1">
            <span className="font-bold tabular-nums text-ink-800">{searched.products_considered}</span>{" "}
            {t("results.searched" as PhraseKey, language)}
          </span>
          <span className="rounded-md border border-ink-200 bg-white px-2.5 py-1">
            <span className="font-bold tabular-nums text-ink-800">{searched.matched}</span>{" "}
            {t("results.matched" as PhraseKey, language)}
          </span>
          <Link href="/industry" className="btn-secondary !px-3 !py-1.5 text-xs">
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
            New query
          </Link>
        </div>
      </div>

      <div className="mb-6 animate-fade-up">
        <ProductContextCard context={context} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* ------------------------------------------------------ main column */}
        <div className="space-y-6">
          {clarification.length > 0 && <ClarificationCard questions={clarification} />}

          {empty ? (
            <div className="space-y-5">
              <div className="card p-6 text-center">
                <SearchX className="mx-auto h-6 w-6 text-ink-400" aria-hidden />
                <h2 className="mt-3 text-base font-bold text-ink-950">
                  {t("results.none" as PhraseKey, language)}
                </h2>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-ink-600">
                  {t("results.noneBody" as PhraseKey, language)}
                </p>
                <Link href="/standards" className="btn-secondary mx-auto mt-4 text-xs">
                  {t("standards.title" as PhraseKey, language)}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>
              <AbstentionCard />
            </div>
          ) : (
            <>
              <Section title={t("results.title" as PhraseKey, language)}>
                <div className="space-y-4">
                  {ordered.map((r, i) => (
                    <div key={r.standard_id} className="animate-fade-up" style={{ animationDelay: `${i * 45}ms` }}>
                      <StandardCard result={r} primary={i === 0} />
                    </div>
                  ))}
                </div>
              </Section>

              {primary && (
                <div className="grid gap-6 md:grid-cols-2">
                  <RelationshipGraph context={context} results={results} primary={primary} />
                  <EvidencePanel result={primary} official={packet.official_sources} />
                </div>
              )}
            </>
          )}
        </div>

        {/* ---------------------------------------------------- side column */}
        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          {primary && (
            <CompliancePassport
              context={context}
              primary={primary}
              onExplain={() =>
                window.dispatchEvent(
                  new CustomEvent("bis-mitra:ask", { detail: "What does this mean?" }),
                )
              }
            />
          )}
          <ChatPanel variant="panel" suggested="industry" />
        </aside>
      </div>
    </div>
  );
}
