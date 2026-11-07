"use client";

import { useEffect, useRef, useState } from "react";
import type { LangCode } from "@/lib/types";

export type MicState = "idle" | "recording" | "transcribing";
type MicError = "micError" | "transcribeError";

const MAX_RECORD_MS = 30_000;

function pickMime(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  for (const m of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"]) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return undefined;
}

/** Tap to record, tap again to stop; the speech is turned into text with Groq Whisper. */
export function useRecorder(lang: LangCode, onText: (text: string) => void, onError: (e: MicError) => void) {
  const [state, setState] = useState<MicState>("idle");
  const recRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      recRef.current?.stream.getTracks().forEach((tr) => tr.stop());
    },
    [],
  );

  const fail = (e: MicError) => {
    setState("idle");
    onError(e);
  };

  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") return fail("micError");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      return fail("micError");
    }
    const mime = pickMime();
    const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = async () => {
      stream.getTracks().forEach((tr) => tr.stop());
      if (timerRef.current) clearTimeout(timerRef.current);
      const blob = new Blob(chunks, { type: rec.mimeType || mime || "audio/webm" });
      if (blob.size < 1000) return fail("transcribeError");
      setState("transcribing");
      try {
        const fd = new FormData();
        fd.append("audio", blob, "speech");
        fd.append("language", lang);
        const res = await fetch("/api/transcribe", { method: "POST", body: fd });
        const data = (await res.json().catch(() => ({}))) as { text?: string };
        if (!res.ok || !data.text) return fail("transcribeError");
        setState("idle");
        onText(data.text);
      } catch {
        fail("transcribeError");
      }
    };
    recRef.current = rec;
    rec.start();
    setState("recording");
    timerRef.current = setTimeout(() => rec.state === "recording" && rec.stop(), MAX_RECORD_MS);
  };

  const toggle = () => {
    if (state === "recording") recRef.current?.stop();
    else if (state === "idle") void start();
  };

  return { state, toggle };
}
