import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const viewport: Viewport = {
  themeColor: "#1a3c6b",
};
 
export const metadata: Metadata = {
  title: "Alɔdó",
  description: "Plateforme intelligente pour l'économie informelle",
  applicationName: "Alɔdó",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" style={{ margin: 0, padding: 0 }}>
      <body style={{ 
        margin: 0, 
        padding: 0,
        paddingBottom: "80px", // Ajout du padding bas pour la navbar mobile
      }}>
        <div style={{
          minHeight: "100vh",
          paddingBottom: "80px", // Padding supplémentaire
        }}>
          {children}
        </div>
        <Navbar />
      </body>
    </html>
  );
}