"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import supabase from "@/src/lib/supabase/browser";
import { TrendingUp, Store, Wrench, User, Layers, Bot, ChevronDown, Home, Wallet, FileText, Menu, X } from "lucide-react";

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

type Profile = { 
  id: string; 
  type: "vendeur" | "prestataire" | "simple" | "institution" | null; 
  user_id: string;
  role?: string;
};

type NavItem = { 
  href: string; 
  icon: React.ElementType; 
  label: string; 
  color: string; 
};

type DropdownItem = {
  href: string;
  label: string;
  icon: React.ElementType;
};

export default function Navbar() {
  const pathname = usePathname(); 
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null); 
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false); 
  const [isMobile, setIsMobile] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile(); 
    window.addEventListener("resize", checkMobile);
    return () => { 
      window.removeEventListener("scroll", handleScroll); 
      window.removeEventListener("resize", checkMobile); 
    };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;
        if (!user) { 
          if (active) setLoading(false); 
          return; 
        }
        
        const { data: profileData, error: profileErr } = await supabase
          .from("profiles")
          .select("id, type, user_id, role")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (profileErr) throw profileErr;
        
        if (active && profileData) {
          setProfile(profileData);
        }
      } catch (err) { 
        console.error("Erreur chargement profil:", err); 
      } finally { 
        if (active) setLoading(false); 
      }
    }
    loadProfile();
    return () => { active = false; };
  }, []);

  // Liens essentiels (visible partout)
  const essentialItems: NavItem[] = [
    { href: "/opportunites", icon: TrendingUp, label: "Opportunités", color: colors.beninGreen },
    { href: "/wallet", icon: Wallet, label: "Portefeuille", color: colors.beninYellow },
    { href: "/formalisation", icon: Bot, label: "Assistant", color: colors.deepBlue },
  ];

  // Bouton dashboard selon le rôle
  const getDashboardButton = (): NavItem | null => {
    if (profile?.type === "vendeur") {
      return { href: "/vendeur", icon: Store, label: "Tableau de bord", color: colors.beninGreen };
    } else if (profile?.type === "prestataire") {
      return { href: "/prestataire", icon: Wrench, label: "Tableau de bord", color: colors.deepBlue };
    }
    return null;
  };

  // Dropdown items basés sur le rôle
  const getDropdownItems = (): DropdownItem[] => {
    const items: DropdownItem[] = [
      { href: "/demo", label: "Démo USSD", icon: TrendingUp },
    ];

    if (profile?.type === "vendeur") {
      return [
        { href: "/vendeur", label: "Tableau de bord", icon: Store },
        { href: "/vendeur/produits", label: "Mes produits", icon: Store },
        { href: "/vendeur/transactions", label: "Transactions", icon: FileText },
        { href: "/vendeur/rapports", label: "Rapports", icon: FileText },
        ...items,
      ];
    } else if (profile?.type === "prestataire") {
      return [
        { href: "/prestataire", label: "Tableau de bord", icon: Wrench },
        { href: "/prestataire/projets", label: "Mes projets", icon: FileText },
        { href: "/prestataire/documents", label: "Documents", icon: FileText },
        { href: "/prestataire/transactions", label: "Transactions", icon: FileText },
        { href: "/prestataire/historique", label: "Historique", icon: FileText },
        ...items,
      ];
    } else if (profile?.type === "simple") {
      return [
        { href: "/simple", label: "Tableau de bord", icon: Home },
        { href: "/simple/boitier", label: "Boîtier", icon: Home },
        { href: "/simple/historique", label: "Historique", icon: FileText },
        ...items,
      ];
    } else if (profile?.type === "institution") {
      return [
        { href: "/institutions", label: "Tableau de bord", icon: Store },
        { href: "/institutions/dashboard", label: "Dashboard", icon: FileText },
        { href: "/institutions/dashboard/finance", label: "Finance", icon: FileText },
        ...items,
      ];
    }

    return items;
  };

  const dropdownItems = getDropdownItems();

  const isActive = (href: string) => {
    if (href === "/vendeur" && pathname.startsWith("/vendeur")) return true;
    if (href === "/prestataire" && pathname.startsWith("/prestataire")) return true;
    if (href === "/simple" && pathname.startsWith("/simple")) return true;
    if (href === "/institutions" && pathname.startsWith("/institutions")) return true;
    return pathname === href || pathname.startsWith(href + "/");
  };

  const navigateTo = (href: string) => {
    router.push(href);
    setOpenDropdown(null);
    setMobileMenuOpen(false);
  };

  if (loading) return null;

  // Mobile: navbar en bas + menu mobile
  if (isMobile) {
    return (
      <>
        {/* Top Mobile Bar */}
        <div style={{ 
          position: "fixed", top: 0, left: 0, right: 0, height: 56,
          background: "rgba(255,255,255,0.98)", backdropFilter: "blur(20px)", 
          borderBottom: `1px solid ${colors.gray200}`, 
          display: "flex", justifyContent: "space-between", alignItems: "center",
          paddingLeft: 16, paddingRight: 16, zIndex: 50,
          gap: 12
        }}>
          {/* Logo */}
          <div 
            style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", flex: 1 }} 
            onClick={() => navigateTo("/")}
          >
            <div style={{ 
              width: 32, height: 32, borderRadius: 8, 
              background: `linear-gradient(135deg, ${colors.beninGreen}, ${colors.beninYellow})`, 
              display: "flex", alignItems: "center", justifyContent: "center" 
            }}>
              <Layers size={18} color={colors.white} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 14, color: colors.deepBlue }}>Alodo</span>
          </div>

          {/* Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              border: "none", background: "transparent", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 40, height: 40, borderRadius: 8
            }}
          >
            {mobileMenuOpen ? (
              <X size={20} color={colors.gray700} />
            ) : (
              <Menu size={20} color={colors.gray700} />
            )}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div style={{
            position: "fixed", top: 56, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.5)", zIndex: 40,
            backdropFilter: "blur(4px)"
          }} onClick={() => setMobileMenuOpen(false)} />
        )}

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div style={{
            position: "fixed", top: 56, left: 0, right: 0, bottom: 0,
            background: colors.white, zIndex: 41, overflowY: "auto",
            display: "flex", flexDirection: "column"
          }}>
            {/* Sections */}
            <div style={{ padding: "12px 0" }}>
              {/* Dashboard */}
              {getDashboardButton() && (
                <>
                  <div style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 8, paddingBottom: 8 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: colors.gray500, letterSpacing: "0.5px", textTransform: "uppercase" }}>Mon Espace</p>
                  </div>
                  {(() => {
                    const btn = getDashboardButton();
                    if (!btn) return null;
                    const Icon = btn.icon;
                    const active = isActive(btn.href);
                    return (
                      <button
                        onClick={() => navigateTo(btn.href)}
                        style={{
                          width: "100%", padding: "12px 16px", border: "none", background: "transparent",
                          display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
                          borderLeft: active ? `3px solid ${btn.color}` : "3px solid transparent"
                        }}
                      >
                        <Icon size={18} color={active ? btn.color : colors.gray500} />
                        <span style={{ fontSize: 14, fontWeight: active ? 600 : 500, color: active ? btn.color : colors.gray700 }}>
                          {btn.label}
                        </span>
                      </button>
                    );
                  })()}
                </>
              )}

              {/* Essentiels */}
              <div style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 8, paddingBottom: 8 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: colors.gray500, letterSpacing: "0.5px", textTransform: "uppercase" }}>Essentiels</p>
              </div>
              {essentialItems.map(item => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <button
                    key={item.href}
                    onClick={() => navigateTo(item.href)}
                    style={{
                      width: "100%", padding: "12px 16px", border: "none", background: "transparent",
                      display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
                      borderLeft: active ? `3px solid ${item.color}` : "3px solid transparent"
                    }}
                  >
                    <Icon size={18} color={active ? item.color : colors.gray500} />
                    <span style={{ fontSize: 14, fontWeight: active ? 600 : 500, color: active ? item.color : colors.gray700 }}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Dropdown Section */}
            {dropdownItems.length > 0 && (
              <div style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 12, paddingBottom: 8 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: colors.gray500, letterSpacing: "0.5px", textTransform: "uppercase" }}>
                  {profile?.type ? profile.type.toUpperCase() : "MENU"}
                </p>
              </div>
            )}
            {dropdownItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.href}
                  onClick={() => navigateTo(item.href)}
                  style={{
                    width: "100%", padding: "12px 16px", border: "none", background: "transparent",
                    display: "flex", alignItems: "center", gap: 12, cursor: "pointer"
                  }}
                >
                  <Icon size={18} color={colors.gray500} />
                  <span style={{ fontSize: 14, fontWeight: 500, color: colors.gray700 }}>
                    {item.label}
                  </span>
                </button>
              );
            })}

            {/* Divider */}
            <div style={{ height: 1, backgroundColor: colors.gray200, margin: "12px 0" }} />

            {/* Profil & Logout */}
            <button
              onClick={() => navigateTo("/profil")}
              style={{
                width: "100%", padding: "12px 16px", border: "none", background: "transparent",
                display: "flex", alignItems: "center", gap: 12, cursor: "pointer"
              }}
            >
              <User size={18} color={colors.gray500} />
              <span style={{ fontSize: 14, fontWeight: 500, color: colors.gray700 }}>Mon Profil</span>
            </button>
          </div>
        )}
      </>
    );
  }

  // Desktop: header classique
  return (
    <header style={{ 
      position: "fixed", top: 0, left: 0, right: 0, height: 70,
      background: scrolled ? "rgba(255,255,255,0.98)" : "rgba(255,255,255,0.92)", 
      backdropFilter: "blur(20px)", borderBottom: `1px solid ${colors.gray200}`,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      paddingLeft: 24, paddingRight: 24, zIndex: 50, gap: 24
    }}>
      {/* Logo */}
      <div 
        style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} 
        onClick={() => router.push("/")}
      >
        <div style={{ 
          width: 40, height: 40, borderRadius: 12, 
          background: `linear-gradient(135deg, ${colors.beninGreen}, ${colors.beninYellow})`, 
          display: "flex", alignItems: "center", justifyContent: "center" 
        }}>
          <Layers size={22} color={colors.white} />
        </div>
        <span style={{ 
          fontWeight: 700, fontSize: 20,
          background: `linear-gradient(135deg, ${colors.deepBlue}, ${colors.beninGreen})`, 
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" 
        }}>
          Alodo
        </span>
      </div>

      {/* Navigation Center */}
      <nav style={{ display: "flex", gap: 8, alignItems: "center", flex: 1 }}>
        {/* Dashboard Button */}
        {getDashboardButton() && (() => {
          const btn = getDashboardButton();
          if (!btn) return null;
          const Icon = btn.icon;
          const active = isActive(btn.href);
          return (
            <button
              onClick={() => router.push(btn.href)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: 10,
                background: active ? `${btn.color}12` : "transparent",
                border: "none", cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = colors.gray100;
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = "transparent";
              }}
            >
              <Icon size={16} color={active ? btn.color : colors.gray500} strokeWidth={active ? 2 : 1.5} />
              <span style={{
                fontSize: 13, fontWeight: active ? 600 : 500,
                color: active ? btn.color : colors.gray700
              }}>
                {btn.label}
              </span>
            </button>
          );
        })()}

        {/* Liens Essentiels */}
        {essentialItems.map(item => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: 10,
                background: active ? `${item.color}12` : "transparent",
                border: "none", cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = colors.gray100;
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = "transparent";
              }}
            >
              <Icon size={16} color={active ? item.color : colors.gray500} strokeWidth={active ? 2 : 1.5} />
              <span style={{
                fontSize: 13, fontWeight: active ? 600 : 500,
                color: active ? item.color : colors.gray700
              }}>
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Dropdown Menu */}
        {dropdownItems.length > 0 && (
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setOpenDropdown(openDropdown === "menu" ? null : "menu")}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "8px 12px", borderRadius: 10,
                background: openDropdown === "menu" ? colors.gray100 : "transparent",
                border: "none", cursor: "pointer",
                transition: "all 0.2s ease",
                color: colors.gray700, fontSize: 13, fontWeight: 500
              }}
              onMouseEnter={(e) => {
                if (openDropdown !== "menu") e.currentTarget.style.background = colors.gray100;
              }}
              onMouseLeave={(e) => {
                if (openDropdown !== "menu") e.currentTarget.style.background = "transparent";
              }}
            >
              <span>{profile?.type ? profile.type.charAt(0).toUpperCase() + profile.type.slice(1) : "Plus"}</span>
              <ChevronDown size={14} />
            </button>

            {/* Dropdown Content */}
            {openDropdown === "menu" && (
              <div style={{
                position: "absolute", top: "100%", left: 0, marginTop: 8,
                background: colors.white, borderRadius: 12, border: `1px solid ${colors.gray200}`,
                boxShadow: "0 12px 32px rgba(0,0,0,0.12)", minWidth: 200, zIndex: 50
              }}>
                {dropdownItems.map((item, idx) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <button
                      key={item.href}
                      onClick={() => navigateTo(item.href)}
                      style={{
                        width: "100%", padding: "10px 14px", border: "none",
                        background: active ? `${colors.beninGreen}12` : "transparent",
                        borderBottom: idx < dropdownItems.length - 1 ? `1px solid ${colors.gray200}` : "none",
                        display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
                        transition: "all 0.2s ease", textAlign: "left"
                      }}
                      onMouseEnter={(e) => {
                        if (!active) e.currentTarget.style.background = colors.gray100;
                      }}
                      onMouseLeave={(e) => {
                        if (!active) e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <Icon size={14} color={active ? colors.beninGreen : colors.gray500} />
                      <span style={{
                        fontSize: 13, fontWeight: active ? 600 : 500,
                        color: active ? colors.beninGreen : colors.gray700
                      }}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Right Side: Profil */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button
          onClick={() => router.push("/profil")}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 14px", borderRadius: 10,
            background: isActive("/profil") ? `${colors.gray500}12` : "transparent",
            border: "none", cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            if (!isActive("/profil")) e.currentTarget.style.background = colors.gray100;
          }}
          onMouseLeave={(e) => {
            if (!isActive("/profil")) e.currentTarget.style.background = "transparent";
          }}
        >
          <User size={16} color={isActive("/profil") ? colors.gray700 : colors.gray500} />
          <span style={{ fontSize: 13, fontWeight: isActive("/profil") ? 600 : 500, color: colors.gray700 }}>Profil</span>
        </button>
      </div>
    </header>
  );
}