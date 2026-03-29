"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/src/lib/supabase/browser";
import {
  Briefcase,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileText,
  ExternalLink,
  Loader2,
  Building2,
  Calendar,
  MapPin,
  DollarSign,
  Clock,
  ArrowRight,
  Upload,
  Shield
} from "lucide-react";

const colors = {
  white: "#FFFFFF",
  deepBlue: "#1a3c6b",
  deepBlueDark: "#0e2a4a",
  beninGreen: "#008751",
  beninYellow: "#FCD116",
  beninRed: "#E8112D",
  gray50: "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray300: "#D1D5DB",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray600: "#4B5563",
  gray700: "#374151",
  gray800: "#1F2937",
};

export default function OpportunitesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    let sub: { data: { subscription: any } } | null = null;

    async function initAuthAndLoad() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user ?? null;

        if (!user) {
          sub = supabase.auth.onAuthStateChange((_event, session) => {
            const u = session?.user ?? null;
            if (u) {
              void loadMatchesForUser(u.id);
            }
          });

          await new Promise((res) => setTimeout(res, 400));

          const { data: sessionData2 } = await supabase.auth.getSession();
          const u2 = sessionData2?.session?.user ?? null;
          if (!u2) {
            router.replace("/institutions/login");
            return;
          }

          await loadMatchesForUser(u2.id);
        } else {
          await loadMatchesForUser(user.id);
        }
      } catch (err: any) {
        if (active) setError(err?.message ?? "Erreur lors du chargement des opportunites.");
      } finally {
        if (active) setLoading(false);
      }
    }

    async function loadMatchesForUser(userId: string) {
      const { data: profileRow, error: profileErr } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (profileErr) throw profileErr;
      if (!profileRow?.id) {
        setError("Profil introuvable pour l'utilisateur connecté.");
        return;
      }

      const profileId = profileRow.id;

      const { data: matches, error: matchesErr } = await supabase
        .from("post_institution_matches")
        .select("*")
        .eq("profile_id", profileId)
        .order("score", { ascending: false });

      if (matchesErr) throw matchesErr;
      if (!matches || matches.length === 0) {
        setItems([]);
        return;
      }

      const postIds = Array.from(new Set(matches.map((m: any) => m.post_institution_id)));
      const { data: posts, error: postsErr } = await supabase
        .from("post_institutions")
        .select("*")
        .in("id", postIds);

      if (postsErr) throw postsErr;

      const postsById = new Map((posts || []).map((p: any) => [p.id, p]));

      const combined = (matches || []).map((m: any) => ({
        match: m,
        post: postsById.get(m.post_institution_id) ?? null,
      }));

      if (active) setItems(combined);
    }

    void initAuthAndLoad();

    return () => {
      active = false;
      if (sub?.data?.subscription) sub.data.subscription.unsubscribe?.();
    };
  }, [router]);

  const very = items.filter((i) => i.match?.niveau === "tres_pertinent");
  const pertinent = items.filter((i) => i.match?.niveau === "pertinent");
  const canApply = items.filter((i) => i.match?.can_apply === true);
  const cannotApply = items.filter((i) => i.match?.can_apply === false);

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: colors.gray50,
      }}>
        <Loader2 size={40} color={colors.deepBlue} style={{ animation: "spin 1s linear infinite" }} />
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: colors.gray50,
        padding: 20,
      }}>
        <div style={{
          background: colors.white,
          borderRadius: 20,
          padding: 32,
          textAlign: "center",
          maxWidth: 400,
        }}>
          <AlertCircle size={48} color={colors.beninRed} />
          <p style={{ color: colors.gray600, marginTop: 16 }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 20,
              padding: "10px 20px",
              background: colors.deepBlue,
              color: colors.white,
              border: "none",
              borderRadius: 12,
              cursor: "pointer",
            }}
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  function renderItem(item: any) {
    const post = item.post;
    const match = item.match;
    
    return (
      <div
        key={match.id}
        style={{
          background: colors.white,
          borderRadius: 20,
          padding: 24,
          marginBottom: 16,
          border: `1px solid ${colors.gray200}`,
          transition: "all 0.2s ease",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.05)";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: match.niveau === "tres_pertinent" ? `${colors.beninGreen}10` : `${colors.deepBlue}10`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <Building2 size={24} color={match.niveau === "tres_pertinent" ? colors.beninGreen : colors.deepBlue} />
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.gray800, marginBottom: 4 }}>
                  {post?.titre ?? "Titre manquant"}
                </h3>
                <p style={{ fontSize: 13, color: colors.gray500 }}>
                  {post?.institution_nom || "Institution"}
                </p>
              </div>
            </div>
            
            <p style={{ color: colors.gray600, lineHeight: 1.6, marginBottom: 16 }}>
              {post?.description ? post.description.slice(0, 180) + (post.description.length > 180 ? "..." : "") : "Aucune description"}
            </p>
            
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 16 }}>
              {post?.montant_min && post?.montant_max && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <DollarSign size={14} color={colors.gray400} />
                  <span style={{ fontSize: 12, color: colors.gray600 }}>
                    {post.montant_min.toLocaleString()} - {post.montant_max.toLocaleString()} FCFA
                  </span>
                </div>
              )}
              {post?.duree_mois && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Clock size={14} color={colors.gray400} />
                  <span style={{ fontSize: 12, color: colors.gray600 }}>{post.duree_mois} mois</span>
                </div>
              )}
              {post?.lieu && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <MapPin size={14} color={colors.gray400} />
                  <span style={{ fontSize: 12, color: colors.gray600 }}>{post.lieu}</span>
                </div>
              )}
              {post?.date_limite && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Calendar size={14} color={colors.gray400} />
                  <span style={{ fontSize: 12, color: colors.gray600 }}>
                    {new Date(post.date_limite).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              )}
            </div>
            
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 12px",
              borderRadius: 20,
              background: match.niveau === "tres_pertinent" ? `${colors.beninGreen}10` : `${colors.deepBlue}10`,
              marginBottom: 12,
            }}>
              <TrendingUp size={14} color={match.niveau === "tres_pertinent" ? colors.beninGreen : colors.deepBlue} />
              <span style={{ fontSize: 12, fontWeight: 600, color: match.niveau === "tres_pertinent" ? colors.beninGreen : colors.deepBlue }}>
                Score: {match.score}% - {match.niveau === "tres_pertinent" ? "Très pertinent" : "Pertinent"}
              </span>
            </div>
            
            {match.matching_reasons && match.matching_reasons.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: colors.gray700, marginBottom: 6 }}>
                  Pourquoi cette opportunité :
                </div>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {match.matching_reasons.slice(0, 3).map((reason: string, idx: number) => (
                    <li key={idx} style={{ fontSize: 12, color: colors.gray600, marginBottom: 4 }}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {match.missing_documents && match.missing_documents.length > 0 && (
              <div style={{
                padding: 12,
                borderRadius: 12,
                background: `${colors.beninRed}05`,
                border: `1px solid ${colors.beninRed}20`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <FileText size={14} color={colors.beninRed} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: colors.beninRed }}>
                    Documents requis manquants :
                  </span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {match.missing_documents.map((doc: string, idx: number) => (
                    <span key={idx} style={{
                      padding: "4px 8px",
                      background: colors.white,
                      borderRadius: 8,
                      fontSize: 11,
                      color: colors.gray600,
                      border: `1px solid ${colors.gray200}`,
                    }}>
                      {doc}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div style={{ minWidth: 140, textAlign: "right" }}>
            {match.can_apply ? (
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 12px",
                borderRadius: 20,
                background: `${colors.beninGreen}10`,
                marginBottom: 16,
              }}>
                <CheckCircle size={14} color={colors.beninGreen} />
                <span style={{ fontSize: 12, color: colors.beninGreen, fontWeight: 500 }}>Postulable</span>
              </div>
            ) : (
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 12px",
                borderRadius: 20,
                background: `${colors.beninRed}10`,
                marginBottom: 16,
              }}>
                <XCircle size={14} color={colors.beninRed} />
                <span style={{ fontSize: 12, color: colors.beninRed, fontWeight: 500 }}>Non postulable</span>
              </div>
            )}
            
            <button
              onClick={() => router.push(`/opportunites/${post?.id}`)}
              style={{
                width: "100%",
                padding: "10px 16px",
                borderRadius: 12,
                border: `1px solid ${colors.deepBlue}`,
                background: colors.white,
                color: colors.deepBlue,
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginBottom: 12,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = colors.deepBlue;
                e.currentTarget.style.color = colors.white;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = colors.white;
                e.currentTarget.style.color = colors.deepBlue;
              }}
            >
              Voir plus
              <ArrowRight size={14} />
            </button>
            
            {match.can_apply && (
              <button
                onClick={() => router.push(`/opportunites/${post?.id}/postuler`)}
                style={{
                  width: "100%",
                  padding: "10px 16px",
                  borderRadius: 12,
                  border: "none",
                  background: colors.beninGreen,
                  color: colors.white,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = colors.beninGreen + "dd"}
                onMouseLeave={(e) => e.currentTarget.style.background = colors.beninGreen}
              >
                Postuler
                <ExternalLink size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: colors.gray50,
      padding: "24px",
    }}>
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

      <div style={{ maxWidth: 1200, margin: "0 auto", paddingTop: 24 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            fontSize: "clamp(28px, 5vw, 36px)",
            fontWeight: 700,
            fontFamily: "'Playfair Display', serif",
            color: colors.deepBlue,
            marginBottom: 8,
          }}>
            Opportunités de financement
          </h1>
          <p style={{ fontSize: 16, color: colors.gray600 }}>
            Découvrez les offres adaptées à votre profil
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}>
          <div style={{
            background: colors.white,
            borderRadius: 16,
            padding: 16,
            border: `1px solid ${colors.gray200}`,
          }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: colors.beninGreen }}>
              {very.length}
            </div>
            <div style={{ fontSize: 13, color: colors.gray500 }}>Très pertinentes</div>
          </div>
          <div style={{
            background: colors.white,
            borderRadius: 16,
            padding: 16,
            border: `1px solid ${colors.gray200}`,
          }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: colors.deepBlue }}>
              {pertinent.length}
            </div>
            <div style={{ fontSize: 13, color: colors.gray500 }}>Pertinentes</div>
          </div>
          <div style={{
            background: colors.white,
            borderRadius: 16,
            padding: 16,
            border: `1px solid ${colors.gray200}`,
          }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: colors.beninGreen }}>
              {canApply.length}
            </div>
            <div style={{ fontSize: 13, color: colors.gray500 }}>Postulables</div>
          </div>
          <div style={{
            background: colors.white,
            borderRadius: 16,
            padding: 16,
            border: `1px solid ${colors.gray200}`,
          }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: colors.beninRed }}>
              {cannotApply.length}
            </div>
            <div style={{ fontSize: 13, color: colors.gray500 }}>Non postulables</div>
          </div>
        </div>

        {very.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ width: 4, height: 24, background: colors.beninGreen, borderRadius: 2 }} />
              <h2 style={{ fontSize: 20, fontWeight: 600, color: colors.gray800 }}>
                Très pertinentes ({very.length})
              </h2>
            </div>
            {very.map(renderItem)}
          </section>
        )}

        {pertinent.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ width: 4, height: 24, background: colors.deepBlue, borderRadius: 2 }} />
              <h2 style={{ fontSize: 20, fontWeight: 600, color: colors.gray800 }}>
                Pertinentes ({pertinent.length})
              </h2>
            </div>
            {pertinent.map(renderItem)}
          </section>
        )}

        {canApply.filter((i: any) => i.match.niveau !== "tres_pertinent" && i.match.niveau !== "pertinent").length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ width: 4, height: 24, background: colors.beninGreen, borderRadius: 2 }} />
              <h2 style={{ fontSize: 20, fontWeight: 600, color: colors.gray800 }}>
                Autres opportunités postulables ({canApply.filter((i: any) => i.match.niveau !== "tres_pertinent" && i.match.niveau !== "pertinent").length})
              </h2>
            </div>
            {canApply
              .filter((i: any) => i.match.niveau !== "tres_pertinent" && i.match.niveau !== "pertinent")
              .map(renderItem)}
          </section>
        )}

        {/* Section Non postulables - Version améliorée */}
        {cannotApply.length > 0 && (
          <section>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ width: 4, height: 24, background: colors.beninRed, borderRadius: 2 }} />
              <h2 style={{ fontSize: 20, fontWeight: 600, color: colors.gray800 }}>
                Non postulables ({cannotApply.length})
              </h2>
            </div>
            
            {/* Affichage des opportunités non postulables */}
            {cannotApply.map(renderItem)}
            
            {/* Message d'encouragement pour compléter les documents */}
            <div style={{
              marginTop: 24,
              padding: 32,
              background: `linear-gradient(135deg, ${colors.deepBlue} 0%, ${colors.deepBlueDark} 100%)`,
              borderRadius: 24,
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
            }}>
              <div style={{
                position: "absolute",
                top: -50,
                right: -50,
                width: 200,
                height: 200,
                background: colors.beninYellow,
                borderRadius: "50%",
                opacity: 0.1,
              }} />
              <div style={{
                position: "absolute",
                bottom: -50,
                left: -50,
                width: 200,
                height: 200,
                background: colors.beninGreen,
                borderRadius: "50%",
                opacity: 0.1,
              }} />
              
              <div style={{ position: "relative", zIndex: 2 }}>
                <div style={{
                  width: 64,
                  height: 64,
                  background: "rgba(255,255,255,0.15)",
                  borderRadius: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}>
                  <Upload size={32} color={colors.white} />
                </div>
                
                <h3 style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: colors.white,
                  marginBottom: 12,
                }}>
                  Complétez vos documents pour débloquer plus d'opportunités
                </h3>
                
                <p style={{
                  fontSize: 15,
                  color: "rgba(255,255,255,0.85)",
                  maxWidth: 500,
                  margin: "0 auto 24px",
                  lineHeight: 1.6,
                }}>
                  Plus votre profil est complet, plus nous pouvons vous proposer des offres de financement adaptées à votre activité.
                </p>
                
                <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                  <button
                    onClick={() => router.push("/profil/documents")}
                    style={{
                      padding: "12px 28px",
                      background: colors.white,
                      color: colors.deepBlue,
                      border: "none",
                      borderRadius: 14,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "scale(1.02)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    <Upload size={16} />
                    Ajouter mes documents
                  </button>
                  
                  <button
                    onClick={() => router.push("/profil")}
                    style={{
                      padding: "12px 28px",
                      background: "rgba(255,255,255,0.15)",
                      color: colors.white,
                      border: `1px solid rgba(255,255,255,0.3)`,
                      borderRadius: 14,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.25)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.15)";
                    }}
                  >
                    <Shield size={16} />
                    Compléter mon profil
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {items.length === 0 && (
          <div style={{
            textAlign: "center",
            padding: 64,
            background: colors.white,
            borderRadius: 20,
            border: `1px solid ${colors.gray200}`,
          }}>
            <Briefcase size={64} color={colors.gray400} />
            <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 16, color: colors.gray800 }}>
              Aucune opportunité pour le moment
            </h2>
            <p style={{ color: colors.gray500, marginTop: 8 }}>
              De nouvelles opportunités seront disponibles bientôt.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}