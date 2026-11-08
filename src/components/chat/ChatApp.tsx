"use client";

import { useEffect, useRef, useState } from "react";
import type { BotReply, ChatMessage, ChatNeed, Where } from "@/lib/chat";
import { offlineReply, PLANNABLE } from "@/lib/chat";
import { generalLinks, helplineContacts, serviceContacts } from "@/lib/contacts";
import { needLabel, t, type TKey } from "@/lib/i18n";
import type { LangCode } from "@/lib/types";
import { MicIcon, NeedIcon, StopIcon } from "../Icons";
import { LangPicker } from "../LangPicker";
import { Logo } from "../Logo";
import { InstallPrompt } from "./InstallPrompt";
import { useLang } from "../useLang";
import { ThemeToggle } from "../ThemeToggle";
import { GetIt } from "./GetIt";
import { useRecorder } from "./useRecorder";

const STORE_KEY = "railassist-chat";
const uid = () => Math.random().toString(36).slice(2, 10);

const WHERE_KEY: Record<Where, TKey | null> = {
  boarding: "whereBoarding",
  arrival: "whereArrival",
  onboard: "whereOnboard",
  any: null,
};

const SUGGESTIONS: TKey[] = ["suggestWheelchair", "suggestBags", "suggestFood", "suggestMedical"];

/** The chat lives only in this browser (localStorage). Nobody else can see it. */
function loadChat(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    const parsed = raw ? (JSON.parse(raw) as ChatMessage[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function saveChat(m: ChatMessage[]) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(m.slice(-60)));
  } catch {
    /* storage full or blocked: chat still works for this visit */
  }
}

/** What we send to the AI: the visible conversation as plain text. */
function toApi(messages: ChatMessage[]) {
  return messages.map((m) => {
    if (m.role === "user") return { role: "user", content: m.text };
    const b = m.bot;
    const needs = b?.needs.length ? `\n(Needs listed: ${b.needs.map((n) => `${n.type} @ ${n.where}`).join(", ")})` : "";
    return { role: "assistant", content: (b?.reply ?? m.text) + needs };
  });
}

