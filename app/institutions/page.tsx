"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import supabase from "@/src/lib/supabase/browser";
import { ArrowRight, Building2, CircleDollarSign, Target, Waves } from "lucide-react";

const colors = {
  white: "#ffffff",
  ink: "#163f2e",
  blue: "#1a3c6b",
  blueDark: "#102748",
  green: "#008751",
  yellow: "#fcd116",
  line: "#d7e4da",
  muted: "#5d7667",
  soft: "#f6faf7",
};

export default function InstitutionsPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active || !user) {
        setIsAdmin(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (active) {
        setIsAdmin(profile?.role === "admin");
      }
    }

    void checkUser();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(180deg, ${colors.soft} 0%, ${colors.white} 100%)`,
        padding: "24px 18px 72px",
        color: colors.ink,
      }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gap: 22 }}>
        <section
          style={{
            background: `linear-gradient(135deg, ${colors.blue} 0%, ${colors.blueDark} 100%)`,
            color: colors.white,
            borderRadius: 28,
            padding: "38px 34px",
            display: "grid",
            gap: 18,
            boxShadow: "0 26px 56px rgba(10, 26, 45, 0.18)",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", color: colors.yellow }}>
            ESPACE INSTITUTIONS
          </div>
          <h1 style={{ margin: 0, fontSize: 42, lineHeight: 1.02, maxWidth: 780 }}>
            Publiez vos offres et touchez directement les bonnes MPME
          </h1>
          <div style={{ maxWidth: 820, lineHeight: 1.75, opacity: 0.92 }}>
            L'espace institutions permet de publier des opportunites, definir des criteres de
            ciblage et diffuser vos offres vers les vendeurs et prestataires les plus compatibles.
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 6 }}>
            <Link
              href={isAdmin ? "/institutions/dashboard" : "/institutions/login"}
              style={primaryLinkStyle}
            >
              {isAdmin ? "Ouvrir le dashboard" : "Se connecter"}
              <ArrowRight size={18} />
            </Link>

            <button
              type="button"
              onClick={() =>
                router.push(isAdmin ? "/institutions/dashboard/nouveau" : "/institutions/login")
              }
              style={secondaryButtonStyle}
            >
              Creer un post
            </button>
          </div>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          <FeatureCard
            icon={<Building2 size={20} color={colors.green} />}
            title="Publication simple"
            text="Titre, description, secteurs cibles, communes, revenus et documents requis."
          />
          <FeatureCard
            icon={<Target size={20} color={colors.blue} />}
            title="Matching automatique"
            text="Les posts sont alignes sur les champs de profils pour faciliter le ciblage."
          />
          <FeatureCard
            icon={<CircleDollarSign size={20} color="#b7861d" />}
            title="Montants et criteres"
            text="Indiquez les montants proposes, le besoin vise et les documents attendus."
          />
          <FeatureCard
            icon={<Waves size={20} color="#8f5c91" />}
            title="Diffusion multicanale"
            text="Le dashboard est pense pour alimenter ensuite les notifications et recommandations."
          />
        </section>

        <section
          style={{
            background: colors.white,
            border: `1px solid ${colors.line}`,
            borderRadius: 24,
            padding: 24,
            boxShadow: "0 18px 40px rgba(19, 49, 33, 0.05)",
            display: "grid",
            gap: 14,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", color: colors.green }}>
            PARCOURS
          </div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>Comment cela fonctionne</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            {[
              "1. L'institution se connecte",
              "2. Elle publie un post cible",
              "3. La plateforme compare avec les profils",
              "4. Les bonnes MPME recoivent l'offre",
            ].map((item) => (
              <div
                key={item}
                style={{
                  borderRadius: 18,
                  background: colors.soft,
                  border: `1px solid ${colors.line}`,
                  padding: 16,
                  fontWeight: 700,
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div
      style={{
        background: colors.white,
        border: `1px solid ${colors.line}`,
        borderRadius: 22,
        padding: 20,
        boxShadow: "0 18px 40px rgba(19, 49, 33, 0.04)",
        display: "grid",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          background: colors.soft,
          display: "grid",
          placeItems: "center",
        }}
      >
        {icon}
      </div>
      <div style={{ fontSize: 20, fontWeight: 800 }}>{title}</div>
      <div style={{ color: colors.muted, lineHeight: 1.7 }}>{text}</div>
    </div>
  );
}

const primaryLinkStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 10,
  minHeight: 52,
  padding: "0 18px",
  borderRadius: 16,
  background: colors.green,
  color: colors.white,
  textDecoration: "none",
  fontWeight: 800,
} as const;

const secondaryButtonStyle = {
  minHeight: 52,
  padding: "0 18px",
  borderRadius: 16,
  border: `2px solid rgba(255,255,255,0.24)`,
  background: "rgba(255,255,255,0.08)",
  color: colors.white,
  fontWeight: 800,
  cursor: "pointer",
} as const;
