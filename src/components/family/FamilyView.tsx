"use client";

import { helpTime } from "@/lib/actions";
import { t } from "@/lib/i18n";
import { useShared } from "@/lib/store";
import { fmtTime } from "@/lib/time";
import { DemoControls } from "../DemoControls";
import { Feed } from "../Feed";
import { HeartIcon } from "../Icons";
import { LangPicker } from "../LangPicker";
import { Logo } from "../Logo";
import { PhoneFrame } from "../PhoneFrame";
import { LateChip, TrainProgressBar, positionText } from "../TripTracker";
import { useLang } from "../useLang";

export function FamilyView() {
  const s = useShared();
  const [lang, setLang] = useLang("family");
  const trip = s.trip;
  const last = trip ? trip.stops.length - 1 : 0;

  return (
    <PhoneFrame caption="Family view">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-line bg-white px-4 pb-3 pt-4 sm:pt-9">
        <Logo size={38} sub={t(lang, "familyUpdates")} />
        <LangPicker lang={lang} onChange={setLang} label={t(lang, "language")} />
      </header>
      <main className="scroll-quiet min-h-0 flex-1 overflow-y-auto bg-paper px-4 pb-6 pt-4" lang={lang}>
        {trip ? (
          <>
            <div className="rounded-2xl bg-brand-800 p-4 text-white">
              <div className="flex items-center gap-2 text-sm font-semibold text-brand-100">
                <HeartIcon className="h-4 w-4 text-accent-500" />
                {t(lang, "following", { name: trip.passenger.name })}
              </div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <div className="text-lg font-bold">
                  {trip.trainNo} {trip.trainName}
                </div>
                <LateChip minutes={s.stopDelay[last] ?? 0} lang={lang} />
              </div>
              <div className="mt-3 rounded-2xl bg-white p-3 text-ink">
                <TrainProgressBar s={s} />
                <div className="mt-1 flex justify-between text-sm font-bold text-brand-900">
                  <span>{trip.stops[0].code}</span>
                  <span>{trip.stops[last].code}</span>
                </div>
                <div className="mt-2 text-base font-semibold">{positionText(s, lang)}</div>
                <div className="text-sm text-muted">
                  {t(lang, "arrives")} {trip.stops[last].name}:{" "}
                  <b className={s.stopDelay[last] ? "text-accent-600" : "text-ink"}>{fmtTime(helpTime(trip, last, s.stopDelay))}</b>
                </div>
              </div>
            </div>
            <h2 className="mb-3 mt-5 text-xl font-bold text-brand-900">{t(lang, "familyUpdates")}</h2>
            <Feed items={s.feed} lang={lang} big />
          </>
        ) : (
          <div className="mt-20 text-center text-lg text-muted">{t(lang, "noUpdates")}</div>
        )}
        <div className="mt-6 text-center text-xs font-medium text-muted">{t(lang, "demoData")}</div>
      </main>
      <DemoControls />
    </PhoneFrame>
  );
}
