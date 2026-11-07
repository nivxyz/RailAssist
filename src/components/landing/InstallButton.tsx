"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Platform = "ios" | "android" | "desktop";

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

/**
 * "Install app" button. Uses the browser's install prompt where it exists
 * (Chrome, Edge, Brave, Android). Otherwise shows short how-to steps
 * (Safari on iPhone has no prompt: Share → Add to Home Screen).
 */
export function InstallButton({ label = "Install app", className = "" }: { label?: string; className?: string }) {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [help, setHelp] = useState(false);
  const [platform, setPlatform] = useState<Platform>("desktop");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read browser info after mount
    setPlatform(detectPlatform());
    if (window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed)
    return (
      <span className={`inline-flex items-center justify-center rounded-xl bg-ok-100 px-5 py-3 text-base font-bold text-ok-700 ${className}`}>
        Installed ✓
      </span>
    );

  const click = async () => {
    if (prompt) {
      try {
        await prompt.prompt();
        const choice = await prompt.userChoice;
        if (choice.outcome === "accepted") setInstalled(true);
        setPrompt(null);
      } catch {
        setHelp(true); // browser refused the prompt: show the manual steps
      }
    } else {
      setHelp((h) => !h);
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={click}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-800 px-5 py-3 text-base font-bold text-white transition hover:bg-brand-900 active:scale-[0.98]"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
        </svg>
        {label}
      </button>
      {help && (
        <p className="anim-fade-up mt-2 rounded-lg bg-brand-50 px-3 py-2 text-sm leading-snug text-ink">
          {platform === "ios"
            ? "On iPhone: open this page in Safari, tap the Share button, then “Add to Home Screen”."
            : platform === "android"
              ? "Open the browser menu (⋮) and tap “Install app” or “Add to Home screen”."
              : "Click the install icon at the right end of the address bar, or open the browser menu and choose “Install RailAssist”."}
        </p>
      )}
    </div>
  );
}
