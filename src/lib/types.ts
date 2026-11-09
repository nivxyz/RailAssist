export type LangCode = "en" | "hi" | "ta" | "kn" | "te" | "bn" | "mr" | "ml";

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
