"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import supabase from "@/src/lib/supabase/browser";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Send,
  DollarSign,
  MessageSquare,
  TrendingUp,
  Zap,
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
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray600: "#4B5563",
  gray700: "#374151",
  gray800: "#1F2937",
};

type Profile = {
  id: string;
  user_id: string;
  reputation_score: number;
  type?: string;
  archetype?: string;
};

type PostInstitution = {
  id: string;
  titre: string;
  description: string;
  montant_min_fcfa?: number;
  montant_max_fcfa?: number;
  type_traitement?: "auto" | "manuel";
  score_minimum_auto?: number;
  institution_profile_id?: string;
  institution_nom?: string;
};

type FinancingResult = {
  statut: "approved" | "pending" | "rejected";
  message: string;
};

export default function PostulerPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params?.id as string;

  // État du chargement initial
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Données chargées
  const [profile, setProfile] = useState<Profile | null>(null);
  const [post, setPost] = useState<PostInstitution | null>(null);

  // État du formulaire
  const [montantDemande, setMontantDemande] = useState("");
  const [messageDemande, setMessageDemande] = useState("");

  // État de la soumission
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<FinancingResult | null>(null);

  // Chargement initial des données
  useEffect(() => {
    let active = true;

    async function loadData() {
      if (!postId) return;

      try {
        // Récupérer la session
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;

        if (!user) {
          router.replace("/institutions/login");
          return;
        }

        // Récupérer le profil avec reputation_score
        const { data: profileData, error: profileErr } = await supabase
          .from("profiles")
          .select("id, user_id, reputation_score, type, archetype")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileErr) throw profileErr;
        if (!profileData) {
          setError("Profil introuvable. Veuillez compléter votre onboarding.");
          return;
        }

        if (!active) return;
        setProfile(profileData);

        // Récupérer les détails du post
        const { data: postData, error: postErr } = await supabase
          .from("post_institutions")
          .select("*")
          .eq("id", postId)
          .maybeSingle();

        if (postErr) throw postErr;
        if (!postData) {
          setError("Opportunité non trouvée");
          return;
        }

        if (!active) return;
        setPost(postData);

      } catch (err: any) {
        if (active) {
          console.error("Erreur de chargement:", err);
          setError(err?.message ?? "Erreur lors du chargement des données");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [postId, router]);

  // Validation du formulaire
  const isFormValid =
    montantDemande &&
    !isNaN(Number(montantDemande)) &&
    Number(montantDemande) > 0 &&
    messageDemande.trim().length > 0;

  // Soumission du formulaire
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!profile || !post) {
      setSubmitError("Données manquantes");
      return;
    }

    if (!isFormValid) {
      setSubmitError("Veuillez remplir tous les champs correctement");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      // ✅ ÉTAPE 1: Vérifier l'éligibilité via RPC
      // Cette fonction appelle la fonction SQL check_financement_eligibility
      // qui retourne "approved" si le profil est éligible automatiquement,
      // sinon "pending" pour révision manuelle
      const { data: eligibilityResult, error: rpcError } = await supabase.rpc(
        "check_financement_eligibility",
        {
          p_profile_id: profile.id,
          p_post_id: post.id,
        }
      );

      if (rpcError) {
        console.error("Erreur RPC:", rpcError);
        throw new Error("Erreur lors de la vérification d'éligibilité");
      }

      // Le résultat est soit "approved" soit "pending"
      const statut = eligibilityResult || "pending";

      // Étape 2: Insérer dans la table financements
      const { data: financingData, error: insertErr } = await supabase
        .from("financements")
        .insert({
          profile_id: profile.id,
          post_id: post.id,
          institution_profile_id: post.institution_profile_id,
          montant_demande: Number(montantDemande),
          statut,
          message_demande: messageDemande,
        })
        .select()
        .single();

      if (insertErr) {
        console.error("Erreur insertion:", insertErr);
        throw new Error("Erreur lors de l'enregistrement de votre demande");
      }

      if (!financingData) {
        throw new Error("Erreur lors de l'enregistrement");
      }

      // Étape 3: Afficher le résultat
      const resultMessage =
        statut === "approved"
          ? "✅ Votre demande de financement a été approuvée instantanément!"
          : "⏳ Votre demande est en cours de traitement. L'institution la passera en revue sous peu.";

      setResult({
        statut,
        message: resultMessage,
      });

      // Redirection après 3 secondes
      setTimeout(() => {
        router.push("/opportunites");
      }, 3000);

    } catch (err: any) {
      console.error("Erreur soumission:", err);
      setSubmitError(err?.message ?? "Une erreur s'est produite");
    } finally {
      setSubmitting(false);
    }
  }

  // État: Chargement
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: colors.gray50,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <Loader2
            size={40}
            color={colors.deepBlue}
            style={{ animation: "spin 1s linear infinite", margin: "0 auto 16px" }}
          />
          <p style={{ color: colors.gray600 }}>Chargement des informations...</p>
        </div>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // État: Erreur de chargement
  if (error || !profile || !post) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: colors.gray50,
          padding: 20,
        }}
      >
        <div
          style={{
            background: colors.white,
            borderRadius: 20,
            padding: 32,
            textAlign: "center",
            maxWidth: 400,
            border: `1px solid ${colors.gray200}`,
          }}
        >
          <AlertCircle size={48} color={colors.beninRed} style={{ margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: 20, fontWeight: 600, color: colors.gray800, marginBottom: 8 }}>
            Erreur
          </h2>
          <p style={{ color: colors.gray600, marginBottom: 24 }}>
            {error || "Impossible de charger les données"}
          </p>
          <button
            onClick={() => router.back()}
            style={{
              padding: "10px 20px",
              background: colors.deepBlue,
              color: colors.white,
              border: "none",
              borderRadius: 12,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  // État: Résultat de la soumission
  if (result) {
    const isApproved = result.statut === "approved";

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: colors.gray50,
          padding: 20,
        }}
      >
        <div
          style={{
            background: colors.white,
            borderRadius: 24,
            padding: 40,
            textAlign: "center",
            maxWidth: 500,
            border: `2px solid ${isApproved ? colors.beninGreen : colors.beninYellow}`,
          }}
        >
          {isApproved ? (
            <>
              <CheckCircle2
                size={64}
                color={colors.beninGreen}
                style={{ margin: "0 auto 24px" }}
              />
              <h2
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: colors.beninGreen,
                  marginBottom: 16,
                }}
              >
                Financement Approuvé! 🎉
              </h2>
            </>
          ) : (
            <>
              <Clock
                size={64}
                color={colors.beninYellow}
                style={{ margin: "0 auto 24px" }}
              />
              <h2
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: colors.beninYellow,
                  marginBottom: 16,
                }}
              >
                En cours de traitement
              </h2>
            </>
          )}

          <p style={{ color: colors.gray600, fontSize: 16, lineHeight: 1.6, marginBottom: 32 }}>
            {result.message}
          </p>

          <div
            style={{
              background: colors.gray50,
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
              textAlign: "left",
            }}
          >
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: colors.gray600 }}>Montant demandé:</span>
                <strong style={{ color: colors.gray800 }}>
                  {Number(montantDemande).toLocaleString("fr-FR")} FCFA
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: colors.gray600 }}>Opportunité:</span>
                <strong style={{ color: colors.gray800 }}>{post.titre}</strong>
              </div>
            </div>
          </div>

          <p style={{ color: colors.gray500, fontSize: 14, marginBottom: 24 }}>
            {isApproved
              ? "Vous serez redirigé vers votre tableau de bord en quelques secondes..."
              : "Un conseiller examinera votre demande et vous contactera bientôt."}
          </p>
        </div>
      </div>
    );
  }

  // État: Formulaire normal
  const montantMin = post.montant_min_fcfa || 0;
  const montantMax = post.montant_max_fcfa || 1000000;
  const autoApproveScore = profile.reputation_score >= (post.score_minimum_auto || 4);

  return (
    <div style={{ minHeight: "100vh", background: colors.gray50, padding: "24px" }}>
      {/* Barre tricolore */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          display: "flex",
          zIndex: 50,
        }}
      >
        <div style={{ flex: 1, background: colors.beninGreen }} />
        <div style={{ flex: 1, background: colors.beninYellow }} />
        <div style={{ flex: 1, background: colors.beninRed }} />
      </div>

      <div style={{ maxWidth: 700, margin: "0 auto", paddingTop: 24 }}>
        {/* Bouton retour */}
        <button
          onClick={() => router.back()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "none",
            border: "none",
            color: colors.gray600,
            cursor: "pointer",
            marginBottom: 24,
            padding: "8px 0",
            fontSize: 14,
            fontWeight: 500,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = colors.deepBlue)}
          onMouseLeave={(e) => (e.currentTarget.style.color = colors.gray600)}
        >
          <ArrowLeft size={20} />
          Retour à l'opportunité
        </button>

        {/* En-tête */}
        <div
          style={{
            background: colors.white,
            borderRadius: 24,
            padding: 32,
            marginBottom: 24,
            border: `1px solid ${colors.gray200}`,
          }}
        >
          <h1
            style={{
              fontSize: "clamp(24px, 4vw, 32px)",
              fontWeight: 700,
              fontFamily: "'Playfair Display', serif",
              color: colors.gray800,
              marginBottom: 8,
            }}
          >
            Postuler à cette opportunité
          </h1>
          <p style={{ fontSize: 14, color: colors.gray600 }}>{post.titre}</p>
        </div>

        {/* Grille principale */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>
          {/* Formulaire */}
          <form
            onSubmit={handleSubmit}
            style={{
              background: colors.white,
              borderRadius: 24,
              padding: 32,
              border: `1px solid ${colors.gray200}`,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.gray800, marginBottom: 24 }}>
              Détails de votre demande
            </h2>

            {submitError && (
              <div
                style={{
                  background: `${colors.beninRed}10`,
                  border: `1px solid ${colors.beninRed}20`,
                  color: colors.beninRed,
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 24,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <AlertCircle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{submitError}</span>
              </div>
            )}

            {/* Montant demandé */}
            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 14,
                  fontWeight: 600,
                  color: colors.gray700,
                  marginBottom: 8,
                }}
              >
                Montant demandé (FCFA)
              </label>
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <DollarSign
                  size={18}
                  color={colors.gray400}
                  style={{
                    position: "absolute",
                    left: 12,
                    pointerEvents: "none",
                  }}
                />
                <input
                  type="number"
                  min={montantMin}
                  max={montantMax}
                  placeholder={`Entre ${montantMin.toLocaleString()} et ${montantMax.toLocaleString()} FCFA`}
                  value={montantDemande}
                  onChange={(e) => setMontantDemande(e.target.value)}
                  disabled={submitting}
                  style={{
                    width: "100%",
                    paddingLeft: 40,
                    paddingRight: 16,
                    paddingTop: 12,
                    paddingBottom: 12,
                    border: `1px solid ${colors.gray200}`,
                    borderRadius: 12,
                    fontSize: 14,
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: colors.gray500,
                  marginTop: 8,
                }}
              >
                Montant: {montantMin.toLocaleString()} - {montantMax.toLocaleString()} FCFA
              </p>
            </div>

            {/* Message */}
            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 14,
                  fontWeight: 600,
                  color: colors.gray700,
                  marginBottom: 8,
                }}
              >
                Message de motivation
              </label>
              <div style={{ position: "relative" }}>
                <MessageSquare
                  size={18}
                  color={colors.gray400}
                  style={{
                    position: "absolute",
                    left: 12,
                    top: 12,
                    pointerEvents: "none",
                  }}
                />
                <textarea
                  placeholder="Expliquez pourquoi cette opportunité est importante pour vous et comment vous l'utiliserez..."
                  value={messageDemande}
                  onChange={(e) => setMessageDemande(e.target.value)}
                  disabled={submitting}
                  style={{
                    width: "100%",
                    paddingLeft: 40,
                    paddingRight: 16,
                    paddingTop: 12,
                    paddingBottom: 12,
                    border: `1px solid ${colors.gray200}`,
                    borderRadius: 12,
                    fontSize: 14,
                    minHeight: 140,
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                    resize: "vertical",
                  }}
                />
              </div>
            </div>

            {/* Bouton soumettre */}
            <button
              type="submit"
              disabled={submitting || !isFormValid}
              style={{
                width: "100%",
                padding: "14px 20px",
                borderRadius: 12,
                border: "none",
                background: isFormValid && !submitting ? colors.beninGreen : colors.gray400,
                color: colors.white,
                fontWeight: 600,
                fontSize: 15,
                cursor: isFormValid && !submitting ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "all 0.2s ease",
                opacity: isFormValid && !submitting ? 1 : 0.6,
              }}
              onMouseEnter={(e) => {
                if (isFormValid && !submitting) {
                  e.currentTarget.style.background = colors.beninGreen;
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 16px rgba(0, 135, 81, 0.2)";
                }
              }}
              onMouseLeave={(e) => {
                if (isFormValid && !submitting) {
                  e.currentTarget.style.background = colors.beninGreen;
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }
              }}
            >
              {submitting ? (
                <>
                  <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                  Traitement en cours...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Envoyer ma demande
                </>
              )}
            </button>

            <style>{`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
          </form>

          {/* Sidebar - Informations */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Profil */}
            <div
              style={{
                background: colors.white,
                borderRadius: 20,
                padding: 20,
                border: `1px solid ${colors.gray200}`,
              }}
            >
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: colors.gray700,
                  marginBottom: 16,
                }}
              >
                Votre profil
              </h3>

              <div
                style={{
                  padding: 12,
                  borderRadius: 12,
                  background: colors.gray50,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <TrendingUp size={16} color={colors.beninGreen} />
                  <span style={{ fontSize: 12, color: colors.gray600 }}>
                    Score de réputation
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: colors.beninGreen,
                  }}
                >
                  {profile.reputation_score.toFixed(1)}/5
                </div>
              </div>

              {post.type_traitement === "auto" && (
                <div
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    background: autoApproveScore ? `${colors.beninGreen}10` : `${colors.beninRed}10`,
                    border: `1px solid ${autoApproveScore ? colors.beninGreen : colors.beninRed}20`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    {autoApproveScore ? (
                      <CheckCircle2 size={14} color={colors.beninGreen} />
                    ) : (
                      <AlertCircle size={14} color={colors.beninRed} />
                    )}
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: autoApproveScore ? colors.beninGreen : colors.beninRed,
                      }}
                    >
                      Éligible pour approbation auto
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: 11,
                      color: autoApproveScore ? colors.beninGreen : colors.beninRed,
                      margin: 0,
                    }}
                  >
                    {autoApproveScore
                      ? `Votre score (${profile.reputation_score.toFixed(1)}) ≥ ${post.score_minimum_auto}`
                      : `Votre score (${profile.reputation_score.toFixed(1)}) < ${post.score_minimum_auto}`}
                  </p>
                </div>
              )}
            </div>

            {/* Types de traitement */}
            <div
              style={{
                background:
                  post.type_traitement === "auto"
                    ? `${colors.beninGreen}05`
                    : `${colors.beninYellow}05`,
                borderRadius: 20,
                padding: 20,
                border: `1px solid ${
                  post.type_traitement === "auto"
                    ? colors.beninGreen
                    : colors.beninYellow
                }20`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                {post.type_traitement === "auto" ? (
                  <Zap size={16} color={colors.beninGreen} />
                ) : (
                  <Clock size={16} color={colors.beninYellow} />
                )}
                <h3
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color:
                      post.type_traitement === "auto"
                        ? colors.beninGreen
                        : colors.beninYellow,
                    margin: 0,
                  }}
                >
                  {post.type_traitement === "auto"
                    ? "Réponse instantanée"
                    : "Révision manuelle"}
                </h3>
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: colors.gray600,
                  margin: 0,
                }}
              >
                {post.type_traitement === "auto"
                  ? "Vous obtiendrez une réponse en quelques secondes"
                  : "Votre demande sera examinée dans 3-5 jours"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
