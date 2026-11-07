import { t } from "@/lib/i18n";
import type { LangCode } from "@/lib/types";

export function StepHeader({ n, lang, title, hint }: { n: number; lang: LangCode; title: string; hint?: string }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((i) => (
          <span key={i} className={`h-1.5 rounded-full transition-all ${i <= n ? "w-8 bg-accent-500" : "w-4 bg-brand-100"}`} />
        ))}
        <span className="ml-1 text-sm font-semibold text-muted">{t(lang, "stepOf", { n })}</span>
      </div>
      <h1 className="mt-3 text-[28px] font-bold leading-tight text-brand-900">{title}</h1>
      {hint && <p className="mt-1.5 text-lg text-muted">{hint}</p>}
    </div>
  );
}
