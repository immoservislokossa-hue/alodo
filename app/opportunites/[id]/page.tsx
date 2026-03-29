"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import supabase from "@/src/lib/supabase/browser";
import {
  ArrowLeft,
  Building2,
  Calendar,
  MapPin,
  DollarSign,
  Clock,
  TrendingUp,
  FileText,
  CheckCircle,
  XCircle,
  ExternalLink,
  Loader2,
  AlertCircle,
  Percent,
  Users,
  Briefcase,
  Shield,
  Upload
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

type PostInstitution = {
  id: string;
  titre: string;
  description: string;
  institution_nom: string;
  institution_logo?: string;
  institution_description?: string;
  montant_min_fcfa?: number;
  montant_max_fcfa?: number;
  montant_min?: number;
  montant_max?: number;
  duree_mois?: number;
  taux_interet?: number;
  date_limite?: string;
  lieu?: string;
  secteur?: string;
  conditions?: string[];
  documents_requis?: string[];
  type_traitement?: "auto" | "manuel";
  score_minimum_auto?: number;
  institution_profile_id?: string;
  created_at: string;
};

type Match = {
  id: string;
  post_institution_id: string;
  profile_id: string;
  score: number;
  niveau: string;
  matching_reasons: string[];
  missing_documents: string[];
  can_apply: boolean;
  created_at: string;
};

export default function OpportuniteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [post, setPost] = useState<PostInstitution | null>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadData() {
      if (!id) return;
      
      try {
        // Vérifier la session
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user ?? null;

        if (!user) {
          router.replace("/institutions/login");
          return;
        }

        // Récupérer le profil
        const { data: profileRow, error: profileErr } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileErr) throw profileErr;
        if (!profileRow?.id) {
          setError("Profil introuvable");
          return;
        }

        setProfileId(profileRow.id);

        // Récupérer les détails du post
        const { data: postData, error: postErr } = await supabase
          .from("post_institutions")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (postErr) throw postErr;
        if (!postData) {
          setError("Opportunité non trouvée");
          return;
        }

        setPost(postData);

        // Récupérer le match pour ce profil et ce post
        const { data: matchData, error: matchErr } = await supabase
          .from("post_institution_matches")
          .select("*")
          .eq("post_institution_id", id)
          .eq("profile_id", profileRow.id)
          .maybeSingle();

        if (matchErr) throw matchErr;
        setMatch(matchData);

      } catch (err: any) {
        if (active) setError(err?.message ?? "Erreur lors du chargement");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
  }, [id, router]);

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

  if (error || !post) {
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
          <p style={{ color: colors.gray600, marginTop: 16 }}>{error || "Opportunité non trouvée"}</p>
          <button
            onClick={() => router.back()}
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
            Retour
          </button>
        </div>
      </div>
    );
  }

  const canApply = match?.can_apply === true;
  const score = match?.score || 0;
  const niveau = match?.niveau === "tres_pertinent" ? "Très pertinent" : "Pertinent";
  const niveauColor = match?.niveau === "tres_pertinent" ? colors.beninGreen : colors.deepBlue;

  return (
    <div style={{
      minHeight: "100vh",
      background: colors.gray50,
      padding: "24px",
    }}>
      {/* Barre tricolore */}
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

      <div style={{ maxWidth: 1000, margin: "0 auto", paddingTop: 24 }}>
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
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = colors.deepBlue}
          onMouseLeave={(e) => e.currentTarget.style.color = colors.gray600}
        >
          <ArrowLeft size={20} />
          Retour aux opportunités
        </button>

        {/* En-tête */}
        <div style={{
          background: colors.white,
          borderRadius: 24,
          padding: 32,
          marginBottom: 24,
          border: `1px solid ${colors.gray200}`,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: `${colors.deepBlue}10`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <Building2 size={32} color={colors.deepBlue} />
              </div>
              <div>
                <h1 style={{
                  fontSize: "clamp(24px, 4vw, 32px)",
                  fontWeight: 700,
                  fontFamily: "'Playfair Display', serif",
                  color: colors.gray800,
                  marginBottom: 8,
                }}>
                  {post.titre}
                </h1>
                <p style={{ fontSize: 14, color: colors.gray500 }}>
                  {post.institution_nom}
                </p>
              </div>
            </div>
            
            {/* Badge de score */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              borderRadius: 20,
              background: `${niveauColor}10`,
            }}>
              <TrendingUp size={16} color={niveauColor} />
              <span style={{ fontSize: 13, fontWeight: 600, color: niveauColor }}>
                Score: {score}% - {niveau}
              </span>
            </div>
          </div>
        </div>

        {/* Grille principale */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
          {/* Colonne gauche - Détails */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Description */}
            <div style={{
              background: colors.white,
              borderRadius: 20,
              padding: 24,
              border: `1px solid ${colors.gray200}`,
            }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.gray800, marginBottom: 16 }}>
                Description
              </h2>
              <p style={{ color: colors.gray600, lineHeight: 1.7 }}>
                {post.description || "Aucune description disponible."}
              </p>
            </div>

            {/* Informations financières */}
            <div style={{
              background: colors.white,
              borderRadius: 20,
              padding: 24,
              border: `1px solid ${colors.gray200}`,
            }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.gray800, marginBottom: 16 }}>
                Informations financières
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                {(post.montant_min_fcfa || post.montant_min) && (post.montant_max_fcfa || post.montant_max) && (
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: `${colors.beninGreen}10`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <DollarSign size={20} color={colors.beninGreen} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: colors.gray500 }}>Montant</div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: colors.gray800 }}>
                        {(post.montant_min_fcfa || post.montant_min || 0).toLocaleString()} - {(post.montant_max_fcfa || post.montant_max || 0).toLocaleString()} FCFA
                      </div>
                    </div>
                  </div>
                )}
                {post.duree_mois && (
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: `${colors.deepBlue}10`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <Clock size={20} color={colors.deepBlue} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: colors.gray500 }}>Durée</div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: colors.gray800 }}>
                        {post.duree_mois} mois
                      </div>
                    </div>
                  </div>
                )}
                {post.taux_interet && (
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: `${colors.beninYellow}10`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <Percent size={20} color={colors.beninYellow} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: colors.gray500 }}>Taux d'intérêt</div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: colors.gray800 }}>
                        {post.taux_interet}%
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Conditions de financement */}
            <div style={{
              background: post.type_traitement === "auto" ? `${colors.beninGreen}05` : `${colors.beninYellow}05`,
              borderRadius: 20,
              padding: 24,
              border: `1px solid ${post.type_traitement === "auto" ? colors.beninGreen : colors.beninYellow}20`,
            }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: post.type_traitement === "auto" ? colors.beninGreen : colors.beninYellow, marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
                {post.type_traitement === "auto" ? (
                  <>
                    <CheckCircle size={20} />
                    Financement Automatique
                  </>
                ) : (
                  <>
                    <Clock size={20} />
                    Financement Manuel
                  </>
                )}
              </h2>
              <p style={{ color: colors.gray600, marginBottom: 16, lineHeight: 1.6 }}>
                {post.type_traitement === "auto" ? (
                  <>Votre réponse sera <strong>traitée automatiquement</strong> en quelques secondes. Si votre score de réputation est ≥ <strong>{post.score_minimum_auto}</strong>, vous obtiendrez une réponse instantanée.</>
                ) : (
                  <>Votre demande sera <strong>examinée manuellement</strong> par l'institution. Vous recevrez une réponse sous 3-5 jours.
                  </>
                )}
              </p>
            </div>

            {/* Conditions de financement */}
            <div style={{
              background: post.type_traitement === "auto" ? `${colors.beninGreen}05` : `${colors.deepBlue}05`,
              borderRadius: 20,
              padding: 24,
              border: `1px solid ${post.type_traitement === "auto" ? colors.beninGreen : colors.deepBlue}20`,
              marginBottom: 24,
            }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.gray800, marginBottom: 16 }}>
                Conditions de financement
              </h2>
              {post.type_traitement === "auto" ? (
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: colors.white, borderRadius: 12 }}>
                  <div style={{ fontSize: 24 }}>⚡</div>
                  <div>
                    <div style={{ fontWeight: 600, color: colors.beninGreen }}>Financement automatique disponible</div>
                    <div style={{ fontSize: 14, color: colors.gray600, marginTop: 4 }}>
                      Financement approuvé instantanément si votre score de réputation ≥ {post.score_minimum_auto}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: colors.white, borderRadius: 12 }}>
                  <div style={{ fontSize: 24 }}>👤</div>
                  <div>
                    <div style={{ fontWeight: 600, color: colors.deepBlue }}>Financement soumis à validation</div>
                    <div style={{ fontSize: 14, color: colors.gray600, marginTop: 4 }}>
                      Votre demande sera examinée par l'institution
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Conditions et documents */}
            <div style={{
              background: colors.white,
              borderRadius: 20,
              padding: 24,
              border: `1px solid ${colors.gray200}`,
            }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.gray800, marginBottom: 16 }}>
                Conditions requises
              </h2>
              {post.conditions && post.conditions.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: 20, marginBottom: 24 }}>
                  {post.conditions.map((condition, idx) => (
                    <li key={idx} style={{ color: colors.gray600, marginBottom: 8 }}>{condition}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: colors.gray500, marginBottom: 24 }}>Aucune condition spécifique.</p>
              )}

              <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.gray800, marginBottom: 16 }}>
                Documents requis
              </h2>
              {post.documents_requis && post.documents_requis.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {post.documents_requis.map((doc, idx) => {
                    const isMissing = match?.missing_documents?.includes(doc);
                    return (
                      <li key={idx} style={{
                        color: isMissing ? colors.beninRed : colors.gray600,
                        marginBottom: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}>
                        {isMissing ? (
                          <XCircle size={14} color={colors.beninRed} />
                        ) : (
                          <CheckCircle size={14} color={colors.beninGreen} />
                        )}
                        {doc}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p style={{ color: colors.gray500 }}>Aucun document spécifique requis.</p>
              )}
            </div>

            {/* Raisons du matching */}
            {match?.matching_reasons && match.matching_reasons.length > 0 && (
              <div style={{
                background: `${colors.deepBlue}05`,
                borderRadius: 20,
                padding: 24,
                border: `1px solid ${colors.deepBlue}20`,
              }}>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.deepBlue, marginBottom: 16 }}>
                  Pourquoi cette opportunité est pertinente
                </h2>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {match.matching_reasons.map((reason, idx) => (
                    <li key={idx} style={{ color: colors.gray600, marginBottom: 8 }}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Colonne droite - Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Carte d'action */}
            <div style={{
              background: colors.white,
              borderRadius: 20,
              padding: 24,
              border: `1px solid ${colors.gray200}`,
              position: "sticky",
              top: 24,
            }}>
              <div style={{
                padding: 16,
                borderRadius: 16,
                background: canApply ? `${colors.beninGreen}10` : `${colors.beninRed}10`,
                marginBottom: 24,
                textAlign: "center",
              }}>
                {canApply ? (
                  <>
                    <CheckCircle size={32} color={colors.beninGreen} style={{ margin: "0 auto 12px" }} />
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.beninGreen, marginBottom: 8 }}>
                      Vous pouvez postuler
                    </h3>
                    <p style={{ fontSize: 13, color: colors.gray600 }}>
                      Votre profil correspond aux critères de cette opportunité.
                    </p>
                  </>
                ) : (
                  <>
                    <XCircle size={32} color={colors.beninRed} style={{ margin: "0 auto 12px" }} />
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.beninRed, marginBottom: 8 }}>
                      Non postulable
                    </h3>
                    <p style={{ fontSize: 13, color: colors.gray600 }}>
                      Complétez votre profil pour postuler.
                    </p>
                  </>
                )}
              </div>

              {canApply ? (
                <button
                  onClick={() => router.push(`/opportunites/${post.id}/postuler`)}
                  style={{
                    width: "100%",
                    padding: "14px 20px",
                    borderRadius: 14,
                    border: "none",
                    background: colors.beninGreen,
                    color: colors.white,
                    fontWeight: 600,
                    fontSize: 15,
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
                  Postuler maintenant
                  <ExternalLink size={16} />
                </button>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {match?.missing_documents && match.missing_documents.length > 0 && (
                    <div style={{
                      padding: 12,
                      borderRadius: 12,
                      background: `${colors.beninRed}05`,
                      border: `1px solid ${colors.beninRed}20`,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <FileText size={14} color={colors.beninRed} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: colors.beninRed }}>
                          Documents manquants :
                        </span>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {match.missing_documents.map((doc, idx) => (
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
                  
                  <button
                    onClick={() => router.push("/profil/documents")}
                    style={{
                      width: "100%",
                      padding: "14px 20px",
                      borderRadius: 14,
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
                    <Upload size={16} />
                    Ajouter mes documents
                  </button>
                  
                  <button
                    onClick={() => router.push("/profil")}
                    style={{
                      width: "100%",
                      padding: "14px 20px",
                      borderRadius: 14,
                      border: "none",
                      background: colors.gray100,
                      color: colors.gray600,
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = colors.gray200;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = colors.gray100;
                    }}
                  >
                    <Shield size={16} />
                    Compléter mon profil
                  </button>
                </div>
              )}
            </div>

            {/* Informations supplémentaires */}
            <div style={{
              background: colors.white,
              borderRadius: 20,
              padding: 20,
              border: `1px solid ${colors.gray200}`,
            }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: colors.gray700, marginBottom: 12 }}>
                Informations pratiques
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {post.lieu && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <MapPin size={16} color={colors.gray400} />
                    <span style={{ fontSize: 13, color: colors.gray600 }}>{post.lieu}</span>
                  </div>
                )}
                {post.date_limite && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Calendar size={16} color={colors.gray400} />
                    <span style={{ fontSize: 13, color: colors.gray600 }}>
                      Date limite: {new Date(post.date_limite).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                )}
                {post.secteur && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Briefcase size={16} color={colors.gray400} />
                    <span style={{ fontSize: 13, color: colors.gray600 }}>Secteur: {post.secteur}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}