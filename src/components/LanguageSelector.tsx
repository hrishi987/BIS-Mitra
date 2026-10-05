"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Languages } from "lucide-react";

import { coverage, t, type PhraseKey } from "@/lib/i18n";
import { LANGUAGES, type Language } from "@/lib/types";
import { useSession } from "@/lib/store";

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-2.5 py-1.5
          text-xs font-medium text-ink-700 transition-colors hover:border-ink-300 hover:bg-ink-50"
        title={t("common.language" as PhraseKey, language)}
      >
        <Languages className="h-3.5 w-3.5 text-ink-500" aria-hidden />
        {!compact && <span>{current.native}</span>}
        <ChevronDown className={`h-3.5 w-3.5 text-ink-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-ink-200
            bg-white shadow-panel animate-fade-in"
        >
          <div className="border-b border-ink-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
            {t("common.language" as PhraseKey, language)}
          </div>
          <ul className="py-1">
            {LANGUAGES.map((l) => {
              const active = l.code === language;
              const pct = coverage(l.code);
              return (
                <li key={l.code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      setLanguage(l.code);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm
                      transition-colors hover:bg-ink-50 ${active ? "text-bis-700" : "text-ink-800"}`}
                  >
                    <span className="flex flex-col">
                      <span className="font-medium">{l.native}</span>
                      <span className="text-[11px] text-ink-400">{l.label}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      {pct < 100 && (
                        <span className="text-[10px] tabular-nums text-ink-400">{pct}%</span>
                      )}
                      {active && <Check className="h-4 w-4" aria-hidden />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="border-t border-ink-100 bg-ink-50/60 px-3 py-2 text-[11px] leading-relaxed text-ink-500">
            Dataset values (IS numbers, titles, sources) stay in their original form in every language.
          </p>
        </div>
      )}
    </div>
  );
}
