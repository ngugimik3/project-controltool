import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastHost } from "@/components/toast";

export const metadata: Metadata = {
  title: "Project Control · Davis & Shirtliff",
  description: "Track engineering projects from inception to handover.",
};

export const viewport: Viewport = {
  themeColor: "#0082d6",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <ToastHost />
      </body>
    </html>
  );
}
