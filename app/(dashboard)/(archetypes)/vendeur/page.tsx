"use client";

import Link from "next/link";
import { 
  Package, 
  TrendingUp, 
  BarChart3, 
  Calculator, 
  Clock,
  ArrowRight
} from "lucide-react";

const colors = {
  white: "#FFFFFF",
  deepBlue: "#1a3c6b",
  deepBlueDark: "#0e2a4a",
  beninGreen: "#008751",
  beninYellow: "#FCD116",
  beninRed: "#E8112D",
  beninBlue: "#3498db",
  grayBg: "#F8FAFC",
  grayBorder: "#E2E8F0",
  grayText: "#64748B",
  grayTitle: "#1E293B",
};

// 5 cartes avec couleurs intégrées
const cards = [
  {
    href: "/vendeur/produits",
    icon: Package,
    color: colors.beninGreen,
    bgLight: "#F0FDF4",
    title: "Produits",
    description: "Gérez votre catalogue"
  },
  {
    href: "/vendeur/transactions",
    icon: TrendingUp,
    color: colors.beninYellow,
    bgLight: "#FFFBEB",
    title: "Transactions",
    description: "Enregistrez ventes et achats"
  },
  {
    href: "/vendeur/rapports",
    icon: BarChart3,
    color: colors.beninRed,
    bgLight: "#FEF2F2",
    title: "Rapports",
    description: "Analyses financières"
  },
  {
    href: "/simple/boitier",
    icon: Calculator,
    color: colors.beninBlue,
    bgLight: "#EFF6FF",
    title: "Caisse",
    description: "Calculatrice intégrée"
  },
  {
    href: "/simple/historique",
    icon: Clock,
    color: colors.deepBlue,
    bgLight: "#F0F4F8",
    title: "Historique",
    description: "Consulter les opérations"
  }
];

