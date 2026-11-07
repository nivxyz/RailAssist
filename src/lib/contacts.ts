import type { NeedType } from "./types";

// ===========================================================================
// HOW TO GET EACH SERVICE
// ---------------------------------------------------------------------------
// RailAssist cannot book anything, so under each kind of help the chat shows
// official links, apps and numbers the passenger can use themselves.
//
// Only official sources. Every entry has the page it was checked on in
// `source`. Leave `value` empty if unsure: empty entries are hidden.
// Filled entries are also given to the AI as facts, so it may mention them.
// ===========================================================================

export type ContactKind = "phone" | "app" | "website" | "counter";

export interface ContactOption {
  kind: ContactKind;
  /** Short name shown to the passenger. */
  label: string;
  /** phone: digits; app/website: https URL; counter: where to go. */
  value: string;
  source: string;
  /** Optional translation key (from i18n.ts) shown instead of `value`. */
  i18nKey?: "enquiryCounter";
}

// Researched and opened on 2026-11-08. PIB = Press Information Bureau (Govt of India).
const PIB_FACILITIES = "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2201576&reg=3&lang=1";

/** Shown once under every answer that lists help. */
export const HELPLINE: ContactOption[] = [
  { kind: "phone", label: "Rail Madad helpline (12 languages, any phone)", value: "139", source: "https://railmadad.indianrailways.gov.in" },
  {
    kind: "counter",
    label: "Station help",
    value: "Enquiry counter at the station",
    source: PIB_FACILITIES,
    i18nKey: "enquiryCounter",
  },
];

/**
 * Per kind of help. Labels are English for now.
 * TODO(native-speaker review): translate labels if needed.
 */
export const SERVICE_CONTACTS: Record<NeedType, ContactOption[]> = {
  wheelchair: [
    // Online booking only at 19 big stations and needs the PNR. Free; refundable Rs 500 deposit + photo ID at pickup.
    { kind: "website", label: "Book a wheelchair online (IRCTC, 19 big stations)", value: "https://www.irctctourism.com/wheelchair", source: "https://www.irctctourism.com/wheelchair" },
    { kind: "counter", label: "Free wheelchairs at 5,868 stations", value: "the station enquiry counter or station manager (free wheelchair)", source: PIB_FACILITIES },
  ],
  porter: [
    // No national porter booking app. Licensed Sahayaks work at fixed rates shown at the station.
    { kind: "counter", label: "Licensed porter (Sahayak)", value: "a licensed Sahayak at the station, at the fixed rate shown there", source: PIB_FACILITIES },
  ],
  battery_car: [
    // 196 battery cars at 79 stations, first come first served; no central booking.
    { kind: "counter", label: "Battery car (79 stations)", value: "the station enquiry counter or station manager", source: PIB_FACILITIES },
  ],
  lower_berth: [
    { kind: "website", label: "Book with the senior citizen / lower berth quota (IRCTC)", value: "https://www.irctc.co.in/nget/train-search", source: "https://www.irctc.co.in/nget/train-search" },
    { kind: "website", label: "Divyangjan railway ID card (disability quota)", value: "https://divyangjanid.indianrail.gov.in/", source: "https://divyangjanid.indianrail.gov.in/" },
  ],
  meal: [
    { kind: "phone", label: "Order food to your seat (IRCTC eCatering)", value: "1323", source: "https://www.ecatering.irctc.co.in/" },
    { kind: "website", label: "Order food online (IRCTC eCatering)", value: "https://www.ecatering.irctc.co.in/", source: "https://www.ecatering.irctc.co.in/" },
    { kind: "app", label: "Food on Track app (Android)", value: "https://play.google.com/store/apps/details?id=com.irctc.fot", source: "https://play.google.com/store/apps/details?id=com.irctc.fot" },
    { kind: "app", label: "Food on Track app (iPhone)", value: "https://apps.apple.com/in/app/irctc-catering-food-on-track/id1077183717", source: "https://apps.apple.com/in/app/irctc-catering-food-on-track/id1077183717" },
  ],
  medical: [
    // 139: press 1 for medical/security help (PIB 8 Mar 2021, Rail Madad site).
    { kind: "website", label: "Rail Madad (help and complaints on the train)", value: "https://railmadad.indianrailways.gov.in", source: "https://railmadad.indianrailways.gov.in" },
  ],
  escort: [
    { kind: "counter", label: "Help to reach your coach", value: "the station enquiry counter or station manager", source: PIB_FACILITIES },
  ],
  other: [],
};

/** Shown on the welcome screen. */
export const GENERAL_LINKS: ContactOption[] = [
  { kind: "app", label: "RailOne app (Android)", value: "https://play.google.com/store/apps/details?id=org.cris.aikyam", source: "https://play.google.com/store/apps/details?id=org.cris.aikyam" },
  { kind: "app", label: "RailOne app (iPhone)", value: "https://apps.apple.com/in/app/railone/id6473384334", source: "https://apps.apple.com/in/app/railone/id6473384334" },
  { kind: "website", label: "Live train status (NTES)", value: "https://enquiry.indianrail.gov.in/mntes/", source: "https://enquiry.indianrail.gov.in/mntes/" },
  { kind: "website", label: "Rail Madad: help and complaints", value: "https://railmadad.indianrailways.gov.in", source: "https://railmadad.indianrailways.gov.in" },
  { kind: "website", label: "Facilities for seniors and Divyangjan (Govt of India)", value: PIB_FACILITIES, source: PIB_FACILITIES },
];

const filled = (list: ContactOption[] = []) => list.filter((c) => c.value.trim());

export const serviceContacts = (type: NeedType) => filled(SERVICE_CONTACTS[type]);
export const helplineContacts = () => filled(HELPLINE);
export const generalLinks = () => filled(GENERAL_LINKS);

/** Filled contacts as plain lines for the AI prompt. */
export function contactFactLines(): string[] {
  const lines: string[] = [];
  for (const c of filled(HELPLINE)) lines.push(`${c.label}: ${c.value}`);
  for (const [type, list] of Object.entries(SERVICE_CONTACTS)) {
    for (const c of filled(list)) lines.push(`${type} — ${c.label} (${c.kind}): ${c.value}`);
  }
  for (const c of filled(GENERAL_LINKS)) lines.push(`General — ${c.label} (${c.kind}): ${c.value}`);
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
