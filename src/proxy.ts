import { NextResponse, userAgent, type NextRequest } from "next/server";

/**
 * Opening the site address picks the right view for the device:
 *   phone / tablet -> the passenger app (/app)
 *   PC             -> the station desk (/station)
 * Everyone can still reach /download to see both and install the app.
 */
export function proxy(request: NextRequest) {
  const { device } = userAgent(request);
  const isPhone = device.type === "mobile" || device.type === "tablet";
  // 307 = temporary, so browsers don't remember it if someone switches device mode.
  return NextResponse.redirect(new URL(isPhone ? "/app" : "/station", request.url), 307);
}

export const config = {
  matcher: "/",
};
