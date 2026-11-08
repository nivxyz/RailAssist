"use client";

import { useEffect, useState } from "react";
import { t } from "@/lib/i18n";
import type { LangCode } from "@/lib/types";
import { LogoMark } from "../Logo";
import { isInstalledApp, isPhoneDevice, useInstall } from "../useInstall";

const DISMISS_KEY = "railassist-install-dismissed";

/**
 * On a phone (not already installed), asks once: "Download the RailAssist app?"
 * Install uses the browser's own dialog where available, otherwise shows the steps.
 */
export function InstallPrompt({ lang }: { lang: LangCode }) {
  const { platform, install } = useInstall();
  const [open, setOpen] = useState(false);
  const [steps, setSteps] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      /* ignore */
    }
    if (!isPhoneDevice() || isInstalledApp() || dismissed) return;
    const id = setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(id);
  }, []);

  if (!open) return null;

  const close = () => {
    setOpen(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  const onInstall = async () => {
    const shown = await install();
    if (shown) close();
    else setSteps(true);
  };

  return (
    <div className="absolute inset-0 z-[60] flex items-end bg-black/30" role="dialog" aria-modal="true" aria-labelledby="install-title">
      <div className="anim-fade-up w-full rounded-t-3xl bg-card px-5 pb-6 pt-5 shadow-[0_-12px_40px_-12px_rgba(32,27,23,0.35)]">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-brand-100" />
        <div className="flex items-center gap-3">
          <LogoMark size={56} />
          <div>
            <h2 id="install-title" className="text-xl font-bold leading-tight text-brand-900">
              {t(lang, "installTitle")}
            </h2>
            <p className="mt-0.5 text-base leading-snug text-muted">{t(lang, "installBody")}</p>
          </div>
        </div>

        {steps && (
          <p className="anim-fade-up mt-4 rounded-xl bg-brand-50 px-4 py-3 text-base leading-snug text-ink">
            {t(lang, platform === "ios" ? "installStepsIos" : "installStepsAndroid")}
          </p>
        )}

        <div className="mt-5 flex flex-col gap-2.5">
          {!steps && (
            <button
              type="button"
              onClick={onInstall}
              className="w-full rounded-2xl bg-brand-800 py-4 text-xl font-bold text-white transition active:scale-[0.98]"
            >
              {t(lang, "installYes")}
            </button>
          )}
          <button type="button" onClick={close} className="w-full rounded-2xl py-3 text-lg font-semibold text-muted">
            {steps ? t(lang, "ok") : t(lang, "installNo")}
          </button>
        </div>
      </div>
    </div>
  );
}
