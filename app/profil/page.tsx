"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/src/lib/supabase/browser";

export const dynamic = "force-dynamic";

type UserRole = "vendeur" | "prestataire" | "simple" | "institution" | null;

interface NavLink {
  label: string;
  href: string;
  icon: string;
  description?: string;
}

interface NavSection {
  title: string;
  links: NavLink[];
}

export default function ProfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const [expandedDropdown, setExpandedDropdown] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/");
          return;
        }

        setUser(user);

        // Déterminer le rôle de l'utilisateur
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

  // Sections de navigation
  const commonSections: NavSection[] = [
    {
      title: "🚀 Découverte",
      links: [
        { label: "Accueil", href: "/", icon: "🏠", description: "Page d'accueil" },
        { label: "Démonstration", href: "/demo", icon: "🎮", description: "Démo interactive" },
        { label: "Formalisation", href: "/formalisation", icon: "📝", description: "Assistant conversationnel" },
      ],
    },
    {
      title: "💼 Opportunités & Investissement",
      links: [
        { label: "Opportunités", href: "/opportunites", icon: "🎯", description: "Explorer les offres" },
        { label: "Portefeuille", href: "/wallet", icon: "💰", description: "Gérer votre wallet" },
      ],
    },
  ];

  const vendeurSections: NavSection[] = [
    {
      title: "🛍️ Gestion Vendeur",
      links: [
        { label: "Tableau de bord", href: "/vendeur", icon: "📊", description: "Vue d'ensemble" },
        { label: "Produits", href: "/vendeur/produits", icon: "📦", description: "Gérer vos produits" },
        { label: "Transactions", href: "/vendeur/transactions", icon: "💳", description: "Historique de vente" },
        { label: "Rapports", href: "/vendeur/rapports", icon: "📈", description: "Analyses financières" },
      ],
    },
  ];

  const prestataireSections: NavSection[] = [
    {
      title: "🎓 Gestion Prestataire",
      links: [
        { label: "Tableau de bord", href: "/prestataire", icon: "📊", description: "Vue d'ensemble" },
        { label: "Projets", href: "/prestataire/projets", icon: "🗂️", description: "Vos projets" },
        { label: "Documents", href: "/prestataire/documents", icon: "📄", description: "Gestion documentaire" },
        { label: "Transactions", href: "/prestataire/transactions", icon: "💳", description: "Historique des paiements" },
        { label: "Historique", href: "/prestataire/historique", icon: "📅", description: "Activités passées" },
      ],
    },
  ];

  const simpleSections: NavSection[] = [
    {
      title: "📱 Tableau Simple",
      links: [
        { label: "Tableau de bord", href: "/simple", icon: "📊", description: "Vue simplifiée" },
        { label: "Boîtier", href: "/simple/boitier", icon: "🎨", description: "Personnalisation" },
        { label: "Historique", href: "/simple/historique", icon: "📝", description: "Votre historique" },
      ],
    },
  ];

  const institutionSections: NavSection[] = [
    {
      title: "🏦 Gestion Institution",
      links: [
        { label: "Tableau de bord", href: "/institutions", icon: "🏛️", description: "Vue d'ensemble" },
        { label: "Connexion", href: "/institutions/login", icon: "🔑", description: "Accès sécurisé" },
        { label: "Dashboard", href: "/institutions/dashboard", icon: "📈", description: "Analyse détaillée" },
        { label: "Finance", href: "/institutions/dashboard/finance", icon: "💹", description: "Gestion financière" },
        { label: "Nouvelle Institution", href: "/institutions/dashboard/nouveau", icon: "➕", description: "Ajouter une institution" },
      ],
    },
  ];

  // Construire les sections basées sur le rôle
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
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f5f5f5" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "20px", marginBottom: "10px" }}>⏳</div>
          <div style={{ color: "#666" }}>Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "16px",
        fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "16px",
            padding: "24px",
            marginBottom: "24px",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                backgroundColor: "#667eea",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: "28px",
              }}
            >
              👤
            </div>
            <div>
              <h1 style={{ margin: "0 0 4px 0", fontSize: "24px", fontWeight: 700, color: "#333" }}>
                {user?.user_metadata?.name || user?.email?.split("@")[0] || "Utilisateur"}
              </h1>
              <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
                {role ? `Profil: ${role.charAt(0).toUpperCase() + role.slice(1)}` : "Profil standard"}
              </p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "12px" }}>
            {role && (
              <div
                style={{
                  padding: "8px 12px",
                  backgroundColor: "#667eea",
                  color: "#fff",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 600,
                  textAlign: "center",
                }}
              >
                ✓ {role.toUpperCase()}
              </div>
            )}
            <div
              style={{
                padding: "8px 12px",
                backgroundColor: "#f0f0f0",
                color: "#666",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                textAlign: "center",
              }}
            >
              Email: {user?.email}
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <div style={{ display: "grid", gap: "20px", marginBottom: "40px" }}>
          {sections.map((section, idx) => (
            <div key={idx}>
              <h2
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#fff",
                  marginBottom: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {section.title}
              </h2>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px" }}>
                {section.links.map((link, linkIdx) => (
                  <a
                    key={linkIdx}
                    href={link.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "16px",
                      backgroundColor: "#fff",
                      borderRadius: "12px",
                      textDecoration: "none",
                      color: "inherit",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
                      border: "1px solid #f0f0f0",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow = "0 12px 24px rgba(0, 0, 0, 0.12)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.06)";
                    }}
                  >
                    <div style={{ fontSize: "28px" }}>{link.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: "#333", fontSize: "14px" }}>
                        {link.label}
                      </div>
                      {link.description && (
                        <div style={{ fontSize: "12px", color: "#999", marginTop: "2px" }}>
                          {link.description}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: "16px", color: "#ccc" }}>→</div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
            padding: "20px",
            textAlign: "center",
            color: "#fff",
            backdropFilter: "blur(10px)",
            marginBottom: "20px",
          }}
        >
          <p style={{ margin: 0, fontSize: "13px", opacity: 0.9 }}>
            © 2026 ALODO. Tous les services accessibles depuis votre profil.
          </p>
        </div>
      </div>
    </div>
  );
}
