import type { Metadata, Viewport } from "next";
import { Figtree, Geist_Mono } from "next/font/google";
import { RegisterSW } from "@/components/RegisterSW";
import "./globals.css";

// Figtree: friendly, very legible at large sizes (good for older readers).
// Indian scripts fall back to the system font (Nirmala UI on Windows).
const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RailAssist",
  description: "Plan station help for elderly and disabled train passengers.",
  // Installable app: the station page swaps in its own manifest.
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "RailAssist", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#6b1623",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${figtree.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
