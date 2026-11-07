"use client";

import { useEffect, useState } from "react";
import { isLang } from "@/lib/i18n";
import type { LangCode } from "@/lib/types";

/** Language choice is per page (passenger and family may differ). */
export function useLang(page: string): [LangCode, (l: LangCode) => void] {
  const key = `railassist-lang-${page}`;
  const [lang, setLang] = useState<LangCode>("en");
  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- load saved choice after hydration
      if (isLang(saved)) setLang(saved);
    } catch {
      /* ignore */
    }
  }, [key]);
  const update = (l: LangCode) => {
    setLang(l);
    try {
      localStorage.setItem(key, l);
    } catch {
      /* ignore */
    }
  };
  return [lang, update];
}
