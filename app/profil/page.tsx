"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/src/lib/supabase/browser";
import {
  Home,
  Play,
  MessageSquare,
  TrendingUp,
  Wallet,
  Store,
  Package,
  CreditCard,
  BarChart3,
  Briefcase,
  FolderOpen,
  Calendar,
  Layers,
  Settings,
  FileText,
  User,
  Mail,
  Shield,
  ChevronRight,
  Building2,
  LogOut
} from "lucide-react";

export const dynamic = "force-dynamic";

// Couleurs du branding Alɔdó
const colors = {
  white: "#FFFFFF",
  deepBlue: "#1a3c6b",
  deepBlueDark: "#0e2a4a",
  deepBlueLight: "#2c4e7e",
  beninGreen: "#008751",
  beninYellow: "#FCD116",
  beninRed: "#E8112D",
  softGreen: "#E8F5E9",
  softBlue: "#EFF6FF",
  softYellow: "#FFF9E6",
  softRed: "#FFEBEE",
  gray50: "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray300: "#D1D5DB",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray600: "#4B5563",
  gray700: "#374151",
  gray800: "#1F2937",
  gray900: "#111827",
};

type UserRole = "vendeur" | "prestataire" | "simple" | "institution" | null;

interface NavLink {
  label: string;
  href: string;
  icon: React.ElementType;
  description?: string;
  color: string;
  bgColor: string;
}

interface NavSection {
  title: string;
  icon?: React.ElementType;
  links: NavLink[];
}

