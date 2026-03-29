"use client";

import Link from "next/link";
import { Calculator, History, ArrowRight } from "lucide-react";

const colors = {
  white: "#FFFFFF",
  deepBlue: "#1a3c6b",
  deepBlueDark: "#0e2a4a",
  beninGreen: "#008751",
  beninYellow: "#FCD116",
  beninRed: "#E8112D",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray300: "#D1D5DB",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray600: "#4B5563",
};

export default function VendeurSimplePage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: colors.white,
      fontFamily: "system-ui, -apple-system, sans-serif",
      padding: "24px",
    }}>
      <div style={{
        maxWidth: "800px",
        margin: "0 auto",
      }}>
        
        {/* Barre tricolore */}
        <div style={{
          display: "flex",
          gap: "4px",
          marginBottom: "32px",
        }}>
          <div style={{ flex: 1, height: "3px", background: colors.beninGreen, borderRadius: "2px" }} />
          <div style={{ flex: 1, height: "3px", background: colors.beninYellow, borderRadius: "2px" }} />
          <div style={{ flex: 1, height: "3px", background: colors.beninRed, borderRadius: "2px" }} />
        </div>

        {/* Header */}
        <div style={{
          marginBottom: "48px",
          textAlign: "center",
        }}>
          <div style={{
            width: "64px",
            height: "64px",
            background: colors.deepBlue,
            borderRadius: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}>
            <span style={{ fontSize: "32px", fontWeight: 700, color: colors.white }}>A</span>
          </div>
          <h1 style={{
            fontSize: "32px",
            fontWeight: 700,
            fontFamily: "'Playfair Display', serif",
            color: colors.deepBlue,
            marginBottom: "12px",
            letterSpacing: "-0.02em",
          }}>
            Alɔdó
          </h1>
        </div>

        {/* Deux boutons principaux avec couleurs distinctes */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
          marginBottom: "32px",
        }}>
          {/* Boitier - Bleu */}
          <Link
            href="/simple/boitier"
            style={{
              background: `${colors.deepBlue}08`,
              borderRadius: "24px",
              padding: "40px 24px",
              textDecoration: "none",
              textAlign: "center",
              transition: "all 0.2s ease",
              border: `1px solid ${colors.deepBlue}20`,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.background = `${colors.deepBlue}12`;
              e.currentTarget.style.borderColor = colors.deepBlue;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.background = `${colors.deepBlue}08`;
              e.currentTarget.style.borderColor = `${colors.deepBlue}20`;
            }}
          >
            <div style={{
              width: "72px",
              height: "72px",
              background: `${colors.deepBlue}15`,
              borderRadius: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}>
              <Calculator size={36} color={colors.deepBlue} />
            </div>
            <h2 style={{
              fontSize: "24px",
              fontWeight: 600,
              color: colors.deepBlue,
              marginBottom: "8px",
            }}>
              Boitier
            </h2>
            <p style={{
              fontSize: "14px",
              color: colors.gray500,
            }}>
              Calculatrice et transactions
            </p>
          </Link>

          {/* Historique - Vert */}
          <Link
            href="/simple/historique"
            style={{
              background: `${colors.beninGreen}08`,
              borderRadius: "24px",
              padding: "40px 24px",
              textDecoration: "none",
              textAlign: "center",
              transition: "all 0.2s ease",
              border: `1px solid ${colors.beninGreen}20`,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.background = `${colors.beninGreen}12`;
              e.currentTarget.style.borderColor = colors.beninGreen;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.background = `${colors.beninGreen}08`;
              e.currentTarget.style.borderColor = `${colors.beninGreen}20`;
            }}
          >
            <div style={{
              width: "72px",
              height: "72px",
              background: `${colors.beninGreen}15`,
              borderRadius: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}>
              <History size={36} color={colors.beninGreen} />
            </div>
            <h2 style={{
              fontSize: "24px",
              fontWeight: 600,
              color: colors.deepBlue,
              marginBottom: "8px",
            }}>
              Historique
            </h2>
            <p style={{
              fontSize: "14px",
              color: colors.gray500,
            }}>
              Toutes vos transactions
            </p>
          </Link>
        </div>

        {/* Lien retour discret */}
        <div style={{ textAlign: "center" }}>
          <Link
            href="/vendeur"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              fontSize: "13px",
              color: colors.gray500,
              textDecoration: "none",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = colors.deepBlue}
            onMouseLeave={(e) => e.currentTarget.style.color = colors.gray500}
          >
            <ArrowRight size={14} style={{ transform: "rotate(180deg)" }} />
            Retour
          </Link>
        </div>
      </div>
    </div>
  );
}