"use client";

import { useEffect, useRef, useState } from "react";
import { relocalizePlan, restartTrip, resetDemo, sendRequests } from "@/lib/actions";
import { type ContactOption, contactHref, contactsFor } from "@/lib/contacts";
import { needLabel, t } from "@/lib/i18n";
import { offlinePlan } from "@/lib/plan";
import { fmtTime } from "@/lib/time";
import type { LangCode, Plan, SharedState, StationRequest } from "@/lib/types";
import { Feed } from "../Feed";
import { HeartIcon, LinkIcon, ListIcon, NeedIcon, PhoneIcon, PinIcon, TrainIcon } from "../Icons";
import { StatusChip } from "../StatusChip";
import { TripTracker } from "../TripTracker";
import { StepHeader } from "./StepHeader";
import { useNow } from "../useNow";
import { TripCard } from "./TripCard";

type Tab = "help" | "trip" | "family";

export function PlanView({ s, lang }: { s: SharedState; lang: LangCode }) {
  const [tab, setTab] = useState<Tab>("help");
  const plan = s.plan!;
  const trip = s.trip!;
  const anyPlanned = s.requests.some((r) => r.status === "planned");
  const allConfirmed = s.requests.length > 0 && s.requests.every((r) => r.status === "confirmed" || r.status === "done");
  const stale = plan.lang !== lang;

  // The plan text is written in the language it was made in. When the
  // passenger switches language, re-make the text in the new language.
  const inFlight = useRef<LangCode | null>(null);
  useEffect(() => {
    if (plan.lang === lang) {
      inFlight.current = null; // drop any late reply for a language we left
      return;
    }
    if (inFlight.current === lang) return;
    inFlight.current = lang;
    const transcript = s.transcript;
    const done = (p: Plan) => {
      if (inFlight.current !== lang) return; // language changed again meanwhile
      relocalizePlan(p);
      inFlight.current = null;
    };
    if (plan.source === "offline" || !transcript) {
      done(offlinePlan(transcript, trip, lang));
      return;
    }
    fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript, pnr: trip.pnr, lang }),
    })
      .then((res) => res.json() as Promise<{ plan?: Plan }>)
      .then((data) => done(data.plan ?? offlinePlan(transcript, trip, lang)))
      .catch(() => done(offlinePlan(transcript, trip, lang)));
  }, [lang, plan.lang, plan.source, s.transcript, trip]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="scroll-quiet min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-4">
        {tab === "help" && (
          <div key="help" className="anim-fade-up">
            <StepHeader n={3} lang={lang} title={t(lang, "yourPlan")} />
            {stale ? (
              <p className="anim-blink mt-2 text-lg leading-snug text-muted">{t(lang, "planning")}</p>
            ) : (
              <>
                {plan.summary && <p className="mt-2 text-lg leading-snug text-ink">{plan.summary}</p>}
                {plan.source === "offline" && plan.summary !== t(lang, "offlinePlan") && (
                  <p className="mt-1 text-sm text-muted">{t(lang, "offlinePlan")}</p>
                )}
              </>
            )}

            <div className="mt-4 space-y-3">
              {s.requests.map((r, i) => (
                <StationCard key={r.id} r={r} lang={lang} index={i} stale={stale} />
              ))}
            </div>

            <p className="mt-5 border-l-[3px] border-accent-500 pl-3 text-[15px] leading-snug text-muted">{t(lang, "futureNote")}</p>

            {anyPlanned ? (
              <button
                type="button"
                onClick={sendRequests}
                className="mt-4 w-full rounded-2xl bg-accent-500 py-4 text-xl font-bold text-white transition hover:bg-accent-600 active:scale-[0.98]"
              >
                {t(lang, "sendRequests")}
              </button>
            ) : (
              <div className={`anim-fade-up mt-4 rounded-2xl px-4 py-3 text-center text-lg font-bold ${allConfirmed ? "bg-ok-100 text-ok-700" : "bg-brand-100 text-brand-800"}`}>
                {allConfirmed ? t(lang, "allConfirmed") : t(lang, "requestsSent")}
              </div>
            )}

            <div className="mt-6 flex justify-center gap-6 text-sm font-semibold text-muted">
              <button type="button" onClick={restartTrip} className="hover:text-brand-900">
                {t(lang, "back")}
              </button>
              <button type="button" onClick={resetDemo} className="hover:text-brand-900">
                {t(lang, "startOver")}
              </button>
            </div>
          </div>
        )}

        {tab === "trip" && (
          <div key="trip" className="anim-fade-up space-y-4">
            <TripCard trip={trip} lang={lang} compact />
            <TripTracker s={s} lang={lang} />
          </div>
        )}

        {tab === "family" && (
          <div key="family" className="anim-fade-up">
            <h2 className="text-[26px] font-bold text-brand-900">{t(lang, "familyUpdates")}</h2>
            <p className="mb-4 mt-1 text-base text-muted">{t(lang, "familyHint")}</p>
            <Feed items={s.feed} lang={lang} />
          </div>
        )}
      </div>

      <nav className="grid shrink-0 grid-cols-3 border-t border-line bg-white px-2 pb-3 pt-2">
        <TabBtn active={tab === "help"} onClick={() => setTab("help")} icon={<ListIcon className="h-7 w-7" />} label={t(lang, "tabHelp")} />
        <TabBtn active={tab === "trip"} onClick={() => setTab("trip")} icon={<TrainIcon className="h-7 w-7" />} label={t(lang, "tabTrip")} />
        <TabBtn
          active={tab === "family"}
          onClick={() => setTab("family")}
          icon={<HeartIcon className="h-7 w-7" />}
          label={t(lang, "tabFamily")}
          badge={s.feed.length}
        />
      </nav>
    </div>
  );
}

