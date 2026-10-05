"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Factory, UserRound } from "lucide-react";

import { t, type PhraseKey } from "@/lib/i18n";
import { useSession } from "@/lib/store";

const MODES = [
  { href: "/industry", key: "nav.industry", Icon: Factory },
  { href: "/consumer", key: "nav.consumer", Icon: UserRound },
] as const;

export function ModeSwitcher({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const { language } = useSession();

  return (
    <div
      className={`inline-flex items-center rounded-lg border border-ink-200 bg-ink-50/70 p-0.5 ${className}`}
      role="tablist"
      aria-label="Assistant mode"
    >
      {MODES.map(({ href, key, Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            role="tab"
            aria-selected={active}
            className={`inline-flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-xs font-semibold
              transition-all duration-150 ${
                active
                  ? "bg-white text-bis-700 shadow-sm ring-1 ring-ink-200"
                  : "text-ink-600 hover:text-ink-900"
              }`}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {t(key as PhraseKey, language)}
          </Link>
        );
      })}
    </div>
  );
}
