"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import supabase from "@/src/lib/supabase/browser";
import { TrendingUp, Store, Wrench, User, LogOut, Layers, Bot } from "lucide-react";

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
  const [scrolled, setScrolled] = useState(false); 
  const [isMobile, setIsMobile] = useState(false);

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

  const getNavItems = (): NavItem[] => {
    const items: NavItem[] = [
      { href: "/opportunites", icon: TrendingUp, label: "Opportunités", color: colors.beninGreen },
      { href: "/formalisation", icon: Bot, label: "Assistant", color: colors.beninYellow },
      { href: "/profil", icon: User, label: "Profil", color: colors.gray600 },
    ];

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

  // Mobile: navbar en bas
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

  // Desktop: header en haut
  return (
    <header style={{ 
      position: "fixed", top: 0, left: 0, right: 0, height: 70,
      background: scrolled ? "rgba(255,255,255,0.98)" : "rgba(255,255,255,0.92)", 
      backdropFilter: "blur(20px)", borderBottom: `1px solid ${colors.gray200}`,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      paddingLeft: 24, paddingRight: 24, zIndex: 50, padding: "20px"
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => router.push(profile?.type === "vendeur" ? "/vendeur" : "/prestataire")}>
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

      {/* Navigation */}
      <nav style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {navItems.map(item => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 16px", borderRadius: 10,
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
              <Icon size={18} color={active ? item.color : colors.gray500} strokeWidth={active ? 2 : 1.5} />
              <span style={{
                fontSize: 14, fontWeight: active ? 600 : 500,
                color: active ? item.color : colors.gray600
              }}>
                {item.label}
              </span>
            </button>
          );
        })}
        
        {/* Déconnexion */}
        <button
          onClick={handleLogout}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 16px", borderRadius: 10,
            background: "transparent", border: "none", cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = `${colors.beninRed}10`}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
        >
          <LogOut size={18} color={colors.beninRed} strokeWidth={1.5} />
          <span style={{ fontSize: 14, fontWeight: 500, color: colors.beninRed }}>Déconnexion</span>
        </button>
      </nav>


      
    </header>
  );
}