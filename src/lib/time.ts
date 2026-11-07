/** Format minutes-after-midnight as "3:10 PM". */
export function fmtTime(mins: number): string {
  const m = ((Math.round(mins) % 1440) + 1440) % 1440;
  const h24 = Math.floor(m / 60);
  const mm = m % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${mm.toString().padStart(2, "0")} ${h24 < 12 ? "AM" : "PM"}`;
}

export function dayOffset(mins: number): number {
  return Math.floor(mins / 1440);
}

export function fmtDate(iso: string, addDays = 0): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + addDays);
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

export function todayIso(): string {
  const d = new Date();
  const p = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
