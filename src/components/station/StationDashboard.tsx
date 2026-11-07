"use client";

import { useState } from "react";
import { useNow } from "../useNow";
import { acceptRequest, completeRequest } from "@/lib/actions";
import { needLabel } from "@/lib/i18n";
import { useShared } from "@/lib/store";
import { fmtTime } from "@/lib/time";
import type { SharedState, StationRequest } from "@/lib/types";
import { DemoControls } from "../DemoControls";
import { AlertIcon, CheckIcon, ClockIcon, NeedIcon, TrainIcon } from "../Icons";
import { Logo } from "../Logo";
import { LateChip, TrainProgressBar, positionText } from "../TripTracker";

const ALL = "__all";

export function StationDashboard() {
  const s = useShared();
  const [desk, setDesk] = useState(ALL);
  const now = useNow();

  const visible = s.requests.filter((r) => r.status !== "planned");
  const desks = [...new Map(visible.map((r) => [r.stationCode, r.stationName])).entries()];
  const shown = visible
    .filter((r) => desk === ALL || r.stationCode === desk)
    .sort((a, b) => a.expectedTime - b.expectedTime);

  const counts = {
    waiting: visible.filter((r) => r.status === "sent").length,
    confirmed: visible.filter((r) => r.status === "confirmed").length,
    done: visible.filter((r) => r.status === "done").length,
  };

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white px-6 py-4">
        <Logo size={40} sub="Station Assistance Desk" />
        <div className="flex items-center gap-3">
          <select
            value={desk}
            onChange={(e) => setDesk(e.target.value)}
            className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-ink outline-none focus-visible:ring-4 focus-visible:ring-brand-700/15"
            aria-label="Station desk"
          >
            <option value={ALL}>All station desks</option>
            {desks.map(([code, name]) => (
              <option key={code} value={code}>
                {name} ({code})
              </option>
            ))}
          </select>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-ok-700">
            <span className="anim-blink h-2 w-2 rounded-full bg-ok-600" />
            Live
          </span>
          <span className="rounded-md border border-line px-2 py-0.5 text-xs font-semibold text-muted">Demo data</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Waiting for staff" value={counts.waiting} tone="text-brand-800" />
            <Stat label="Confirmed" value={counts.confirmed} tone="text-ok-700" />
            <Stat label="Completed" value={counts.done} tone="text-muted" />
          </div>
          <TrainPanel s={s} />
        </div>

        <h2 className="mb-3 mt-7 flex items-center gap-2 text-lg font-bold text-brand-900">
          Assistance requests
          <span className="rounded-full bg-brand-100 px-2 py-0.5 text-sm text-brand-800">{shown.length}</span>
        </h2>

        {shown.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-line bg-white px-6 py-16 text-center">
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-700">
              <ClockIcon className="h-7 w-7" />
            </div>
            <div className="text-lg font-bold text-brand-900">Waiting for new requests…</div>
            <p className="mt-1 text-muted">Requests from passengers appear here live.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {shown.map((r) => (
              <RequestRow key={r.id} r={r} s={s} now={now} />
            ))}
          </div>
        )}
      </main>
      <DemoControls />
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white px-4 py-3 shadow-sm">
      <div className="text-sm font-semibold text-muted">{label}</div>
      <div key={value} className={`anim-pop text-3xl font-bold tabular-nums ${tone}`}>
        {value}
      </div>
    </div>
  );
}

function TrainPanel({ s }: { s: SharedState }) {
  if (!s.trip)
    return <div className="rounded-2xl border border-line bg-white px-4 py-3 text-sm text-muted shadow-sm">No train selected yet.</div>;
  const last = s.trip.stops.length - 1;
  return (
    <div className="rounded-2xl border border-line bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-bold text-brand-900">
          <TrainIcon className="h-5 w-5 text-brand-700" />
          {s.trip.trainNo} {s.trip.trainName}
        </div>
        <LateChip minutes={s.stopDelay[last] ?? 0} lang="en" />
      </div>
      <div className="mt-1 text-sm text-muted">{positionText(s, "en")}</div>
      <div className="mt-1">
        <TrainProgressBar s={s} />
      </div>
    </div>
  );
}

