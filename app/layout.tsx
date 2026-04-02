import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { PWAProvider } from "@/src/components/PWAProvider";

export const viewport: Viewport = {
  themeColor: "#1a3c6b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};
 
export const metadata: Metadata = {
  title: "Alɔdó",
  description: "Plateforme intelligente pour l'économie informelle",
  applicationName: "Alɔdó",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Alɔdó",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" style={{ margin: 0, padding: 0 }} data-scroll-behavior="smooth">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Alɔdó" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body style={{ 
        margin: 0, 
        padding: 0,
      }}>
        <PWAProvider>
          <div className="app-content">
            {children}
          </div>
          <Navbar />
        </PWAProvider>
      </body>
    </html>
  );
}