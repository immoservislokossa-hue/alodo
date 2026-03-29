"use client";

import { useRouter } from "next/navigation";
import { 
  Briefcase, 
  FileText, 
  TrendingUp, 
  Calendar,
  Users,
  DollarSign,
  ArrowRight
} from "lucide-react";

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
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray600: "#4B5563",
};

export default function PrestatairePage() {
  const router = useRouter();

  const modules = [
    {
      title: "Projets & Clients",
      description: "Gérez vos projets, clients et interventions",
      icon: Briefcase,
      path: "/prestataire/projets",
      color: colors.deepBlue,
    },
    {
      title: "Documents",
      description: "Créez et gérez devis, factures et contrats",
      icon: FileText,
      path: "/prestataire/documents",
      color: colors.beninGreen,
    },
    {
      title: "Transactions",
      description: "Suivez vos revenus et dépenses",
      icon: TrendingUp,
      path: "/prestataire/transactions",
      color: colors.beninYellow,
    },
    {
      title: "Rapports",
      description: "Consultez tous vos rapports et statistiques",
      icon: Calendar,
      path: "/prestataire/rapports",
      color: colors.beninRed,
    },
  ];

  return (
    <div style={{ backgroundColor: colors.gray50, minHeight: "100vh" }}>
      {/* Barre tricolore */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "3px",
        display: "flex",
        zIndex: 50,
      }}>
        <div style={{ flex: 1, backgroundColor: colors.beninGreen }} />
        <div style={{ flex: 1, backgroundColor: colors.beninYellow }} />
        <div style={{ flex: 1, backgroundColor: colors.beninRed }} />
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "100px 24px 60px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h1 style={{
            fontSize: "36px",
            fontWeight: 700,
            fontFamily: "'Playfair Display', serif",
            color: colors.deepBlue,
            marginBottom: "12px",
          }}>
            Espace Prestataire
          </h1>
          <p style={{ fontSize: "16px", color: colors.gray500 }}>
            Gérez votre activité professionnelle
          </p>
        </div>

        {/* Modules */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "24px",
          marginBottom: "48px",
        }}>
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <button
                key={module.path}
                onClick={() => router.push(module.path)}
                style={{
                  backgroundColor: colors.white,
                  padding: "32px 24px",
                  borderRadius: "20px",
                  border: `1px solid ${colors.gray200}`,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 10px 25px -5px rgba(0,0,0,0.1)";
                  e.currentTarget.style.borderColor = module.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = colors.gray200;
                }}
              >
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  backgroundColor: `${module.color}10`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "20px",
                }}>
                  <Icon size={24} color={module.color} />
                </div>
                <h2 style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  color: colors.gray600,
                  marginBottom: "8px",
                }}>
                  {module.title}
                </h2>
                <p style={{
                  fontSize: "14px",
                  color: colors.gray500,
                  marginBottom: "20px",
                  lineHeight: 1.4,
                }}>
                  {module.description}
                </p>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "13px",
                  color: module.color,
                  fontWeight: 500,
                }}>
                  Accéder
                  <ArrowRight size={14} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Statistiques rapides */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          paddingTop: "24px",
          borderTop: `1px solid ${colors.gray200}`,
        }}>
          <div style={{ textAlign: "center" }}>
            <Users size={20} color={colors.gray400} style={{ marginBottom: "8px" }} />
            <div style={{ fontSize: "24px", fontWeight: 600, color: colors.deepBlue }}>0</div>
            <div style={{ fontSize: "12px", color: colors.gray500 }}>Clients</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <Briefcase size={20} color={colors.gray400} style={{ marginBottom: "8px" }} />
            <div style={{ fontSize: "24px", fontWeight: 600, color: colors.deepBlue }}>0</div>
            <div style={{ fontSize: "12px", color: colors.gray500 }}>Projets</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <FileText size={20} color={colors.gray400} style={{ marginBottom: "8px" }} />
            <div style={{ fontSize: "24px", fontWeight: 600, color: colors.deepBlue }}>0</div>
            <div style={{ fontSize: "12px", color: colors.gray500 }}>Documents</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <DollarSign size={20} color={colors.gray400} style={{ marginBottom: "8px" }} />
            <div style={{ fontSize: "24px", fontWeight: 600, color: colors.deepBlue }}>0 FCFA</div>
            <div style={{ fontSize: "12px", color: colors.gray500 }}>Chiffre d&apos;affaires</div>
          </div>
        </div>
      </div>
    </div>
  );
}