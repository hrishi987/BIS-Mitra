import { ShieldAlert } from "lucide-react";

import { Brand } from "./Brand";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-ink-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xl">
            <Brand compact />
            <p className="mt-3 text-sm leading-relaxed text-ink-600">
              BIS Mitra is an explanation and navigation layer for Indian Standards. It is not an
              official BIS service, and nothing it produces is an official BIS decision.
            </p>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-bis-200 bg-bis-50/60 px-4 py-3 md:max-w-sm">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-bis-700" aria-hidden />
            <p className="text-xs leading-relaxed text-ink-700">
              <span className="font-semibold text-bis-800">Prototype dataset.</span> Content comes
              from the supplied seed workbook. Clause, page, licence numbers and live statuses are
              intentionally absent where the workbook did not supply them.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t border-ink-100 pt-5 text-xs text-ink-500 sm:flex-row sm:items-center sm:justify-between">
          <span>BIS Mitra — powered by structured BIS knowledge and evidence.</span>
          <span>Smart India Hackathon prototype · Not affiliated with BIS.</span>
        </div>
      </div>
    </footer>
  );
}
