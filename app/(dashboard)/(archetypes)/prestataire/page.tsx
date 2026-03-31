"use client";

import Link from "next/link";
import { 
  Briefcase, 
  FileText, 
  TrendingUp, 
  Calendar,
  Calculator,
  Clock
} from "lucide-react";

const colors = {
  white: "#FFFFFF",
  deepBlue: "#1a3c6b",
  deepBlueDark: "#0e2a4a",
  beninGreen: "#008751",
  beninYellow: "#FCD116",
  beninRed: "#E8112D",
  beninBlue: "#3498db",
  grayBg: "#F9FAFB",
  grayBorder: "#E5E7EB",
  grayText: "#6B7280",
  grayTitle: "#374151",
};

// 6 modules avec couleurs intégrées
const modules = [
  {
    href: "/prestataire/projets",
    icon: Briefcase,
    color: colors.deepBlue,
    bgLight: "#E8F0F9",
    title: "Projets & Clients",
    description: "Gérez vos projets, clients et interventions"
  },
  {
    href: "/prestataire/documents",
    icon: FileText,
    color: colors.beninGreen,
    bgLight: "#E8F5E9",
    title: "Documents",
    description: "Créez et gérez devis, factures et contrats"
  },
  {
    href: "/prestataire/transactions",
    icon: TrendingUp,
    color: colors.beninYellow,
    bgLight: "#FFF9E6",
    title: "Transactions",
    description: "Suivez vos revenus et dépenses"
  },
  {
    href: "/prestataire/rapports",
    icon: Calendar,
    color: colors.beninRed,
    bgLight: "#FFEBEE",
    title: "Rapports",
    description: "Consultez tous vos rapports et statistiques"
  },
  {
    href: "/simple/boitier",
    icon: Calculator,
    color: colors.beninBlue,
    bgLight: "#E3F2FD",
    title: "Boitier",
    description: "Calculatrice et transactions immédiates"
  },
  {
    href: "/simple/historique",
    icon: Clock,
    color: colors.grayTitle,
    bgLight: "#F3F4F6",
    title: "Historique",
    description: "Toutes vos opérations"
  }
];

export default function PrestatairePage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: colors.grayBg,
      padding: "24px 16px 90px 16px", // Ajout de padding-bottom: 90px pour la navbar mobile
    }}>
      <div style={{
        maxWidth: "900px",
        margin: "0 auto",
      }}>
        
        {/* Barre de couleurs */}
        <div style={{
          display: "flex",
          gap: "6px",
          marginBottom: "32px",
          justifyContent: "center"
        }}>
          <div style={{ width: "45px", height: "3px", background: colors.deepBlue, borderRadius: "2px" }} />
          <div style={{ width: "45px", height: "3px", background: colors.beninGreen, borderRadius: "2px" }} />
          <div style={{ width: "45px", height: "3px", background: colors.beninYellow, borderRadius: "2px" }} />
          <div style={{ width: "45px", height: "3px", background: colors.beninRed, borderRadius: "2px" }} />
          <div style={{ width: "45px", height: "3px", background: colors.beninBlue, borderRadius: "2px" }} />
          <div style={{ width: "45px", height: "3px", background: colors.grayTitle, borderRadius: "2px" }} />
        </div>

        {/* Titre caché sur mobile */}
        <div style={{
          textAlign: "center",
          marginBottom: "32px",
        }}>
          <h1 style={{
            fontSize: "26px",
            fontWeight: 600,
            color: colors.deepBlue,
            marginBottom: "6px",
            letterSpacing: "-0.3px",
            display: "block",
          }}>
            Espace Prestataire
          </h1>
          <p style={{
            fontSize: "13px",
            color: colors.grayText,
          }}>
            Gérez votre activité professionnelle
          </p>
        </div>

        {/* Grille 2 colonnes avec 6 modules */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "16px",
        }}>
          {modules.map((module) => {
            const Icon = module.icon;
            
            return (
              <Link
                key={module.href}
                href={module.href}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: module.bgLight,
                  borderRadius: "20px",
                  padding: "28px 16px",
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                  minHeight: "180px",
                  width: "100%",
                  border: `2px solid ${module.color}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow = `0 8px 20px -8px ${module.color}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* Icône avec fond coloré */}
                <div style={{
                  width: "70px",
                  height: "70px",
                  borderRadius: "35px",
                  background: module.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "16px",
                }}>
                  <Icon size={36} color={colors.white} strokeWidth={1.5} />
                </div>
                
                {/* Titre coloré */}
                <div style={{
                  fontSize: "17px",
                  fontWeight: 600,
                  color: module.color,
                  marginBottom: "6px",
                  textAlign: "center",
                }}>
                  {module.title}
                </div>
               
              </Link>
            );
          })}
        </div>

        {/* Pied de page avec espace supplémentaire pour mobile */}
        <div style={{
          height: "20px",
        }} />
      </div>
    </div>
  );
}