function TabBtn({ active, onClick, icon, label, badge }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; badge?: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-col items-center gap-0.5 rounded-2xl py-1.5 text-sm font-bold transition ${active ? "bg-brand-50 text-brand-900" : "text-muted hover:text-brand-900"}`}
    >
      {icon}
      <span className="truncate">{label}</span>
      {!!badge && (
        <span key={badge} className="anim-pop absolute right-[22%] top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-accent-500 px-1 text-[11px] font-bold text-white">
          {badge}
        </span>
      )}
    </button>
  );
}

function StationCard({ r, lang, index, stale }: { r: StationRequest; lang: LangCode; index: number; stale: boolean }) {
  const roleKey = r.role === "boarding" ? "boarding" : r.role === "arrival" ? "arrival" : "onTheWay";
  const now = useNow();
  const recentlyChanged = !!r.changedAt && now > 0 && now - r.changedAt < 8000;
  // Needs with their own contacts show them inline; the rest share one block
  // (usually just the helpline) at the bottom of the card.
  const fallbackKey = JSON.stringify(contactsFor("other", ""));
  const all = r.needs.map((n) => contactsFor(n.type, r.stationCode));
  const perNeed = all.map((c) => (JSON.stringify(c) === fallbackKey ? null : c));
  const shared = all.some((c, i) => !perNeed[i] && c.length) ? contactsFor("other", "") : null;
  return (
    <div
      className={`anim-fade-up overflow-hidden rounded-2xl border bg-white shadow-sm ${r.status === "confirmed" || r.status === "done" ? "border-ok-600/40" : "border-line"}`}
      style={{ animationDelay: `${index * 120}ms` }}
    >
      <div className="px-4 pt-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className={`text-sm font-semibold ${r.role === "arrival" ? "text-accent-600" : "text-brand-700"}`}>{t(lang, roleKey)}</div>
          <StatusChip status={r.status} lang={lang} />
        </div>
        <div className="mt-1 text-xl font-bold leading-tight text-brand-900">{r.stationName}</div>
        <div
          key={r.changedAt ?? 0}
          className={`-mx-1 mt-1 inline-flex flex-wrap items-center gap-x-2 rounded-lg px-1 text-base font-semibold ${recentlyChanged ? "anim-flash" : ""}`}
        >
          {r.prevTime != null && r.prevTime !== r.expectedTime && <span className="whitespace-nowrap text-muted line-through">{fmtTime(r.prevTime)}</span>}
          <span className={`whitespace-nowrap ${r.prevTime != null && r.prevTime !== r.expectedTime ? "font-bold text-accent-600" : "text-ink"}`}>
            {t(lang, "helpAt", { time: fmtTime(r.expectedTime) })}
          </span>
        </div>
      </div>
      <ul className="mt-3 divide-y divide-line border-t border-line">
        {r.needs.map((n, j) => (
          <li key={n.type + j} className="anim-fade-up flex gap-3 px-4 py-3" style={{ animationDelay: `${index * 120 + (j + 1) * 90}ms` }}>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent-50 text-accent-600">
              <NeedIcon type={n.type} className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              {/* While re-translating, show the built-in label instead of old-language text. */}
              <div className="text-lg font-bold leading-tight text-ink">{stale ? needLabel(lang, n.type) : n.title || needLabel(lang, n.type)}</div>
              {stale ? (
                <div className="mt-1.5 h-4 w-4/5 animate-pulse rounded bg-brand-100" />
              ) : (
                <p className="mt-0.5 text-base leading-snug text-muted">{n.instruction}</p>
              )}
              {perNeed[j] && <GetIt contacts={perNeed[j]!} lang={lang} />}
            </div>
          </li>
        ))}
      </ul>
      {shared && (
        <div className="border-t border-line bg-brand-50/60 px-4 pb-4 pt-3">
          <div className="text-[15px] font-bold text-brand-900">{t(lang, "howToGet")}</div>
          <GetIt contacts={shared} lang={lang} />
        </div>
      )}
    </div>
  );
}

/** Call / open / ask-at actions so the passenger can arrange the help today. */
function GetIt({ contacts, lang }: { contacts: ContactOption[]; lang: LangCode }) {
  return (
    <div className="mt-2 space-y-2">
      {contacts.map((c) => {
        const href = contactHref(c);
        if (c.kind === "counter" || !href)
          return (
            <div key={c.kind + c.value} className="flex items-start gap-2 text-[15px] leading-snug text-ink">
              <PinIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" />
              <span>
                <span className="text-muted">{t(lang, "askAt")} </span>
                <b className="font-semibold">{c.i18nKey ? t(lang, c.i18nKey) : c.value}</b>
              </span>
            </div>
          );
        const isPhone = c.kind === "phone";
        return (
          <a
            key={c.kind + c.value}
            href={href}
            target={isPhone ? undefined : "_blank"}
            rel={isPhone ? undefined : "noopener noreferrer"}
            className="flex items-center gap-3 rounded-xl border-2 border-brand-800 bg-white px-3 py-2.5 text-brand-800 transition hover:bg-brand-50 active:scale-[0.98]"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-800 text-white">
              {isPhone ? <PhoneIcon className="h-5 w-5" /> : <LinkIcon className="h-5 w-5" />}
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block text-lg font-bold">{isPhone ? t(lang, "callNumber", { number: c.value }) : t(lang, "openLink")}</span>
              <span className="block truncate text-sm text-muted">{c.label}</span>
            </span>
          </a>
        );
      })}
    </div>
  );
}