export function ChatApp() {
  const [lang, setLang] = useLang("passenger");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load this device's chat after mount
    setMessages(loadChat());
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) saveChat(messages);
    // Keep the welcome message in view until the chat starts.
    if (messages.length || busy) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loaded, busy]);

  const send = async (raw: string) => {
    const content = raw.trim();
    if (!content || busy) return;
    setNotice(null);
    setText("");
    const userMsg: ChatMessage = { id: uid(), role: "user", text: content, ts: Date.now() };
    const next = [...messages, userMsg];
    setMessages(next);
    setBusy(true);
    let reply: BotReply;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: toApi(next), lang }),
      });
      const data = (await res.json()) as { reply?: BotReply };
      reply = res.ok && data.reply ? data.reply : offlineReply(content, lang);
    } catch {
      // No connection: answer on this device so the chat never dead-ends.
      reply = offlineReply(content, lang);
    }
    setMessages((m) => [...m, { id: uid(), role: "bot", text: reply.reply, bot: reply, ts: Date.now() }]);
    setBusy(false);
  };

  const mic = useRecorder(
    lang,
    (heard) => void send(heard),
    (e) => {
      setNotice(t(lang, e));
      inputRef.current?.focus();
    },
  );

  const newChat = () => {
    setMessages([]);
    setNotice(null);
  };

  const working = busy || mic.state === "transcribing";

  return (
    <div className="relative flex h-dvh w-full flex-col bg-paper">
      <header className="shrink-0 border-b border-line bg-card">
        <div className="flex items-center justify-between gap-2 px-4 py-3 lg:px-8 lg:py-4">
          <Logo size={38} sub={t(lang, "tagline")} />
          <div className="flex items-center gap-2 lg:gap-3">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={newChat}
                className="hidden rounded-full border border-line px-4 py-2 text-base font-semibold text-brand-900 transition hover:border-brand-800 lg:block"
              >
                {t(lang, "newChat")}
              </button>
            )}
            <ThemeToggle toDark={t(lang, "darkMode")} toLight={t(lang, "lightMode")} />
            <LangPicker lang={lang} onChange={setLang} label={t(lang, "language")} />
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <Sidebar lang={lang} disabled={working} onAsk={(topic) => void send(t(lang, "askTopic", { topic }))} />

        <section className="flex min-w-0 flex-1 flex-col">
          <main className="scroll-quiet flex min-h-0 flex-1 flex-col overflow-y-auto bg-paper px-4 pb-4 pt-4 lg:px-8 lg:pt-8" lang={lang}>
            <div className="mx-auto flex w-full max-w-3xl flex-col">
              {/* Welcome */}
              <BotBubble>
                <p className="text-[18px] leading-snug text-ink">{t(lang, "welcome")}</p>
                <p className="mt-2 text-sm text-muted">{t(lang, "privacyNote")}</p>
              </BotBubble>

              {loaded && messages.length === 0 && (
                <div className="anim-fade-up mt-1 flex flex-wrap gap-2 pl-1">
                  {SUGGESTIONS.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => void send(t(lang, k))}
                      className="rounded-full border-2 border-brand-800/20 bg-card px-4 py-2.5 text-[16px] font-semibold text-brand-800 transition hover:border-brand-800 active:scale-[0.97]"
                    >
                      {t(lang, k)}
                    </button>
                  ))}
                </div>
              )}

              {messages.map((m) =>
                m.role === "user" ? (
                  <div key={m.id} className="anim-fade-up mt-3 flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-br-md bg-brand-800 px-4 py-3 text-[18px] leading-snug text-white">{m.text}</div>
                  </div>
                ) : (
                  <BotMessage key={m.id} reply={m.bot!} lang={lang} />
                ),
              )}

              {working && (
                <BotBubble>
                  <span className="anim-blink text-[17px] text-muted">{mic.state === "transcribing" ? t(lang, "transcribing") : t(lang, "thinking")}</span>
                </BotBubble>
              )}

              {loaded && messages.length === 0 && generalLinks().length > 0 && (
                <div className="mt-4 lg:hidden">
                  <div className="mb-1 pl-1 text-[15px] font-bold text-brand-900">{t(lang, "usefulLinks")}</div>
                  <GetIt contacts={generalLinks()} lang={lang} />
                </div>
              )}
              <div ref={endRef} />
            </div>
          </main>

          {/* Input bar */}
          <div className="shrink-0 border-t border-line bg-card px-3 pb-3 pt-2.5 lg:px-8 lg:pb-5 lg:pt-4">
            <div className="mx-auto w-full max-w-3xl">
              {notice && (
                <div role="alert" className="anim-fade-up mb-2 rounded-xl bg-accent-50 px-3 py-2 text-[15px] font-semibold text-accent-600">
                  {notice}
                </div>
              )}
              <form
                className="flex items-end gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void send(text);
                }}
              >
                <button
                  type="button"
                  onClick={mic.toggle}
                  disabled={busy || mic.state === "transcribing"}
                  aria-label={mic.state === "recording" ? t(lang, "listening") : t(lang, "tapToSpeak")}
                  className={`relative grid h-14 w-14 shrink-0 place-items-center rounded-full text-white transition active:scale-95 disabled:opacity-50 ${
                    mic.state === "recording" ? "pulse-ring bg-red-600 text-red-600" : "bg-accent-500 hover:bg-accent-600"
                  }`}
                >
                  <span className="relative text-white">{mic.state === "recording" ? <StopIcon className="h-6 w-6" /> : <MicIcon className="h-7 w-7" />}</span>
                </button>
                <textarea
                  id="chat-input"
                  ref={inputRef}
                  rows={1}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void send(text);
                    }
                  }}
                  placeholder={mic.state === "recording" ? t(lang, "listening") : t(lang, "typeMessage")}
                  className="max-h-32 min-h-14 flex-1 resize-none rounded-2xl border-2 border-line bg-paper px-4 py-3.5 text-[18px] leading-snug text-ink outline-none focus:border-brand-700"
                />
                <button
                  type="submit"
                  disabled={!text.trim() || busy}
                  aria-label={t(lang, "send")}
                  className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand-800 text-white transition active:scale-95 disabled:bg-brand-100 disabled:text-brand-700/50"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </button>
              </form>
              {messages.length > 0 && (
                <button type="button" onClick={newChat} className="mt-2 w-full text-center text-sm font-semibold text-muted hover:text-brand-800 lg:hidden">
                  {t(lang, "newChat")}
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
      <InstallPrompt lang={lang} />
    </div>
  );
}

