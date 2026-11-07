"use client";

import { useEffect, useState } from "react";
import { addDelay, advanceTrain, restartTrip, resetDemo } from "@/lib/actions";
import { DEMO_DELAY_MINUTES } from "@/lib/config";

/**
 * Hidden presenter controls. Keyboard shortcuts work on every page:
 *   D        add a 40-minute delay
 *   N        move the train forward (depart / next station)
 *   Shift+R  restart the trip (same PNR)
 * A tiny dot in the bottom-left corner opens a small panel with the same buttons.
 */
export function DemoControls() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === "d") addDelay();
      else if (k === "n") advanceTrain();
      else if (k === "r" && e.shiftKey) restartTrip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="fixed bottom-3 left-3 z-[100]">
      {open && (
        <div className="anim-fade-up mb-2 w-56 rounded-2xl border border-line bg-white p-2 text-sm shadow-xl">
          <div className="px-2 pb-1 pt-1 text-xs font-bold text-muted">Demo controls</div>
          <Btn onClick={() => addDelay()} k="D">Add {DEMO_DELAY_MINUTES} min delay</Btn>
          <Btn onClick={() => advanceTrain()} k="N">Move train forward</Btn>
          <Btn onClick={() => restartTrip()} k="⇧R">Restart trip</Btn>
          <Btn
            onClick={() => {
              if (confirm("Clear the whole demo, including the PNR?")) resetDemo();
            }}
          >
            Clear everything
          </Btn>
        </div>
      )}
      <button
        type="button"
        aria-label="Demo controls"
        onClick={() => setOpen((o) => !o)}
        className="h-3.5 w-3.5 rounded-full bg-brand-900/15 transition hover:bg-brand-900/40"
      />
    </div>
  );
}

function Btn({ children, onClick, k }: { children: React.ReactNode; onClick: () => void; k?: string }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left font-medium text-ink hover:bg-brand-50">
      <span>{children}</span>
      {k && <kbd className="rounded-md border border-line bg-paper px-1.5 text-xs font-semibold text-muted">{k}</kbd>}
    </button>
  );
}
