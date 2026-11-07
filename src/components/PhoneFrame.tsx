/**
 * On desktop the app sits in a phone-sized frame so it reads as a mobile app
 * when screen-recorded. On a real phone it fills the screen.
 */
export function PhoneFrame({ children, caption }: { children: React.ReactNode; caption?: string }) {
  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center bg-[#ebe3d6] sm:py-3">
      <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-paper sm:h-[min(860px,calc(100dvh-72px))] sm:w-[400px] sm:rounded-[46px] sm:border-[9px] sm:border-[#1b1714] sm:shadow-[0_24px_60px_-24px_rgba(32,27,23,0.5)]">
        <div className="pointer-events-none absolute left-1/2 top-2 z-50 hidden h-6 w-24 -translate-x-1/2 rounded-full bg-[#1b1714] sm:block" />
        {children}
      </div>
      {caption && <p className="mt-2 hidden text-sm font-medium text-muted sm:block">{caption}</p>}
    </div>
  );
}
