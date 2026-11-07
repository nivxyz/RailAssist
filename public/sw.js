// Minimal service worker so browsers offer "Install app".
// It does not cache anything: the app always loads fresh from the network,
// so a demo never shows stale code.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {
  // Pass through to the network (default behaviour).
});
