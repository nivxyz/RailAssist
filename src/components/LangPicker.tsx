"use client";

import { LANGUAGES } from "@/lib/i18n";
import type { LangCode } from "@/lib/types";

export function LangPicker({ lang, onChange, label }: { lang: LangCode; onChange: (l: LangCode) => void; label: string }) {
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{label}</span>
      <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-2.5 h-4 w-4 text-brand-700" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" />
      </svg>
      <select
        value={lang}
        onChange={(e) => onChange(e.target.value as LangCode)}
        className="appearance-none rounded-full border border-line bg-card py-2 pl-8 pr-8 text-base font-semibold text-brand-900 shadow-sm outline-none focus-visible:ring-4 focus-visible:ring-accent-500/30"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.native}
          </option>
        ))}
      </select>
      <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-2.5 h-4 w-4 text-brand-700" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
        <path d="M6 9l6 6 6-6" />
      </svg>
    </label>
  );
}
