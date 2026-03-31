"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Smartphone, Zap, Check, AlertCircle, FileText } from "lucide-react";

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

export default function DemoInfo() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.gray50,
        padding: "16px",
        paddingTop: "24px",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header Back Button */}
        <button
          onClick={() => router.back()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "none",
            border: "none",
            color: colors.deepBlue,
            cursor: "pointer",
            marginBottom: "24px",
            padding: "8px 0",
            fontSize: "16px",
            fontWeight: 500,
          }}
        >
          <ArrowLeft size={20} />
          Retour
        </button>

        {/* Title */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <Smartphone size={32} color={colors.deepBlue} />
            <h1 style={{ fontSize: "32px", fontWeight: 700, color: colors.deepBlue, margin: 0 }}>
              ALODO USSD Simulator
            </h1>
          </div>
          <p style={{ fontSize: "16px", color: colors.gray600, margin: 0 }}>
            Simulation d'une interface USSD pour consulter et postuler aux opportunités
          </p>
        </div>

        {/* Main Content Grid */}
        <div style={{ display: "grid", gap: "24px" }}>
          {/* How It Works */}
          <div
            style={{
              background: colors.white,
              borderRadius: "16px",
              padding: "24px",
              border: `1px solid ${colors.gray200}`,
            }}
          >
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: colors.deepBlue, marginTop: 0 }}>
              <Zap size={24} style={{ display: "inline", marginRight: "8px", verticalAlign: "middle" }} />
              Comment ça marche?
            </h2>

            <div style={{ gap: "16px", display: "flex", flexDirection: "column", marginTop: "16px" }}>
              {[
                {
                  step: "1",
                  title: "Composez votre numéro",
                  desc: "Entrez votre ID de profil ou composez *202#",
                },
                {
                  step: "2",
                  title: "Consultez les opportunités",
                  desc: "Voir la liste des opportunités avec les prix en FCFA",
                },
                {
                  step: "3",
                  title: "Sélectionnez une opportunité",
                  desc: "Tapez le numéro de l'opportunité pour voir les détails",
                },
                {
                  step: "4",
                  title: "Postulez en 1 clic",
                  desc: "Confirmez votre candidature avec un simple '1'",
                },
                {
                  step: "5",
                  title: "Confirmez",
                  desc: "Recevez une confirmation instantanée de votre candidature",
                },
              ].map((item, idx) => (
                <div key={idx} style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${colors.beninGreen}, ${colors.beninYellow})`,
                      color: colors.white,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "16px",
                      flexShrink: 0,
                    }}
                  >
                    {item.step}
                  </div>
                  <div>
                    <h3 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 4px 0", color: colors.deepBlue }}>
                      {item.title}
                    </h3>
                    <p style={{ fontSize: "14px", color: colors.gray600, margin: 0 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          <div
            style={{
              background: colors.white,
              borderRadius: "16px",
              padding: "24px",
              border: `1px solid ${colors.gray200}`,
            }}
          >
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: colors.deepBlue, marginTop: 0 }}>
              <Check size={24} style={{ display: "inline", marginRight: "8px", verticalAlign: "middle" }} />
              Caractéristiques
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "16px",
                marginTop: "16px",
              }}
            >
              {[
                {
                  icon: "💰",
                  title: "Voir les prix",
                  desc: "Consultez les montants en FCFA pour chaque opportunité",
                },
                {
                  icon: "📋",
                  title: "Détails complets",
                  desc: "Description, institution, date limite et plus",
                },
                {
                  icon: "⚡",
                  title: "Candidature rapide",
                  desc: "Postulez en quelques secondes sans formulaire",
                },
                {
                  icon: "📱",
                  title: "Interface simple",
                  desc: "Design minimaliste comme un vrai système USSD",
                },
                {
                  icon: "🎯",
                  title: "Score de matching",
                  desc: "Voir votre compatibilité avec chaque opportunité",
                },
                {
                  icon: "✅",
                  title: "Confirmation instantanée",
                  desc: "Recevez une confirmation immédiate",
                },
              ].map((feature, idx) => (
                <div key={idx} style={{ padding: "16px", background: colors.gray50, borderRadius: "12px" }}>
                  <div style={{ fontSize: "24px", marginBottom: "8px" }}>{feature.icon}</div>
                  <h3 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 4px 0", color: colors.deepBlue }}>
                    {feature.title}
                  </h3>
                  <p style={{ fontSize: "14px", color: colors.gray600, margin: 0 }}>{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Example */}
          <div
            style={{
              background: colors.white,
              borderRadius: "16px",
              padding: "24px",
              border: `1px solid ${colors.gray200}`,
            }}
          >
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: colors.deepBlue, marginTop: 0 }}>
              <FileText size={24} style={{ display: "inline", marginRight: "8px", verticalAlign: "middle" }} />
              Exemple d'utilisation
            </h2>

            <div style={{ marginTop: "16px", background: colors.gray50, borderRadius: "12px", padding: "16px", fontSize: "14px", fontFamily: "monospace" }}>
              <p style={{ margin: "8px 0", color: colors.gray700 }}>
                <strong>Vous:</strong> 550e8400-e29b-41d4-a716-446655440000
              </p>
              <p style={{ margin: "8px 0", color: colors.gray500 }}>
                <em>Chargement du profil...</em>
              </p>
              <p style={{ margin: "8px 0", color: colors.gray700 }}>
                <strong>Système:</strong> 📋 Vos Opportunités:
              </p>
              <p style={{ margin: "8px 0", color: colors.gray600 }}>
                1. Développeur Full Stack<br />
                💰 500K - 1.5M FCFA<br />
                🏢 Tech Startup Cotonou<br />
                <br />
                2. Manager de projet<br />
                💰 800K - 2M FCFA<br />
                🏢 Cabinet de Consulting
              </p>
              <p style={{ margin: "8px 0", color: colors.gray700 }}>
                <strong>Vous:</strong> 1
              </p>
              <p style={{ margin: "8px 0", color: colors.gray500 }}>
                <em>Affichage des détails...</em>
              </p>
              <p style={{ margin: "8px 0", color: colors.gray700 }}>
                <strong>Vous:</strong> 1
              </p>
              <p style={{ margin: "8px 0", color: colors.beninGreen }}>
                <strong>✅ Candidature envoyée avec succès!</strong>
              </p>
            </div>
          </div>

          {/* Technical Info */}
          <div
            style={{
              background: `${colors.beninYellow}20`,
              borderRadius: "16px",
              padding: "24px",
              border: `1px solid ${colors.beninYellow}`,
            }}
          >
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: colors.deepBlue, marginTop: 0 }}>
              <AlertCircle size={20} style={{ display: "inline", marginRight: "8px", verticalAlign: "middle" }} />
              Information technique
            </h3>
            <ul style={{ fontSize: "14px", color: colors.gray700, paddingLeft: "24px", margin: "12px 0 0 0" }}>
              <li>Les données proviennent de Supabase en temps réel</li>
              <li>Les candidatures sont enregistrées dans la base de données</li>
              <li>Les logs USSD sont stockés pour analyse</li>
              <li>Compatible avec tous les appareils (desktop, tablet, mobile)</li>
              <li>Fonctionne sans JavaScript (simulation USSD authentique)</li>
            </ul>
          </div>

          {/* CTA Button */}
          <button
            onClick={() => router.push("/demo")}
            style={{
              width: "100%",
              padding: "16px",
              background: `linear-gradient(135deg, ${colors.deepBlue}, ${colors.beninGreen})`,
              color: colors.white,
              border: "none",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseOver={(e) => {
              (e.target as HTMLElement).style.transform = "translateY(-2px)";
              (e.target as HTMLElement).style.boxShadow = "0 8px 20px rgba(26,60,107,0.3)";
            }}
            onMouseOut={(e) => {
              (e.target as HTMLElement).style.transform = "translateY(0)";
              (e.target as HTMLElement).style.boxShadow = "none";
            }}
          >
            Essayer le simulateur USSD →
          </button>
        </div>
      </div>
    </div>
  );
}