/** Desktop only: what RailAssist covers, plus official links that are always handy. */
function Sidebar({ lang, disabled, onAsk }: { lang: LangCode; disabled: boolean; onAsk: (topic: string) => void }) {
  const links = generalLinks();
  const helpline = helplineContacts();
  return (
    <aside
      className="scroll-quiet hidden w-[360px] shrink-0 flex-col gap-6 overflow-y-auto border-r border-line bg-card px-6 py-6 lg:flex xl:w-[400px]"
      lang={lang}
    >
      <div>
        <h2 className="text-[15px] font-bold uppercase tracking-wide text-brand-900">{t(lang, "helpTopics")}</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {PLANNABLE.map((type) => (
            <button
              key={type}
              type="button"
              disabled={disabled}
              onClick={() => onAsk(needLabel(lang, type))}
              className="flex items-center gap-2.5 rounded-xl border border-line bg-paper px-3 py-2.5 text-left text-[15px] font-semibold leading-tight text-ink transition hover:border-brand-800 disabled:opacity-60"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-50 text-accent-600">
                <NeedIcon type={type} className="h-5 w-5" />
              </span>
              {needLabel(lang, type)}
            </button>
          ))}
        </div>
      </div>

      {helpline.length > 0 && (
        <div className="rounded-2xl border border-line bg-brand-50/70 px-4 py-3">
          <h2 className="text-[15px] font-bold text-brand-900">{t(lang, "alwaysAvailable")}</h2>
          <GetIt contacts={helpline} lang={lang} />
        </div>
      )}

      {links.length > 0 && (
        <div>
          <h2 className="text-[15px] font-bold uppercase tracking-wide text-brand-900">{t(lang, "usefulLinks")}</h2>
          <GetIt contacts={links} lang={lang} />
        </div>
      )}

      <div className="mt-auto rounded-2xl bg-paper px-4 py-3">
        <div className="text-[15px] font-bold text-ink">{t(lang, "privacyTitle")}</div>
        <p className="mt-1 text-sm leading-snug text-muted">{t(lang, "privacyNote")}</p>
      </div>
    </aside>
  );
}

function BotBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="anim-fade-up mt-3 flex justify-start first:mt-0">
      <div className="max-w-[92%] rounded-2xl rounded-bl-md border border-line bg-card px-4 py-3">{children}</div>
    </div>
  );
}

function BotMessage({ reply, lang }: { reply: BotReply; lang: LangCode }) {
  const helpline = helplineContacts();
  return (
    <div className="anim-fade-up mt-3 max-w-[96%] space-y-2">
      <BotBubble>
        <p className="text-[18px] leading-snug text-ink">{reply.reply}</p>
        {!reply.understood && <p className="mt-2 text-[16px] leading-snug text-muted">{t(lang, "canHelpWith")}</p>}
        {reply.source === "offline" && reply.understood && <p className="mt-2 text-sm text-muted">{t(lang, "offlinePlan")}</p>}
      </BotBubble>

      {reply.notPossible.length > 0 && (
        <div className="rounded-2xl border border-line bg-card px-4 py-3">
          <div className="text-[15px] font-bold text-brand-900">{t(lang, "notPossibleTitle")}</div>
          <ul className="mt-1 list-disc pl-5 text-[16px] text-muted">
            {reply.notPossible.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      )}

      {reply.needs.map((n, i) => (
        <NeedCard key={n.type + n.where + i} need={n} lang={lang} delay={i * 90} />
      ))}

      {reply.needs.length > 0 && helpline.length > 0 && (
        <div className="rounded-2xl border border-line bg-brand-50/70 px-4 py-3">
          <div className="text-[15px] font-bold text-brand-900">{t(lang, "alwaysAvailable")}</div>
          <GetIt contacts={helpline} lang={lang} />
        </div>
      )}
    </div>
  );
}

function NeedCard({ need, lang, delay }: { need: ChatNeed; lang: LangCode; delay: number }) {
  const whereKey = WHERE_KEY[need.where];
  const links = serviceContacts(need.type);
  return (
    <div className="anim-fade-up rounded-2xl border border-line bg-card px-4 py-3" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent-50 text-accent-600">
          <NeedIcon type={need.type} className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          {whereKey && <div className="text-sm font-semibold text-accent-600">{t(lang, whereKey)}</div>}
          <div className="text-lg font-bold leading-tight text-ink">{need.title || needLabel(lang, need.type)}</div>
          <p className="mt-0.5 text-[16px] leading-snug text-muted">{need.instruction}</p>
        </div>
      </div>
      {links.length > 0 && (
        <div className="mt-2">
          <div className="text-[14px] font-bold text-brand-900">{t(lang, "howToGet")}</div>
          <GetIt contacts={links} lang={lang} />
        </div>
      )}
    </div>
  );
}
