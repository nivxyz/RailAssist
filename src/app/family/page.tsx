import type { Metadata } from "next";
import { FamilyView } from "@/components/family/FamilyView";

export const metadata: Metadata = { title: "RailAssist · Family" };

export default function FamilyPage() {
  return <FamilyView />;
}
