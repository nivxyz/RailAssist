"use client";

import { useState } from "react";
import { useInstall } from "../useInstall";

/**
 * "Install app" button. Uses the browser's install prompt where it exists
 * (Chrome, Edge, Brave, Android). Otherwise shows short how-to steps
 * (Safari on iPhone has no prompt: Share → Add to Home Screen).
 */
export function InstallButton({ label = "Install app", className = "" }: { label?: string; className?: string }) {
  const { installed, platform, install } = useInstall();
  const [help, setHelp] = useState(false);

  if (installed)
    return (
      <span className={`inline-flex items-center justify-center rounded-xl bg-ok-100 px-5 py-3 text-base font-bold text-ok-700 ${className}`}>
        Installed ✓
      </span>
    );

  const click = async () => {
    const shown = await install();
    if (!shown) setHelp((h) => !h);
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
