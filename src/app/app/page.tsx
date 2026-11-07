import { redirect } from "next/navigation";

// Old address (and older installed apps) now open the chatbot.
export default function OldAppPage() {
  redirect("/");
}