function RequestRow({ r, s, now }: { r: StationRequest; s: SharedState; now: number }) {
  const trip = s.trip;
  const changed = r.prevTime != null && r.prevTime !== r.expectedTime;
  const flashing = !!r.changedAt && now > 0 && now - r.changedAt < 6000;
  const roleLabel = r.role === "boarding" ? "Boarding" : r.role === "arrival" ? "Arrival" : "En route";
  const timeLabel = r.role === "boarding" ? "Meet passenger at" : "Train arrives";

  return (
    <div
      key={r.changedAt ?? "row"}
      className={`anim-slide-in grid items-center gap-4 rounded-2xl border bg-white p-4 shadow-sm md:grid-cols-[170px_1fr_auto] ${
        flashing ? "anim-flash border-accent-500" : r.status === "sent" ? "border-brand-700/40" : "border-line"
      }`}
    >
      <div className={`rounded-2xl px-4 py-3 ${changed ? "bg-accent-50" : "bg-brand-50"}`}>
        <div className="text-xs font-bold text-muted">{timeLabel}</div>
        {changed && <div className="text-sm font-semibold text-muted line-through tabular-nums">{fmtTime(r.prevTime!)}</div>}
        <div className={`text-2xl font-bold tabular-nums ${changed ? "text-accent-600" : "text-brand-900"}`}>{fmtTime(r.expectedTime)}</div>
        {changed && (
          <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-accent-500 px-2 py-0.5 text-xs font-bold text-white">
            <AlertIcon className="h-3.5 w-3.5" />
            Updated +{r.expectedTime - r.prevTime!} min
          </div>
        )}
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xl font-bold text-brand-900">{trip?.passenger.name}</span>
          <span className="text-sm font-semibold text-muted">Age {trip?.passenger.age}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${r.role === "arrival" ? "bg-accent-100 text-accent-600" : "bg-brand-100 text-brand-800"}`}>
            {roleLabel} · {r.stationName}
          </span>
        </div>
        <div className="mt-0.5 text-sm text-muted">
          {trip?.trainNo} {trip?.trainName} · Coach <b className="text-ink">{trip?.coach}</b> · Berth <b className="text-ink">{trip?.berth}</b> · PNR {trip?.pnr}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {r.needs.map((n, i) => (
            <span key={n.type + i} className="inline-flex items-center gap-1.5 rounded-full bg-accent-50 px-2.5 py-1 text-sm font-bold text-accent-600 ring-1 ring-accent-500/20">
              <NeedIcon type={n.type} className="h-4 w-4" />
              {needLabel("en", n.type)}
            </span>
          ))}
        </div>
        {s.transcript && <p className="mt-2 line-clamp-2 text-sm italic text-muted">“{s.transcript}”</p>}
      </div>

      <div className="flex flex-col items-stretch gap-2 md:w-44">
        {r.status === "sent" && (
          <button
            type="button"
            onClick={() => acceptRequest(r.id)}
            className="rounded-2xl bg-ok-600 px-4 py-3 text-lg font-bold text-white transition hover:bg-ok-700 active:scale-[0.97]"
          >
            Accept
          </button>
        )}
        {r.status === "confirmed" && (
          <>
            <span className="anim-pop inline-flex items-center justify-center gap-1.5 rounded-full bg-ok-100 px-3 py-1.5 text-sm font-bold text-ok-700">
              <CheckIcon className="h-4 w-4" /> Confirmed
            </span>
            {r.role !== "enroute" && (
              <button
                type="button"
                onClick={() => completeRequest(r.id)}
                className="rounded-2xl border-2 border-brand-800 px-3 py-2 text-sm font-bold text-brand-800 transition hover:bg-brand-50"
              >
                {r.role === "boarding" ? "Mark boarded" : "Mark picked up"}
              </button>
            )}
          </>
        )}
        {r.status === "done" && (
          <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-paper px-3 py-1.5 text-sm font-bold text-muted ring-1 ring-line">
            <CheckIcon className="h-4 w-4" /> Completed
          </span>
        )}
      </div>
    </div>
  );
}
