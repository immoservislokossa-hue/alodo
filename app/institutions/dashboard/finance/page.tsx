"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/src/lib/supabase/browser";
import { ArrowLeft, ChevronDown, Check, X, Loader2, AlertCircle, MessageSquare } from "lucide-react";

const colors = {
  white: "#FFFFFF",
  deepBlue: "#1a3c6b",
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

type PostWithApplicants = {
  id: string;
  titre: string;
  montant_min_fcfa: number;
  montant_max_fcfa: number;
  type_traitement: "auto" | "manuel";
  applicants: Applicant[];
};

type Applicant = {
  id: string;
  financement_id: string;
  profile_id: string;
  phone: string;
  secteur: string;
  sous_secteur: string;
  montant_demande: number;
  reputation_score: number;
  statut: "pending" | "approved" | "rejected";
  message_demande: string;
  created_at: string;
};

export default function FinanceDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<PostWithApplicants[]>([]);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      // 1. Vérifier la session et le rôle
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;

      if (!user) {
        router.replace("/institutions/login");
        return;
      }

      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileErr) throw profileErr;
      if (!profile?.id || profile.role !== "admin") {
        router.replace("/");
        return;
      }

      // 2. Récupérer tous les posts de l'institution
      const { data: postsData, error: postsErr } = await supabase
        .from("post_institutions")
        .select("id, titre, montant_min_fcfa, montant_max_fcfa, type_traitement")
        .eq("institution_profile_id", profile.id)
        .order("created_at", { ascending: false });

      if (postsErr) throw postsErr;

      // 3. Pour chaque post, récupérer les financements avec les infos du profil
      const postsWithApplicants: PostWithApplicants[] = [];

      for (const post of postsData || []) {
        const { data: financementsData, error: finErr } = await supabase
          .from("financements")
          .select("id, profile_id, montant_demande, statut, message_demande, created_at")
          .eq("post_id", post.id)
          .order("created_at", { ascending: false });

        if (finErr) throw finErr;

        const applicants: Applicant[] = [];

        for (const fin of financementsData || []) {
          const { data: profileData, error: profErr } = await supabase
            .from("profiles")
            .select("phone, secteur, sous_secteur, reputation_score")
            .eq("id", fin.profile_id)
            .maybeSingle();

          if (!profErr && profileData) {
            applicants.push({
              id: fin.profile_id,
              financement_id: fin.id,
              profile_id: fin.profile_id,
              phone: profileData.phone || "N/A",
              secteur: profileData.secteur || "N/A",
              sous_secteur: profileData.sous_secteur || "N/A",
              montant_demande: fin.montant_demande,
              reputation_score: profileData.reputation_score || 0,
              statut: fin.statut,
              message_demande: fin.message_demande || "",
              created_at: fin.created_at,
            });
          }
        }

        postsWithApplicants.push({
          id: post.id,
          titre: post.titre,
          montant_min_fcfa: post.montant_min_fcfa || 0,
          montant_max_fcfa: post.montant_max_fcfa || 0,
          type_traitement: post.type_traitement || "manuel",
          applicants,
        });
      }

      setPosts(postsWithApplicants);
    } catch (err: any) {
      console.error("Erreur:", err);
      setError(err?.message ?? "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(applicant: Applicant) {
    setProcessingId(applicant.financement_id);

    try {
      const { error } = await supabase
        .from("financements")
        .update({
          statut: "approved",
          montant_accorde: applicant.montant_demande,
        })
        .eq("id", applicant.financement_id);

      if (error) throw error;

      // Mettre à jour l'état local
      setPosts((prevPosts) =>
        prevPosts.map((post) => ({
          ...post,
          applicants: post.applicants.map((app) =>
            app.financement_id === applicant.financement_id
              ? { ...app, statut: "approved" }
              : app
          ),
        }))
      );

      setSelectedApplicant(null);
    } catch (err: any) {
      alert("Erreur lors de l'approbation: " + err.message);
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(applicant: Applicant, reason: string) {
    setProcessingId(applicant.financement_id);

    try {
      const { error } = await supabase
        .from("financements")
        .update({
          statut: "rejected",
          decision_comment: reason,
        })
        .eq("id", applicant.financement_id);

      if (error) throw error;

      // Mettre à jour l'état local
      setPosts((prevPosts) =>
        prevPosts.map((post) => ({
          ...post,
          applicants: post.applicants.map((app) =>
            app.financement_id === applicant.financement_id
              ? { ...app, statut: "rejected" }
              : app
          ),
        }))
      );

      setSelectedApplicant(null);
    } catch (err: any) {
      alert("Erreur lors du rejet: " + err.message);
    } finally {
      setProcessingId(null);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: colors.gray50 }}>
        <Loader2 size={40} color={colors.deepBlue} style={{ animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: colors.gray50, padding: 20 }}>
        <div style={{ background: colors.white, borderRadius: 20, padding: 32, textAlign: "center", maxWidth: 400 }}>
          <AlertCircle size={48} color={colors.beninRed} />
          <p style={{ color: colors.gray600, marginTop: 16 }}>{error}</p>
        </div>
      </div>
    );
  }

  const pendingCount = posts.reduce((sum, post) => sum + post.applicants.filter((a) => a.statut === "pending").length, 0);

  return (
    <div style={{ minHeight: "100vh", background: colors.gray50, padding: "24px" }}>
      {/* Barre de navigation */}
      <div style={{ maxWidth: 1200, margin: "0 auto", marginBottom: 32 }}>
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
            padding: "8px 0",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          <ArrowLeft size={20} />
          Retour
        </button>

        <h1 style={{ fontSize: 32, fontWeight: 700, color: colors.gray800, marginTop: 16, marginBottom: 8 }}>Gestion des financements</h1>
        <p style={{ fontSize: 16, color: colors.gray600 }}>
          {posts.length} opportunité{posts.length !== 1 ? "s" : ""} créée{posts.length !== 1 ? "s" : ""}
          {pendingCount > 0 && (
            <>
              {" "}
              · <strong style={{ color: colors.beninYellow }}>{pendingCount} en attente</strong>
            </>
          )}
        </p>
      </div>

      {/* Grille des posts */}
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gap: 24 }}>
        {posts.length === 0 ? (
          <div style={{ background: colors.white, borderRadius: 20, padding: 40, textAlign: "center", border: `1px solid ${colors.gray200}` }}>
            <p style={{ color: colors.gray600, fontSize: 16 }}>Aucune opportunité créée</p>
          </div>
        ) : (
          posts.map((post) => {
            const isExpanded = expandedPostId === post.id;
            const pendingApplicants = post.applicants.filter((a) => a.statut === "pending");
            const approvedApplicants = post.applicants.filter((a) => a.statut === "approved");
            const rejectedApplicants = post.applicants.filter((a) => a.statut === "rejected");

            return (
              <div
                key={post.id}
                style={{
                  background: colors.white,
                  borderRadius: 20,
                  border: `1px solid ${colors.gray200}`,
                  overflow: "hidden",
                }}
              >
                {/* En-tête du post */}
                <button
                  onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                  style={{
                    width: "100%",
                    padding: 24,
                    border: "none",
                    background: colors.white,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                  }}
                >
                  <div style={{ textAlign: "left", flex: 1 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.gray800, marginBottom: 8 }}>{post.titre}</h2>
                    <div style={{ display: "flex", gap: 16, fontSize: 14, color: colors.gray600 }}>
                      <span>
                        💰 {post.montant_min_fcfa.toLocaleString()}-{post.montant_max_fcfa.toLocaleString()} FCFA
                      </span>
                      <span>{post.type_traitement === "auto" ? "⚡ Auto" : "👤 Manuel"}</span>
                      <span>
                        {post.applicants.length} candidat{post.applicants.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  {/* Badge de nombre en attente */}
                  {pendingApplicants.length > 0 && (
                    <div style={{ background: colors.beninYellow, color: colors.white, padding: "6px 12px", borderRadius: 20, fontWeight: 600, fontSize: 14 }}>
                      {pendingApplicants.length} en attente
                    </div>
                  )}

                  <ChevronDown
                    size={24}
                    color={colors.gray400}
                    style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
                  />
                </button>

                {/* Contenu déroulé */}
                {isExpanded && (
                  <div
                    style={{
                      background: colors.gray50,
                      borderTop: `1px solid ${colors.gray200}`,
                      padding: 24,
                      display: "grid",
                      gap: 24,
                    }}
                  >
                    {/* En attente */}
                    {pendingApplicants.length > 0 && (
                      <div>
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: colors.beninYellow, marginBottom: 16 }}>
                          ⏳ En attente ({pendingApplicants.length})
                        </h3>
                        <div style={{ display: "grid", gap: 12 }}>
                          {pendingApplicants.map((applicant) => (
                            <ApplicantCard
                              key={applicant.financement_id}
                              applicant={applicant}
                              isSelected={selectedApplicant?.financement_id === applicant.financement_id}
                              onSelect={() => setSelectedApplicant(selectedApplicant?.financement_id === applicant.financement_id ? null : applicant)}
                              onApprove={() => handleApprove(applicant)}
                              onReject={() => handleReject(applicant, "Dossier insuffisant")}
                              isProcessing={processingId === applicant.financement_id}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Approuvés */}
                    {approvedApplicants.length > 0 && (
                      <div>
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: colors.beninGreen, marginBottom: 16 }}>
                          ✅ Approuvés ({approvedApplicants.length})
                        </h3>
                        <div style={{ display: "grid", gap: 12 }}>
                          {approvedApplicants.map((applicant) => (
                            <ApplicantCard key={applicant.financement_id} applicant={applicant} isSelected={false} onSelect={() => {}} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Rejetés */}
                    {rejectedApplicants.length > 0 && (
                      <div>
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: colors.beninRed, marginBottom: 16 }}>
                          ❌ Rejetés ({rejectedApplicants.length})
                        </h3>
                        <div style={{ display: "grid", gap: 12 }}>
                          {rejectedApplicants.map((applicant) => (
                            <ApplicantCard key={applicant.financement_id} applicant={applicant} isSelected={false} onSelect={() => {}} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Aucun candidat */}
                    {post.applicants.length === 0 && (
                      <div style={{ textAlign: "center", padding: 32, color: colors.gray500 }}>
                        <p>Aucun candidat pour le moment</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal de détails du candidat */}
      {selectedApplicant && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 20,
          }}
          onClick={() => setSelectedApplicant(null)}
        >
          <div
            style={{
              background: colors.white,
              borderRadius: 20,
              padding: 32,
              maxWidth: 500,
              maxHeight: "80vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 20, fontWeight: 600, color: colors.gray800, marginBottom: 24 }}>Détails du candidat</h2>

            <div style={{ display: "grid", gap: 16, marginBottom: 32 }}>
              <div>
                <p style={{ fontSize: 12, color: colors.gray500, marginBottom: 4 }}>Téléphone</p>
                <p style={{ fontSize: 16, fontWeight: 600, color: colors.gray800 }}>{selectedApplicant.phone}</p>
              </div>

              <div>
                <p style={{ fontSize: 12, color: colors.gray500, marginBottom: 4 }}>Secteur</p>
                <p style={{ fontSize: 16, fontWeight: 600, color: colors.gray800 }}>
                  {selectedApplicant.secteur}
                  {selectedApplicant.sous_secteur && ` / ${selectedApplicant.sous_secteur}`}
                </p>
              </div>

              <div>
                <p style={{ fontSize: 12, color: colors.gray500, marginBottom: 4 }}>Score de réputation</p>
                <p style={{ fontSize: 16, fontWeight: 600, color: colors.beninGreen }}>{selectedApplicant.reputation_score.toFixed(1)}/10</p>
              </div>

              <div>
                <p style={{ fontSize: 12, color: colors.gray500, marginBottom: 4 }}>Montant demandé</p>
                <p style={{ fontSize: 16, fontWeight: 600, color: colors.gray800 }}>
                  {selectedApplicant.montant_demande.toLocaleString("fr-FR")} FCFA
                </p>
              </div>

              {selectedApplicant.message_demande && (
                <div>
                  <p style={{ fontSize: 12, color: colors.gray500, marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                    <MessageSquare size={14} /> Message
                  </p>
                  <p style={{ fontSize: 14, color: colors.gray700, background: colors.gray50, padding: 12, borderRadius: 12 }}>
                    {selectedApplicant.message_demande}
                  </p>
                </div>
              )}
            </div>

            {selectedApplicant.statut === "pending" && (
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={() => handleApprove(selectedApplicant)}
                  disabled={processingId === selectedApplicant.financement_id}
                  style={{
                    flex: 1,
                    padding: "12px 20px",
                    background: colors.beninGreen,
                    color: colors.white,
                    border: "none",
                    borderRadius: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    opacity: processingId === selectedApplicant.financement_id ? 0.6 : 1,
                  }}
                >
                  <Check size={18} />
                  Approuver
                </button>
                <button
                  onClick={() => handleReject(selectedApplicant, "Dossier insuffisant")}
                  disabled={processingId === selectedApplicant.financement_id}
                  style={{
                    flex: 1,
                    padding: "12px 20px",
                    background: colors.beninRed,
                    color: colors.white,
                    border: "none",
                    borderRadius: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    opacity: processingId === selectedApplicant.financement_id ? 0.6 : 1,
                  }}
                >
                  <X size={18} />
                  Rejeter
                </button>
              </div>
            )}

            <button
              onClick={() => setSelectedApplicant(null)}
              style={{
                width: "100%",
                padding: "12px 20px",
                background: colors.gray100,
                border: "none",
                borderRadius: 12,
                fontWeight: 600,
                cursor: "pointer",
                marginTop: 12,
              }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ApplicantCard({
  applicant,
  isSelected,
  onSelect,
  onApprove,
  onReject,
  isProcessing,
}: {
  applicant: Applicant;
  isSelected: boolean;
  onSelect: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  isProcessing?: boolean;
}) {
  const statusColor =
    applicant.statut === "approved"
      ? colors.beninGreen
      : applicant.statut === "rejected"
        ? colors.beninRed
        : colors.beninYellow;

  const statusLabel =
    applicant.statut === "approved"
      ? "Approuvé"
      : applicant.statut === "rejected"
        ? "Rejeté"
        : "En attente";

  return (
    <div
      onClick={onSelect}
      style={{
          background: colors.white,
        padding: 16,
        borderRadius: 12,
        border: `2px solid ${isSelected ? colors.deepBlue : colors.gray200}`,
        cursor: isSelected ? "pointer" : "default",
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 16,
        alignItems: "center",
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <strong style={{ color: colors.gray800 }}>{applicant.phone}</strong>
          <span style={{ background: statusColor, color: colors.white, padding: "4px 8px", borderRadius: 8, fontSize: 12, fontWeight: 600 }}>
            {statusLabel}
          </span>
        </div>
        <div style={{ fontSize: 13, color: colors.gray600, marginBottom: 8 }}>
          {applicant.secteur}
          {applicant.sous_secteur && ` • ${applicant.sous_secteur}`}
        </div>
        <div style={{ fontSize: 13, display: "flex", gap: 16 }}>
          <span>💰 {applicant.montant_demande.toLocaleString("fr-FR")} FCFA</span>
          <span>⭐ {applicant.reputation_score.toFixed(1)}/10</span>
        </div>
      </div>

      {applicant.statut === "pending" && onApprove && onReject && (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onApprove();
            }}
            disabled={isProcessing}
            style={{
              padding: "8px 12px",
              background: colors.beninGreen,
              color: colors.white,
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 12,
              opacity: isProcessing ? 0.6 : 1,
            }}
          >
            <Check size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReject();
            }}
            disabled={isProcessing}
            style={{
              padding: "8px 12px",
              background: colors.beninRed,
              color: colors.white,
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 12,
              opacity: isProcessing ? 0.6 : 1,
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
