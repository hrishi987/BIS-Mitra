"use client";

import Link from "next/link";
import { ArrowRight, Database, ShieldAlert } from "lucide-react";

import { ChatPanel } from "@/components/ChatPanel";
import { PrototypeBadge } from "@/components/ui";
import { t, type PhraseKey } from "@/lib/i18n";
import { useSession } from "@/lib/store";

export default function AskPage() {
  const { language, packet, consumer, hydrated } = useSession();
  const contextName = consumer?.record
    ? consumer.record.identifier
    : packet?.context.product || null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Conversation</p>
          <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-ink-950 sm:text-3xl">
            {t("chat.title" as PhraseKey, language)}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-600">
            {t("chat.sub" as PhraseKey, language)}
          </p>
        </div>
        <PrototypeBadge />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <ChatPanel variant="page" />

        <aside className="space-y-4">
          <div className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-ink-950">
              <Database className="h-4 w-4 text-bis-700" aria-hidden />
              Context
            </h2>
            {hydrated && contextName ? (
              <div className="mt-3 space-y-2">
                <p className="mono rounded-md border border-ink-200 bg-ink-50 px-2.5 py-1.5 text-xs font-semibold text-ink-800">
                  {contextName}
                </p>
                {packet?.primary && !consumer?.record && (
                  <p className="mono rounded-md border border-bis-200 bg-bis-50 px-2.5 py-1.5 text-xs font-semibold text-bis-800">
                    {packet.primary.is_number}
                  </p>
                )}
                <p className="text-xs leading-relaxed text-ink-600">
                  Follow-up questions use this context automatically — you never need to repeat your
                  product.
                </p>
              </div>
            ) : (
              <div className="mt-3">
                <p className="text-xs leading-relaxed text-ink-600">
                  No active context yet. Start from a product query so answers can be grounded in
                  retrieved records.
                </p>
                <div className="mt-3 flex flex-col gap-2">
                  <Link href="/industry" className="btn-primary text-xs">
                    {t("industry.cta" as PhraseKey, language)}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                  <Link href="/consumer" className="btn-secondary text-xs">
                    {t("consumer.title" as PhraseKey, language)}
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-amber-900">
              <ShieldAlert className="h-4 w-4" aria-hidden />
              {t("abstain.title" as PhraseKey, language)}
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-ink-700">
              {t("abstain.body" as PhraseKey, language)}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-ink-600">
              Ask about a penalty, a fee or a licence number and BIS Mitra will decline rather than
              guess.
            </p>
            <Link href="/sources" className="mt-3 inline-flex text-xs font-semibold text-bis-700 hover:underline">
              {t("abstain.cta" as PhraseKey, language)} →
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
