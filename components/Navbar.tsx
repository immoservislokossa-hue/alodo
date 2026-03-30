"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import supabase from "@/src/lib/supabase/browser";
import { TrendingUp, Wallet, Store, Wrench, CreditCard, User, Settings, LogOut, Layers, ChevronLeft, ChevronRight } from "lucide-react";

const colors = {
  white: "#FFFFFF", deepBlue: "#1a3c6b", beninGreen: "#008751", beninYellow: "#FCD116", beninRed: "#E8112D",
  gray50: "#F9FAFB", gray100: "#F3F4F6", gray200: "#E5E7EB", gray300: "#D1D5DB", gray400: "#9CA3AF",
  gray500: "#6B7280", gray600: "#4B5563", gray700: "#374151", gray800: "#1F2937",
};

type Profile = { id: string; type: "vendeur" | "prestataire"; user_id: string };
type NavItem = { href: string; icon: React.ElementType; label: string; color: string; forVendeur?: boolean; forPrestataire?: boolean; forBoth?: boolean };

const baseNavItems: NavItem[] = [
  { href: "/opportunites", icon: TrendingUp, label: "Opportunités", color: colors.beninGreen, forBoth: true },
  { href: "/marche", icon: Store, label: "Marché", color: colors.deepBlue, forVendeur: true },
  { href: "/prestations", icon: Wrench, label: "Prestations", color: colors.deepBlue, forPrestataire: true },
  { href: "/wallet", icon: Wallet, label: "Portefeuille", color: colors.beninYellow, forBoth: true },
  { href: "/transactions", icon: CreditCard, label: "Transactions", color: colors.gray500, forBoth: true },
  { href: "/profil", icon: User, label: "Profil", color: colors.gray600, forBoth: true },
  { href: "/parametres", icon: Settings, label: "Paramètres", color: colors.gray400, forBoth: true },
];

