"use client"

import { usePathname, useRouter } from "next/navigation"
import { Home, ShoppingBag, Wallet, Briefcase, Calculator } from "lucide-react"

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()

  const navItems = [
    { href: "/", icon: Home, label: "Accueil", color: "#008751" },
    { href: "/vendeur", icon: ShoppingBag, label: "Vendre", color: "#1a3c6b" },
    { href: "/opportunites", icon: Briefcase, label: "Opportunités", color: "#FCD116" },
  
    { href: "/simple/boitier", icon: Calculator, label: "Boîtier", color: "#6B7280" },
  ]

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/")

  return (
    <nav style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      height: "80px",
      background: "#FFFFFF",
      borderTop: "1px solid #E5E7EB",
      display: "flex",
      justifyContent: "space-around",
      alignItems: "center",
      zIndex: 40,
      boxShadow: "0 -4px 12px rgba(0, 0, 0, 0.05)",
    }}>
      {navItems.map((item) => {
        const Icon = item.icon
        const active = isActive(item.href)
        return (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              background: active ? `${item.color}10` : "transparent",
              border: "none",
              cursor: "pointer",
              padding: "8px 12px",
              borderRadius: "12px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${item.color}15`
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = active ? `${item.color}10` : "transparent"
            }}
          >
            <Icon
              size={24}
              color={active ? item.color : "#6B7280"}
              style={{ transition: "color 0.2s ease" }}
            />
            <span style={{
              fontSize: "11px",
              fontWeight: active ? 600 : 500,
              color: active ? item.color : "#6B7280",
              transition: "color 0.2s ease",
            }}>
              {item.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
