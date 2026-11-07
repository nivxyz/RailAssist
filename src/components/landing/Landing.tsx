"use client";

import Link from "next/link";
import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import { Logo } from "../Logo";
import { InstallButton } from "./InstallButton";

/**
 * Live, scaled-down preview of a page inside an iframe.
 * With `fit`, it scales to fill the width of its container.
 */
function Preview({ src, w, h, scale: fixed, title, fit = false }: { src: string; w: number; h: number; scale?: number; title: string; fit?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(0.5);
  useEffect(() => {
    if (!fit || !ref.current) return;
    const el = ref.current.parentElement!;
    const ro = new ResizeObserver(() => setFitScale(el.clientWidth / w));
    ro.observe(el);
    return () => ro.disconnect();
  }, [fit, w]);
  const scale = fit ? fitScale : (fixed ?? 0.5);
  return (
    <div ref={ref} className="relative overflow-hidden" style={{ width: fit ? "100%" : w * scale, height: h * scale }}>
      <iframe
        src={src}
        title={title}
        width={w}
        height={h}
        allow="microphone"
        className="absolute left-0 top-0 origin-top-left border-0"
        style={{ transform: `scale(${scale})` }}
      />
    </div>
  );
}

function QR({ path }: { path: string }) {
  const [svg, setSvg] = useState("");
  const [url, setUrl] = useState("");
  useEffect(() => {
    const u = `${window.location.origin}${path}`;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the address is only known in the browser
    setUrl(u);
    QRCode.toString(u, { type: "svg", margin: 1, color: { dark: "#431219", light: "#ffffff" } })
      .then(setSvg)
      .catch(() => setSvg(""));
  }, [path]);
  return (
    <div className="flex items-center gap-3">
      <div className="h-24 w-24 shrink-0 rounded-lg border border-line bg-white p-1" dangerouslySetInnerHTML={{ __html: svg }} aria-label={`QR code for ${url}`} />
      <p className="text-sm leading-snug text-muted">
        Scan with your phone camera to open the app, then install it.
        <span className="mt-0.5 block break-all font-medium text-ink">{url.replace(/^https?:\/\//, "")}</span>
      </p>
    </div>
  );
}

export function Landing() {
  return (
    <div className="min-h-dvh bg-paper">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Logo size={40} sub="Station help, start to finish" />
          <nav className="hidden items-center gap-5 text-sm font-semibold text-muted sm:flex">
            <Link href="/app" className="hover:text-brand-800">Phone app</Link>
            <Link href="/station" className="hover:text-brand-800">PC version</Link>
            <Link href="/family" className="hover:text-brand-800">Family view</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6">
        <section className="max-w-3xl">
          <h1 className="text-[34px] font-bold leading-[1.1] text-brand-900 sm:text-5xl">
            Station help for elderly and disabled train passengers.
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted sm:text-xl">
            Say what you need in your own language. RailAssist works out the wheelchair, porter, battery car and meal help for every station on your trip, tells you how to get each one,
            and keeps your family updated.
          </p>
          <p className="mt-3 text-sm text-muted">
            Prototype for Youth Ideathon 2026 (IRCTC track). All trains and passengers are demo data.
          </p>
        </section>

        <div className="mt-10 grid gap-6 lg:grid-cols-[auto_1fr]">
          {/* ---------------- Phone app ---------------- */}
          <section className="rounded-2xl border border-line bg-white p-5 sm:p-6">
            <div className="text-sm font-semibold text-accent-600">For passengers and families</div>
            <h2 className="mt-1 text-2xl font-bold text-brand-900">Phone app</h2>
            <p className="mt-1 max-w-sm text-base text-muted">Big text, voice input, 7 Indian languages.</p>

            <div className="mt-5 hidden justify-center lg:flex">
              <div className="rounded-[36px] border-[8px] border-[#1b1714] bg-paper shadow-[0_20px_50px_-24px_rgba(32,27,23,0.5)]">
                <div className="overflow-hidden rounded-[28px]">
                  <Preview src="/app" title="RailAssist phone app" w={390} h={780} scale={0.74} />
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 lg:max-w-[300px]">
              <InstallButton label="Install the phone app" />
              <Link
                href="/app"
                className="inline-flex items-center justify-center rounded-xl border-2 border-brand-800 px-5 py-2.5 text-base font-bold text-brand-800 transition hover:bg-brand-50"
              >
                Open in browser
              </Link>
              <div className="mt-1 hidden lg:block">
                <QR path="/app" />
              </div>
            </div>
          </section>

          {/* ---------------- PC version ---------------- */}
          <section className="min-w-0 rounded-2xl border border-line bg-white p-5 sm:p-6">
            <div className="text-sm font-semibold text-accent-600">For station staff</div>
            <h2 className="mt-1 text-2xl font-bold text-brand-900">PC version: Station Desk</h2>
            <p className="mt-1 max-w-lg text-base text-muted">
              Requests from passengers arrive live. Staff accept them, and the passenger&apos;s phone shows &ldquo;Confirmed&rdquo;. Delays move help times automatically.
            </p>

            <div className="mt-5 hidden overflow-hidden rounded-xl border border-line shadow-[0_20px_50px_-24px_rgba(32,27,23,0.35)] lg:block">
              <div className="flex items-center gap-2 border-b border-line bg-brand-50 px-3 py-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#e0a19a]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#e7c27d]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#9fc7a6]" />
                <span className="ml-3 truncate rounded-md bg-white px-3 py-0.5 text-xs text-muted">/station</span>
              </div>
              <Preview src="/station" title="RailAssist station desk" w={1280} h={860} fit />
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/station"
                className="inline-flex items-center justify-center rounded-xl bg-brand-800 px-5 py-3 text-base font-bold text-white transition hover:bg-brand-900"
              >
                Open the PC version
              </Link>
              <Link
                href="/family"
                className="inline-flex items-center justify-center rounded-xl border-2 border-brand-800 px-5 py-2.5 text-base font-bold text-brand-800 transition hover:bg-brand-50"
              >
                Family view
              </Link>
            </div>
            <p className="mt-3 text-sm text-muted">
              To install it on a PC, open the PC version in Chrome, Edge or Brave and click the install icon in the address bar.
            </p>
          </section>
        </div>

        <section className="mt-10 rounded-2xl border border-line bg-white p-5 sm:p-6">
          <h2 className="text-xl font-bold text-brand-900">Try the full demo</h2>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-base text-ink">
            <li>Open the phone app and the PC version in two windows side by side.</li>
            <li>In the phone app, pick the Bengaluru → Chennai demo trip and say or type what help you need.</li>
            <li>Send the requests, then click Accept on the station desk. The phone shows Confirmed.</li>
            <li>Press <kbd className="rounded border border-line bg-paper px-1.5 font-semibold">D</kbd> to add a 40-minute delay and watch help times move.</li>
          </ol>
        </section>
      </main>
    </div>
  );
}
