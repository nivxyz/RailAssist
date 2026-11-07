import Image from "next/image";

/** RailAssist app icon (public/logo.png). */
export function LogoMark({ size = 40 }: { size?: number }) {
  return <Image src="/logo.png" alt="" width={size} height={size} className="shrink-0" priority />;
}

export function Logo({ size = 40, sub }: { size?: number; sub?: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <LogoMark size={size} />
      <div className="min-w-0 leading-tight">
        <div className="font-bold tracking-tight text-brand-900" style={{ fontSize: size * 0.5 }}>
          RailAssist
        </div>
        {sub && <div className="truncate text-[13px] text-muted">{sub}</div>}
      </div>
    </div>
  );
}
