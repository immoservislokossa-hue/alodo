import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alɔdó",
  description: "Plateforme intelligente pour l'économie informelle",
  applicationName: "Alɔdó",
  themeColor: "#1a3c6b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}