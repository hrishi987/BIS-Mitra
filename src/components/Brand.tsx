import Link from "next/link";

export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-md bg-bis-700 text-white shadow-sm"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24" fill="none">
        <path
          d="M4 20h16M6 20V9.5L12 5l6 4.5V20M9.5 20v-5h5v5"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label="BIS Mitra home">
      <BrandMark />
      <span className="flex flex-col leading-none">
        <span className="text-[15px] font-bold tracking-tight text-ink-950 group-hover:text-bis-700">
          BIS MITRA
        </span>
        {!compact && (
          <span className="mt-0.5 hidden whitespace-nowrap text-[11px] font-medium text-ink-500 xl:block">
            Indian Standards intelligence, made understandable.
          </span>
        )}
      </span>
    </Link>
  );
}
