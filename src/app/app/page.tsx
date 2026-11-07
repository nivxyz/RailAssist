import type { Metadata } from "next";
import { PassengerApp } from "@/components/passenger/PassengerApp";

export const metadata: Metadata = { title: "RailAssist" };

export default function PassengerPage() {
  return <PassengerApp />;
}
