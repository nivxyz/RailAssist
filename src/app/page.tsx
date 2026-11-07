import { Landing } from "@/components/landing/Landing";

// Normally src/proxy.ts sends visitors to /app (phones) or /station (PCs).
// This page is only a fallback if that redirect doesn't run.
export default function Home() {
  return <Landing />;
}
