import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/providers";
import { PWAProvider } from "@/components/pwa/pwa-provider";
import { SupabaseSetupBanner } from "@/components/supabase/setup-banner";

export const metadata: Metadata = {
  title: "Keuangan Keluarga — Abi & Umi",
  description:
    "Aplikasi keuangan keluarga: catat pemasukan, pengeluaran, transfer, anggaran bulanan, aset & kewajiban, dengan ekspor Excel/PDF. Bekerja offline.",
  keywords: [
    "keuangan keluarga",
    "anggaran",
    "catatan keuangan",
    "abi umi",
    "keuangan rumah tangga",
    "PWA",
    "offline",
  ],
  authors: [{ name: "Keluarga" }],
  manifest: "/manifest.json",
  applicationName: "Keuangan Keluarga",
  appleWebApp: {
    capable: true,
    title: "Keuangan Keluarga",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/icons/favicon-32.png"],
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  openGraph: {
    title: "Keuangan Keluarga — Abi & Umi",
    description:
      "Catatan keuangan keluarga dengan anggaran, aset, dan ekspor Excel/PDF. Bekerja offline.",
    type: "website",
    locale: "id_ID",
    siteName: "Keuangan Keluarga",
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512 }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#10b981" },
    { media: "(prefers-color-scheme: dark)", color: "#047857" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  appleVerifiable: true,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* Meta tag yang TIDAK didukung Metadata API Next.js */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="default"
        />
        <meta name="apple-mobile-web-app-title" content="Keuangan" />
        {/* Tile icon untuk Windows */}
        <meta name="msapplication-TileColor" content="#10b981" />
        <meta name="msapplication-tileImage" content="/icons/icon-192.png" />
        <meta name="msapplication-config" content="none" />
      </head>
      <body className="antialiased bg-background text-foreground min-h-screen">
        <QueryProvider>
          {children}
          <PWAProvider />
          <SupabaseSetupBanner />
        </QueryProvider>
        <Toaster />
        <SonnerToaster richColors position="top-center" />
      </body>
    </html>
  );
}
