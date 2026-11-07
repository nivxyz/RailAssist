"use client";

import { useState } from "react";
import { loadTrip } from "@/lib/actions";
import { t } from "@/lib/i18n";
import { DEMO_PNRS, isValidPnr, lookupTrip } from "@/lib/trips";
import type { LangCode } from "@/lib/types";
import { StepHeader } from "./StepHeader";

export function PnrStep({ lang }: { lang: LangCode }) {
  const [pnr, setPnr] = useState("");
  const [error, setError] = useState(false);

  const submit = (value = pnr) => {
    const trip = lookupTrip(value);
    if (!trip) {
      setError(true);
      return;
    }
    loadTrip(trip);
  };

  return (
    <div className="anim-fade-up flex flex-1 flex-col px-5 pb-6 pt-4">
      <StepHeader n={1} lang={lang} title={t(lang, "enterPnr")} hint={t(lang, "pnrHint")} />

      <form
        className="mt-6"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <input
          inputMode="numeric"
          autoComplete="off"
          maxLength={10}
          value={pnr}
          onChange={(e) => {
            setPnr(e.target.value.replace(/\D/g, "").slice(0, 10));
            setError(false);
          }}
          placeholder="0000000000"
          aria-label={t(lang, "enterPnr")}
          className={`w-full rounded-2xl border-2 bg-white px-4 py-4 text-center font-mono text-3xl font-bold tracking-[0.18em] text-brand-900 outline-none transition placeholder:text-brand-100 focus:border-brand-700 focus:ring-4 focus:ring-brand-700/15 ${
            error ? "border-red-500" : "border-line"
          }`}
        />
        <div className="mt-2 h-6 text-center text-base font-semibold text-red-600">{error ? t(lang, "invalidPnr") : ""}</div>
        <button
          type="submit"
          disabled={!isValidPnr(pnr)}
          className="mt-2 w-full rounded-2xl bg-brand-800 py-4 text-xl font-bold text-white transition active:scale-[0.98] disabled:bg-brand-100 disabled:text-brand-700/50 disabled:shadow-none"
        >
          {t(lang, "findTrip")}
        </button>
      </form>

      <div className="mt-auto pt-8">
        <div className="mb-2 flex items-center gap-2 text-sm font-bold text-muted">
          {t(lang, "tryDemo")}
          <span className="rounded-full bg-accent-100 px-2 py-0.5 text-[11px] text-accent-600">{t(lang, "demoData")}</span>
        </div>
        <div className="space-y-2">
          {DEMO_PNRS.map((d) => (
            <button
              key={d.pnr}
              type="button"
              onClick={() => {
                setPnr(d.pnr);
                submit(d.pnr);
              }}
              className="flex w-full items-center justify-between rounded-2xl border border-line bg-white px-4 py-3 text-left transition hover:border-brand-700 hover:bg-brand-50"
            >
              <span className="text-base font-semibold text-ink">{d.label}</span>
              <span className="font-mono text-sm text-muted">{d.pnr}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
