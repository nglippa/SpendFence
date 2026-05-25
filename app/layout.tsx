import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { PwaRegister } from "@/components/pwa-register";
import { AppearanceProvider, appearanceInitScript } from "@/lib/appearance";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  applicationName: "SpendFence",
  title: "SpendFence",
  description: "A clean local-first budget control app.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/spendfence-logo-light.png", type: "image/png" }
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SpendFence"
  },
  formatDetection: {
    telephone: false
  },
  other: {
    "msapplication-TileColor": "#0B1114"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F7F6" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1114" }
  ]
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: appearanceInitScript }} />
        <AppearanceProvider>
          <AuthProvider>
            <AppShell>{children}</AppShell>
            <PwaRegister />
          </AuthProvider>
        </AppearanceProvider>
      </body>
    </html>
  );
}
