"use client";

import { useEffect, useRef, useState } from "react";
import { applyPlan, resetDemo, setTranscript } from "@/lib/actions";
import { t } from "@/lib/i18n";
import { type NoPlan, isNoPlan, offlinePlan } from "@/lib/plan";
import type { LangCode, Plan, Trip } from "@/lib/types";
import { MicIcon, StopIcon } from "../Icons";
import { StepHeader } from "./StepHeader";
import { TripCard } from "./TripCard";

type MicState = "idle" | "recording" | "transcribing";
const MAX_RECORD_MS = 30_000;

function pickMime(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  for (const m of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"]) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return undefined;
}

export function NeedsStep({ trip, lang, initial }: { trip: Trip; lang: LangCode; initial: string }) {
  const [text, setText] = useState(initial);
  const [mic, setMic] = useState<MicState>("idle");
  const [fromVoice, setFromVoice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planning, setPlanning] = useState(false);
  const [noPlan, setNoPlan] = useState<NoPlan | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      recRef.current?.stream.getTracks().forEach((tr) => tr.stop());
    },
    [],
  );

  const fail = (key: "micError" | "transcribeError") => {
    setMic("idle");
    setError(t(lang, key));
    setTimeout(() => textRef.current?.focus(), 50);
  };

  const startRecording = async () => {
    setError(null);
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
      setMic("transcribing");
      try {
        const fd = new FormData();
        fd.append("audio", blob, "speech");
        fd.append("language", lang);
        const res = await fetch("/api/transcribe", { method: "POST", body: fd });
        const data = (await res.json().catch(() => ({}))) as { text?: string };
        if (!res.ok || !data.text) return fail("transcribeError");
        setText((prev) => (prev.trim() ? `${prev.trim()} ${data.text}` : data.text!));
        setFromVoice(true);
        setMic("idle");
      } catch {
        fail("transcribeError");
      }
    };
    recRef.current = rec;
    rec.start();
    setMic("recording");
    timerRef.current = setTimeout(() => rec.state === "recording" && rec.stop(), MAX_RECORD_MS);
  };

  const toggleMic = () => {
    if (mic === "recording") recRef.current?.stop();
    else if (mic === "idle") void startRecording();
  };

  const makePlan = async () => {
    const transcript = text.trim();
    if (!transcript) {
      setError(t(lang, "emptyNeeds"));
      textRef.current?.focus();
      return;
    }
    setError(null);
    setNoPlan(null);
    setPlanning(true);
    setTranscript(transcript);
    let result: Plan | NoPlan;
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, pnr: trip.pnr, lang }),
      });
      const data = (await res.json()) as { plan?: Plan; notUnderstood?: boolean; notPossible?: string[] };
      if (res.ok && data.notUnderstood) result = { none: true, notPossible: data.notPossible ?? [] };
      else result = res.ok && data.plan ? data.plan : offlinePlan(transcript, trip, lang);
    } catch {
      // Server unreachable: plan on this device so the demo keeps going.
      result = offlinePlan(transcript, trip, lang);
    }
    setPlanning(false);
    if (isNoPlan(result)) {
      // Nothing we can plan: explain kindly and let them try again.
      setNoPlan(result);
      textRef.current?.focus();
      return;
    }
    applyPlan(result);
  };

  return (
    <div className="anim-fade-up flex flex-1 flex-col px-5 pb-6 pt-4">
      <TripCard trip={trip} lang={lang} onChange={resetDemo} />
      <div className="mt-5">
        <StepHeader n={2} lang={lang} title={t(lang, "speakNeeds")} hint={t(lang, "speakHint")} />
      </div>

      <div className="my-6 flex flex-col items-center">
        <button
          type="button"
          onClick={toggleMic}
          disabled={mic === "transcribing" || planning}
          aria-label={mic === "recording" ? t(lang, "listening") : t(lang, "tapToSpeak")}
          className={`relative grid h-32 w-32 place-items-center rounded-full text-white shadow-xl transition active:scale-95 disabled:opacity-60 ${
            mic === "recording" ? "pulse-ring bg-red-600 text-red-600" : "bg-accent-500 hover:bg-accent-600"
          }`}
        >
          <span className="relative text-white">
            {mic === "recording" ? <StopIcon className="h-12 w-12" /> : <MicIcon className="h-14 w-14" />}
          </span>
        </button>
        <div className="mt-3 h-7 text-lg font-bold text-brand-900">
          {mic === "recording" ? t(lang, "listening") : mic === "transcribing" ? <span className="anim-blink">{t(lang, "transcribing")}</span> : t(lang, "tapToSpeak")}
        </div>
      </div>

      {noPlan && (
        <div role="alert" className="anim-fade-up mb-3 rounded-2xl border border-line bg-white px-4 py-3">
          <div className="text-lg font-bold text-brand-900">
            {noPlan.notPossible.length ? t(lang, "cantArrange", { items: noPlan.notPossible.join(", ") }) : t(lang, "notUnderstood")}
          </div>
          <p className="mt-1 text-base leading-snug text-muted">{t(lang, "canHelpWith")}</p>
        </div>
      )}

      {error && (
        <div role="alert" className="anim-fade-up mb-3 rounded-2xl border border-accent-500/40 bg-accent-50 px-4 py-3 text-base font-semibold text-accent-600">
          {error}
        </div>
      )}

      <label className="text-base font-bold text-brand-900" htmlFor="needs-text">
        {fromVoice ? t(lang, "youSaid") : t(lang, "orType")}
      </label>
      <textarea
        id="needs-text"
        ref={textRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder={t(lang, "typePlaceholder")}
        className="mt-1.5 w-full resize-none rounded-2xl border-2 border-line bg-white px-4 py-3 text-lg leading-snug text-ink outline-none transition focus:border-brand-700 focus:ring-4 focus:ring-brand-700/15"
      />

      <button
        type="button"
        onClick={makePlan}
        disabled={planning || mic !== "idle"}
        className="mt-4 w-full rounded-2xl bg-brand-800 py-4 text-xl font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
      >
        {planning ? <span className="anim-blink">{t(lang, "planning")}</span> : t(lang, "makePlan")}
      </button>
    </div>
  );
}
