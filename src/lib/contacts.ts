import type { NeedType } from "./types";

// ===========================================================================
// HOW TO GET EACH SERVICE TODAY
// ---------------------------------------------------------------------------
// RailAssist cannot book services yet, so for every need it shows the
// passenger how to arrange it themselves: a number to call, an app or website
// to open, or a counter to ask at.
//
// Fill these in from official sources only. Leave `value` empty until it is
// verified; empty entries are hidden. Put the page you checked in `source`.
// DO NOT fill these from memory.
//
// Filled entries are also given to the AI as facts, so it may mention them.
// ===========================================================================

export type ContactKind = "phone" | "app" | "website" | "counter";

export interface ContactOption {
  kind: ContactKind;
  /** Short name shown to the passenger, e.g. "Wheelchair booking line". */
  label: string;
  /** phone: digits; app/website: https URL; counter: where to go, e.g. "Enquiry counter, platform 1". */
  value: string;
  source: string;
  /** Optional translation key (from i18n.ts) used instead of `value` on screen. */
  i18nKey?: "enquiryCounter";
}

/** Shown for every need when nothing more specific is filled in. */
export const FALLBACK_CONTACTS: ContactOption[] = [
  {
    kind: "phone",
    label: "Rail Madad helpline",
    value: "139", // From the project brief. TODO: confirm and add source URL.
    source: "",
  },
  {
    kind: "counter",
    label: "Station help",
    value: "Enquiry counter at the station",
    source: "", // Generic advice, not a specific service.
    i18nKey: "enquiryCounter",
  },
];

/** Per service. Add as many options as you find (e.g. a phone line AND an app). */
export const SERVICE_CONTACTS: Record<NeedType, ContactOption[]> = {
  wheelchair: [
    { kind: "phone", label: "Wheelchair booking", value: "", source: "" }, // TODO: Yatri Mitra / wheelchair booking number
    { kind: "website", label: "Wheelchair booking online", value: "", source: "" }, // TODO: official booking page, if any
    { kind: "counter", label: "Where to ask", value: "", source: "" }, // TODO: e.g. which desk at the station
  ],
  porter: [
    { kind: "counter", label: "Licensed porters (Sahayak)", value: "", source: "" }, // TODO: where to find them / how to identify
    { kind: "app", label: "Porter booking app", value: "", source: "" }, // TODO: official app link, if any
  ],
  battery_car: [
    { kind: "phone", label: "Battery car booking", value: "", source: "" }, // TODO
    { kind: "counter", label: "Where to ask", value: "", source: "" }, // TODO
  ],
  lower_berth: [
    { kind: "counter", label: "Ask the TTE on the train", value: "", source: "" }, // TODO: confirm the correct process
    { kind: "website", label: "Change berth online", value: "", source: "" }, // TODO
  ],
  meal: [
    { kind: "phone", label: "Order a meal", value: "", source: "" }, // TODO: official e-catering number
    { kind: "website", label: "Order a meal online", value: "", source: "" }, // TODO: official e-catering site
  ],
  medical: [
    { kind: "phone", label: "Medical help on the train", value: "", source: "" }, // TODO: confirm (possibly 139)
  ],
  escort: [
    { kind: "counter", label: "Where to ask", value: "", source: "" }, // TODO
  ],
  other: [],
};

/** Optional: contacts for one station, keyed by station code (e.g. "MAS"). */
export const STATION_CONTACTS: Record<string, ContactOption[]> = {
  // MAS: [{ kind: "phone", label: "Chennai Central help desk", value: "", source: "" }], // TODO
};

const filled = (list: ContactOption[] = []) => list.filter((c) => c.value.trim());

/** What the passenger can do today to get this need at this station. */
export function contactsFor(type: NeedType, stationCode: string): ContactOption[] {
  const specific = [...filled(STATION_CONTACTS[stationCode]), ...filled(SERVICE_CONTACTS[type])];
  const out = specific.length ? [...specific] : [];
  // Always offer the helpline as a safety net (once).
  for (const f of filled(FALLBACK_CONTACTS)) {
    if (f.kind === "counter" && out.some((c) => c.kind === "counter")) continue;
    if (!out.some((c) => c.kind === f.kind && c.value === f.value)) out.push(f);
  }
  return out;
}

/** Filled contacts as plain lines for the AI prompt. */
export function contactFactLines(): string[] {
  const lines: string[] = [];
  for (const f of filled(FALLBACK_CONTACTS)) lines.push(`${f.label}: ${f.value}`);
  for (const [type, list] of Object.entries(SERVICE_CONTACTS)) {
    for (const c of filled(list)) lines.push(`${type} — ${c.label} (${c.kind}): ${c.value}`);
  }
  for (const [code, list] of Object.entries(STATION_CONTACTS)) {
    for (const c of filled(list)) lines.push(`Station ${code} — ${c.label} (${c.kind}): ${c.value}`);
  }
  return lines;
}

/** Only allow safe links: tel digits, https URLs. */
export function contactHref(c: ContactOption): string | null {
  if (c.kind === "phone") {
    const digits = c.value.replace(/[^\d+]/g, "");
    return digits ? `tel:${digits}` : null;
  }
  if (c.kind === "app" || c.kind === "website") return /^https:\/\//.test(c.value) ? c.value : null;
  return null;
}
