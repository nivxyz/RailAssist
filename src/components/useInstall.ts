"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type Platform = "ios" | "android" | "desktop";

// The browser fires its install offer once, often before React has mounted,
// so catch it as soon as this module loads.
let deferred: BeforeInstallPromptEvent | null = null;
const subscribers = new Set<() => void>();
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    subscribers.forEach((f) => f());
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    subscribers.forEach((f) => f());
  });
}

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

export function isPhoneDevice(): boolean {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export function isInstalledApp(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
}

/** Install state + an install() that uses the browser prompt when there is one. */
export function useInstall() {
  const [canPrompt, setCanPrompt] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [platform, setPlatform] = useState<Platform>("desktop");

  useEffect(() => {
    const sync = () => setCanPrompt(!!deferred);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read browser info after mount
    setPlatform(detectPlatform());
    setInstalled(isInstalledApp());
    sync();
    const onInstalled = () => setInstalled(true);
    subscribers.add(sync);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      subscribers.delete(sync);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  /** Returns true if the browser showed its own install dialog. */
  const install = async (): Promise<boolean> => {
    if (!deferred) return false;
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
      deferred = null;
      setCanPrompt(false);
      return true;
    } catch {
      return false;
    }
  };

  return { canPrompt, installed, platform, install };
}
