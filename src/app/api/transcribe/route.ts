import { GROQ_BASE_URL, MODELS } from "@/lib/config";
import { isLang } from "@/lib/i18n";

const MAX_BYTES = 20 * 1024 * 1024; // stay under Groq's 25 MB free-tier limit

export async function POST(req: Request) {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return Response.json({ error: "no_key", message: "GROQ_API_KEY is not set on the server." }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  const audio = form.get("audio");
  const lang = form.get("language");
  if (!(audio instanceof Blob) || audio.size === 0) {
    return Response.json({ error: "no_audio" }, { status: 400 });
  }
  if (audio.size > MAX_BYTES) {
    return Response.json({ error: "too_large" }, { status: 413 });
  }

  const type = audio.type || "audio/webm";
  const ext = type.includes("mp4") ? "mp4" : type.includes("ogg") ? "ogg" : type.includes("wav") ? "wav" : "webm";

  const out = new FormData();
  out.append("file", audio, `speech.${ext}`);
  out.append("model", MODELS.transcribe);
  out.append("response_format", "json");
  out.append("temperature", "0");
  if (isLang(lang)) out.append("language", lang);

  try {
    const res = await fetch(`${GROQ_BASE_URL}/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: out,
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[transcribe] Groq error", res.status, detail.slice(0, 500));
      return Response.json({ error: "upstream", status: res.status }, { status: 502 });
    }
    const data = (await res.json()) as { text?: string };
    return Response.json({ text: (data.text ?? "").trim() });
  } catch (err) {
    console.error("[transcribe] request failed", err);
    return Response.json({ error: "upstream" }, { status: 502 });
  }
}
