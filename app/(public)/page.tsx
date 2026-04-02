"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Smartphone, ChevronRight, CheckCircle2 } from "lucide-react";

const colors = {
  white: "#FFFFFF",
  deepBlue: "#1a3c6b",
  deepBlueDark: "#0e2a4a",
  beninGreen: "#008751",
  beninYellow: "#FCD116",
  beninRed: "#E8112D",
  gray50: "#F9FAFB",
  gray100: "#F3F4F6",
  gray500: "#6B7280",
  gray600: "#4B5563",
  gray800: "#1F2937",
};

export default function PublicHomePage() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(true);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js");

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstallable(false);
  };

  return (
    <div style={{ backgroundColor: colors.white, minHeight: "100vh", fontFamily: "Inter, system-ui, sans-serif", color: colors.gray800 }}>
      {/* On n'inclut PAS la navbar, le layout.tsx de l'utilisateur s'en charge. */}

      <main style={{ padding: "80px 24px", maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* HERO SECTION */}
        <div style={{ textAlign: "center", marginBottom: "120px" }}>
          <div style={{ display: "inline-block", marginBottom: "40px" }}>
            <h1 style={{ fontFamily: '"Playfair Display", "Merriweather", Georgia, serif', fontSize: "72px", fontWeight: 900, color: colors.deepBlue, letterSpacing: "-1.5px", margin: 0, lineHeight: 1 }}>
              Alɔdó
            </h1>
            <div style={{ display: "flex", height: "6px", width: "100%", marginTop: "8px", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ flex: 1, backgroundColor: colors.beninGreen }} />
              <div style={{ flex: 1, backgroundColor: colors.beninYellow }} />
              <div style={{ flex: 1, backgroundColor: colors.beninRed }} />
            </div>
          </div>

          <h2 style={{ fontFamily: '"Playfair Display", "Merriweather", Georgia, serif', fontSize: "clamp(48px, 6vw, 64px)", fontWeight: 900, color: colors.deepBlue, marginBottom: "4px", letterSpacing: "-1px" }}>
            L'inclusion financière
          </h2>
          <h2 style={{ fontFamily: '"Playfair Display", "Merriweather", Georgia, serif', fontSize: "clamp(48px, 6vw, 64px)", fontWeight: 900, background: `linear-gradient(90deg, ${colors.beninGreen}, ${colors.beninYellow}, ${colors.beninRed})`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", letterSpacing: "-1px", margin: "0 0 32px 0" }}>
            pour l'économie informelle
          </h2>
          
          <div style={{ fontSize: "clamp(16px, 1.5vw, 18px)", color: colors.gray600, maxWidth: "650px", margin: "0 auto 48px auto", lineHeight: 1.7, fontWeight: 500 }}>
            <p style={{ margin: "0 0 12px 0" }}>
              Alɔdó est la première plateforme SaaS qui connecte les MPME, agents terrain et institutions financières.
            </p>
            <p style={{ margin: 0 }}>
              Transformez l'économie informelle en un système structuré et prospère grâce à notre application sécurisée et intuitive.
            </p>
          </div>

          <div style={{ display: "flex", gap: "16px", justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
            {isInstallable && (
              <button 
                onClick={handleInstallClick} 
                style={{ border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "12px", padding: "16px 32px", backgroundColor: colors.beninYellow, color: colors.deepBlue, borderRadius: "12px", fontWeight: 700, fontSize: "16px", transition: "transform 0.2s" }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
              >
                <Smartphone size={20} /> Installer
              </button>
            )}

            <Link 
              href="/langue" 
              style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "12px", padding: "16px 32px", backgroundColor: colors.deepBlue, color: colors.white, borderRadius: "12px", fontWeight: 700, fontSize: "16px", boxShadow: "0 10px 25px rgba(26, 60, 107, 0.2)", transition: "transform 0.2s" }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              Commencer <ChevronRight size={20} />
            </Link>
          </div>
        </div>

        {/* DETAILS SECTION */}
        <div id="mission" style={{ paddingTop: "60px", paddingBottom: "60px" }}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <h2 style={{ fontSize: "36px", fontWeight: 800, color: colors.deepBlue, marginBottom: "16px" }}>
              Le défi des MPME béninoises
            </h2>
            <div style={{ display: "flex", height: "4px", width: "100px", margin: "0 auto", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ flex: 1, backgroundColor: colors.beninGreen }} />
              <div style={{ flex: 1, backgroundColor: colors.beninYellow }} />
              <div style={{ flex: 1, backgroundColor: colors.beninRed }} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "40px", alignItems: "stretch" }}>
            
            {/* Left Content */}
            <div style={{ alignSelf: "center" }}>
              <p style={{ fontSize: "16px", color: colors.gray600, lineHeight: 1.7, marginBottom: "32px", fontWeight: 500 }}>
                Au Bénin, les MPME représentent plus de <strong>80%</strong> du tissu économique, mais restent exclues du système financier formel à cause de barrières structurelles :
              </p>
              
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "20px" }}>
                {[
                  "Manque d'informations fiables sur les marchés locaux",
                  "Absence de comptabilité formelle et de preuves de viabilité",
                  "Accès limité aux outils de financement adaptés",
                  "Faible niveau de formalisation administrative"
                ].map((item, i) => (
                  <li key={i} style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                    <div style={{ color: colors.beninGreen, marginTop: "2px" }}>
                      <CheckCircle2 size={24} fill={`${colors.beninGreen}20`} />
                    </div>
                    <span style={{ fontSize: "16px", color: colors.gray800, fontWeight: 500, lineHeight: 1.5 }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right Card */}
            <div style={{ 
              backgroundColor: colors.deepBlue, 
              background: `linear-gradient(135deg, ${colors.deepBlue} 0%, ${colors.deepBlueDark} 100%)`,
              borderRadius: "24px", 
              padding: "48px 40px", 
              color: colors.white,
              boxShadow: "0 25px 50px -12px rgba(26, 60, 107, 0.4)",
              position: "relative",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center"
            }}>
              <h3 style={{ fontSize: "32px", fontWeight: 800, marginBottom: "16px", color: colors.white }}>Notre Mission</h3>
              <div style={{ display: "flex", height: "4px", width: "60px", marginBottom: "32px", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{ flex: 1, backgroundColor: colors.beninGreen }} />
                <div style={{ flex: 1, backgroundColor: colors.beninYellow }} />
                <div style={{ flex: 1, backgroundColor: colors.beninRed }} />
              </div>
              
              <p style={{ fontSize: "18px", lineHeight: 1.7, color: colors.white, fontWeight: 400, opacity: 0.95, marginBottom: "40px" }}>
                "Réduire les barrières entre l'économie informelle et le système financier formel en combinant technologie accessible et action de proximité."
              </p>
              
              <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "1.5px", color: colors.beninYellow, borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "24px" }}>
                APPROCHE HYBRIDE • BÉNIN
              </div>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}