export default function Navbar() {
  const pathname = usePathname(); const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null); const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false); const [scrolled, setScrolled] = useState(false); const [isMobile, setIsMobile] = useState(false);

  // Cacher la navbar sur la page langue
  const isLanguePage = pathname === "/langue";
  if (isLanguePage) return null;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile(); window.addEventListener("resize", checkMobile);
    return () => { window.removeEventListener("scroll", handleScroll); window.removeEventListener("resize", checkMobile); };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;
        if (!user) { if (active) setLoading(false); return; }
        const { data: profileData, error: profileErr } = await supabase.from("profiles").select("id, type, user_id").eq("user_id", user.id).maybeSingle();
        if (profileErr) throw profileErr;
        if (active && profileData) setProfile(profileData);
      } catch (err) { console.error(err); } finally { if (active) setLoading(false); }
    }
    loadProfile();
    return () => { active = false; };
  }, []);

  const filteredNavItems = baseNavItems.filter(item => {
    if (!profile) return item.forBoth;
    if (item.forBoth) return true;
    if (profile?.type === "vendeur" && item.forVendeur) return true;
    if (profile?.type === "prestataire" && item.forPrestataire) return true;
    return false;
  });

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const handleLogout = async () => { await supabase.auth.signOut(); window.location.href = "/"; };

  if (loading) {
    if (isMobile) return (
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 65, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", borderTop: `1px solid ${colors.gray200}`, display: "flex", justifyContent: "space-around", alignItems: "center", zIndex: 40 }}>
        {[1,2,3,4,5].map(i => <div key={i} style={{ width: 44, height: 44, background: colors.gray200, borderRadius: 12 }} />)}
      </div>
    );
    return (
      <div style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: 72, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", borderRight: `1px solid ${colors.gray200}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "24px 0", zIndex: 50 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>{[1,2,3,4,5].map(i => <div key={i} style={{ width: 44, height: 44, background: colors.gray200, borderRadius: 12 }} />)}</div>
        <div style={{ width: 44, height: 44, background: colors.gray200, borderRadius: 12 }} />
      </div>
    );
  }

  if (isMobile) {
    const mobileItems = filteredNavItems.slice(0, 5);
    return (
      <>
        <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 65, background: scrolled ? "rgba(255,255,255,0.98)" : "rgba(255,255,255,0.92)", backdropFilter: "blur(20px)", borderTop: `1px solid ${colors.gray200}`, display: "flex", justifyContent: "space-around", alignItems: "center", zIndex: 40, transition: "all 0.3s ease", boxShadow: scrolled ? "0 -4px 20px rgba(0,0,0,0.08)" : "0 -2px 10px rgba(0,0,0,0.05)" }}>
          {mobileItems.map(item => {
            const Icon = item.icon; const active = isActive(item.href);
            return (
              <button key={item.href} onClick={() => router.push(item.href)} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, background: "transparent", border: "none", cursor: "pointer", padding: "6px 10px", borderRadius: 12, position: "relative" }}>
                {active && <div style={{ position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)", width: 4, height: 4, background: item.color, borderRadius: "50%" }} />}
                <Icon size={22} color={active ? item.color : colors.gray400} strokeWidth={active ? 2 : 1.5} />
                <span style={{ fontSize: 10, fontWeight: active ? 600 : 500, color: active ? item.color : colors.gray500 }}>{item.label.length > 8 ? item.label.slice(0,6)+".." : item.label}</span>
              </button>
            );
          })}
        </nav>
        <div style={{ height: 65, marginBottom: 16 }} />
      </>
    );
  }

  const sidebarWidth = isCollapsed ? "72px" : "260px";
  return (
    <>
      <aside style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: sidebarWidth, background: scrolled ? "rgba(255,255,255,0.98)" : "rgba(255,255,255,0.92)", backdropFilter: "blur(20px)", borderRight: `1px solid ${colors.gray200}`, display: "flex", flexDirection: "column", justifyContent: "space-between", transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)", zIndex: 50, boxShadow: "2px 0 20px rgba(0,0,0,0.03)" }}>
        <div style={{ padding: isCollapsed ? "20px 0" : "24px 20px", borderBottom: `1px solid ${colors.gray100}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: isCollapsed ? "center" : "space-between" }}>
            {!isCollapsed && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 12, background: `linear-gradient(135deg, ${colors.beninGreen}, ${colors.beninYellow})`, display: "flex", alignItems: "center", justifyContent: "center" }}><Layers size={20} color={colors.white} /></div>
                <span style={{ fontWeight: 700, fontSize: 18, background: `linear-gradient(135deg, ${colors.deepBlue}, ${colors.beninGreen})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Alodo</span>
              </div>
            )}
            {isCollapsed && (
              <div style={{ width: 36, height: 36, borderRadius: 12, background: `linear-gradient(135deg, ${colors.beninGreen}, ${colors.beninYellow})`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}><Layers size={20} color={colors.white} /></div>
            )}
            <button onClick={() => setIsCollapsed(!isCollapsed)} style={{ width: 32, height: 32, borderRadius: 10, background: colors.gray100, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: isCollapsed ? 0 : "auto" }}>
              {isCollapsed ? <ChevronRight size={18} color={colors.gray600} /> : <ChevronLeft size={18} color={colors.gray600} />}
            </button>
          </div>
        </div>
        <div style={{ flex: 1, padding: isCollapsed ? "20px 0" : "20px 12px", display: "flex", flexDirection: "column", gap: 4, overflowY: "auto" }}>
          {filteredNavItems.map(item => {
            const Icon = item.icon; const active = isActive(item.href);
            return (
              <button key={item.href} onClick={() => router.push(item.href)} style={{ display: "flex", alignItems: "center", justifyContent: isCollapsed ? "center" : "flex-start", gap: isCollapsed ? 0 : 14, width: "100%", padding: isCollapsed ? "12px 0" : "12px 16px", borderRadius: 12, background: active ? `${item.color}12` : "transparent", border: "none", cursor: "pointer", transition: "all 0.2s ease", position: "relative" }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = colors.gray100; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: active ? `${item.color}20` : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={20} color={active ? item.color : colors.gray500} strokeWidth={active ? 2 : 1.5} /></div>
                {!isCollapsed && <span style={{ fontSize: 14, fontWeight: active ? 600 : 500, color: active ? item.color : colors.gray600 }}>{item.label}</span>}
                {active && !isCollapsed && <div style={{ position: "absolute", right: 12, width: 4, height: 4, background: item.color, borderRadius: "50%" }} />}
              </button>
            );
          })}
        </div>
        <div style={{ padding: isCollapsed ? "16px 0" : "20px 12px", borderTop: `1px solid ${colors.gray100}` }}>
          <button onClick={() => router.push("/profil")} style={{ display: "flex", alignItems: "center", justifyContent: isCollapsed ? "center" : "flex-start", gap: isCollapsed ? 0 : 14, width: "100%", padding: isCollapsed ? "12px 0" : "12px 16px", borderRadius: 12, background: "transparent", border: "none", cursor: "pointer", marginBottom: 8 }}
            onMouseEnter={e => e.currentTarget.style.background = colors.gray100} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <div style={{ width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}><User size={20} color={colors.gray500} /></div>
            {!isCollapsed && <span style={{ fontSize: 14, color: colors.gray600 }}>Mon Profil</span>}
          </button>
          <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", justifyContent: isCollapsed ? "center" : "flex-start", gap: isCollapsed ? 0 : 14, width: "100%", padding: isCollapsed ? "12px 0" : "12px 16px", borderRadius: 12, background: "transparent", border: "none", cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.background = `${colors.beninRed}10`} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <div style={{ width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}><LogOut size={20} color={colors.beninRed} /></div>
            {!isCollapsed && <span style={{ fontSize: 14, color: colors.beninRed }}>Déconnexion</span>}
          </button>
        </div>
      </aside>
      <div style={{ marginLeft: sidebarWidth, transition: "margin-left 0.3s cubic-bezier(0.4,0,0.2,1)", minHeight: "100vh" }} />
    </>
  );
}