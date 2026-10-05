"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  ImageUp,
  Loader2,
  MessageCircleQuestion,
  QrCode,
  ScanLine,
} from "lucide-react";

import { ChatPanel } from "@/components/ChatPanel";
import { AbstentionCard, ErrorState, PrototypeBadge } from "@/components/ui";
import { t, type PhraseKey } from "@/lib/i18n";
import { useSession } from "@/lib/store";
import type { Language } from "@/lib/types";

type Tab = "identifier" | "upload" | "mark" | "ask";

const DEMO_IDS = ["DEMO-LIC-0001", "DEMO-RNO-0001", "DEMO-HUID-0001"];

/** Resolve an identifier to a record and navigate, or report "not found". */
async function resolveIdentifier(
  identifier: string,
  language: Language,
): Promise<{ ok: boolean; recordId?: string }> {
  const res = await fetch("/api/consumer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, language }),
  });
  if (!res.ok) throw new Error("lookup failed");
  const data = (await res.json()) as { found: boolean; recordId?: string };
  return { ok: Boolean(data.found && data.recordId), recordId: data.recordId };
}

export default function ConsumerPage() {
  const router = useRouter();
  const { language } = useSession();
  const [tab, setTab] = useState<Tab>("identifier");
  const [identifier, setIdentifier] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const check = async (value?: string) => {
    const id = (value ?? identifier).trim();
    if (!id || busy) return;
    setBusy(true);
    setError(false);
    setNotFound(false);
    try {
      const result = await resolveIdentifier(id, language);
      if (result.ok && result.recordId) {
        router.push(`/consumer/result/${result.recordId}`);
        return;
      }
      setNotFound(true);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const TABS: { id: Tab; label: string; Icon: typeof QrCode }[] = [
    { id: "identifier", label: t("consumer.opt.identifier" as PhraseKey, language), Icon: QrCode },
    { id: "upload", label: t("consumer.opt.scan" as PhraseKey, language), Icon: Camera },
    { id: "mark", label: t("consumer.opt.mark" as PhraseKey, language), Icon: BadgeCheck },
    { id: "ask", label: t("consumer.opt.ask" as PhraseKey, language), Icon: MessageCircleQuestion },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-ink-900 text-white">
          <ScanLine className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-950 sm:text-3xl">
            {t("consumer.title" as PhraseKey, language)}
          </h1>
          <p className="mt-1 text-sm text-ink-600">{t("consumer.sub" as PhraseKey, language)}</p>
        </div>
        <span className="ml-auto">
          <PrototypeBadge />
        </span>
      </div>

      <div className="mb-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            aria-pressed={tab === id}
            className={`card flex items-center gap-2.5 px-4 py-3 text-left text-sm font-semibold transition-all ${
              tab === id
                ? "border-bis-300 text-bis-800 ring-1 ring-bis-100"
                : "text-ink-700 hover:border-ink-300"
            }`}
          >
            <Icon
              className={`h-4 w-4 shrink-0 ${tab === id ? "text-bis-700" : "text-ink-400"}`}
              aria-hidden
            />
            {label}
          </button>
        ))}
      </div>

      {/* ---------------------------------------------------- identifier tab */}
      {tab === "identifier" && (
        <div className="card p-5 animate-fade-in sm:p-6">
          <label className="label" htmlFor="identifier">
            {t("consumer.input.label" as PhraseKey, language)}
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void check()}
              placeholder={t("consumer.input.placeholder" as PhraseKey, language)}
              className="input mono !text-sm uppercase"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => void check()}
              disabled={busy || !identifier.trim()}
              className="btn-primary shrink-0"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {t("consumer.check" as PhraseKey, language)}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
              {t("consumer.demoHint" as PhraseKey, language)}
            </span>
            {DEMO_IDS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setIdentifier(id);
                  void check(id);
                }}
                disabled={busy}
                className="mono rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px]
                  font-semibold text-amber-800 transition-colors hover:bg-amber-100 disabled:opacity-50"
              >
                {id}
              </button>
            ))}
          </div>

          <p className="mt-4 border-t border-ink-100 pt-3 text-[11px] leading-relaxed text-ink-500">
            The knowledge base also accepts an IS number (for example{" "}
            <span className="mono text-ink-700">IS 4985:2000</span>), which resolves to the standard
            record rather than a consumer record.
          </p>

          {notFound && (
            <div className="mt-5 space-y-4">
              <div className="rounded-xl border border-ink-200 bg-ink-50/60 px-5 py-4">
                <p className="text-sm font-bold text-ink-950">
                  {t("consumer.notFound" as PhraseKey, language)}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink-700">
                  {t("consumer.notFoundBody" as PhraseKey, language)}
                </p>
              </div>
              <AbstentionCard />
            </div>
          )}

          {error && (
            <div className="mt-5">
              <ErrorState onRetry={() => void check()} />
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------- upload tab */}
      {tab === "upload" && <UploadPanel language={language} />}

      {/* ---------------------------------------------------------- mark tab */}
      {tab === "mark" && (
        <div className="card p-6 animate-fade-in">
          <h2 className="flex items-center gap-2 text-base font-bold text-ink-950">
            <BadgeCheck className="h-5 w-5 text-bis-700" aria-hidden />
            {t("consumer.mark.title" as PhraseKey, language)}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-700">
            {t("consumer.mark.body" as PhraseKey, language)}
          </p>
          <Link href="/sources" className="btn-secondary mt-4 w-fit text-xs">
            {t("sources.title" as PhraseKey, language)}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      )}

      {/* ----------------------------------------------------------- ask tab */}
      {tab === "ask" && (
        <div className="animate-fade-in">
          <p className="mb-3 max-w-2xl text-sm leading-relaxed text-ink-600">
            BIS Mitra answers about consumer records only from the retrieved record. Ask it anything
            about the identifier you checked.
          </p>
          <div className="max-w-2xl">
            <ChatPanel variant="page" suggested="consumer" />
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function UploadPanel({ language }: { language: Language }) {
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(null);
  const [fields, setFields] = useState({ identifier: "", manufacturer: "", product: "", isNumber: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const onFile = (file?: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result));
    reader.readAsDataURL(file);
  };

  const check = async () => {
    const id = fields.identifier.trim();
    if (!id || busy) return;
    setBusy(true);
    setError(false);
    try {
      const result = await resolveIdentifier(id, language);
      if (result.ok && result.recordId) {
        router.push(`/consumer/result/${result.recordId}`);
        return;
      }
      router.push("/consumer");
    } catch {
      setError(true);
      setBusy(false);
    }
  };

  const field = (key: keyof typeof fields, label: string, placeholder: string) => (
    <div>
      <label className="label" htmlFor={`ocr-${key}`}>
        {label}
      </label>
      <input
        id={`ocr-${key}`}
        className="input"
        placeholder={placeholder}
        value={fields[key]}
        onChange={(e) => setFields((f) => ({ ...f, [key]: e.target.value }))}
      />
    </div>
  );

  return (
    <div className="card p-5 animate-fade-in sm:p-6">
      <h2 className="flex items-center gap-2 text-base font-bold text-ink-950">
        <ImageUp className="h-5 w-5 text-bis-700" aria-hidden />
        {t("consumer.ocr.title" as PhraseKey, language)}
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
        {t("consumer.ocr.sub" as PhraseKey, language)}
      </p>

      <div className="mt-4 rounded-xl border-2 border-dashed border-ink-200 bg-ink-50/40 p-5 text-center">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Uploaded product"
            className="mx-auto max-h-56 rounded-lg border border-ink-200 bg-white object-contain"
          />
        ) : (
          <div className="mx-auto flex flex-col items-center gap-2 text-ink-400">
            <Camera className="h-7 w-7" aria-hidden />
            <p className="text-xs">{t("consumer.ocr.choose" as PhraseKey, language)}</p>
          </div>
        )}
        <label className="btn-secondary mx-auto mt-4 cursor-pointer text-xs">
          {t("consumer.ocr.choose" as PhraseKey, language)}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
        </label>
      </div>

      <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50/70 px-4 py-3">
        <p className="text-xs font-semibold text-amber-900">
          {t("consumer.ocr.untrusted" as PhraseKey, language)}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-ink-700">
          {t("consumer.ocr.detected" as PhraseKey, language)} —{" "}
          {t("consumer.ocr.edit" as PhraseKey, language)}
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {field("identifier", t("consumer.identifier" as PhraseKey, language), "DEMO-LIC-0001")}
        {field("manufacturer", t("consumer.manufacturer" as PhraseKey, language), "Manufacturer name")}
        {field("product", t("consumer.product" as PhraseKey, language), "Product name")}
        {field("isNumber", t("consumer.assoc" as PhraseKey, language), "IS 302 (Part 1):2024")}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => void check()} disabled={busy || !fields.identifier.trim()} className="btn-primary text-xs">
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {t("consumer.check" as PhraseKey, language)}
          {!busy && <ArrowRight className="h-3.5 w-3.5" aria-hidden />}
        </button>
        <span className="text-[11px] text-ink-500">
          Manual entry stays authoritative — edit anything that looks wrong before checking.
        </span>
      </div>

      {error && (
        <div className="mt-4">
          <ErrorState onRetry={() => void check()} />
        </div>
      )}
    </div>
  );
}
