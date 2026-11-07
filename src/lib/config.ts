// All model IDs live here so they are easy to swap.
// Checked against https://console.groq.com/docs/models on 2026-11-08.
// (llama-3.3-70b-versatile was retired on 2026-08-16; openai/gpt-oss-120b is
// Groq's suggested replacement, is multilingual and supports JSON object mode.)
export const MODELS = {
  transcribe: "whisper-large-v3-turbo",
  chat: "openai/gpt-oss-120b",
} as const;

export const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
