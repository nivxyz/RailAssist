import { NEED_TYPES, type LangCode, type Need, type NeedType, type Plan, type StationPlan, type StationRole, type Trip } from "./types";
import { needLabel, t } from "./i18n";

function str(x: unknown, max = 400): string | null {
  if (typeof x !== "string") return null;
  const s = x.trim();
  return s ? s.slice(0, max) : null;
}

/** Validate and clean the model's JSON. Returns null if it is unusable. */
export function validatePlan(raw: unknown, trip: Trip, lang: LangCode): Plan | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.stations)) return null;
  const codes = trip.stops.map((s) => s.code);
  const lastIdx = codes.length - 1;

  const byCode = new Map<string, StationPlan>();
  for (const st of obj.stations) {
    if (!st || typeof st !== "object") continue;
    const s = st as Record<string, unknown>;
    const code = str(s.stationCode, 10)?.toUpperCase();
    if (!code) continue;
    const idx = codes.indexOf(code);
    if (idx < 0) continue;
    const role: StationRole = idx === 0 ? "boarding" : idx === lastIdx ? "arrival" : "enroute";
    if (!Array.isArray(s.needs)) continue;
    const needs: Need[] = [];
    for (const n of s.needs) {
      if (!n || typeof n !== "object") continue;
      const r = n as Record<string, unknown>;
      const type = (NEED_TYPES as readonly string[]).includes(String(r.type)) ? (r.type as NeedType) : "other";
      const title = str(r.title, 80) ?? needLabel(lang, type);
      const instruction = str(r.instruction) ?? t(lang, "genericInstruction");
      if (!needs.some((x) => x.type === type && type !== "other")) needs.push({ type, title, instruction });
    }
    // The passenger stays seated at stops on the way: only meal or medical help belongs there.
    if (role === "enroute") {
      const kept = needs.filter((n) => n.type === "meal" || n.type === "medical");
      needs.length = 0;
      needs.push(...kept);
    }
    if (!needs.length) continue;
    const existing = byCode.get(code);
    if (existing) existing.needs.push(...needs);
    else byCode.set(code, { stationCode: code, role, needs });
  }
  const stations = [...byCode.values()].sort((a, b) => codes.indexOf(a.stationCode) - codes.indexOf(b.stationCode));
  if (!stations.length) return null;
  return { summary: str(obj.summary, 400) ?? "", stations, lang, source: "ai" };
}

// ---------------------------------------------------------------------------
// Offline fallback: simple keyword matching so the demo never dead-ends when
// Groq is down or the key is missing. Keywords cover English plus common words
// in the supported languages. TODO(native-speaker review): extend keywords.
// ---------------------------------------------------------------------------
const KEYWORDS: Record<Exclude<NeedType, "other" | "escort">, string[]> = {
  wheelchair: [
    "wheelchair", "wheel chair", "walk", "knee", "leg", "stairs", "disab",
    "व्हीलचेयर", "व्हील चेयर", "चल नहीं", "चलने", "घुटन", "व्हीलचेअर", "चालता",
    "சக்கர நாற்காலி", "வீல்சேர்", "நடக்க", "ಗಾಲಿಕುರ್ಚಿ", "ವೀಲ್", "ನಡೆಯ",
    "వీల్", "నడవ", "হুইলচেয়ার", "হাঁট",
  ],
  porter: [
    "porter", "luggage", "bag", "suitcase", "coolie", "sahayak", "heavy",
    "सामान", "कुली", "बैग", "सहायक", "हमाल", "சாமான்", "பை", "லக்கேஜ்", "ಲಗೇಜ್", "ಚೀಲ", "ಕೂಲಿ",
    "లగేజ్", "సామాను", "కూలీ", "মাল", "ব্যাগ", "কুলি", "सामान",
  ],
  battery_car: ["battery", "buggy", "cart", "golf", "बैटरी", "बॅटरी", "பேட்டரி", "ಬ್ಯಾಟರಿ", "బ్యాటరీ", "ব্যাটারি"],
  lower_berth: ["lower", "berth", "climb", "नीचे", "लोअर", "बर्थ", "खालचा", "கீழ்", "ಕೆಳಗಿನ", "కింది", "নিচের", "বার্থ"],
  meal: [
    "meal", "food", "eat", "lunch", "dinner", "breakfast", "diabet", "sugar", "veg",
    "खाना", "भोजन", "जेवण", "சாப்பாடு", "உணவு", "ಊಟ", "భోజనం", "ఆహారం", "খাবার",
  ],
  medical: [
    "medic", "doctor", "oxygen", "heart", "bp", "pressure", "insulin", "pill", "tablet", "unwell", "sick",
    "दवा", "डॉक्टर", "दवाई", "औषध", "மருந்து", "மருத்துவ", "டாக்டர்", "ಔಷಧ", "ವೈದ್ಯ", "మందు", "డాక్టర్", "ওষুধ", "ডাক্তার",
  ],
};

export function offlinePlan(transcript: string, trip: Trip, lang: LangCode): Plan {
  const text = transcript.toLowerCase();
  const found = (Object.keys(KEYWORDS) as (keyof typeof KEYWORDS)[]).filter((k) =>
    KEYWORDS[k].some((w) => text.includes(w.toLowerCase())),
  );
  const needs: NeedType[] = found.length ? found : ["wheelchair"];
  const last = trip.stops.length - 1;
  const mid = Math.floor(last / 2);
  const mk = (type: NeedType): Need => ({ type, title: needLabel(lang, type), instruction: t(lang, "genericInstruction") });

  const at: Record<number, NeedType[]> = {};
  const add = (i: number, n: NeedType) => (at[i] ??= []).push(n);
  for (const n of needs) {
    if (n === "wheelchair" || n === "porter" || n === "battery_car" || n === "medical") {
      add(0, n);
      add(last, n);
    } else if (n === "lower_berth") add(0, n);
    else if (n === "meal") add(mid, n);
  }
  const stations: StationPlan[] = Object.keys(at)
    .map(Number)
    .sort((a, b) => a - b)
    .map((i) => ({
      stationCode: trip.stops[i].code,
      role: i === 0 ? "boarding" : i === last ? "arrival" : "enroute",
      needs: at[i].map(mk),
    }));
  return { summary: t(lang, "offlinePlan"), stations, lang, source: "offline" };
}
