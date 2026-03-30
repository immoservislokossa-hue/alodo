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
  FileText,
  Upload,
  X,
  Check
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
  documents_disponibles?: any;
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
  documents_requis?: string[];
};

type FinancingResult = {
  statut: "approved" | "pending" | "rejected";
  message: string;
};

// Styles responsives mobile-first
const styles = {
  container: {
    minHeight: "100vh",
    background: colors.gray50,
    padding: "16px",
  },
  content: {
    maxWidth: 1200,
    margin: "0 auto",
    paddingTop: "16px",
  },
  backButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "none",
    border: "none",
    color: colors.gray600,
    cursor: "pointer",
    marginBottom: "20px",
    padding: "8px 0",
    fontSize: "14px",
    fontWeight: 500,
    width: "fit-content",
  },
  headerCard: {
    background: colors.white,
    borderRadius: "20px",
    padding: "20px",
    marginBottom: "20px",
    border: `1px solid ${colors.gray200}`,
  },
  title: {
    fontSize: "24px",
    fontWeight: 700,
    fontFamily: "'Playfair Display', serif",
    color: colors.gray800,
    marginBottom: "8px",
  },
  subtitle: {
    fontSize: "14px",
    color: colors.gray600,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "20px",
  },
  formCard: {
    background: colors.white,
    borderRadius: "20px",
    padding: "20px",
    border: `1px solid ${colors.gray200}`,
  },
  formTitle: {
    fontSize: "18px",
    fontWeight: 600,
    color: colors.gray800,
    marginBottom: "20px",
  },
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: 600,
    color: colors.gray700,
    marginBottom: "8px",
  },
  inputWrapper: {
    position: "relative" as const,
    display: "flex",
    alignItems: "center",
  },
  inputIcon: {
    position: "absolute" as const,
    left: "12px",
    pointerEvents: "none" as const,
  },
  input: {
    width: "100%",
    paddingLeft: "40px",
    paddingRight: "16px",
    paddingTop: "12px",
    paddingBottom: "12px",
    border: `1px solid ${colors.gray200}`,
    borderRadius: "12px",
    fontSize: "14px",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
    outline: "none",
    transition: "border-color 0.2s",
  },
  textarea: {
    width: "100%",
    paddingLeft: "40px",
    paddingRight: "16px",
    paddingTop: "12px",
    paddingBottom: "12px",
    border: `1px solid ${colors.gray200}`,
    borderRadius: "12px",
    fontSize: "14px",
    minHeight: "120px",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
    resize: "vertical" as const,
    outline: "none",
  },
  helperText: {
    fontSize: "12px",
    color: colors.gray500,
    marginTop: "8px",
  },
  errorBox: {
    background: `${colors.beninRed}10`,
    border: `1px solid ${colors.beninRed}20`,
    color: colors.beninRed,
    padding: "12px",
    borderRadius: "12px",
    marginBottom: "20px",
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    fontSize: "13px",
  },
  submitButton: (disabled: boolean) => ({
    width: "100%",
    padding: "14px 20px",
    borderRadius: "12px",
    border: "none",
    background: disabled ? colors.gray400 : colors.beninGreen,
    color: colors.white,
    fontWeight: 600,
    fontSize: "15px",
    cursor: disabled ? "not-allowed" : "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "all 0.2s ease",
    opacity: disabled ? 0.6 : 1,
  }),
  sidebarCard: {
    background: colors.white,
    borderRadius: "20px",
    padding: "20px",
    border: `1px solid ${colors.gray200}`,
  },
  sidebarTitle: {
    fontSize: "14px",
    fontWeight: 600,
    color: colors.gray700,
    marginBottom: "16px",
  },
  scoreCard: {
    padding: "12px",
    borderRadius: "12px",
    background: colors.gray50,
    marginBottom: "16px",
  },
  scoreValue: {
    fontSize: "24px",
    fontWeight: 700,
    color: colors.beninGreen,
  },
  badge: (bgColor: string, textColor: string) => ({
    padding: "12px",
    borderRadius: "12px",
    background: bgColor,
    border: `1px solid ${textColor}20`,
  }),
  missingDocsCard: {
    background: `${colors.beninYellow}08`,
    borderRadius: "12px",
    padding: "12px",
    marginTop: "12px",
    border: `1px solid ${colors.beninYellow}20`,
  },
  docList: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "8px",
    marginTop: "8px",
  },
  docTag: (hasDoc: boolean) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    background: hasDoc ? `${colors.beninGreen}10` : `${colors.beninRed}10`,
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    border: `1px solid ${hasDoc ? colors.beninGreen : colors.beninRed}`,
    color: hasDoc ? colors.beninGreen : colors.beninRed,
  }),
  successCard: {
    background: colors.white,
    borderRadius: "24px",
    padding: "32px",
    textAlign: "center" as const,
    maxWidth: "500px",
    margin: "0 auto",
  },
};

