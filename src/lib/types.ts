export type LangCode = "en" | "hi" | "ta" | "kn" | "te" | "bn" | "mr";

/** Times are minutes after midnight of the journey date (can be > 1440 for next day). */
export interface Stop {
  code: string;
  name: string;
  arr: number | null;
  dep: number | null;
  platform?: string;
}

export interface Trip {
  pnr: string;
  trainNo: string;
  trainName: string;
  date: string; // YYYY-MM-DD
  coach: string;
  berth: string;
  travelClass: string;
  passenger: { name: string; age: number };
  stops: Stop[];
}

export const NEED_TYPES = [
  "wheelchair",
  "porter",
  "battery_car",
  "lower_berth",
  "meal",
  "medical",
  "escort",
  "other",
] as const;
export type NeedType = (typeof NEED_TYPES)[number];

export interface Need {
  type: NeedType;
  title: string;
  instruction: string;
}

export type StationRole = "boarding" | "arrival" | "enroute";

export interface StationPlan {
  stationCode: string;
  role: StationRole;
  needs: Need[];
}

export interface Plan {
  summary: string;
  stations: StationPlan[];
  lang: LangCode;
  source: "ai" | "offline";
  /** Things the passenger asked for that stations and trains don't provide. */
  notPossible?: string[];
}

export type RequestStatus = "planned" | "sent" | "confirmed" | "done";

export interface StationRequest {
  id: string;
  stopIndex: number;
  stationCode: string;
  stationName: string;
  role: StationRole;
  needs: Need[];
  status: RequestStatus;
  /** Original help time (minutes). */
  schedTime: number;
  /** Help time after delays (minutes). */
  expectedTime: number;
  /** Previous expected time, shown struck through after a change. */
  prevTime?: number;
  /** Wall-clock ms of the last time change (for the highlight). */
  changedAt?: number;
}

export type FeedKey =
  | "feedSent"
  | "feedConfirmed"
  | "feedBoarded"
  | "feedDeparted"
  | "feedDelay"
  | "feedArrived"
  | "feedPickedUp";

export interface FeedItem {
  id: string;
  ts: number; // wall clock ms
  simTime: number; // trip clock minutes
  key: FeedKey;
  params: Record<string, string | number>;
  needs?: NeedType[];
}

export interface DelayEvent {
  minutes: number; // total delay
  stationName: string;
  needType: NeedType | null;
  newTime: number;
  ts: number;
}

export interface SharedState {
  v: number;
  trip: Trip | null;
  transcript: string;
  plan: Plan | null;
  requests: StationRequest[];
  /** Train position in half steps: 0 = at first stop, 0.5 = between stop 0 and 1, 1 = at stop 1 ... */
  pos: number;
  boarded: boolean;
  /** Extra minutes per stop index. */
  stopDelay: number[];
  lastDelay: DelayEvent | null;
  feed: FeedItem[];
}
