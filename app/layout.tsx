import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PWAProvider } from "@/components/PWAProvider";
import { InstallPWAButtonDelayed } from "@/components/InstallPWAButtonDelayed";

export const metadata: Metadata = {
  title: "ALODO - Plateforme de Financement Intelligent",
  description: "Plateforme de mise en relation entre micro-entreprises et institutions financières au Bénin",
  manifest: "/manifest.json",
  keywords: ["financement", "MPME", "Bénin", "microentreprises", "institutions financières"],
  authors: [{ name: "ALODO Team" }],
  creator: "ALODO",
  publisher: "ALODO",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://alodo-xi.vercel.app",
    title: "ALODO - Plateforme de Financement Intelligent",
    description: "Plateforme de mise en relation entre micro-entreprises et institutions financières au Bénin",
    siteName: "ALODO",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ALODO",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#008751",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="apple-touch-startup-image" href="/icon-512x512.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ALODO" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body suppressHydrationWarning>
        <PWAProvider>
          <InstallPWAButtonDelayed />
          {children}
        </PWAProvider>
      </body>
    </html>
  );
}