// Mapping des documents requis pour affichage convivial
const documentLabels: Record<string, string> = {
  cip: "Carte d'identité nationale",
  passport: "Passeport",
  attestation_residence: "Attestation de résidence",
  justificatif_domicile: "Justificatif de domicile",
  registre_commerce: "Registre de commerce",
  numero_contribuable: "Numéro de contribuable",
  releve_mobile_money: "Relevé Mobile Money",
  attestation_formation: "Attestation de formation",
  diplome: "Diplôme",
  certificat_professionnel: "Certificat professionnel",
  photo_identite: "Photo d'identité",
  lettre_recommandation: "Lettre de recommandation",
  plan_affaires: "Plan d'affaires",
  etats_financiers: "États financiers",
};

export default function PostulerPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [post, setPost] = useState<PostInstitution | null>(null);
  const [montantDemande, setMontantDemande] = useState("");
  const [messageDemande, setMessageDemande] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<FinancingResult | null>(null);
  const [missingDocuments, setMissingDocuments] = useState<string[]>([]);

  useEffect(() => {
    let active = true;

    async function loadData() {
      if (!postId) return;

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;

        if (!user) {
          router.replace("/institutions/login");
          return;
        }

        const { data: profileData, error: profileErr } = await supabase
          .from("profiles")
          .select("id, user_id, reputation_score, type, archetype, documents_disponibles")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileErr) throw profileErr;
        if (!profileData) {
          setError("Profil introuvable");
          return;
        }

        if (!active) return;
        setProfile(profileData);

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

        // Vérifier les documents manquants
        const requis = postData.documents_requis || [];
        const disponibles = profileData.documents_disponibles || {};
        
        const missing = requis.filter((doc: string) => !disponibles[doc]);
        setMissingDocuments(missing);

      } catch (err: any) {
        if (active) {
          console.error("Erreur:", err);
          setError(err?.message ?? "Erreur lors du chargement");
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

  const montantMin = post?.montant_min_fcfa || 0;
  const montantMax = post?.montant_max_fcfa || 1000000;
  const isFormValid = montantDemande && Number(montantDemande) > 0 && messageDemande.trim().length > 0;
  const hasMissingDocs = missingDocuments.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!profile || !post) {
      setSubmitError("Données manquantes");
      return;
    }

    if (hasMissingDocs) {
      setSubmitError(`Vous devez d'abord uploader les documents manquants: ${missingDocuments.map(d => documentLabels[d] || d).join(", ")}`);
      return;
    }

    if (!isFormValid) {
      setSubmitError("Veuillez remplir tous les champs");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const { data: eligibilityResult, error: rpcError } = await supabase.rpc(
        "check_financement_eligibility",
        { p_profile_id: profile.id, p_post_id: post.id }
      );

      if (rpcError) throw new Error("Erreur de vérification");

      const statut = eligibilityResult || "pending";

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

      if (insertErr) throw new Error("Erreur d'enregistrement");

      const resultMessage = statut === "approved"
        ? "Votre demande de financement a été approuvée instantanément."
        : "Votre demande est en cours de traitement. L'institution la passera en revue sous peu.";

      setResult({ statut, message: resultMessage });

      setTimeout(() => router.push("/opportunites"), 3000);

    } catch (err: any) {
      setSubmitError(err?.message ?? "Une erreur s'est produite");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
          <Loader2 size={40} color={colors.deepBlue} style={{ animation: "spin 1s linear infinite" }} />
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (error || !profile || !post) {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.successCard, marginTop: "100px" }}>
          <AlertCircle size={48} color={colors.beninRed} style={{ margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Erreur</h2>
          <p style={{ color: colors.gray600, marginBottom: 24 }}>{error || "Données manquantes"}</p>
          <button onClick={() => router.back()} style={styles.submitButton(false)}>
            Retour
          </button>
        </div>
      </div>
    );
  }

  if (result) {
    const isApproved = result.statut === "approved";
    return (
      <div style={styles.container}>
        <div style={{ ...styles.successCard, marginTop: "100px", border: `2px solid ${isApproved ? colors.beninGreen : colors.beninYellow}` }}>
          {isApproved ? (
            <CheckCircle2 size={64} color={colors.beninGreen} style={{ margin: "0 auto 24px" }} />
          ) : (
            <Clock size={64} color={colors.beninYellow} style={{ margin: "0 auto 24px" }} />
          )}
          <h2 style={{ fontSize: 24, fontWeight: 700, color: isApproved ? colors.beninGreen : colors.beninYellow, marginBottom: 16 }}>
            {isApproved ? "Financement Approuvé" : "En cours de traitement"}
          </h2>
          <p style={{ color: colors.gray600, marginBottom: 24 }}>{result.message}</p>
          <p style={{ fontSize: 13, color: colors.gray500 }}>Redirection dans quelques secondes...</p>
        </div>
      </div>
    );
  }

  const autoApproveScore = profile.reputation_score >= (post.score_minimum_auto || 4);

  return (
    <div style={styles.container}>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "4px", display: "flex", zIndex: 50 }}>
        <div style={{ flex: 1, background: colors.beninGreen }} />
        <div style={{ flex: 1, background: colors.beninYellow }} />
        <div style={{ flex: 1, background: colors.beninRed }} />
      </div>

      <div style={styles.content}>
        <button onClick={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={20} /> Retour
        </button>

        <div style={styles.headerCard}>
          <h1 style={styles.title}>Postuler</h1>
          <p style={styles.subtitle}>{post.titre}</p>
        </div>

        <div style={styles.grid}>
          {/* Formulaire */}
          <form onSubmit={handleSubmit} style={styles.formCard}>
            <h2 style={styles.formTitle}>Votre demande</h2>

            {submitError && (
              <div style={styles.errorBox}>
                <AlertCircle size={18} />
                <span>{submitError}</span>
              </div>
            )}

            {hasMissingDocs && (
              <div style={styles.missingDocsCard}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <Upload size={14} color={colors.beninYellow} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: colors.beninYellow }}>Documents manquants</span>
                </div>
                <p style={{ fontSize: 12, color: colors.gray600, marginBottom: 8 }}>
                  Pour postuler, vous devez d'abord uploader ces documents:
                </p>
                <div style={styles.docList}>
                  {missingDocuments.map(doc => (
                    <span key={doc} style={styles.docTag(false)}>
                      <X size={10} />
                      {documentLabels[doc] || doc}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/profil/documents")}
                  style={{
                    marginTop: 12,
                    padding: "8px 16px",
                    background: colors.beninYellow,
                    color: colors.white,
                    border: "none",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    width: "100%",
                  }}
                >
                  Uploader mes documents
                </button>
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label style={styles.label}>Montant demandé (FCFA)</label>
              <div style={styles.inputWrapper}>
                <DollarSign size={16} color={colors.gray400} style={styles.inputIcon} />
                <input
                  type="number"
                  min={montantMin}
                  max={montantMax}
                  placeholder={`${montantMin.toLocaleString()} - ${montantMax.toLocaleString()} FCFA`}
                  value={montantDemande}
                  onChange={(e) => setMontantDemande(e.target.value)}
                  disabled={submitting || hasMissingDocs}
                  style={styles.input}
                  onFocus={(e) => e.target.style.borderColor = colors.beninGreen}
                  onBlur={(e) => e.target.style.borderColor = colors.gray200}
                />
              </div>
              <p style={styles.helperText}>Montant disponible: {montantMin.toLocaleString()} - {montantMax.toLocaleString()} FCFA</p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={styles.label}>Message de motivation</label>
              <div style={styles.inputWrapper}>
                <MessageSquare size={16} color={colors.gray400} style={styles.inputIcon} />
                <textarea
                  placeholder="Expliquez pourquoi cette opportunité est importante pour vous..."
                  value={messageDemande}
                  onChange={(e) => setMessageDemande(e.target.value)}
                  disabled={submitting || hasMissingDocs}
                  style={styles.textarea}
                  onFocus={(e) => e.target.style.borderColor = colors.beninGreen}
                  onBlur={(e) => e.target.style.borderColor = colors.gray200}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !isFormValid || hasMissingDocs}
              style={styles.submitButton(!isFormValid || hasMissingDocs)}
            >
              {submitting ? (
                <><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Envoi...</>
              ) : (
                <><Send size={16} /> Envoyer ma demande</>
              )}
            </button>
          </form>

          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={styles.sidebarCard}>
              <h3 style={styles.sidebarTitle}>Votre profil</h3>
              <div style={styles.scoreCard}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <TrendingUp size={14} color={colors.beninGreen} />
                  <span style={{ fontSize: 12, color: colors.gray600 }}>Score de réputation</span>
                </div>
                <div style={styles.scoreValue}>{profile.reputation_score.toFixed(1)}/10</div>
              </div>

              {post.type_traitement === "auto" && (
                <div style={styles.badge(autoApproveScore ? `${colors.beninGreen}10` : `${colors.beninRed}10`, autoApproveScore ? colors.beninGreen : colors.beninRed)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    {autoApproveScore ? <CheckCircle2 size={14} color={colors.beninGreen} /> : <AlertCircle size={14} color={colors.beninRed} />}
                    <span style={{ fontSize: 11, fontWeight: 600, color: autoApproveScore ? colors.beninGreen : colors.beninRed }}>
                      {autoApproveScore ? "Éligible approbation auto" : "Non éligible auto"}
                    </span>
                  </div>
                  <p style={{ fontSize: 10, color: autoApproveScore ? colors.beninGreen : colors.beninRed, margin: 0 }}>
                    Score {profile.reputation_score.toFixed(1)} {autoApproveScore ? "≥" : "<"} {post.score_minimum_auto}
                  </p>
                </div>
              )}
            </div>

            <div style={styles.sidebarCard}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                {post.type_traitement === "auto" ? <Zap size={16} color={colors.beninGreen} /> : <Clock size={16} color={colors.beninYellow} />}
                <h3 style={{ ...styles.sidebarTitle, marginBottom: 0 }}>
                  {post.type_traitement === "auto" ? "Réponse instantanée" : "Révision manuelle"}
                </h3>
              </div>
              <p style={{ fontSize: 12, color: colors.gray600, margin: 0 }}>
                {post.type_traitement === "auto"
                  ? "Réponse automatique en quelques secondes"
                  : "Examen dans les 3-5 jours ouvrés"}
              </p>
            </div>

            {post.documents_requis && post.documents_requis.length > 0 && (
              <div style={styles.sidebarCard}>
                <h3 style={styles.sidebarTitle}>Documents requis</h3>
                <div style={styles.docList}>
                  {post.documents_requis.map(doc => {
                    const hasDoc = !missingDocuments.includes(doc);
                    return (
                      <span key={doc} style={styles.docTag(hasDoc)}>
                        {hasDoc ? <Check size={10} /> : <X size={10} />}
                        {documentLabels[doc] || doc}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}