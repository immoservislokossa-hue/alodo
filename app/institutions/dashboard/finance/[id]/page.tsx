"use client";

import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Send, Users, MapPin, Briefcase, DollarSign, FileText, Star } from "lucide-react";
import { useEffect, useState } from "react";
import supabase from "@/src/lib/supabase/browser";

const colors = {
  white: "#FFFFFF",
  deepBlue: "#1a3c6b",
  beninGreen: "#008751",
  gray50: "#F9FAFB",
  gray600: "#4B5563",
  gray200: "#E5E7EB",
  softGreen: "#E8F5E9",
  success: "#00A86B",
};

type Profile = {
  id: string;
  user_id: string;
  type: string;
  langue: string;
  phone: string | null;
  secteur: string | null;
  sous_secteur: string | null;
  commune: string | null;
  archetype: string | null;
  revenu_mensuel_estime_fcfa: number | null;
  besoin_financement: string | null;
  documents_disponibles: any;
  role: string;
  reputation_score: number;
  full_name?: string;
  created_at: string;
  updated_at: string;
};

export default function FinanceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfileData();
  }, [userId]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (fetchError) {
        setError("Profil non trouvé");
        return;
      }

      setProfile(data as Profile);
    } catch (err) {
      setError("Erreur lors du chargement du profil");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: colors.gray50, padding: "24px" }}>
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
        <div style={{ textAlign: "center", marginTop: 40 }}>
          <p style={{ color: colors.gray600 }}>Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div style={{ minHeight: "100vh", background: colors.gray50, padding: "24px" }}>
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
        <div style={{ textAlign: "center", marginTop: 40, color: "red" }}>
          <p style={{ fontSize: 16 }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: colors.gray50, padding: "24px 0" }}>
      {/* Header avec retour */}
      <div style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>
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
            marginBottom: 24,
          }}
        >
          <ArrowLeft size={20} />
          Retour
        </button>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        {/* Profile Card */}
        <div style={{ background: colors.white, borderRadius: 16, padding: 32, marginBottom: 24 }}>
          {/* Header avec bouton d'action */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 32 }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: colors.deepBlue }}>
                {profile.full_name || "Utilisateur"}
              </h1>
              <div style={{ display: "flex", gap: 16, marginTop: 12, color: colors.gray600, fontSize: 14 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Users size={16} />
                  {profile.type || "Non spécifié"}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Star size={16} />
                  {profile.reputation_score ? profile.reputation_score.toFixed(1) : "3.5"} / 5
                </span>
              </div>
            </div>

            {/* Bouton Envoyer un crédit */}
            <button
              onClick={() => router.push(`/institutions/dashboard/finances/${userId}/envoyer`)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: colors.beninGreen,
                color: colors.white,
                border: "none",
                borderRadius: 8,
                padding: "12px 20px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#006941";
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = colors.beninGreen;
              }}
            >
              <Send size={18} />
              Envoyer un crédit
            </button>
          </div>

          {/* Info Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
            {/* Contact Section */}
            <div style={{ padding: 20, background: colors.softGreen, borderRadius: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: colors.deepBlue, marginBottom: 16, margin: "0 0 16px 0" }}>
                Contact
              </h3>
              <div style={{ display: "grid", gap: 12 }}>
                <div>
                  <p style={{ fontSize: 12, color: colors.gray600, margin: 0 }}>Téléphone</p>
                  <p style={{ fontSize: 14, fontWeight: 500, margin: "4px 0 0 0" }}>
                    {profile.phone || "Non fourni"}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: 12, color: colors.gray600, margin: 0 }}>Langue</p>
                  <p style={{ fontSize: 14, fontWeight: 500, margin: "4px 0 0 0" }}>
                    {profile.langue?.toUpperCase() || "FR"}
                  </p>
                </div>
              </div>
            </div>

            {/* Location Section */}
            <div style={{ padding: 20, background: colors.softGreen, borderRadius: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: colors.deepBlue, marginBottom: 16, margin: "0 0 16px 0" }}>
                Localisation
              </h3>
              <div style={{ display: "grid", gap: 12 }}>
                <div>
                  <p style={{ fontSize: 12, color: colors.gray600, margin: 0 }}>Commune</p>
                  <p style={{ fontSize: 14, fontWeight: 500, margin: "4px 0 0 0" }}>
                    {profile.commune || "Non spécifiée"}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: 12, color: colors.gray600, margin: 0 }}>Archétype</p>
                  <p style={{ fontSize: 14, fontWeight: 500, margin: "4px 0 0 0" }}>
                    {profile.archetype || "Non spécifié"}
                  </p>
                </div>
              </div>
            </div>

            {/* Business Section */}
            <div style={{ padding: 20, background: colors.softGreen, borderRadius: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: colors.deepBlue, marginBottom: 16, margin: "0 0 16px 0" }}>
                Secteur
              </h3>
              <div style={{ display: "grid", gap: 12 }}>
                <div>
                  <p style={{ fontSize: 12, color: colors.gray600, margin: 0 }}>Secteur principal</p>
                  <p style={{ fontSize: 14, fontWeight: 500, margin: "4px 0 0 0" }}>
                    {profile.secteur || "Non spécifié"}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: 12, color: colors.gray600, margin: 0 }}>Sous-secteur</p>
                  <p style={{ fontSize: 14, fontWeight: 500, margin: "4px 0 0 0" }}>
                    {profile.sous_secteur || "Non spécifié"}
                  </p>
                </div>
              </div>
            </div>

            {/* Finance Section */}
            <div style={{ padding: 20, background: colors.softGreen, borderRadius: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: colors.deepBlue, marginBottom: 16, margin: "0 0 16px 0" }}>
                Finance
              </h3>
              <div style={{ display: "grid", gap: 12 }}>
                <div>
                  <p style={{ fontSize: 12, color: colors.gray600, margin: 0 }}>Revenu mensuel estimé</p>
                  <p style={{ fontSize: 14, fontWeight: 500, margin: "4px 0 0 0", color: colors.beninGreen }}>
                    {profile.revenu_mensuel_estime_fcfa
                      ? `${profile.revenu_mensuel_estime_fcfa.toLocaleString("fr-FR")} FCFA`
                      : "Non renseigné"}
                  </p>
                </div>
              </div>
            </div>

            {/* Needs Section */}
            <div style={{ padding: 20, background: colors.softGreen, borderRadius: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: colors.deepBlue, marginBottom: 16, margin: "0 0 16px 0" }}>
                Besoin de financement
              </h3>
              <p style={{ fontSize: 14, margin: 0, color: colors.gray600 }}>
                {profile.besoin_financement || "Non spécifié"}
              </p>
            </div>
          </div>

          {/* Documents Section */}
          {profile.documents_disponibles && Object.keys(profile.documents_disponibles).length > 0 && (
            <div style={{ marginTop: 32, paddingTop: 32, borderTop: `1px solid ${colors.gray200}` }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: colors.deepBlue, marginBottom: 16 }}>
                Documents disponibles
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {Object.keys(profile.documents_disponibles).map((doc) => (
                  <div
                    key={doc}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 12px",
                      background: colors.softGreen,
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 500,
                      color: colors.beninGreen,
                    }}
                  >
                    <FileText size={16} />
                    {doc}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Account Info */}
          <div style={{ marginTop: 32, paddingTop: 32, borderTop: `1px solid ${colors.gray200}`, fontSize: 12, color: colors.gray600 }}>
            <p style={{ margin: 0 }}>
              Date d'inscription: {new Date(profile.created_at).toLocaleDateString("fr-FR")}
            </p>
            <p style={{ margin: "8px 0 0 0" }}>
              Dernière mise à jour: {new Date(profile.updated_at).toLocaleDateString("fr-FR")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
