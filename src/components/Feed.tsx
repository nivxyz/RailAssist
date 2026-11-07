"use client";

import { needLabel, t } from "@/lib/i18n";
import { fmtTime } from "@/lib/time";
import type { FeedItem, LangCode } from "@/lib/types";
import { AlertIcon, BellIcon, CheckIcon, PinIcon, TrainIcon } from "./Icons";
import { LogoMark } from "./Logo";

export function feedText(item: FeedItem, lang: LangCode): string {
  const needs = (item.needs ?? []).map((n) => needLabel(lang, n));
  const params: Record<string, string | number> = { ...item.params };
  if (item.key === "feedConfirmed") params.needs = needs.join(", ") || needLabel(lang, "other");
  if (item.key === "feedDelay") {
    params.need = needs[0] ?? needLabel(lang, "other");
    params.time = fmtTime(Number(item.params.time));
  }
  return t(lang, item.key, params);
}

const STYLE: Record<FeedItem["key"], { icon: React.ReactNode; tone: string }> = {
  feedSent: { icon: <BellIcon className="h-4 w-4" />, tone: "bg-brand-100 text-brand-800" },
  feedConfirmed: { icon: <CheckIcon className="h-4 w-4" />, tone: "bg-ok-100 text-ok-700" },
  feedBoarded: { icon: <TrainIcon className="h-4 w-4" />, tone: "bg-brand-100 text-brand-800" },
  feedDeparted: { icon: <TrainIcon className="h-4 w-4" />, tone: "bg-brand-100 text-brand-800" },
  feedDelay: { icon: <AlertIcon className="h-4 w-4" />, tone: "bg-accent-100 text-accent-600" },
  feedArrived: { icon: <PinIcon className="h-4 w-4" />, tone: "bg-brand-100 text-brand-800" },
  feedPickedUp: { icon: <CheckIcon className="h-4 w-4" />, tone: "bg-ok-100 text-ok-700" },
};

export function Feed({ items, lang, big = false }: { items: FeedItem[]; lang: LangCode; big?: boolean }) {
  if (!items.length)
    return (
      <div className="rounded-2xl border border-dashed border-line bg-white/60 px-4 py-10 text-center text-base text-muted">
        {t(lang, "noUpdates")}
      </div>
    );
  return (
    <ul className="space-y-2.5">
      {[...items].reverse().map((item) => {
        const st = STYLE[item.key];
        return (
          <li key={item.id} className="anim-slide-in flex gap-3 rounded-2xl border border-line bg-white p-3 shadow-[0_1px_2px_rgba(32,27,23,0.06)]">
            <div className="shrink-0">
              <LogoMark size={big ? 40 : 34} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2 text-xs font-semibold text-muted">
                <span>RailAssist</span>
                <span className="tabular-nums">{fmtTime(item.simTime)}</span>
              </div>
              <div className="mt-0.5 flex items-start gap-2">
                <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${st.tone}`}>{st.icon}</span>
                <p className={`${big ? "text-lg" : "text-base"} font-semibold leading-snug text-ink`}>{feedText(item, lang)}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
