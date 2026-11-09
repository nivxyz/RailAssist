import { NEED_TYPES, type LangCode, type NeedType } from "./types";
import { needLabel, t } from "./i18n";

/** Where the passenger needs the help. */
export type Where = "boarding" | "arrival" | "onboard" | "any";

export interface ChatNeed {
  type: NeedType;
  where: Where;
  title: string;
  instruction: string;
}

export interface BotReply {
  understood: boolean;
  reply: string;
  needs: ChatNeed[];
  notPossible: string[];
  source: "ai" | "offline";
}

export interface ChatMessage {
  id: string;
  role: "user" | "bot";
  text: string;
  bot?: BotReply;
  ts: number;
}

/** Services RailAssist will help with. Anything else is "not possible". */
export const PLANNABLE: readonly NeedType[] = ["wheelchair", "porter", "battery_car", "lower_berth", "meal", "medical", "escort"];
const WHERE: readonly Where[] = ["boarding", "arrival", "onboard", "any"];

function str(x: unknown, max = 500): string | null {
  if (typeof x !== "string") return null;
  const s = x.trim();
  return s ? s.slice(0, max) : null;
}

function strList(x: unknown): string[] {
  if (!Array.isArray(x)) return [];
  return x.map((v) => str(v, 60)).filter((v): v is string => !!v).slice(0, 5);
}

/** Validate the model's JSON. Returns null if unusable (the caller retries). */
export function validateReply(raw: unknown, lang: LangCode): BotReply | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.understood === false) return { understood: false, reply: t(lang, "notUnderstood"), needs: [], notPossible: [], source: "ai" };
  const reply = str(o.reply);
  if (!reply) return null;
  const needs: ChatNeed[] = [];
  if (Array.isArray(o.needs)) {
    for (const n of o.needs) {
      if (!n || typeof n !== "object") continue;
      const r = n as Record<string, unknown>;
      // Only real station/train services. Unknown types are dropped, never invented.
      if (!(NEED_TYPES as readonly string[]).includes(String(r.type))) continue;
      const type = r.type as NeedType;
      if (!PLANNABLE.includes(type)) continue;
      const where = (WHERE as readonly string[]).includes(String(r.where)) ? (r.where as Where) : "any";
      if (needs.some((x) => x.type === type && x.where === where)) continue;
      needs.push({
        type,
        where,
        title: str(r.title, 80) ?? needLabel(lang, type),
        instruction: str(r.instruction, 400) ?? t(lang, "genericInstruction"),
      });
    }
  }
  return { understood: true, reply, needs: needs.slice(0, 8), notPossible: strList(o.notPossible), source: "ai" };
}

// ---------------------------------------------------------------------------
// Offline fallback: keyword matching so the chat still answers when Groq is
// down or the key is missing. TODO(native-speaker review): extend keywords.
// ---------------------------------------------------------------------------
const KEYWORDS: Record<Exclude<NeedType, "other" | "escort">, string[]> = {
  wheelchair: [
    "wheelchair", "wheel chair", "walk", "knee", "leg", "stairs", "disab",
    "व्हीलचेयर", "व्हील चेयर", "चल नहीं", "चलने", "घुटन", "व्हीलचेअर", "चालता",
    "சக்கர நாற்காலி", "வீல்சேர்", "நடக்க", "ಗಾಲಿಕುರ್ಚಿ", "ವೀಲ್", "ನಡೆಯ",
    "వీల్", "నడవ", "হুইলচেয়ার", "হাঁট", "വീൽചെയർ", "നടക്ക",
  ],
  porter: [
    "porter", "luggage", "bag", "suitcase", "coolie", "sahayak", "heavy",
    "सामान", "कुली", "बैग", "सहायक", "हमाल", "சாமான்", "பை", "லக்கேஜ்", "ಲಗೇಜ್", "ಚೀಲ", "ಕೂಲಿ",
    "లగేజ్", "సామాను", "కూలీ", "মাল", "ব্যাগ", "কুলি", "ലഗേജ്", "ബാഗ്", "പോർട്ടർ", "ചുമട്",
  ],
  battery_car: ["battery", "buggy", "cart", "golf", "बैटरी", "बॅटरी", "பேட்டரி", "ಬ್ಯಾಟರಿ", "బ్యాటరీ", "ব্যাটারি", "ബാറ്ററി"],
  lower_berth: ["lower", "berth", "climb", "नीचे", "लोअर", "बर्थ", "खालचा", "கீழ்", "ಕೆಳಗಿನ", "కింది", "নিচের", "বার্থ", "ബർത്ത്", "താഴത്തെ"],
  meal: [
    "meal", "food", "eat", "lunch", "dinner", "breakfast", "diabet", "sugar", "veg",
    "खाना", "भोजन", "जेवण", "சாப்பாடு", "உணவு", "ಊಟ", "భోజనం", "ఆహారం", "খাবার", "ഭക്ഷണം",
  ],
  medical: [
    "medic", "doctor", "oxygen", "heart", "bp", "pressure", "insulin", "pill", "tablet", "unwell", "sick",
    "दवा", "डॉक्टर", "दवाई", "औषध", "மருந்து", "மருத்துவ", "டாக்டர்", "ಔಷಧ", "ವೈದ್ಯ", "మందు", "డాక్టర్", "ওষুধ", "ডাক্তার", "മരുന്ന്", "ഡോക്ടർ",
  ],
};
const GREETINGS = ["hi", "hello", "hey", "namaste", "namaskar", "thanks", "thank you", "नमस्ते", "धन्यवाद", "வணக்கம்", "ನಮಸ್ಕಾರ", "నమస్కారం", "নমস্কার", "നമസ്കാരം"];

/** Latin keywords must start a word ("eat" must not match "seat"); Indian scripts match anywhere. */
function hasKeyword(text: string, w: string): boolean {
  const word = w.toLowerCase().trim();
  // Keywords are plain letters and spaces, so they are safe to put in a RegExp.
  if (/^[a-z ]+$/.test(word)) return new RegExp(`(^|[^a-z])${word}`).test(text);
  return text.includes(word);
}

const DEFAULT_WHERE: Record<NeedType, Where> = {
  wheelchair: "any",
  porter: "any",
  battery_car: "any",
  lower_berth: "any",
  meal: "onboard",
  medical: "onboard",
  escort: "any",
  other: "any",
};

export function offlineReply(text: string, lang: LangCode): BotReply {
  const lower = text.toLowerCase();
  const found = (Object.keys(KEYWORDS) as (keyof typeof KEYWORDS)[]).filter((k) => KEYWORDS[k].some((w) => hasKeyword(lower, w)));
  if (!found.length) {
    if (GREETINGS.some((g) => hasKeyword(lower, g))) return { understood: true, reply: t(lang, "welcome"), needs: [], notPossible: [], source: "offline" };
    return { understood: false, reply: t(lang, "notUnderstood"), needs: [], notPossible: [], source: "offline" };
  }
  return {
    understood: true,
    reply: t(lang, "offlineReply"),
    needs: found.map((type) => ({ type, where: DEFAULT_WHERE[type], title: needLabel(lang, type), instruction: t(lang, "genericInstruction") })),
    notPossible: [],
    source: "offline",
  };
}
