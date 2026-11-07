import type { Stop, Trip } from "./types";
import { todayIso } from "./time";

// DEMO DATA ONLY. Trains, timings, coaches and passengers are made up for the
// prototype. They are not real schedules.

const t = (h: number, m: number, day = 0) => day * 1440 + h * 60 + m;

interface Template {
  trainNo: string;
  trainName: string;
  coach: string;
  berth: string;
  travelClass: string;
  passenger: { name: string; age: number };
  stops: Stop[];
}

const BLR_MAS: Template = {
  trainNo: "12608",
  trainName: "Lalbagh Express",
  coach: "B2",
  berth: "34 (Lower)",
  travelClass: "AC 3 Tier",
  passenger: { name: "Kamala Sundaram", age: 72 },
  stops: [
    { code: "SBC", name: "KSR Bengaluru", arr: null, dep: t(8, 15), platform: "5" },
    { code: "KJM", name: "Krishnarajapuram", arr: t(8, 33), dep: t(8, 35) },
    { code: "BWT", name: "Bangarapet", arr: t(9, 28), dep: t(9, 30) },
    { code: "JTJ", name: "Jolarpettai", arr: t(10, 40), dep: t(10, 45) },
    { code: "KPD", name: "Katpadi", arr: t(11, 55), dep: t(12, 0) },
    { code: "AJJ", name: "Arakkonam", arr: t(13, 0), dep: t(13, 2) },
    { code: "MAS", name: "Chennai Central", arr: t(14, 30), dep: null, platform: "7" },
  ],
};

const CSMT_PUNE: Template = {
  trainNo: "12123",
  trainName: "Deccan Queen",
  coach: "C3",
  berth: "45 (Window)",
  travelClass: "AC Chair Car",
  passenger: { name: "Ramesh Kulkarni", age: 68 },
  stops: [
    { code: "CSMT", name: "Mumbai CSMT", arr: null, dep: t(17, 10), platform: "13" },
    { code: "DR", name: "Dadar", arr: t(17, 22), dep: t(17, 24) },
    { code: "TNA", name: "Thane", arr: t(17, 42), dep: t(17, 44) },
    { code: "KYN", name: "Kalyan", arr: t(18, 5), dep: t(18, 7) },
    { code: "LNL", name: "Lonavala", arr: t(19, 25), dep: t(19, 27) },
    { code: "PUNE", name: "Pune Junction", arr: t(20, 25), dep: null, platform: "1" },
  ],
};

const HWH_NDLS: Template = {
  trainNo: "12301",
  trainName: "Rajdhani Express",
  coach: "A1",
  berth: "12 (Lower)",
  travelClass: "AC 2 Tier",
  passenger: { name: "Anjali Das", age: 75 },
  stops: [
    { code: "HWH", name: "Howrah Junction", arr: null, dep: t(16, 50), platform: "9" },
    { code: "ASN", name: "Asansol", arr: t(19, 2), dep: t(19, 4) },
    { code: "DHN", name: "Dhanbad", arr: t(20, 5), dep: t(20, 10) },
    { code: "GAYA", name: "Gaya", arr: t(22, 40), dep: t(22, 43) },
    { code: "DDU", name: "Pt. DD Upadhyaya Jn", arr: t(1, 15, 1), dep: t(1, 25, 1) },
    { code: "PRYJ", name: "Prayagraj", arr: t(3, 15, 1), dep: t(3, 17, 1) },
    { code: "CNB", name: "Kanpur Central", arr: t(5, 0, 1), dep: t(5, 5, 1) },
    { code: "NDLS", name: "New Delhi", arr: t(10, 0, 1), dep: null, platform: "14" },
  ],
};

export const DEMO_PNRS: { pnr: string; label: string }[] = [
  { pnr: "4521873690", label: "Bengaluru → Chennai" },
  { pnr: "2468013579", label: "Mumbai → Pune" },
  { pnr: "8765432109", label: "Howrah → New Delhi" },
];

const FIXED: Record<string, Template> = {
  "4521873690": BLR_MAS,
  "2468013579": CSMT_PUNE,
  "8765432109": HWH_NDLS,
};

const TEMPLATES = [BLR_MAS, CSMT_PUNE, HWH_NDLS];

export function isValidPnr(pnr: string): boolean {
  return /^\d{10}$/.test(pnr);
}

/** Any 10-digit PNR returns a trip. The demo PNRs return their fixed trip. */
export function lookupTrip(pnr: string): Trip | null {
  if (!isValidPnr(pnr)) return null;
  const fixed = FIXED[pnr];
  const n = pnr.split("").reduce((a, c) => a + Number(c), 0);
  const tpl = fixed ?? TEMPLATES[n % TEMPLATES.length];
  return {
    pnr,
    trainNo: tpl.trainNo,
    trainName: tpl.trainName,
    date: todayIso(),
    coach: fixed ? tpl.coach : tpl.coach.replace(/\d+$/, String((n % 6) + 1)),
    berth: fixed ? tpl.berth : `${(n % 64) + 1} (Lower)`,
    travelClass: tpl.travelClass,
    passenger: fixed ? tpl.passenger : { name: "Demo Passenger", age: 70 },
    stops: tpl.stops,
  };
}
