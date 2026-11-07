import type { NeedType } from "@/lib/types";

type P = { className?: string };
const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
  "aria-hidden": true,
};

export const MicIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8" />
  </svg>
);
export const StopIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor" />
  </svg>
);
export const TrainIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <rect x="5" y="3" width="14" height="14" rx="3" />
    <path d="M5 11h14M9 21l-2-4M15 21l2-4" />
    <circle cx="9" cy="14" r=".6" fill="currentColor" />
    <circle cx="15" cy="14" r=".6" fill="currentColor" />
  </svg>
);
export const CheckIcon = ({ className }: P) => (
  <svg {...base} strokeWidth={2.6} className={className}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);
export const BellIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 21h4" />
  </svg>
);
export const ClockIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
export const AlertIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M12 3l9.5 17h-19z" />
    <path d="M12 10v4M12 17.5v.01" />
  </svg>
);
export const HeartIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
  </svg>
);
export const ListIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M9 6h11M9 12h11M9 18h11" />
    <path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2" />
  </svg>
);
export const PinIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
);

export const PhoneIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
  </svg>
);
export const LinkIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </svg>
);

const NEED_PATHS: Record<NeedType, React.ReactNode> = {
  wheelchair: (
    <>
      <circle cx="10" cy="4" r="1.6" />
      <path d="M10 7v6h6l2 5M10 10h5" />
      <path d="M7.5 11.5a5 5 0 1 0 7.3 6" />
    </>
  ),
  porter: (
    <>
      <rect x="5" y="8" width="14" height="11" rx="2" />
      <path d="M9 8V5h6v3M5 13h14" />
    </>
  ),
  battery_car: (
    <>
      <path d="M4 15V9l2-3h9l3 4h2v5" />
      <path d="M4 15h16" />
      <circle cx="8" cy="17" r="2" />
      <circle cx="16" cy="17" r="2" />
      <path d="M11 8.5l-1 2h2l-1 2" />
    </>
  ),
  lower_berth: (
    <>
      <path d="M3 18V8M21 18v-5H3" />
      <path d="M3 13h5a2 2 0 0 0 2-2V9" />
      <circle cx="7" cy="9.5" r="1.5" />
    </>
  ),
  meal: (
    <>
      <path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10" />
      <path d="M17 21V3c-2 1.5-3 4-3 7h3" />
    </>
  ),
  medical: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  escort: (
    <>
      <circle cx="8" cy="5" r="2" />
      <circle cx="16" cy="5" r="2" />
      <path d="M8 8v6M6 21l2-7 2 7M16 8v6M14 21l2-7 2 7M8 10h8" />
    </>
  ),
  other: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.4M12 17h.01" />
    </>
  ),
};

export function NeedIcon({ type, className }: { type: NeedType; className?: string }) {
  return (
    <svg {...base} className={className}>
      {NEED_PATHS[type]}
    </svg>
  );
}
