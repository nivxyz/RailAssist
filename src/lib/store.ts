"use client";

import { useSyncExternalStore } from "react";
import type { SharedState } from "./types";

// Shared demo state. Saved in localStorage and announced over a
// BroadcastChannel so the passenger, station and family windows on the same
// laptop stay in sync. No server or database involved.

const KEY = "railassist-state";
const VERSION = 3;
const CHANNEL = "railassist";

export const INITIAL_STATE: SharedState = {
  v: VERSION,
  trip: null,
  transcript: "",
  plan: null,
  requests: [],
  pos: 0,
  boarded: false,
  stopDelay: [],
  lastDelay: null,
  feed: [],
};

let cache: SharedState | null = null;
let channel: BroadcastChannel | null = null;
const listeners = new Set<() => void>();

function read(): SharedState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SharedState;
      if (parsed && parsed.v === VERSION) return parsed;
    }
  } catch {
    /* ignore broken storage */
  }
  return INITIAL_STATE;
}

function emit() {
  listeners.forEach((l) => l());
}

function ensureListening() {
  if (typeof window === "undefined" || channel) return;
  try {
    channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = () => {
      cache = read();
      emit();
    };
  } catch {
    /* BroadcastChannel not available: the storage event below still works */
  }
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) {
      cache = read();
      emit();
    }
  });
}

function subscribe(cb: () => void) {
  ensureListening();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getState(): SharedState {
  if (typeof window === "undefined") return INITIAL_STATE;
  if (!cache) cache = read();
  return cache;
}

export function setState(fn: (s: SharedState) => SharedState) {
  // Always start from the latest saved copy, in case another window changed it.
  const next = fn(read());
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full or blocked: still update this window */
  }
  channel?.postMessage("update");
  emit();
}

export function useShared(): SharedState {
  return useSyncExternalStore(subscribe, getState, () => INITIAL_STATE);
}
