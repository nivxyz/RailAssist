import type { Metadata } from "next";
import { StationDashboard } from "@/components/station/StationDashboard";

export const metadata: Metadata = {
  title: "RailAssist · Station Desk",
  // Installs as its own PC app ("RailAssist Station Desk").
  manifest: "/station.webmanifest",
};

export default function StationPage() {
  return <StationDashboard />;
}
