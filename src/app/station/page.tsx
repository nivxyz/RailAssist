import type { Metadata } from "next";
import { StationDashboard } from "@/components/station/StationDashboard";

export const metadata: Metadata = { title: "RailAssist · Station Desk" };

export default function StationPage() {
  return <StationDashboard />;
}
