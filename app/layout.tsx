import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { PwaRegister } from "@/components/pwa-register";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: "SpendFence",
  description: "A clean local-first budget control app.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg"
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SpendFence"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#183f36"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AppShell>{children}</AppShell>
          <PwaRegister />
        </AuthProvider>
      </body>
    </html>
  );
}
