"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import supabase from "@/src/lib/supabase/browser";
import { TrendingUp, Store, Wrench, User, LogOut, Layers, ChevronLeft, ChevronRight, Bot } from "lucide-react";

const colors = {
  white: "#FFFFFF", deepBlue: "#1a3c6b", beninGreen: "#008751", beninYellow: "#FCD116", beninRed: "#E8112D",
  gray50: "#F9FAFB", gray100: "#F3F4F6", gray200: "#E5E7EB", gray300: "#D1D5DB", gray400: "#9CA3AF",
  gray500: "#6B7280", gray600: "#4B5563", gray700: "#374151", gray800: "#1F2937",
};

type Profile = { 
  id: string; 
  type: "vendeur" | "prestataire"; 
  user_id: string;
  role?: string;
};

type NavItem = { 
  href: string; 
  icon: React.ElementType; 
  label: string; 
  color: string; 
};

export default function Navbar() {
  const pathname = usePathname(); 
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null); 
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false); 
  const [scrolled, setScrolled] = useState(false); 
  const [isMobile, setIsMobile] = useState(false);
  const [dashboardPath, setDashboardPath] = useState<string>("/");

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
        
        // Récupérer le profil depuis la table profiles
        const { data: profileData, error: profileErr } = await supabase
          .from("profiles")
          .select("id, type, user_id, role")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (profileErr) throw profileErr;
        
        if (active && profileData) {
          setProfile(profileData);
          // Définir le chemin du tableau de bord en fonction du type
          if (profileData.type === "vendeur") {
            setDashboardPath("/vendeur");
          } else if (profileData.type === "prestataire") {
            setDashboardPath("/prestataire");
          }
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

  // Navigation items - uniquement /vendeur ou /prestataire selon le profil
  const getNavItems = (): NavItem[] => {
    const items: NavItem[] = [
      { href: "/opportunites", icon: TrendingUp, label: "Opportunités", color: colors.beninGreen },
      { href: "/formalisation", icon: Bot, label: "Assistant", color: colors.beninYellow },
      { href: "/profil", icon: User, label: "Profil", color: colors.gray600 },
    ];

    // Ajouter le tableau de bord spécifique au type de profil à la première position
    if (profile?.type === "vendeur") {
      items.unshift({ 
        href: "/vendeur", 
        icon: Store, 
        label: "Tableau de bord", 
        color: colors.deepBlue 
      });
    } else if (profile?.type === "prestataire") {
      items.unshift({ 
        href: "/prestataire", 
        icon: Wrench, 
        label: "Tableau de bord", 
        color: colors.deepBlue 
      });
    }

    return items;
  };

  const navItems = getNavItems();

  const isActive = (href: string) => {
    if (href === "/vendeur" && pathname.startsWith("/vendeur")) return true;
    if (href === "/prestataire" && pathname.startsWith("/prestataire")) return true;
    return pathname === href || pathname.startsWith(href + "/");
  };

  const handleLogout = async () => { 
    await supabase.auth.signOut(); 
    window.location.href = "/"; 
  };

  if (loading) return null;

  // Version mobile (en bas)
  if (isMobile) {
    const mobileItems = navItems.slice(0, 4);
    return (
      <nav style={{ 
        position: "fixed", bottom: 0, left: 0, right: 0, height: 65, 
        background: scrolled ? "rgba(255,255,255,0.98)" : "rgba(255,255,255,0.92)", 
        backdropFilter: "blur(20px)", borderTop: `1px solid ${colors.gray200}`, 
        display: "flex", justifyContent: "space-around", alignItems: "center", zIndex: 40 
      }}>
        {mobileItems.map(item => {
          const Icon = item.icon; 
          const active = isActive(item.href);
          return (
            <button 
              key={item.href} 
              onClick={() => router.push(item.href)} 
              style={{ 
                display: "flex", flexDirection: "column", alignItems: "center", 
                justifyContent: "center", gap: 3, background: "transparent", 
                border: "none", cursor: "pointer", padding: "6px 10px", 
                borderRadius: 12, position: "relative" 
              }}
            >
              {active && (
                <div style={{ 
                  position: "absolute", top: -8, left: "50%", 
                  transform: "translateX(-50%)", width: 4, height: 4, 
                  background: item.color, borderRadius: "50%" 
                }} />
              )}
              <Icon size={22} color={active ? item.color : colors.gray400} strokeWidth={active ? 2 : 1.5} />
              <span style={{ 
                fontSize: 10, fontWeight: active ? 600 : 500, 
                color: active ? item.color : colors.gray500 
              }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    );
  }

  // Version desktop (sidebar)
  const sidebarWidth = isCollapsed ? "72px" : "260px";
  return (
    <>
      <aside style={{ 
        position: "fixed", left: 0, top: 0, bottom: 0, width: sidebarWidth, 
        background: scrolled ? "rgba(255,255,255,0.98)" : "rgba(255,255,255,0.92)", 
        backdropFilter: "blur(20px)", borderRight: `1px solid ${colors.gray200}`, 
        display: "flex", flexDirection: "column", justifyContent: "space-between", 
        transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)", zIndex: 50 
      }}>
        {/* Logo */}
        <div style={{ padding: isCollapsed ? "20px 0" : "24px 20px", borderBottom: `1px solid ${colors.gray100}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: isCollapsed ? "center" : "space-between" }}>
            {!isCollapsed && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ 
                  width: 36, height: 36, borderRadius: 12, 
                  background: `linear-gradient(135deg, ${colors.beninGreen}, ${colors.beninYellow})`, 
                  display: "flex", alignItems: "center", justifyContent: "center" 
                }}>
                  <Layers size={20} color={colors.white} />
                </div>
                <span style={{ 
                  fontWeight: 700, fontSize: 18, 
                  background: `linear-gradient(135deg, ${colors.deepBlue}, ${colors.beninGreen})`, 
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" 
                }}>
                  Alodo
                </span>
              </div>
            )}
            {isCollapsed && (
              <div style={{ 
                width: 36, height: 36, borderRadius: 12, 
                background: `linear-gradient(135deg, ${colors.beninGreen}, ${colors.beninYellow})`, 
                display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" 
              }}>
                <Layers size={20} color={colors.white} />
              </div>
            )}
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)} 
              style={{ 
                width: 32, height: 32, borderRadius: 10, background: colors.gray100, 
                border: "none", cursor: "pointer", display: "flex", alignItems: "center", 
                justifyContent: "center", marginLeft: isCollapsed ? 0 : "auto" 
              }}
            >
              {isCollapsed ? <ChevronRight size={18} color={colors.gray600} /> : <ChevronLeft size={18} color={colors.gray600} />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div style={{ 
          flex: 1, padding: isCollapsed ? "20px 0" : "20px 12px", 
          display: "flex", flexDirection: "column", gap: 4, overflowY: "auto" 
        }}>
          {navItems.map(item => {
            const Icon = item.icon; 
            const active = isActive(item.href);
            return (
              <button 
                key={item.href} 
                onClick={() => router.push(item.href)} 
                style={{ 
                  display: "flex", alignItems: "center", 
                  justifyContent: isCollapsed ? "center" : "flex-start", 
                  gap: isCollapsed ? 0 : 14, width: "100%", 
                  padding: isCollapsed ? "12px 0" : "12px 16px", borderRadius: 12, 
                  background: active ? `${item.color}12` : "transparent", 
                  border: "none", cursor: "pointer", transition: "all 0.2s ease", 
                  position: "relative" 
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = colors.gray100; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{ 
                  width: 36, height: 36, borderRadius: 10, 
                  background: active ? `${item.color}20` : "transparent", 
                  display: "flex", alignItems: "center", justifyContent: "center" 
                }}>
                  <Icon size={20} color={active ? item.color : colors.gray500} strokeWidth={active ? 2 : 1.5} />
                </div>
                {!isCollapsed && (
                  <span style={{ 
                    fontSize: 14, fontWeight: active ? 600 : 500, 
                    color: active ? item.color : colors.gray600 
                  }}>
                    {item.label}
                  </span>
                )}
                {active && !isCollapsed && (
                  <div style={{ position: "absolute", right: 12, width: 4, height: 4, background: item.color, borderRadius: "50%" }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Déconnexion */}
        <div style={{ padding: isCollapsed ? "16px 0" : "20px 12px", borderTop: `1px solid ${colors.gray100}` }}>
          <button 
            onClick={handleLogout} 
            style={{ 
              display: "flex", alignItems: "center", justifyContent: isCollapsed ? "center" : "flex-start", 
              gap: isCollapsed ? 0 : 14, width: "100%", padding: isCollapsed ? "12px 0" : "12px 16px", 
              borderRadius: 12, background: "transparent", border: "none", cursor: "pointer" 
            }}
            onMouseEnter={e => e.currentTarget.style.background = `${colors.beninRed}10`} 
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <LogOut size={20} color={colors.beninRed} />
            </div>
            {!isCollapsed && <span style={{ fontSize: 14, color: colors.beninRed }}>Déconnexion</span>}
          </button>
        </div>
      </aside>
      <div style={{ marginLeft: sidebarWidth }} />
    </>
  );
}