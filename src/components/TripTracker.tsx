"use client";

import { t, needLabel } from "@/lib/i18n";
import { fmtTime } from "@/lib/time";
import type { LangCode, SharedState } from "@/lib/types";
import { NeedIcon, TrainIcon } from "./Icons";

export function positionText(s: SharedState, lang: LangCode): string {
  const trip = s.trip;
  if (!trip) return "";
  const i = Math.floor(s.pos);
  const last = trip.stops.length - 1;
  if (s.pos === 0) return t(lang, "notStarted", { station: trip.stops[0].name });
  if (s.pos === last) return t(lang, "reached", { station: trip.stops[last].name });
  if (s.pos === i) return t(lang, "atStation", { station: trip.stops[i].name });
  return t(lang, "between", { a: trip.stops[i].name, b: trip.stops[i + 1].name });
}

export function LateChip({ minutes, lang, size = "md" }: { minutes: number; lang: LangCode; size?: "md" | "lg" }) {
  const pad = `whitespace-nowrap ${size === "lg" ? "px-3 py-1.5 text-base" : "px-2.5 py-1 text-sm"}`;
  if (minutes > 0)
    return (
      <span key={minutes} className={`anim-pop inline-flex items-center gap-1.5 rounded-full bg-accent-100 font-bold text-accent-600 ${pad}`}>
        <span className="h-2 w-2 rounded-full bg-accent-500" />
        {t(lang, "lateBy", { min: minutes })}
      </span>
    );
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-ok-100 font-bold text-ok-700 ${pad}`}>
      <span className="h-2 w-2 rounded-full bg-ok-600" />
      {t(lang, "onTime")}
    </span>
  );
}

/** Small horizontal progress bar (family view, station header). */
export function TrainProgressBar({ s }: { s: SharedState }) {
  const trip = s.trip;
  if (!trip) return null;
  const last = trip.stops.length - 1;
  const pct = (s.pos / last) * 100;
  return (
    <div className="relative mx-3 h-10">
      <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-brand-100" />
      <div className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-brand-800 transition-all duration-1000 ease-out" style={{ width: `${pct}%` }} />
      {trip.stops.map((st, i) => (
        <div
          key={st.code}
          className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${i <= s.pos ? "border-brand-800 bg-brand-800" : "border-brand-100 bg-white"}`}
          style={{ left: `${(i / last) * 100}%` }}
        />
      ))}
      <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ease-out" style={{ left: `${pct}%` }}>
        <div className="grid h-9 w-9 place-items-center rounded-full bg-accent-500 text-white shadow-lg ring-4 ring-white">
          <TrainIcon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

/** Full vertical timeline for the passenger app. */
export function TripTracker({ s, lang }: { s: SharedState; lang: LangCode }) {
  const trip = s.trip;
  if (!trip) return null;
  const last = trip.stops.length - 1;
  const delay = s.stopDelay[last] ?? 0;

  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="text-lg font-bold text-brand-900">{t(lang, "liveTrain")}</div>
        <LateChip minutes={delay} lang={lang} />
      </div>
      <div className="mb-4 rounded-xl bg-brand-50 px-3 py-2.5 text-base font-semibold text-brand-900">{positionText(s, lang)}</div>

      <ol className="relative">
        {trip.stops.map((st, i) => {
          const passed = i < s.pos;
          const here = i === s.pos;
          const sched = i === 0 ? st.dep : st.arr;
          const extra = s.stopDelay[i] ?? 0;
          const req = s.requests.find((r) => r.stopIndex === i);
          const between = s.pos > i && s.pos < i + 1;
          return (
            <li key={st.code} className="relative flex gap-3 pb-6 last:pb-0">
              {i < last && (
                <span className={`absolute left-[11px] top-6 h-full w-[3px] rounded ${passed ? "bg-brand-800" : "bg-brand-100"}`} />
              )}
              {between && (
                <span
                  className="absolute left-[2px] z-10 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full bg-accent-500 text-white shadow ring-2 ring-white anim-pop"
                  style={{ top: "calc((100% + 26px) / 2)" }}
                >
                  <TrainIcon className="h-3 w-3" />
                </span>
              )}
              <span
                className={`relative z-[1] mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border-[3px] ${
                  here
                    ? "border-accent-500 bg-accent-500 ring-4 ring-accent-100"
                    : passed
                      ? "border-brand-800 bg-brand-800"
                      : "border-brand-100 bg-white"
                }`}
              >
                {here && <TrainIcon className="relative h-3.5 w-3.5 text-white" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className={`truncate text-base ${i === 0 || i === last ? "font-bold text-ink" : "font-medium text-muted"}`}>{st.name}</span>
                  <span className="shrink-0 text-right tabular-nums">
                    {extra > 0 && !passed ? (
                      <>
                        <span className="mr-1.5 text-sm text-muted line-through">{fmtTime(sched ?? 0)}</span>
                        <span key={extra} className="anim-pop inline-block font-bold text-accent-600">{fmtTime((sched ?? 0) + extra)}</span>
                      </>
                    ) : (
                      <span className="font-semibold text-ink">{fmtTime((sched ?? 0) + (passed ? extra : 0))}</span>
                    )}
                  </span>
                </div>
                {req && (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {req.needs.map((n) => (
                      <span key={n.type + n.title} className="inline-flex items-center gap-1 rounded-full bg-accent-50 px-2 py-0.5 text-xs font-semibold text-accent-600">
                        <NeedIcon type={n.type} className="h-3.5 w-3.5" />
                        {needLabel(lang, n.type)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <div className="mt-3 text-right text-xs font-medium text-muted">{t(lang, "demoData")}</div>
    </div>
  );
}
