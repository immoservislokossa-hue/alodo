"use client";

import { useRouter } from "next/navigation";
import { Smartphone, ArrowRight, Zap, Users, TrendingUp, Globe } from "lucide-react";

const colors = {
  white: "#FFFFFF",
  deepBlue: "#1a3c6b",
  beninGreen: "#008751",
  beninYellow: "#FCD116",
  beninRed: "#E8112D",
  gray50: "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray300: "#D1D5DB",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray600: "#4B5563",
  gray700: "#374151",
  gray800: "#1F2937",
};

export default function DemoHome() {
  const router = useRouter();

  return (
    <div style={{ minHeight: "100vh", background: colors.gray50 }}>
      {/* Navigation Header */}
      <div
        style={{
          background: colors.white,
          borderBottom: `1px solid ${colors.gray200}`,
          padding: "16px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Smartphone size={28} color={colors.deepBlue} />
          <span style={{ fontSize: "20px", fontWeight: 700, color: colors.deepBlue }}>ALODO USSD</span>
        </div>
        <button
          onClick={() => router.push("/")}
          style={{
            padding: "8px 16px",
            background: colors.gray100,
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 500,
            color: colors.gray700,
            cursor: "pointer",
          }}
        >
          Retour
        </button>
      </div>

      {/* Hero Section */}
      <div style={{ background: `linear-gradient(135deg, ${colors.deepBlue}, ${colors.beninGreen})`, color: colors.white, padding: "60px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <Smartphone style={{ width: "80px", height: "80px", margin: "0 auto 24px" }} />
          <h1 style={{ fontSize: "48px", fontWeight: 700, margin: "0 0 16px 0", lineHeight: 1.2 }}>
            Consulter les Opportunités par USSD
          </h1>
          <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.9)", margin: "0 0 32px 0" }}>
            Composez votre numéro de profil pour voir les opportunités disponibles, les prix en FCFA, et postuler en quelques secondes
          </p>
          <button
            onClick={() => router.push("/demo/simulator")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "14px 32px",
              background: colors.beninYellow,
              color: colors.deepBlue,
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseOver={(e) => {
              (e.target as HTMLElement).style.transform = "translateY(-2px)";
              (e.target as HTMLElement).style.boxShadow = "0 8px 20px rgba(252,209,22,0.3)";
            }}
            onMouseOut={(e) => {
              (e.target as HTMLElement).style.transform = "translateY(0)";
              (e.target as HTMLElement).style.boxShadow = "none";
            }}
          >
            Essayer maintenant <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* Features Grid */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 24px" }}>
        <h2 style={{ fontSize: "32px", fontWeight: 700, color: colors.deepBlue, textAlign: "center", marginBottom: "48px" }}>
          Pourquoi choisir ALODO USSD?
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "24px",
          }}
        >
          {[
            {
              icon: <Zap size={32} color={colors.beninGreen} />,
              title: "Accès rapide",
              desc: "Consultez vos opportunités en quelques secondes sans connexion internet rapide",
            },
            {
              icon: <Globe size={32} color={colors.beninYellow} />,
              title: "Accessible partout",
              desc: "Compatible avec tous les téléphones, y compris les anciens modèles",
            },
            {
              icon: <TrendingUp size={32} color={colors.deepBlue} />,
              title: "Informations claires",
              desc: "Prix, institution, date limite - tout à portée de main",
            },
            {
              icon: <Users size={32} color={colors.beninRed} />,
              title: "Candidature simple",
              desc: "Postulez en un seul taps, sans formulaires compliqués",
            },
          ].map((feature, idx) => (
            <div
              key={idx}
              style={{
                background: colors.white,
                borderRadius: "16px",
                padding: "32px 24px",
                border: `1px solid ${colors.gray200}`,
                textAlign: "center",
              }}
            >
              <div style={{ marginBottom: "16px", display: "flex", justifyContent: "center" }}>{feature.icon}</div>
              <h3 style={{ fontSize: "18px", fontWeight: 600, color: colors.deepBlue, margin: "0 0 12px 0" }}>{feature.title}</h3>
              <p style={{ fontSize: "14px", color: colors.gray600, margin: 0 }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div style={{ background: colors.white, padding: "60px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2 style={{ fontSize: "32px", fontWeight: 700, color: colors.deepBlue, textAlign: "center", marginBottom: "48px" }}>
            Comment ça marche?
          </h2>

          <div style={{ display: "grid", gap: "24px" }}>
            {[
              {
                step: 1,
                title: "Composez votre numéro",
                desc: "Entrez votre ID de profil ou composez *202# pour commencer",
                icon: "📞",
              },
              {
                step: 2,
                title: "Consultez les opportunités",
                desc: "Voyez les opportunités disponibles avec les prix en FCFA",
                icon: "📋",
              },
              {
                step: 3,
                title: "Sélectionnez une opportunité",
                desc: "Tapez le numéro pour voir les détails complets",
                icon: "👆",
              },
              {
                step: 4,
                title: "Postulez maintenant",
                desc: "Confirmez votre candidature en tapant 1",
                icon: "✅",
              },
            ].map((item, idx) => (
              <div key={idx} style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${colors.beninGreen}, ${colors.beninYellow})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "28px",
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: "18px", fontWeight: 600, color: colors.deepBlue, margin: "0 0 8px 0" }}>
                    Étape {item.step}: {item.title}
                  </h3>
                  <p style={{ fontSize: "15px", color: colors.gray600, margin: 0 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div
        style={{
          background: `linear-gradient(135deg, ${colors.deepBlue}, ${colors.beninGreen})`,
          color: colors.white,
          padding: "60px 24px",
          textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: "32px", fontWeight: 700, margin: "0 0 16px 0" }}>Prêt à commencer?</h2>
        <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.9)", margin: "0 0 32px 0" }}>
          Composez votre numéro et découvrez les opportunités qui vous correspondent
        </p>
        <button
          onClick={() => router.push("/demo/simulator")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "14px 32px",
            background: colors.beninYellow,
            color: colors.deepBlue,
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "transform 0.2s",
          }}
          onMouseOver={(e) => {
            (e.target as HTMLElement).style.transform = "translateY(-2px)";
          }}
          onMouseOut={(e) => {
            (e.target as HTMLElement).style.transform = "translateY(0)";
          }}
        >
          Commencer <ArrowRight size={18} />
        </button>
      </div>

      {/* Footer */}
      <div
        style={{
          background: colors.white,
          borderTop: `1px solid ${colors.gray200}`,
          padding: "24px",
          textAlign: "center",
          color: colors.gray600,
          fontSize: "14px",
        }}
      >
        <p style={{ margin: 0 }}>
          ALODO USSD © {new Date().getFullYear()} - Consulte les opportunités depuis n'importe quel téléphone
        </p>
      </div>
    </div>
  );
}