export default function VendeurPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${colors.grayBg} 0%, #FFFFFF 100%)`,
      paddingTop: "80px",
      paddingBottom: "40px",
    }}>
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "0 16px",
      }}>
        
        {/* En-tête */}
        <div style={{
          marginBottom: "48px",
        }}>
          {/* Barre tricolore élégante */}
          <div style={{
            height: "4px",
            background: `linear-gradient(90deg, ${colors.beninGreen} 0%, ${colors.beninYellow} 33%, ${colors.beninRed} 66%, ${colors.beninBlue} 100%)`,
            borderRadius: "2px",
            marginBottom: "32px",
            opacity: 0.6,
          }} />

          <div>
            <h1 style={{
              fontSize: "clamp(24px, 5vw, 42px)",
              fontWeight: 700,
              color: colors.deepBlue,
              marginBottom: "12px",
              letterSpacing: "-0.5px",
            }}>
              Tableau de Bord
            </h1>
            <p style={{
              fontSize: "clamp(13px, 2vw, 16px)",
              color: colors.grayText,
              lineHeight: 1.6,
              maxWidth: "500px",
            }}>
              Accédez à toutes vos fonctionnalités essentielles en un clic. Gérez vos produits, transactions et suivez vos performances financières.
            </p>
          </div>
        </div>

        {/* Grille responsive - 1, 2 ou 3 colonnes selon l'écran */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "24px",
          marginBottom: "40px",
        }}>
          {cards.slice(0, 4).map((card) => {
            const Icon = card.icon;
            
            return (
              <Link
                key={card.href}
                href={card.href}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  background: colors.white,
                  borderRadius: "16px",
                  padding: "32px 24px",
                  textDecoration: "none",
                  transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  cursor: "pointer",
                  border: `2px solid ${card.bgLight}`,
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-8px)";
                  e.currentTarget.style.boxShadow = `0 20px 40px rgba(${parseInt(card.color.slice(1, 3), 16)}, ${parseInt(card.color.slice(3, 5), 16)}, ${parseInt(card.color.slice(5, 7), 16)}, 0.15)`;
                  e.currentTarget.style.borderColor = card.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.05)";
                  e.currentTarget.style.borderColor = card.bgLight;
                }}
              >
                {/* Fond dégradé en arrière-plan */}
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: card.bgLight,
                  opacity: 0.3,
                  zIndex: 0,
                }} />

                {/* Contenu */}
                <div style={{
                  position: "relative",
                  zIndex: 1,
                }}>
                  {/* Icône avec fond coloré */}
                  <div style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "14px",
                    background: card.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "20px",
                    transition: "transform 0.3s ease",
                  }}>
                    <Icon size={32} color={colors.white} strokeWidth={1.8} />
                  </div>
                  
                  {/* Titre coloré */}
                  <h3 style={{
                    fontSize: "clamp(16px, 2vw, 20px)",
                    fontWeight: 700,
                    color: colors.deepBlue,
                    marginBottom: "8px",
                  }}>
                    {card.title}
                  </h3>
                  
                  {/* Description */}
                  <p style={{
                    fontSize: "clamp(12px, 1.5vw, 14px)",
                    color: colors.grayText,
                    lineHeight: 1.5,
                    marginBottom: "16px",
                    flex: 1,
                  }}>
                    {card.description}
                  </p>

                  {/* Bouton implicite avec arrow */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: card.color,
                    fontSize: "14px",
                    fontWeight: 600,
                    transition: "gap 0.3s ease",
                  }}>
                    Accéder
                    <ArrowRight size={16} style={{ transition: "transform 0.3s ease" }} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Dernière carte pleine largeur */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr",
        }}>
          {cards.slice(4).map((card) => {
            const Icon = card.icon;
            
            return (
              <Link
                key={card.href}
                href={card.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: colors.white,
                  borderRadius: "16px",
                  padding: "32px 24px",
                  textDecoration: "none",
                  transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  cursor: "pointer",
                  border: `2px solid ${card.bgLight}`,
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = `0 20px 40px rgba(${parseInt(card.color.slice(1, 3), 16)}, ${parseInt(card.color.slice(3, 5), 16)}, ${parseInt(card.color.slice(5, 7), 16)}, 0.15)`;
                  e.currentTarget.style.borderColor = card.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.05)";
                  e.currentTarget.style.borderColor = card.bgLight;
                }}
              >
                {/* Fond dégradé */}
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: card.bgLight,
                  opacity: 0.2,
                  zIndex: 0,
                }} />

                {/* Contenu gauche */}
                <div style={{
                  position: "relative",
                  zIndex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "24px",
                  flex: 1,
                }}>
                  {/* Icône */}
                  <div style={{
                    width: "72px",
                    height: "72px",
                    borderRadius: "16px",
                    background: card.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <Icon size={36} color={colors.white} strokeWidth={1.8} />
                  </div>

                  {/* Texte */}
                  <div>
                    <h3 style={{
                      fontSize: "clamp(18px, 3vw, 22px)",
                      fontWeight: 700,
                      color: colors.deepBlue,
                      marginBottom: "6px",
                    }}>
                      {card.title}
                    </h3>
                    <p style={{
                      fontSize: "clamp(13px, 1.5vw, 15px)",
                      color: colors.grayText,
                      lineHeight: 1.5,
                    }}>
                      {card.description}
                    </p>
                  </div>
                </div>

                {/* Flèche droite */}
                <div style={{
                  position: "relative",
                  zIndex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: card.bgLight,
                  flexShrink: 0,
                  transition: "all 0.3s ease",
                }}>
                  <ArrowRight size={24} color={card.color} strokeWidth={2} />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Pied informatif optionnel */}
        <div style={{
          marginTop: "48px",
          paddingTop: "32px",
          borderTop: `1px solid ${colors.grayBorder}`,
          textAlign: "center",
          color: colors.grayText,
          fontSize: "13px",
          lineHeight: 1.6,
        }}>
          <p>Besoin d'aide? Consultez la documentation ou contactez le support.</p>
        </div>
      </div>
    </div>
  );
}