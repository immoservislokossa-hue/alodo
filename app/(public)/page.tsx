"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Smartphone } from "lucide-react";

const colors = {
  white: "#FFFFFF",
  deepBlue: "#1a3c6b",
  deepBlueDark: "#0e2a4a",
  beninGreen: "#008751",
  beninYellow: "#FCD116",
  beninRed: "#E8112D",
  gray50: "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray300: "#D1D5DB",
  gray500: "#6B7280",
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
    <div
      style={{
        backgroundColor: colors.white,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "0px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
        margin: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-150px",
          right: "-150px",
          width: "400px",
          height: "400px",
          backgroundColor: `${colors.beninGreen}20`,
          borderRadius: "50%",
          filter: "blur(120px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-150px",
          left: "-150px",
          width: "400px",
          height: "400px",
          backgroundColor: `${colors.beninRed}20`,
          borderRadius: "50%",
          filter: "blur(120px)",
          pointerEvents: "none",
        }}
      />

      <h1
        style={{
          fontSize: "clamp(32px, 8vw, 64px)",
          fontWeight: 800,
          color: colors.deepBlue,
          lineHeight: 1.2,
          marginBottom: "20px",
        }}
      >
        L'inclusion financière
        <br />
        <span
          style={{
            background: `linear-gradient(90deg, ${colors.beninGreen}, ${colors.beninYellow}, ${colors.beninRed})`,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          pour l'économie informelle
        </span>
      </h1>

      <p
        style={{
          fontSize: "clamp(14px, 4vw, 20px)",
          color: colors.gray500,
          maxWidth: "520px",
          marginBottom: "12px",
          lineHeight: 1.5,
        }}
      >
        Alɔdó est la première plateforme SaaS qui connecte les MPME, agents terrain et institutions financières.
      </p>
      <p
        style={{
          fontSize: "clamp(14px, 4vw, 20px)",
          color: colors.gray500,
          maxWidth: "520px",
          marginBottom: "28px",
          lineHeight: 1.5,
        }}
      >
        Transformez l'économie informelle en un système structuré et prospère grâce à notre application sécurisée et intuitive.
      </p>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
        {isInstallable && (
          <button
            onClick={handleInstallClick}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              minHeight: "48px",
              padding: "10px 24px",
              backgroundColor: colors.beninYellow,
              border: `2px solid ${colors.beninYellow}`,
              color: colors.deepBlue,
              borderRadius: "12px",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
              transition: "all 200ms ease",
            }}
          >
            <Smartphone size={18} />
            Installer
          </button>
        )}

        <Link
          href="/langue"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            minHeight: "48px",
            padding: "10px 24px",
            backgroundColor: colors.deepBlue,
            color: colors.white,
            borderRadius: "12px",
            fontWeight: 600,
            fontSize: "14px",
            cursor: "pointer",
            textDecoration: "none",
            transition: "all 200ms ease",
          }}
        >
          Commencer
          <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}