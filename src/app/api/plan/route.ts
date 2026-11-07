import { GROQ_BASE_URL, MODELS } from "@/lib/config";
import { isLang, langName } from "@/lib/i18n";
import { offlinePlan, validatePlan } from "@/lib/plan";
import { buildSystemPrompt, buildUserMessage } from "@/lib/systemPrompt";
import { lookupTrip } from "@/lib/trips";
import type { LangCode, Plan } from "@/lib/types";

interface Body {
  transcript?: string;
  pnr?: string;
  lang?: string;
}

async function askGroq(key: string, system: string, user: string, extraNote?: string): Promise<unknown> {
  const messages = [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
  if (extraNote) messages.push({ role: "user", content: extraNote });

  const res = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODELS.chat,
      messages,
      temperature: 0.2,
      max_completion_tokens: 3000,
      reasoning_effort: "low",
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Groq ${res.status}: ${detail.slice(0, 300)}`);
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content ?? "";
  // Be forgiving if the model wraps the JSON in text or code fences.
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("No JSON object in reply");
  return JSON.parse(content.slice(start, end + 1));
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  const transcript = (body.transcript ?? "").trim().slice(0, 2000);
  const lang: LangCode = isLang(body.lang) ? body.lang : "en";
  // The trip is looked up on the server from the PNR, so the client cannot
  // inject arbitrary trip text into the prompt.
  const trip = lookupTrip(body.pnr ?? "");
  if (!transcript || !trip) {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const key = process.env.GROQ_API_KEY;
  if (!key) {
    console.warn("[plan] GROQ_API_KEY missing, using offline plan");
    return Response.json({ plan: offlinePlan(transcript, trip, lang), warning: "no_key" });
  }

  const system = buildSystemPrompt(langName(lang));
  const user = buildUserMessage(transcript, trip);

  let plan: Plan | null = null;
  try {
    plan = validatePlan(await askGroq(key, system, user), trip, lang);
  } catch (err) {
    console.error("[plan] attempt 1 failed", err);
  }
  if (!plan) {
    // Retry once with a firmer reminder.
    try {
      plan = validatePlan(
        await askGroq(
          key,
          system,
          user,
          "Your last reply was not valid. Reply with ONLY the JSON object in the exact shape described, using station codes from the trip.",
        ),
        trip,
        lang,
      );
    } catch (err) {
      console.error("[plan] attempt 2 failed", err);
    }
  }
  if (!plan) {
    return Response.json({ plan: offlinePlan(transcript, trip, lang), warning: "ai_failed" });
  }
  return Response.json({ plan });
}
