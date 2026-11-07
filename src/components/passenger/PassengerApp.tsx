"use client";

import { t } from "@/lib/i18n";
import { useShared } from "@/lib/store";
import { DemoControls } from "../DemoControls";
import { LangPicker } from "../LangPicker";
import { Logo } from "../Logo";
import { PhoneFrame } from "../PhoneFrame";
import { useLang } from "../useLang";
import { DelayAlert } from "./DelayAlert";
import { NeedsStep } from "./NeedsStep";
import { PlanView } from "./PlanView";
import { PnrStep } from "./PnrStep";

export function PassengerApp() {
  const s = useShared();
  const [lang, setLang] = useLang("passenger");

  return (
    <PhoneFrame caption="Passenger app">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-line bg-white px-4 pb-3 pt-4 sm:pt-9">
        <Logo size={38} sub={t(lang, "tagline")} />
        <LangPicker lang={lang} onChange={setLang} label={t(lang, "language")} />
      </header>

      <DelayAlert delay={s.lastDelay} lang={lang} />

      <main className="scroll-quiet flex min-h-0 flex-1 flex-col overflow-y-auto bg-paper" lang={lang}>
        {!s.trip ? (
          <PnrStep key="pnr" lang={lang} />
        ) : !s.plan ? (
          <NeedsStep key={s.trip.pnr} trip={s.trip} lang={lang} initial={s.transcript} />
        ) : (
          <PlanView s={s} lang={lang} />
        )}
      </main>
      <DemoControls />
    </PhoneFrame>
  );
}
