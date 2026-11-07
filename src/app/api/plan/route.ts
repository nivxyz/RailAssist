import { GROQ_BASE_URL, MODELS } from "@/lib/config";
import { isLang, langName } from "@/lib/i18n";
import { type NoPlan, isNoPlan, offlinePlan, validatePlan } from "@/lib/plan";
import { buildSystemPrompt, buildUserMessage } from "@/lib/systemPrompt";
import { lookupTrip } from "@/lib/trips";
import type { LangCode, Plan } from "@/lib/types";

interface Body {
  transcript?: string;
  pnr?: string;
  lang?: string;
}

/** How long Groq asks us to wait after a 429, in ms (from the header or the message). */
async function rateLimitWaitMs(res: Response): Promise<number | null> {
  const header = Number(res.headers.get("retry-after"));
  if (Number.isFinite(header) && header > 0) return header * 1000 + 300;
  const text = await res.clone().text().catch(() => "");
  const m = text.match(/try again in ([\d.]+)s/i);
  return m ? Math.ceil(Number(m[1]) * 1000) + 300 : null;
}

async function askGroq(key: string, system: string, user: string, extraNote?: string): Promise<unknown> {
  const messages = [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
  if (extraNote) messages.push({ role: "user", content: extraNote });

  const call = () =>
    fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODELS.chat,
        messages,
        temperature: 0.2,
        max_completion_tokens: 1500,
        reasoning_effort: "low",
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(30_000),
    });

  let res = await call();
  if (res.status === 429) {
    // Free-tier rate limit: Groq says how long to wait. If it is short, wait and try once more
    // so a demo doesn't fall back to the offline planner just because of a quick double test.
    const wait = await rateLimitWaitMs(res);
    if (wait !== null && wait <= 12_000) {
      await new Promise((r) => setTimeout(r, wait));
      res = await call();
    }
  }
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

/** {plan} for a real plan, or {notUnderstood, notPossible} when there is nothing to plan. */
function reply(result: Plan | NoPlan, warning?: string) {
  if (isNoPlan(result)) return Response.json({ notUnderstood: true, notPossible: result.notPossible, warning });
  return Response.json({ plan: result, warning });
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
    return reply(offlinePlan(transcript, trip, lang), "no_key");
  }

  const system = buildSystemPrompt(langName(lang));
  const user = buildUserMessage(transcript, trip);

  let plan: Plan | NoPlan | null = null;
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
    return reply(offlinePlan(transcript, trip, lang), "ai_failed");
  }
  return reply(plan);
}
