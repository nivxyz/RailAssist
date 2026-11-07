import type { Metadata } from "next";
import { Landing } from "@/components/landing/Landing";

export const metadata: Metadata = { title: "Get RailAssist" };

export default function DownloadPage() {
  return <Landing />;
}
