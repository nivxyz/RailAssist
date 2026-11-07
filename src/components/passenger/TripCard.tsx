import { t } from "@/lib/i18n";
import { dayOffset, fmtDate, fmtTime } from "@/lib/time";
import type { LangCode, Trip } from "@/lib/types";

export function TripCard({ trip, lang, onChange, compact = false }: { trip: Trip; lang: LangCode; onChange?: () => void; compact?: boolean }) {
  const a = trip.stops[0];
  const b = trip.stops[trip.stops.length - 1];
  const arrDay = dayOffset(b.arr ?? 0);
  return (
    <div className="overflow-hidden rounded-2xl bg-brand-800 text-white">
      <div className="flex items-center justify-between px-4 pt-3.5 text-sm">
        <span className="font-semibold text-brand-100">
          {trip.trainNo} · {trip.trainName}
        </span>
        <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-bold text-accent-100">{t(lang, "demoData")}</span>
      </div>
      <div className="flex items-end justify-between gap-2 px-4 pb-3 pt-2">
        <div className="min-w-0">
          <div className="text-2xl font-bold">{a.code}</div>
          <div className="truncate text-sm text-brand-100">{a.name}</div>
          <div className="mt-0.5 text-lg font-bold tabular-nums">{fmtTime(a.dep ?? 0)}</div>
        </div>
        <div className="mb-6 flex flex-1 items-center gap-1 px-1">
          <span className="h-2 w-2 rounded-full bg-accent-500" />
          <span className="h-[2px] flex-1 bg-[repeating-linear-gradient(90deg,#ffffff66_0_6px,transparent_6px_10px)]" />
          <span className="h-2 w-2 rounded-full border-2 border-accent-500" />
        </div>
        <div className="min-w-0 text-right">
          <div className="text-2xl font-bold">{b.code}</div>
          <div className="truncate text-sm text-brand-100">{b.name}</div>
          <div className="mt-0.5 text-lg font-bold tabular-nums">
            {fmtTime(b.arr ?? 0)}
            {arrDay > 0 && <sup className="ml-0.5 text-xs text-accent-100">+{arrDay}</sup>}
          </div>
        </div>
      </div>
      {!compact && (
        <div className="grid grid-cols-3 gap-px bg-white/10 text-center">
          <Cell label={fmtDate(trip.date)} value={trip.passenger.name.split(" ")[0]} />
          <Cell label={t(lang, "coach")} value={trip.coach} />
          <Cell label={t(lang, "berth")} value={trip.berth} />
        </div>
      )}
      {onChange && (
        <button type="button" onClick={onChange} className="w-full bg-black/15 py-2 text-sm font-semibold text-brand-100 hover:text-white">
          PNR {trip.pnr} · {t(lang, "edit")}
        </button>
      )}
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-brand-800 px-2 py-2">
      <div className="truncate text-[11px] font-semibold text-brand-100">{label}</div>
      <div className="truncate text-base font-bold">{value}</div>
    </div>
  );
}
