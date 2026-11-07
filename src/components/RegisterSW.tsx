"use client";

import { useEffect } from "react";

/** Registers the tiny service worker that makes RailAssist installable. */
export function RegisterSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* install just won't be offered; the site still works */
      });
    }
  }, []);
  return null;
}
