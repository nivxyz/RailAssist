"use client";

import { BOARDING_HELP_LEAD_MINUTES, DEMO_DELAY_MINUTES } from "./config";
import { needLabel, t } from "./i18n";
import { INITIAL_STATE, setState } from "./store";
import type { FeedItem, Plan, SharedState, StationRequest, Trip } from "./types";

const uid = () => Math.random().toString(36).slice(2, 10);

function stopTime(trip: Trip, i: number, delay: number[]): number {
  const s = trip.stops[i];
  return (s.dep ?? s.arr ?? 0) + (delay[i] ?? 0);
}

/** Help time for a request at stop i. */
export function helpTime(trip: Trip, i: number, delay: number[]): number {
  const s = trip.stops[i];
  const d = delay[i] ?? 0;
  if (i === 0) return (s.dep ?? 0) - BOARDING_HELP_LEAD_MINUTES + d;
  return (s.arr ?? s.dep ?? 0) + d;
}

/** Current trip clock based on train position. */
export function simTime(s: SharedState): number {
  const trip = s.trip;
  if (!trip) return 0;
  const i = Math.floor(s.pos);
  if (s.pos === i) {
    if (i === 0 && !s.boarded) return helpTime(trip, 0, s.stopDelay);
    const st = trip.stops[i];
    return (i === trip.stops.length - 1 ? st.arr ?? 0 : st.dep ?? st.arr ?? 0) + (s.stopDelay[i] ?? 0);
  }
  const a = stopTime(trip, i, s.stopDelay);
  const b = (trip.stops[i + 1].arr ?? 0) + (s.stopDelay[i + 1] ?? 0);
  return Math.round((a + b) / 2);
}

function feed(s: SharedState, item: Omit<FeedItem, "id" | "ts" | "simTime">): FeedItem[] {
  return [...s.feed, { ...item, id: uid(), ts: Date.now(), simTime: simTime(s) }];
}

export function loadTrip(trip: Trip) {
  setState(() => ({
    ...INITIAL_STATE,
    trip,
    stopDelay: trip.stops.map(() => 0),
  }));
}

export function setTranscript(transcript: string) {
  setState((s) => ({ ...s, transcript }));
}

export function applyPlan(plan: Plan) {
  setState((s) => {
    const trip = s.trip;
    if (!trip) return s;
    const requests: StationRequest[] = plan.stations.map((st) => {
      const idx = trip.stops.findIndex((x) => x.code === st.stationCode);
      const time = helpTime(trip, idx, s.stopDelay);
      return {
        id: uid(),
        stopIndex: idx,
        stationCode: st.stationCode,
        stationName: trip.stops[idx].name,
        role: st.role,
        needs: st.needs,
        status: "planned",
        schedTime: time,
        expectedTime: time,
      };
    });
    return { ...s, plan, requests };
  });
}

/**
 * Swap the plan's text into another language without touching request
 * status or times (used when the passenger changes language).
 */
export function relocalizePlan(next: Plan) {
  setState((s) => {
    if (!s.plan) return s;
    const requests = s.requests.map((r) => {
      const st = next.stations.find((x) => x.stationCode === r.stationCode);
      return {
        ...r,
        needs: r.needs.map((n) => {
          const m = st?.needs.find((x) => x.type === n.type);
          return m
            ? { ...n, title: m.title, instruction: m.instruction }
            : { ...n, title: needLabel(next.lang, n.type), instruction: t(next.lang, "genericInstruction") };
        }),
      };
    });
    return { ...s, plan: { ...s.plan, summary: next.summary, lang: next.lang }, requests };
  });
}

export function sendRequests() {
  setState((s) => {
    if (!s.requests.some((r) => r.status === "planned")) return s;
    return {
      ...s,
      requests: s.requests.map((r) => (r.status === "planned" ? { ...r, status: "sent" } : r)),
      feed: feed(s, { key: "feedSent", params: { stations: s.requests.map((r) => r.stationName).join(", ") } }),
    };
  });
}

