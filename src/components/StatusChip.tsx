import { t } from "@/lib/i18n";
import type { LangCode, RequestStatus } from "@/lib/types";
import { CheckIcon } from "./Icons";

export function StatusChip({ status, lang }: { status: RequestStatus; lang: LangCode }) {
  if (status === "planned")
    return <span className="inline-flex items-center rounded-full bg-paper px-3 py-1 text-sm font-bold text-muted ring-1 ring-line">{t(lang, "statusPlanned")}</span>;
  if (status === "sent")
    return (
      <span key="sent" className="anim-pop inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-sm font-bold text-brand-800">
        <span className="anim-blink h-2 w-2 rounded-full bg-brand-700" />
        {t(lang, "statusSent")}
      </span>
    );
  return (
    <span key={status} className="anim-pop inline-flex items-center gap-1.5 rounded-full bg-ok-600 px-3 py-1 text-sm font-bold text-white">
      <CheckIcon className="h-4 w-4" />
      {t(lang, status === "done" ? "statusDone" : "statusConfirmed")}
    </span>
  );
}
