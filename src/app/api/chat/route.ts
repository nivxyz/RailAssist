import { offlineReply, validateReply, type BotReply } from "@/lib/chat";
import { GROQ_BASE_URL, MODELS } from "@/lib/config";
import { isLang, langName } from "@/lib/i18n";
import { buildSystemPrompt } from "@/lib/systemPrompt";
import type { LangCode } from "@/lib/types";

interface InMessage {
  role?: string;
  content?: string;
}
interface Body {
  messages?: InMessage[];
  lang?: string;
}
type GroqMessage = { role: "system" | "user" | "assistant"; content: string };

const MAX_TURNS = 12;
const MAX_CHARS = 1200;

/** How long Groq asks us to wait after a 429, in ms (from the header or the message). */
async function rateLimitWaitMs(res: Response): Promise<number | null> {
  const header = Number(res.headers.get("retry-after"));
  if (Number.isFinite(header) && header > 0) return header * 1000 + 300;
  const text = await res.clone().text().catch(() => "");
  const m = text.match(/try again in ([\d.]+)s/i);
  return m ? Math.ceil(Number(m[1]) * 1000) + 300 : null;
}

async function askGroq(key: string, messages: GroqMessage[]): Promise<unknown> {
  const call = () =>
    fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODELS.chat,
        messages,
        temperature: 0.3,
        max_completion_tokens: 1500,
        reasoning_effort: "low",
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(30_000),
    });

  let res = await call();
  if (res.status === 429) {
    // Free-tier rate limit: wait the few seconds Groq asks for, then try once more.
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
  const lang: LangCode = isLang(body.lang) ? body.lang : "en";
  // Only user/assistant text is accepted from the browser; the system prompt is always ours.
  const history: GroqMessage[] = (Array.isArray(body.messages) ? body.messages : [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content!.trim().slice(0, MAX_CHARS) }));
  const last = history[history.length - 1];
  if (!last || last.role !== "user") return Response.json({ error: "bad_request" }, { status: 400 });

  const key = process.env.GROQ_API_KEY;
  if (!key) {
    console.warn("[chat] GROQ_API_KEY missing, using offline reply");
    return Response.json({ reply: offlineReply(last.content, lang), warning: "no_key" });
  }

  const messages: GroqMessage[] = [{ role: "system", content: buildSystemPrompt(langName(lang)) }, ...history];
  let reply: BotReply | null = null;
  try {
    reply = validateReply(await askGroq(key, messages), lang);
  } catch (err) {
    console.error("[chat] attempt 1 failed", err);
  }
  if (!reply) {
    try {
      reply = validateReply(
        await askGroq(key, [
          ...messages,
          { role: "user", content: "Your last reply was not valid. Reply with ONLY the JSON object in the exact shape described." },
        ]),
        lang,
      );
    } catch (err) {
      console.error("[chat] attempt 2 failed", err);
    }
  }
  if (!reply) return Response.json({ reply: offlineReply(last.content, lang), warning: "ai_failed" });
  return Response.json({ reply });
}
