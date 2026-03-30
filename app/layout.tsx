import type { Metadata } from "next";
import "./globals.css";
import LogoutHeader from "@/components/LogoutHeader";
 
export const metadata: Metadata = {
  title: "Alɔdó",
  description: "Plateforme intelligente pour l'économie informelle",
  applicationName: "Alɔdó",
  themeColor: "#1a3c6b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <LogoutHeader />
        
          <div style={{ paddingTop: 64 }}>
     
            {children}
          </div>
        
      </body>
    </html>
  );
}