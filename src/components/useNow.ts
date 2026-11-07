"use client";

import { useEffect, useState } from "react";

/** Current time, refreshed every second (0 before mount). Used to expire highlights. */
export function useNow() {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}
