"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import { fmtTime } from "@/lib/time";
import type { DelayEvent, LangCode } from "@/lib/types";
import { AlertIcon } from "../Icons";

export function DelayAlert({ delay, lang }: { delay: DelayEvent | null; lang: LangCode }) {
  const [dismissed, setDismissed] = useState<number | null>(null);
  if (!delay || dismissed === delay.ts) return null;
  return (
    <div className="pointer-events-none absolute inset-x-3 top-[72px] z-40 sm:top-[92px]">
      <div key={delay.ts} role="alert" className="anim-slide-down pointer-events-auto rounded-2xl bg-accent-500 p-4 text-white">
        <div className="flex gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/20">
            <AlertIcon className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-xl font-bold leading-tight">{t(lang, "delayTitle", { min: delay.minutes })}</div>
            <p className="mt-1 text-base font-semibold leading-snug text-white/95">
              {t(lang, "delayBody", { station: delay.stationName, time: fmtTime(delay.newTime) })}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(delay.ts)}
          className="mt-3 w-full rounded-2xl bg-white py-2.5 text-lg font-bold text-accent-600 transition active:scale-[0.98]"
        >
          {t(lang, "ok")}
        </button>
      </div>
    </div>
  );
}
