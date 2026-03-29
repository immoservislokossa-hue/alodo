"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import supabase from "@/src/lib/supabase/browser";
import { ArrowRight, Building2, CalendarDays, CircleDollarSign, Plus, Target } from "lucide-react";
import { getDefaultUserPath } from "@/src/lib/profiles/access";

const colors = {
  white: "#ffffff",
  ink: "#163f2e",
  blue: "#1a3c6b",
  green: "#008751",
  line: "#d7e4da",
  muted: "#5d7667",
  soft: "#f6faf7",
};

type InstitutionPost = {
  id: string;
  titre: string;
  description: string;
  statut: string;
  types_concernes: string[] | null;
  secteurs_concernes: string[] | null;
  montant_min_fcfa: number | null;
  montant_max_fcfa: number | null;
  date_limite: string | null;
  created_at: string;
};

export default function InstitutionsDashboardPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<InstitutionPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const stats = useMemo(() => {
    const published = posts.filter((item) => item.statut === "publie").length;
    const drafts = posts.filter((item) => item.statut === "brouillon").length;
    return [
      { label: "Posts total", value: posts.length, icon: Building2, color: colors.green },
      { label: "Publies", value: published, icon: Target, color: colors.blue },
      { label: "Brouillons", value: drafts, icon: CalendarDays, color: "#b78621" },
    ];
  }, [posts]);

  useEffect(() => {
    let active = true;

    async function loadPosts() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;
        if (!user) {
          router.push("/institutions/login");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, role, type")
          .eq("user_id", user.id)
          .single();

        if (profileError) throw profileError;
        if (!profile?.id) throw new Error("Profil introuvable.");
        if (profile.role !== "admin") {
          router.replace(getDefaultUserPath(profile.type));
          return;
        }

        const { data, error: postsError } = await supabase
          .from("post_institutions")
          .select(
            "id, titre, description, statut, types_concernes, secteurs_concernes, montant_min_fcfa, montant_max_fcfa, date_limite, created_at"
          )
          .eq("institution_profile_id", profile.id)
          .order("created_at", { ascending: false });

        if (postsError) throw postsError;
        if (active) setPosts((data as InstitutionPost[]) ?? []);
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error ? loadError.message : "Impossible de charger le dashboard."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadPosts();
    return () => {
      active = false;
    };
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", background: "#f8faf8", padding: "24px 18px 64px", color: colors.ink }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gap: 20 }}>
        <section style={panelStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={eyebrowStyle}>DASHBOARD INSTITUTION</div>
              <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.1 }}>
                Vos posts et vos campagnes de ciblage
              </h1>
              <div style={{ color: colors.muted, maxWidth: 760, lineHeight: 1.7 }}>
                Ici vous publiez des offres qui seront ensuite recommandees automatiquement
                aux vendeurs et prestataires compatibles.
              </div>
            </div>

            <Link href="/institutions/dashboard/nouveau" style={primaryLinkStyle}>
              <Plus size={18} />
              Nouveau post
            </Link>
          </div>
        </section>

        {error ? (
          <div
            style={{
              borderRadius: 18,
              background: "#fff1f3",
              border: "1px solid #f5c9cf",
              padding: "14px 16px",
              color: "#d92543",
              fontWeight: 700,
            }}
          >
            {error}
          </div>
        ) : null}

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} style={statCardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", color: colors.muted }}>
                      {item.label}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 30, fontWeight: 800 }}>{item.value}</div>
                  </div>
                  <div style={{ ...iconBubbleStyle, background: `${item.color}18` }}>
                    <Icon size={20} color={item.color} />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <section style={panelStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "grid", gap: 6 }}>
              <div style={eyebrowStyle}>VOS POSTS</div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>Liste des offres publiees</div>
            </div>

            <Link href="/institutions/dashboard/nouveau" style={secondaryLinkStyle}>
              Creer une offre
              <ArrowRight size={18} />
            </Link>
          </div>

          <div style={{ display: "grid", gap: 14, marginTop: 18 }}>
            {loading ? (
              <div style={{ color: colors.muted }}>Chargement des posts...</div>
            ) : posts.length === 0 ? (
              <div
                style={{
                  borderRadius: 18,
                  border: `1px dashed ${colors.line}`,
                  background: colors.soft,
                  padding: 24,
                  color: colors.muted,
                  lineHeight: 1.7,
                }}
              >
                Aucun post pour le moment. Cree ta premiere offre institutionnelle pour commencer le matching.
              </div>
            ) : (
              posts.map((post) => (
                <article
                  key={post.id}
                  style={{
                    borderRadius: 20,
                    border: `1px solid ${colors.line}`,
                    background: colors.soft,
                    padding: 18,
                    display: "grid",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
                    <div style={{ display: "grid", gap: 8 }}>
                      <div style={{ fontSize: 22, fontWeight: 800 }}>{post.titre}</div>
                      <div style={{ color: colors.muted, lineHeight: 1.7 }}>
                        {post.description}
                      </div>
                    </div>
                    <div
                      style={{
                        borderRadius: 999,
                        padding: "8px 12px",
                        background: post.statut === "publie" ? "#ebf7f1" : "#fff7df",
                        color: post.statut === "publie" ? colors.green : "#9a7510",
                        fontWeight: 800,
                        textTransform: "capitalize",
                      }}
                    >
                      {post.statut}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    <Chip icon={<Target size={14} />} label={post.types_concernes?.join(", ") || "Tous types"} />
                    <Chip icon={<Building2 size={14} />} label={post.secteurs_concernes?.join(", ") || "Tous secteurs"} />
                    <Chip
                      icon={<CircleDollarSign size={14} />}
                      label={
                        post.montant_min_fcfa || post.montant_max_fcfa
                          ? `${(post.montant_min_fcfa ?? 0).toLocaleString("fr-FR")} - ${(post.montant_max_fcfa ?? 0).toLocaleString("fr-FR")} FCFA`
                          : "Montant non precise"
                      }
                    />
                    <Chip
                      icon={<CalendarDays size={14} />}
                      label={
                        post.date_limite
                          ? `Limite ${new Date(post.date_limite).toLocaleDateString("fr-FR")}`
                          : "Sans date limite"
                      }
                    />
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Chip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 12px",
        borderRadius: 999,
        background: "#ffffff",
        border: `1px solid ${colors.line}`,
        color: colors.ink,
        fontWeight: 700,
      }}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}

const panelStyle = {
  background: colors.white,
  border: `1px solid ${colors.line}`,
  borderRadius: 24,
  padding: 24,
  boxShadow: "0 18px 40px rgba(19, 49, 33, 0.05)",
} as const;

const statCardStyle = {
  background: colors.white,
  border: `1px solid ${colors.line}`,
  borderRadius: 22,
  padding: 20,
  boxShadow: "0 18px 40px rgba(19, 49, 33, 0.04)",
} as const;

const iconBubbleStyle = {
  width: 46,
  height: 46,
  borderRadius: 14,
  display: "grid",
  placeItems: "center",
} as const;

const eyebrowStyle = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.08em",
  color: colors.green,
} as const;

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

const secondaryLinkStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 10,
  minHeight: 48,
  padding: "0 16px",
  borderRadius: 14,
  background: colors.blue,
  color: colors.white,
  textDecoration: "none",
  fontWeight: 800,
} as const;
