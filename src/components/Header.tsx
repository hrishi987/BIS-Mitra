"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Sparkles, X } from "lucide-react";

import { Brand } from "./Brand";
import { LanguageSelector } from "./LanguageSelector";
import { ModeSwitcher } from "./ModeSwitcher";
import { t, type PhraseKey } from "@/lib/i18n";
import { useSession } from "@/lib/store";

const NAV = [
  { href: "/", key: "nav.dashboard" },
  { href: "/standards", key: "nav.standards" },
  { href: "/sources", key: "nav.sources" },
] as const;

const MOBILE_NAV = [...NAV, { href: "/ask", key: "nav.ask" }] as const;

export function Header() {
  const pathname = usePathname();
  const { language } = useSession();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200/80 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Brand />

        <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV.map(({ href, key }) => (
            <Link
              key={href}
              href={href}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive(href)
                  ? "bg-bis-50 text-bis-800"
                  : "text-ink-600 hover:bg-ink-100 hover:text-ink-900"
              }`}
            >
              {t(key as PhraseKey, language)}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          <ModeSwitcher className="hidden sm:inline-flex" />
          <LanguageSelector />

          <Link
            href="/ask"
            className="hidden whitespace-nowrap items-center gap-1.5 rounded-lg bg-bis-700 px-3 py-2
              text-xs font-semibold text-white transition-colors hover:bg-bis-800 md:inline-flex"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {t("nav.ask" as PhraseKey, language)}
          </Link>

          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200
              text-ink-600 lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-ink-200 bg-white px-4 py-3 lg:hidden animate-fade-in">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {MOBILE_NAV.map(({ href, key }) => (
              <Link
                key={href}
                href={href}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium ${
                  isActive(href) ? "bg-bis-50 text-bis-800" : "text-ink-700 hover:bg-ink-50"
                }`}
              >
                {t(key as PhraseKey, language)}
              </Link>
            ))}
            <div className="mt-2 border-t border-ink-100 pt-3">
              <ModeSwitcher />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
