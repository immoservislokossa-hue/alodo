"use client";

import Link from "next/link";
import { 
  Package, 
  TrendingUp, 
  BarChart3, 
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

// 5 cartes avec couleurs intégrées
const cards = [
  {
    href: "/vendeur/produits",
    icon: Package,
    color: colors.beninGreen,
    bgLight: "#E8F5E9",
    title: "Produits",
    description: "Gestion du catalogue"
  },
  {
    href: "/vendeur/transactions",
    icon: TrendingUp,
    color: colors.beninYellow,
    bgLight: "#FFF9E6",
    title: "Transactions",
    description: "Ventes et achats"
  },
  {
    href: "/vendeur/rapports",
    icon: BarChart3,
    color: colors.beninRed,
    bgLight: "#FFEBEE",
    title: "Rapports",
    description: "Analyses et statistiques"
  },
  {
    href: "/simple/boitier",
    icon: Calculator,
    color: colors.beninBlue,
    bgLight: "#E3F2FD",
    title: "Caisse",
    description: "Calculatrice intégrée"
  },
  {
    href: "/simple/historique",
    icon: Clock,
    color: colors.deepBlue,
    bgLight: "#E8F0F9",
    title: "Historique",
    description: "Toutes les opérations"
  }
];

export default function VendeurPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: colors.grayBg,
      padding: "24px 16px",
    }}>
      <div style={{
        maxWidth: "680px",
        margin: "0 auto",
      }}>
        
        {/* Barre de couleurs - visible sur mobile et desktop */}
        <div style={{
          display: "flex",
          gap: "6px",
          marginBottom: "32px",
          justifyContent: "center"
        }}>
          <div style={{ width: "45px", height: "3px", background: colors.beninGreen, borderRadius: "2px" }} />
          <div style={{ width: "45px", height: "3px", background: colors.beninYellow, borderRadius: "2px" }} />
          <div style={{ width: "45px", height: "3px", background: colors.beninRed, borderRadius: "2px" }} />
          <div style={{ width: "45px", height: "3px", background: colors.beninBlue, borderRadius: "2px" }} />
          <div style={{ width: "45px", height: "3px", background: colors.deepBlue, borderRadius: "2px" }} />
        </div>

        {/* Titre et sous-titre cachés sur mobile, visibles sur desktop */}
        <div style={{
          textAlign: "center",
          marginBottom: "32px",
          display: "block",
        }}>
          <h1 style={{
            fontSize: "26px",
            fontWeight: 600,
            color: colors.deepBlue,
            marginBottom: "6px",
            letterSpacing: "-0.3px"
          }}>
            Tableau de bord
          </h1>
          <p style={{
            fontSize: "13px",
            color: colors.grayText
          }}>
            Accédez rapidement aux fonctionnalités principales
          </p>
        </div>

        {/* Grille 2 colonnes avec cartes colorées */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "16px",
        }}>
          {cards.map((card, index) => {
            const Icon = card.icon;
            const isLastCard = index === 4;
            
            return (
              <Link
                key={card.href}
                href={card.href}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: card.bgLight,
                  borderRadius: "20px",
                  padding: "28px 16px",
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                  minHeight: "180px",
                  width: "100%",
                  border: `2px solid ${card.color}`,
                  ...(isLastCard && {
                    gridColumn: "span 2",
                    maxWidth: "calc(50% - 8px)",
                    margin: "0 auto",
                  })
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow = `0 8px 20px -8px ${card.color}`;
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
                  background: card.color,
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
                  color: card.color,
                  marginBottom: "6px",
                  textAlign: "center",
                }}>
                  {card.title}
                </div>
                
                {/* Description */}
                <div style={{
                  fontSize: "12px",
                  color: colors.grayText,
                  textAlign: "center",
                  lineHeight: 1.4,
                }}>
                  {card.description}
                </div>
              </Link>
            );
          })}
        </div>

       
      </div>
    </div>
  );
}