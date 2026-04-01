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
} from "lucide-react";

export const dynamic = "force-dynamic";

const colors = {
  white: "#ffffff",
  ink: "#1e2a3a",
  deepBlue: "#1e3a5f",
  deepBlueDark: "#0a2a44",
  beninGreen: "#2e7d32",
  beninYellow: "#f9a825",
  beninRed: "#c62828",
  softGreen: "#e8f5e9",
  softBlue: "#e3f2fd",
  softYellow: "#fff8e1",
  softRed: "#ffebee",
  gray50: "#fafafa",
  gray100: "#f5f5f5",
  gray200: "#eeeeee",
  gray300: "#e0e0e0",
  gray500: "#9e9e9e",
  gray700: "#616161",
};

type UserRole = "vendeur" | "prestataire" | "simple" | "institution" | null;

interface NavLink {
  label: string;
  href: string;
  icon: React.ElementType;
  description?: string;
  color: string;
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
  const [loading, setLoading] = useState(true);

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
          .select("type_profile")
          .eq("user_id", user.id)
          .single();

        if (profile) {
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
        { label: "Accueil", href: "/", icon: Home, description: "Retour à l'accueil", color: colors.beninGreen },
        { label: "Démo USSD", href: "/demo", icon: Play, description: "Essayer le système", color: colors.beninYellow },
        { label: "Assistant IA", href: "/formalisation", icon: MessageSquare, description: "Aide à la formalisation", color: colors.deepBlue },
      ],
    },
    {
      title: "Opportunités & Finances",
      icon: TrendingUp,
      links: [
        { label: "Opportunités", href: "/opportunites", icon: TrendingUp, description: "Explorer les offres", color: colors.beninGreen },
        { label: "Portefeuille", href: "/wallet", icon: Wallet, description: "Gérer vos moyens", color: colors.beninYellow },
      ],
    },
  ];

  const vendeurSections: NavSection[] = [
    {
      title: "Gestion Vendeur",
      icon: Store,
      links: [
        { label: "Tableau de bord", href: "/vendeur", icon: BarChart3, description: "Vue d'ensemble", color: colors.beninGreen },
        { label: "Produits", href: "/vendeur/produits", icon: Package, description: "Gérer vos produits", color: colors.beninYellow },
        { label: "Transactions", href: "/vendeur/transactions", icon: CreditCard, description: "Historique de vente", color: colors.beninRed },
        { label: "Rapports", href: "/vendeur/rapports", icon: BarChart3, description: "Analyses financières", color: colors.deepBlue },
      ],
    },
  ];

  const prestataireSections: NavSection[] = [
    {
      title: "Gestion Prestataire",
      icon: Briefcase,
      links: [
        { label: "Tableau de bord", href: "/prestataire", icon: BarChart3, description: "Vue d'ensemble", color: colors.beninGreen },
        { label: "Projets", href: "/prestataire/projets", icon: FolderOpen, description: "Vos projets", color: colors.beninYellow },
        { label: "Documents", href: "/prestataire/documents", icon: FileText, description: "Gestion documentaire", color: colors.beninRed },
        { label: "Transactions", href: "/prestataire/transactions", icon: CreditCard, description: "Historique des paiements", color: colors.deepBlue },
        { label: "Historique", href: "/prestataire/historique", icon: Calendar, description: "Activités passées", color: colors.gray700 },
      ],
    },
  ];

  const simpleSections: NavSection[] = [
    {
      title: "Tableau Simple",
      icon: Layers,
      links: [
        { label: "Tableau de bord", href: "/simple", icon: BarChart3, description: "Vue simplifiée", color: colors.beninGreen },
        { label: "Boîtier", href: "/simple/boitier", icon: Settings, description: "Personnalisation", color: colors.beninYellow },
        { label: "Historique", href: "/simple/historique", icon: Calendar, description: "Votre historique", color: colors.beninRed },
      ],
    },
  ];

  const institutionSections: NavSection[] = [
    {
      title: "Gestion Institution",
      icon: Store,
      links: [
        { label: "Tableau de bord", href: "/institutions", icon: BarChart3, description: "Vue d'ensemble", color: colors.beninGreen },
        { label: "Dashboard", href: "/institutions/dashboard", icon: BarChart3, description: "Analyse détaillée", color: colors.beninYellow },
        { label: "Finance", href: "/institutions/dashboard/finance", icon: CreditCard, description: "Gestion financière", color: colors.beninRed },
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

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.gray100,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "32px", marginBottom: "16px" }}>Alodo</div>
          <div style={{ color: colors.gray700, fontSize: "14px" }}>Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${colors.deepBlue} 0%, ${colors.beninGreen} 100%)`,
        padding: "16px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        paddingTop: "80px",
      }}
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        {/* Header Card */}
        <div
          style={{
            backgroundColor: colors.white,
            borderRadius: "16px",
            padding: "32px",
            marginBottom: "32px",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.12)",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "24px", marginBottom: "24px" }}>
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "12px",
                background: `linear-gradient(135deg, ${colors.beninGreen}, ${colors.beninYellow})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: colors.white,
                fontSize: "32px",
                flexShrink: 0,
              }}
            >
              <Layers size={40} />
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ margin: "0 0 8px 0", fontSize: "28px", fontWeight: 700, color: colors.ink }}>
                {user?.user_metadata?.name || user?.email?.split("@")[0] || "Utilisateur"}
              </h1>
              <p style={{ margin: "0 0 16px 0", color: colors.gray700, fontSize: "16px" }}>
                {role ? `Profil ${role.charAt(0).toUpperCase() + role.slice(1)}` : "Profil standard"}
              </p>

              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                {role && (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 16px",
                      backgroundColor: colors.softGreen,
                      color: colors.beninGreen,
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: 600,
                      border: `1px solid ${colors.beninGreen}30`,
                    }}
                  >
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: colors.beninGreen }} />
                    {role.toUpperCase()}
                  </div>
                )}
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 16px",
                    backgroundColor: colors.gray100,
                    color: colors.gray700,
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  {user?.email}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <div style={{ display: "grid", gap: "32px", marginBottom: "40px" }}>
          {sections.map((section, idx) => (
            <div key={idx}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                {section.icon && (
                  <section.icon size={24} color={colors.white} />
                )}
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: colors.white,
                    margin: 0,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {section.title}
                </h2>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
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
                        backgroundColor: colors.white,
                        borderRadius: "12px",
                        textDecoration: "none",
                        color: "inherit",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.1)",
                        border: `1px solid ${colors.gray200}`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.boxShadow = "0 16px 40px rgba(0, 0, 0, 0.15)";
                        (e.currentTarget.querySelector("[data-icon]") as any).style.transform = "scale(1.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.1)";
                        (e.currentTarget.querySelector("[data-icon]") as any).style.transform = "scale(1)";
                      }}
                    >
                      <div
                        data-icon
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "10px",
                          backgroundColor: `${link.color}15`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          transition: "transform 0.3s ease",
                        }}
                      >
                        <Icon size={24} color={link.color} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: colors.ink, fontSize: "14px" }}>
                          {link.label}
                        </div>
                        {link.description && (
                          <div style={{ fontSize: "12px", color: colors.gray500, marginTop: "4px" }}>
                            {link.description}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: "16px", color: colors.gray300, transition: "all 0.3s ease" }}>
                        →
                      </div>
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
            backgroundColor: "rgba(255, 255, 255, 0.08)",
            borderRadius: "12px",
            padding: "24px",
            textAlign: "center",
            color: colors.white,
            backdropFilter: "blur(10px)",
            border: `1px solid rgba(255, 255, 255, 0.1)`,
            marginBottom: "24px",
          }}
        >
          <p style={{ margin: 0, fontSize: "13px", opacity: 0.9 }}>
            © 2026 ALODO • Tous les services accessibles depuis votre espace personnel
          </p>
        </div>
      </div>
    </div>
  );
}
