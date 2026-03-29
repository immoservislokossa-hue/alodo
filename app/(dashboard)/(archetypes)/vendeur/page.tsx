"use client";

import Link from "next/link";
import { 
  FolderOpen, 
  BarChart3, 
  Calculator, 
  Clock3, 
  Plus, 
  ArrowRight,
  Package,
  TrendingUp,
  Wallet,
  Shield
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
  gray700: "#374151",
  gray800: "#1F2937",
};

const sections = [
  {
    title: "Gestion des produits",
    description: "Gérez votre catalogue d'articles",
    items: [
      {
        href: "/vendeur/produits",
        title: "Mes produits",
        text: "Consulter, modifier et gérer votre catalogue",
        icon: FolderOpen,
        accent: colors.deepBlue,
        color: colors.deepBlue,
      },
      {
        href: "/vendeur/produits/nouveau",
        title: "Nouveau produit",
        text: "Ajouter un article à votre inventaire",
        icon: Plus,
        accent: colors.beninGreen,
        color: colors.beninGreen,
      },
    ],
  },
  {
    title: "Transactions",
    description: "Enregistrez et suivez vos opérations",
    items: [
      {
        href: "/vendeur/transactions",
        title: "Nouvelle transaction",
        text: "Vente, achat, dépense, dette ou paiement",
        icon: Calculator,
        accent: colors.deepBlue,
        color: colors.deepBlue,
      },
      {
        href: "/vendeur/rapports",
        title: "Rapports",
        text: "Analysez vos performances",
        icon: BarChart3,
        accent: colors.beninRed,
        color: colors.beninRed,
      },
    ],
  },
  {
    title: "Accès rapide",
    description: "Les outils du quotidien",
    items: [
      {
        href: "/simple/boitier",
        title: "Boitier",
        text: "Calculatrice et transactions immédiates",
        icon: Calculator,
        accent: colors.beninYellow,
        color: colors.beninYellow,
      },
      {
        href: "/simple/historique",
        title: "Historique",
        text: "Toutes vos transactions",
        icon: Clock3,
        accent: colors.gray600,
        color: colors.gray600,
      },
    ],
  },
];

const stats = [
  { label: "Transactions", value: "0", icon: TrendingUp, color: colors.beninGreen },
  { label: "Produits", value: "0", icon: Package, color: colors.deepBlue },
  { label: "Solde", value: "0 FCFA", icon: Wallet, color: colors.beninYellow },
];

export default function VendeurPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: colors.gray50,
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      <div style={{
        maxWidth: "1280px",
        margin: "0 auto",
        padding: "24px",
      }}>
        
        {/* Barre tricolore */}
        <div style={{
          display: "flex",
          gap: "4px",
          marginBottom: "32px",
        }}>
          <div style={{ flex: 1, height: "4px", background: colors.beninGreen, borderRadius: "2px" }} />
          <div style={{ flex: 1, height: "4px", background: colors.beninYellow, borderRadius: "2px" }} />
          <div style={{ flex: 1, height: "4px", background: colors.beninRed, borderRadius: "2px" }} />
        </div>

        {/* Hero section */}
        <div style={{
          background: `linear-gradient(135deg, ${colors.deepBlue} 0%, ${colors.deepBlueDark} 100%)`,
          borderRadius: "32px",
          padding: "40px",
          marginBottom: "32px",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Décoration */}
          <div style={{
            position: "absolute",
            top: -50,
            right: -50,
            width: "200px",
            height: "200px",
            background: colors.beninGreen,
            borderRadius: "50%",
            opacity: 0.1,
          }} />
          <div style={{
            position: "absolute",
            bottom: -30,
            left: -30,
            width: "150px",
            height: "150px",
            background: colors.beninYellow,
            borderRadius: "50%",
            opacity: 0.1,
          }} />
          
          <div style={{ position: "relative", zIndex: 2 }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 12px",
              background: "rgba(255,255,255,0.1)",
              borderRadius: "100px",
              marginBottom: "20px",
            }}>
              <Shield size={14} color={colors.beninYellow} />
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)" }}>
                Espace sécurisé
              </span>
            </div>
            
            <h1 style={{
              fontSize: "clamp(28px, 5vw, 42px)",
              fontWeight: 700,
              fontFamily: "'Playfair Display', serif",
              color: colors.white,
              marginBottom: "12px",
              letterSpacing: "-0.02em",
            }}>
              Bonjour, <span style={{ color: colors.beninYellow }}></span>
            </h1>
            
            <p style={{
              fontSize: "16px",
              color: "rgba(255,255,255,0.8)",
              maxWidth: "500px",
              lineHeight: 1.5,
            }}>
              Gérez vos produits, enregistrez vos transactions et suivez vos performances en temps réel.
            </p>
          </div>
        </div>

       
        {/* Sections */}
        {sections.map((section, idx) => (
          <div key={idx} style={{ marginBottom: idx === sections.length - 1 ? 0 : "40px" }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: "20px",
              flexWrap: "wrap",
              gap: "8px",
            }}>
              <div>
                <h2 style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  color: colors.gray800,
                  marginBottom: "4px",
                }}>
                  {section.title}
                </h2>
                <p style={{
                  fontSize: "13px",
                  color: colors.gray500,
                }}>
                  {section.description}
                </p>
              </div>
            </div>
            
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px",
            }}>
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: "block",
                      background: colors.white,
                      borderRadius: "24px",
                      padding: "24px",
                      textDecoration: "none",
                      border: `1px solid ${colors.gray200}`,
                      transition: "all 0.2s ease",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow = "0 12px 24px -12px rgba(0,0,0,0.15)";
                      e.currentTarget.style.borderColor = item.color;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.borderColor = colors.gray200;
                    }}
                  >
                    <div style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      marginBottom: "16px",
                    }}>
                      <div style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "16px",
                        background: `${item.accent}12`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                        <Icon size={24} color={item.color} />
                      </div>
                      <ArrowRight size={18} color={colors.gray400} />
                    </div>
                    
                    <h3 style={{
                      fontSize: "18px",
                      fontWeight: 600,
                      color: colors.gray800,
                      marginBottom: "8px",
                    }}>
                      {item.title}
                    </h3>
                    
                    <p style={{
                      fontSize: "13px",
                      color: colors.gray500,
                      lineHeight: 1.5,
                    }}>
                      {item.text}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Footer */}
        <div style={{
          marginTop: "48px",
          paddingTop: "24px",
          borderTop: `1px solid ${colors.gray200}`,
          textAlign: "center",
        }}>
          
        </div>
      </div>
    </div>
  );
}