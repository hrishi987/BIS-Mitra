"use client";

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Database,
  FileSearch,
  GitBranch,
  PackageSearch,
  ScrollText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { PrototypeBadge, Section } from "./ui";
import { t, type PhraseKey } from "@/lib/i18n";
import { useSession } from "@/lib/store";
import type { KbStats } from "@/lib/types";

const HOW = [
  { key: "how.1", d: "how.1d", Icon: FileSearch },
  { key: "how.2", d: "how.2d", Icon: Database },
  { key: "how.3", d: "how.3d", Icon: GitBranch },
  { key: "how.4", d: "how.4d", Icon: ShieldCheck },
  { key: "how.5", d: "how.5d", Icon: Sparkles },
] as const;

export function LandingPage({
  stats,
  trustPolicy,
  generatedAt,
}: {
  stats: KbStats;
  trustPolicy: string;
  generatedAt: string;
}) {
  const { language } = useSession();

  const counters = [
    { label: t("kb.standards" as PhraseKey, language), value: stats.standards, Icon: ScrollText },
    { label: t("kb.products" as PhraseKey, language), value: stats.product_categories, Icon: PackageSearch },
    { label: t("kb.consumer" as PhraseKey, language), value: stats.consumer_demo_records, Icon: Building2 },
    { label: t("kb.sources" as PhraseKey, language), value: stats.sources, Icon: Database },
    { label: t("kb.domains" as PhraseKey, language), value: stats.domains, Icon: GitBranch },
    { label: t("kb.evidence" as PhraseKey, language), value: stats.evidence, Icon: ShieldCheck },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* ---------------------------------------------------------------- hero */}
      <section className="relative overflow-hidden border-b border-ink-200 pb-14 pt-14 sm:pt-20">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-64 opacity-[0.5]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(15,17,22,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,17,22,0.045) 1px, transparent 1px)",
            backgroundSize: "34px 34px",
            maskImage: "radial-gradient(ellipse 70% 60% at 50% 0%, #000 40%, transparent 100%)",
          }}
          aria-hidden
        />

        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mb-5 flex justify-center">
            <PrototypeBadge label={t("hero.proto" as PhraseKey, language)} />
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-ink-950 sm:text-5xl">
            BIS <span className="text-bis-700">Mitra</span>
          </h1>

          <div className="mt-5 space-y-1 text-xl font-semibold leading-snug text-ink-800 sm:text-2xl">
            <p>{t("hero.l1" as PhraseKey, language)}</p>
            <p>{t("hero.l2" as PhraseKey, language)}</p>
            <p>{t("hero.l3" as PhraseKey, language)}</p>
          </div>

          <p className="mx-auto mt-5 max-w-2xl text-balance text-sm leading-relaxed text-ink-600 sm:text-base">
            {t("hero.sub" as PhraseKey, language)}
          </p>

          <p className="mt-4 text-xs font-medium text-ink-400">
            {t("brand.tagline" as PhraseKey, language)} — {t("brand.powered" as PhraseKey, language)}
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------- two doors */}
      <section className="grid gap-5 py-12 md:grid-cols-2">
        <ModeCard
          href="/industry"
          eyebrow={t("card.industry.title" as PhraseKey, language)}
          title={t("card.industry.desc" as PhraseKey, language)}
          example={t("card.industry.example" as PhraseKey, language)}
          cta={t("card.industry.cta" as PhraseKey, language)}
          Icon={Building2}
          tone="industry"
        />
        <ModeCard
          href="/consumer"
          eyebrow={t("card.consumer.title" as PhraseKey, language)}
          title={t("card.consumer.desc" as PhraseKey, language)}
          example={t("card.consumer.example" as PhraseKey, language)}
          cta={t("card.consumer.cta" as PhraseKey, language)}
          Icon={PackageSearch}
          tone="consumer"
        />
      </section>

      {/* ------------------------------------------------------------ dashboard */}
      <Section
        id="dashboard"
        eyebrow={t("nav.dashboard" as PhraseKey, language)}
        title={t("kb.title" as PhraseKey, language)}
        subtitle={t("kb.sub" as PhraseKey, language)}
        className="py-4"
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {counters.map(({ label, value, Icon }) => (
            <div key={label} className="card px-4 py-4">
              <Icon className="h-4 w-4 text-bis-700" aria-hidden />
              <p className="mt-2.5 text-2xl font-extrabold tabular-nums tracking-tight text-ink-950">
                {value}
              </p>
              <p className="mt-0.5 text-[11px] font-medium leading-tight text-ink-500">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-ink-500">
          <span>
            {stats.relationships} product→standard relationships · {stats.rules} applicability rules ·{" "}
            {stats.evaluation_cases} evaluation cases · {stats.reference_standards.toLocaleString("en-IN")}{" "}
            reference standards
          </span>
          <span className="hidden sm:inline">·</span>
          <span className="mono text-ink-400">ingested {generatedAt}</span>
        </div>

        <p className="mt-3 rounded-lg border border-ink-200 bg-white px-4 py-3 text-xs leading-relaxed text-ink-600">
          <span className="font-semibold text-ink-800">Trust policy:</span> {trustPolicy}
        </p>
      </Section>

      {/* ---------------------------------------------------------- how it works */}
      <Section
        eyebrow="Method"
        title={t("how.title" as PhraseKey, language)}
        className="py-12"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {HOW.map(({ key, d, Icon }, i) => (
            <div key={key} className="card relative p-4">
              <span className="absolute right-3 top-3 text-[11px] font-bold tabular-nums text-ink-300">
                {String(i + 1).padStart(2, "0")}
              </span>
              <Icon className="h-4.5 w-4.5 h-5 w-5 text-bis-700" aria-hidden />
              <h3 className="mt-3 text-sm font-bold text-ink-950">{t(key, language)}</h3>
              <p className="mt-1 text-xs leading-relaxed text-ink-600">{t(d, language)}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/industry" className="btn-primary">
            {t("card.industry.cta" as PhraseKey, language)}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link href="/standards" className="btn-secondary">
            {t("standards.title" as PhraseKey, language)}
          </Link>
          <Link href="/sources" className="btn-secondary">
            {t("sources.title" as PhraseKey, language)}
          </Link>
          <Link href="/ask" className="btn-secondary">
            {t("nav.ask" as PhraseKey, language)}
          </Link>
        </div>
      </Section>
    </div>
  );
}

function ModeCard({
  href,
  eyebrow,
  title,
  example,
  cta,
  Icon,
  tone,
}: {
  href: string;
  eyebrow: string;
  title: string;
  example: string;
  cta: string;
  Icon: typeof Building2;
  tone: "industry" | "consumer";
}) {
  return (
    <Link
      href={href}
      className={`card card-hover group relative overflow-hidden p-6 ${
        tone === "industry" ? "border-l-4 border-l-bis-700" : "border-l-4 border-l-ink-800"
      }`}
    >
      <div className="flex items-start justify-between">
        <span className="eyebrow">{eyebrow}</span>
        <span
          className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${
            tone === "industry" ? "bg-bis-50 text-bis-700" : "bg-ink-100 text-ink-800"
          }`}
        >
          <Icon className="h-4.5 w-4.5 h-5 w-5" aria-hidden />
        </span>
      </div>
      <h2 className="mt-3 text-xl font-bold text-ink-950">{title}</h2>
      <p className="mt-3 rounded-lg border border-dashed border-ink-200 bg-ink-50/60 px-4 py-3 text-sm italic text-ink-600">
        {example}
      </p>
      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-bis-700">
        {cta}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </span>
    </Link>
  );
}