export default function ProfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await supabase.auth.signOut();
      router.push("/");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      setLoggingOut(false);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/");
          return;
        }

        setUser(user);

        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (profile) {
          setProfile(profile);
          setRole(profile.type_profile as UserRole);
        }
      } catch (error) {
        console.error("Erreur:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const commonSections: NavSection[] = [
    {
      title: "Découverte",
      icon: Play,
      links: [
        { 
          label: "Accueil", 
          href: "/", 
          icon: Home, 
          description: "Retour à l'accueil", 
          color: colors.beninGreen,
          bgColor: `${colors.beninGreen}10`
        },
        { 
          label: "Démo USSD", 
          href: "/demo", 
          icon: Play, 
          description: "Essayer le système", 
          color: colors.beninYellow,
          bgColor: `${colors.beninYellow}10`
        },
        { 
          label: "Assistant IA", 
          href: "/formalisation", 
          icon: MessageSquare, 
          description: "Aide à la formalisation", 
          color: colors.deepBlue,
          bgColor: `${colors.deepBlue}10`
        },
      ],
    },
    {
      title: "Opportunités & Finances",
      icon: TrendingUp,
      links: [
        { 
          label: "Opportunités", 
          href: "/opportunites", 
          icon: TrendingUp, 
          description: "Explorer les offres", 
          color: colors.beninGreen,
          bgColor: `${colors.beninGreen}10`
        },
        { 
          label: "Portefeuille", 
          href: "/wallet", 
          icon: Wallet, 
          description: "Gérer vos moyens", 
          color: colors.beninYellow,
          bgColor: `${colors.beninYellow}10`
        },
      ],
    },
  ];

  const vendeurSections: NavSection[] = [
    {
      title: "Gestion Vendeur",
      icon: Store,
      links: [
        { 
          label: "Tableau de bord", 
          href: "/vendeur", 
          icon: BarChart3, 
          description: "Vue d'ensemble", 
          color: colors.beninGreen,
          bgColor: `${colors.beninGreen}10`
        },
        { 
          label: "Produits", 
          href: "/vendeur/produits", 
          icon: Package, 
          description: "Gérer vos produits", 
          color: colors.beninYellow,
          bgColor: `${colors.beninYellow}10`
        },
        { 
          label: "Transactions", 
          href: "/vendeur/transactions", 
          icon: CreditCard, 
          description: "Historique de vente", 
          color: colors.beninRed,
          bgColor: `${colors.beninRed}10`
        },
        { 
          label: "Rapports", 
          href: "/vendeur/rapports", 
          icon: BarChart3, 
          description: "Analyses financières", 
          color: colors.deepBlue,
          bgColor: `${colors.deepBlue}10`
        },
      ],
    },
  ];

  const prestataireSections: NavSection[] = [
    {
      title: "Gestion Prestataire",
      icon: Briefcase,
      links: [
        { 
          label: "Tableau de bord", 
          href: "/prestataire", 
          icon: BarChart3, 
          description: "Vue d'ensemble", 
          color: colors.beninGreen,
          bgColor: `${colors.beninGreen}10`
        },
        { 
          label: "Projets", 
          href: "/prestataire/projets", 
          icon: FolderOpen, 
          description: "Vos projets", 
          color: colors.beninYellow,
          bgColor: `${colors.beninYellow}10`
        },
        { 
          label: "Documents", 
          href: "/prestataire/documents", 
          icon: FileText, 
          description: "Gestion documentaire", 
          color: colors.beninRed,
          bgColor: `${colors.beninRed}10`
        },
        { 
          label: "Transactions", 
          href: "/prestataire/transactions", 
          icon: CreditCard, 
          description: "Historique des paiements", 
          color: colors.deepBlue,
          bgColor: `${colors.deepBlue}10`
        },
        { 
          label: "Historique", 
          href: "/prestataire/historique", 
          icon: Calendar, 
          description: "Activités passées", 
          color: colors.gray600,
          bgColor: `${colors.gray600}10`
        },
      ],
    },
  ];

  const simpleSections: NavSection[] = [
    {
      title: "Tableau Simple",
      icon: Layers,
      links: [
        { 
          label: "Tableau de bord", 
          href: "/simple", 
          icon: BarChart3, 
          description: "Vue simplifiée", 
          color: colors.beninGreen,
          bgColor: `${colors.beninGreen}10`
        },
        { 
          label: "Boîtier", 
          href: "/simple/boitier", 
          icon: Settings, 
          description: "Calculatrice et transactions", 
          color: colors.beninYellow,
          bgColor: `${colors.beninYellow}10`
        },
        { 
          label: "Historique", 
          href: "/simple/historique", 
          icon: Calendar, 
          description: "Votre historique", 
          color: colors.beninRed,
          bgColor: `${colors.beninRed}10`
        },
      ],
    },
  ];

  const institutionSections: NavSection[] = [
    {
      title: "Gestion Institution",
      icon: Building2,
      links: [
        { 
          label: "Tableau de bord", 
          href: "/institutions", 
          icon: BarChart3, 
          description: "Vue d'ensemble", 
          color: colors.beninGreen,
          bgColor: `${colors.beninGreen}10`
        },
        { 
          label: "Dashboard", 
          href: "/institutions/dashboard", 
          icon: BarChart3, 
          description: "Analyse détaillée", 
          color: colors.beninYellow,
          bgColor: `${colors.beninYellow}10`
        },
        { 
          label: "Finance", 
          href: "/institutions/dashboard/finance", 
          icon: CreditCard, 
          description: "Gestion financière", 
          color: colors.beninRed,
          bgColor: `${colors.beninRed}10`
        },
      ],
    },
  ];

  const getSections = (): NavSection[] => {
    const sections = [...commonSections];

    if (role === "vendeur") {
      sections.push(...vendeurSections);
    } else if (role === "prestataire") {
      sections.push(...prestataireSections);
    } else if (role === "simple") {
      sections.push(...simpleSections);
    } else if (role === "institution") {
      sections.push(...institutionSections);
    }

    return sections;
  };

  const sections = getSections();

  const getRoleLabel = (roleValue: UserRole) => {
    switch (roleValue) {
      case "vendeur": return "Vendeur";
      case "prestataire": return "Prestataire de services";
      case "simple": return "Mode simple";
      case "institution": return "Institution financière";
      default: return "Utilisateur";
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: colors.white,
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ 
            width: 48, 
            height: 48, 
            border: `3px solid ${colors.gray200}`,
            borderTopColor: colors.deepBlue,
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 16px",
          }} />
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
          <div style={{ color: colors.gray500 }}>Chargement de votre profil...</div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.white,
        padding: "24px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Barre tricolore béninoise */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "4px",
        display: "flex",
        zIndex: 50,
      }}>
        <div style={{ flex: 1, background: colors.beninGreen }} />
        <div style={{ flex: 1, background: colors.beninYellow }} />
        <div style={{ flex: 1, background: colors.beninRed }} />
      </div>

      <div style={{ maxWidth: "1000px", margin: "0 auto", paddingTop: "24px" }}>
        {/* Header Card */}
        <div
          style={{
            background: colors.white,
            borderRadius: "24px",
            padding: "32px",
            marginBottom: "32px",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
            border: `1px solid ${colors.gray200}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "24px", flexWrap: "wrap" }}>
            <div
              style={{
                width: "88px",
                height: "88px",
                borderRadius: "24px",
                background: `linear-gradient(135deg, ${colors.deepBlue} 0%, ${colors.deepBlueDark} 100%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: colors.white,
                fontSize: "36px",
                flexShrink: 0,
                boxShadow: "0 4px 12px rgba(26, 60, 107, 0.15)",
              }}
            >
              <User size={44} />
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{
                margin: "0 0 8px 0",
                fontSize: "28px",
                fontWeight: 700,
                fontFamily: "'Playfair Display', serif",
                color: colors.deepBlue,
                letterSpacing: "-0.02em",
              }}>
                {user?.user_metadata?.name || user?.email?.split("@")[0] || "Utilisateur"}
              </h1>
              <p style={{ margin: "0 0 20px 0", color: colors.gray500, fontSize: "15px" }}>
                {getRoleLabel(role)}
              </p>

              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                {role && (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "6px 14px",
                      background: `${colors.beninGreen}10`,
                      color: colors.beninGreen,
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    <Shield size={14} />
                    {getRoleLabel(role)}
                  </div>
                )}
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px 14px",
                    background: colors.gray100,
                    color: colors.gray600,
                    borderRadius: "20px",
                    fontSize: "12px",
                  }}
                >
                  <Mail size={14} />
                  {user?.email}
                </div>
                {profile?.commune && (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "6px 14px",
                      background: colors.gray100,
                      color: colors.gray600,
                      borderRadius: "20px",
                      fontSize: "12px",
                    }}
                  >
                    <Building2 size={14} />
                    {profile.commune}
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 16px",
                    background: colors.beninRed,
                    color: colors.white,
                    border: "none",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: loggingOut ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease",
                    opacity: loggingOut ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!loggingOut) {
                      (e.currentTarget as HTMLButtonElement).style.background = "#C80A23";
                      (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.05)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loggingOut) {
                      (e.currentTarget as HTMLButtonElement).style.background = colors.beninRed;
                      (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
                    }
                  }}
                >
                  <LogOut size={14} />
                  {loggingOut ? "Déconnexion..." : "Se déconnecter"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <div style={{ display: "grid", gap: "40px", marginBottom: "40px" }}>
          {sections.map((section, idx) => (
            <div key={idx}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                {section.icon && (
                  <div style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "10px",
                    background: `${colors.deepBlue}10`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <section.icon size={18} color={colors.deepBlue} />
                  </div>
                )}
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: 600,
                    color: colors.gray700,
                    margin: 0,
                  }}
                >
                  {section.title}
                </h2>
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "16px",
              }}>
                {section.links.map((link, linkIdx) => {
                  const Icon = link.icon;
                  return (
                    <a
                      key={linkIdx}
                      href={link.href}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        padding: "20px",
                        background: colors.white,
                        borderRadius: "20px",
                        textDecoration: "none",
                        color: "inherit",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        border: `1px solid ${colors.gray200}`,
                        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 8px 20px rgba(0, 0, 0, 0.08)";
                        e.currentTarget.style.borderColor = link.color;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 1px 2px rgba(0, 0, 0, 0.05)";
                        e.currentTarget.style.borderColor = colors.gray200;
                      }}
                    >
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "14px",
                          background: link.bgColor,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          transition: "all 0.2s ease",
                        }}
                      >
                        <Icon size={24} color={link.color} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontWeight: 600,
                          color: colors.gray800,
                          fontSize: "15px",
                          marginBottom: "4px",
                        }}>
                          {link.label}
                        </div>
                        {link.description && (
                          <div style={{
                            fontSize: "12px",
                            color: colors.gray500,
                            lineHeight: 1.4,
                          }}>
                            {link.description}
                          </div>
                        )}
                      </div>
                      <ChevronRight size={18} color={colors.gray400} />
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            background: colors.gray50,
            borderRadius: "20px",
            padding: "24px",
            textAlign: "center",
            border: `1px solid ${colors.gray200}`,
          }}
        >
          <p style={{ margin: 0, fontSize: "13px", color: colors.gray500 }}>
            © {new Date().getFullYear()} Alɔdó • Terminal sécurisé
          </p>
        </div>
      </div>
    </div>
  );
}