export function acceptRequest(id: string) {
  setState((s) => {
    const r = s.requests.find((x) => x.id === id);
    if (!r || r.status !== "sent") return s;
    return {
      ...s,
      requests: s.requests.map((x) => (x.id === id ? { ...x, status: "confirmed" } : x)),
      feed: feed(s, { key: "feedConfirmed", params: { station: r.stationName }, needs: r.needs.map((n) => n.type) }),
    };
  });
}

/** Staff marks a confirmed request as done (boarded / picked up). */
export function completeRequest(id: string) {
  setState((s) => {
    const r = s.requests.find((x) => x.id === id);
    if (!r || !s.trip || r.status === "done") return s;
    const requests = s.requests.map((x) => (x.id === id ? { ...x, status: "done" as const } : x));
    if (r.role === "boarding") {
      if (s.boarded) return { ...s, requests };
      return {
        ...s,
        requests,
        boarded: true,
        feed: feed(s, { key: "feedBoarded", params: { station: r.stationName, coach: s.trip.coach } }),
      };
    }
    if (r.role === "arrival") {
      return { ...s, requests, feed: feed(s, { key: "feedPickedUp", params: { station: r.stationName } }) };
    }
    return { ...s, requests };
  });
}

/** Demo: move the train half a step (depart / arrive). */
export function advanceTrain() {
  setState((s) => {
    const trip = s.trip;
    if (!trip) return s;
    const last = trip.stops.length - 1;
    if (s.pos >= last) return s;
    let next: SharedState = { ...s };
    if (s.pos === 0) {
      // Leaving the first station: make sure the passenger is marked boarded.
      if (!s.boarded) {
        next = {
          ...next,
          boarded: true,
          requests: next.requests.map((r) => (r.role === "boarding" && r.status !== "planned" ? { ...r, status: "done" } : r)),
          feed: feed(next, { key: "feedBoarded", params: { station: trip.stops[0].name, coach: trip.coach } }),
        };
      }
      // Log the departure at the departure time, then move the train.
      next = { ...next, boarded: true };
      next = { ...next, feed: feed(next, { key: "feedDeparted", params: { station: trip.stops[0].name } }) };
      return { ...next, pos: 0.5 };
    }
    next.pos = s.pos + 0.5;
    if (next.pos === last) {
      next = { ...next, feed: feed(next, { key: "feedArrived", params: { station: trip.stops[last].name } }) };
    }
    return next;
  });
}

/** Demo: add a delay to every stop the train has not reached yet. */
export function addDelay(minutes = DEMO_DELAY_MINUTES) {
  setState((s) => {
    const trip = s.trip;
    if (!trip) return s;
    const last = trip.stops.length - 1;
    const from = Math.floor(s.pos) + 1;
    if (from > last) return s;
    const stopDelay = trip.stops.map((_, i) => (s.stopDelay[i] ?? 0) + (i >= from ? minutes : 0));
    const now = Date.now();
    const requests = s.requests.map((r) => {
      if (r.stopIndex < from) return r;
      return { ...r, prevTime: r.expectedTime, expectedTime: helpTime(trip, r.stopIndex, stopDelay), changedAt: now };
    });
    const arrivalReq = requests.find((r) => r.stopIndex === last);
    const newTime = arrivalReq?.expectedTime ?? helpTime(trip, last, stopDelay);
    const needType = arrivalReq?.needs[0]?.type ?? null;
    const next: SharedState = {
      ...s,
      stopDelay,
      requests,
      lastDelay: { minutes: stopDelay[last], stationName: trip.stops[last].name, needType, newTime, ts: now },
    };
    return {
      ...next,
      feed: feed(next, { key: "feedDelay", params: { min: stopDelay[last], time: newTime }, needs: needType ? [needType] : [] }),
    };
  });
}

export function resetDemo() {
  setState(() => INITIAL_STATE);
}

/** Restart the trip but keep the same PNR (handy between takes). */
export function restartTrip() {
  setState((s) => (s.trip ? { ...INITIAL_STATE, trip: s.trip, stopDelay: s.trip.stops.map(() => 0) } : INITIAL_STATE));
}
