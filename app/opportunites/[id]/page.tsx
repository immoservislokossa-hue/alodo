"use client";

import { useEffect, useState, useRef } from "react";
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
  Briefcase,
  Shield,
  Upload,
  Play,
  Pause,
  Volume2
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
  montant_min_fcfa?: number;
  montant_max_fcfa?: number;
  duree_mois?: number;
  date_limite?: string;
  lieu?: string;
  secteur?: string;
  conditions?: string[];
  documents_requis?: string[];
  type_traitement?: "auto" | "manuel";
  score_minimum_auto?: number;
  audio_fr?: string;
  audio_yor?: string;
  created_at: string;
};

type Match = {
  id: string;
  score: number;
  niveau: string;
  matching_reasons: string[];
  missing_documents: string[];
  can_apply: boolean;
};

type Profile = {
  id: string;
  langue: string;
};

// Composant Skeleton pour le chargement
function SkeletonLoader() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "16px", paddingTop: 24 }}>
      {/* Bouton retour skeleton */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, padding: "8px 0" }}>
        <div style={{ width: 20, height: 20, background: colors.gray200, borderRadius: 4 }} />
        <div style={{ width: 80, height: 16, background: colors.gray200, borderRadius: 4 }} />
      </div>

      {/* En-tête skeleton */}
      <div style={{ background: colors.white, borderRadius: 20, padding: 20, marginBottom: 16, border: `1px solid ${colors.gray200}` }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
          <div style={{ width: 48, height: 48, background: colors.gray200, borderRadius: 12 }} />
          <div>
            <div style={{ width: 180, height: 20, background: colors.gray200, borderRadius: 4, marginBottom: 8 }} />
            <div style={{ width: 120, height: 14, background: colors.gray200, borderRadius: 4 }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <div style={{ width: 100, height: 28, background: colors.gray200, borderRadius: 20 }} />
          <div style={{ width: 80, height: 28, background: colors.gray200, borderRadius: 20 }} />
          <div style={{ width: 70, height: 28, background: colors.gray200, borderRadius: 20 }} />
        </div>
        <div style={{ width: 140, height: 36, background: colors.gray200, borderRadius: 20, marginTop: 8 }} />
      </div>

      {/* Carte action skeleton */}
      <div style={{ background: colors.gray200, borderRadius: 20, padding: 20, marginBottom: 16, height: 140 }} />

      {/* Description skeleton */}
      <div style={{ background: colors.white, borderRadius: 20, padding: 20, marginBottom: 16, border: `1px solid ${colors.gray200}` }}>
        <div style={{ width: 100, height: 20, background: colors.gray200, borderRadius: 4, marginBottom: 12 }} />
        <div style={{ width: "100%", height: 60, background: colors.gray200, borderRadius: 8 }} />
      </div>

      {/* Documents skeleton */}
      <div style={{ background: colors.white, borderRadius: 20, padding: 20, marginBottom: 16, border: `1px solid ${colors.gray200}` }}>
        <div style={{ width: 120, height: 20, background: colors.gray200, borderRadius: 4, marginBottom: 12 }} />
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ width: 80, height: 32, background: colors.gray200, borderRadius: 20 }} />
          <div style={{ width: 90, height: 32, background: colors.gray200, borderRadius: 20 }} />
          <div style={{ width: 70, height: 32, background: colors.gray200, borderRadius: 20 }} />
        </div>
      </div>

      {/* Animation de pulsation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .skeleton-pulse {
          animation: pulse 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default function OpportuniteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [post, setPost] = useState<PostInstitution | null>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function isUrl(str: string): boolean {
    return str.startsWith("http://") || str.startsWith("https://");
  }

  async function playAudio(audioField: "audio_fr" | "audio_yor") {
    if (!post || !post[audioField]) return;
    
    try {
      setAudioError(null);
      const audioValue = post[audioField];
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const audio = new Audio();
      audio.src = isUrl(audioValue) ? audioValue : `data:audio/mpeg;base64,${audioValue}`;
      audioRef.current = audio;

      audio.onplay = () => setPlayingAudio(audioField);
      audio.onended = () => {
        setPlayingAudio(null);
        audioRef.current = null;
      };
      audio.onerror = () => {
        setAudioError("Impossible de lire l'audio");
        setPlayingAudio(null);
        audioRef.current = null;
      };

      await audio.play();
    } catch (err) {
      setAudioError("Erreur de lecture");
    }
  }

  function stopAudio() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlayingAudio(null);
      setAudioError(null);
    }
  }

  useEffect(() => {
    let active = true;

    async function loadData() {
      if (!id) return;
      
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;
        if (!user) {
          router.replace("/institutions/login");
          return;
        }

        const { data: profileRow, error: profileErr } = await supabase
          .from("profiles")
          .select("id, langue")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileErr) throw profileErr;
        if (!profileRow?.id) {
          setError("Profil introuvable");
          return;
        }
        setProfile(profileRow);

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

        const { data: matchData, error: matchErr } = await supabase
          .from("post_institution_matches")
          .select("*")
          .eq("post_institution_id", id)
          .eq("profile_id", profileRow.id)
          .maybeSingle();

        if (matchErr) throw matchErr;
        if (matchData) setMatch(matchData);

      } catch (err: any) {
        if (active) setError(err?.message ?? "Erreur lors du chargement");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [id, router]);

  // Afficher le skeleton pendant le chargement
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: colors.gray50 }}>
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "4px", display: "flex", zIndex: 50 }}>
          <div style={{ flex: 1, background: colors.beninGreen }} />
          <div style={{ flex: 1, background: colors.beninYellow }} />
          <div style={{ flex: 1, background: colors.beninRed }} />
        </div>
        <SkeletonLoader />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: colors.gray50, padding: 20 }}>
        <div style={{ background: colors.white, borderRadius: 20, padding: 32, textAlign: "center", maxWidth: 400 }}>
          <AlertCircle size={48} color={colors.beninRed} />
          <p style={{ color: colors.gray600, marginTop: 16 }}>{error || "Opportunité non trouvée"}</p>
          <button onClick={() => router.back()} style={{ marginTop: 20, padding: "10px 20px", background: colors.deepBlue, color: colors.white, border: "none", borderRadius: 12, cursor: "pointer" }}>
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
  const hasAudio = post.audio_fr || post.audio_yor;
  const audioField = profile?.langue === "yor" ? "audio_yor" : "audio_fr";
  const isPlaying = playingAudio === audioField;

  return (
    <div style={{ minHeight: "100vh", background: colors.gray50 }}>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "4px", display: "flex", zIndex: 50 }}>
        <div style={{ flex: 1, background: colors.beninGreen }} />
        <div style={{ flex: 1, background: colors.beninYellow }} />
        <div style={{ flex: 1, background: colors.beninRed }} />
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "16px", paddingTop: 24 }}>
        {/* Retour */}
        <button onClick={() => router.back()} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: colors.gray600, cursor: "pointer", marginBottom: 16, padding: "8px 0" }}>
          <ArrowLeft size={20} /> Retour
        </button>

        {/* En-tête */}
        <div style={{ background: colors.white, borderRadius: 20, padding: 20, marginBottom: 16, border: `1px solid ${colors.gray200}` }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: `${colors.deepBlue}10`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Building2 size={24} color={colors.deepBlue} />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: colors.gray800, marginBottom: 4 }}>{post.titre}</h1>
              <p style={{ fontSize: 13, color: colors.gray500 }}>{post.institution_nom}</p>
            </div>
          </div>
          
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
            {post.montant_min_fcfa && post.montant_max_fcfa && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: colors.gray100, padding: "6px 12px", borderRadius: 20 }}>
                <DollarSign size={14} color={colors.beninGreen} />
                <span style={{ fontSize: 12, fontWeight: 500 }}>{post.montant_min_fcfa.toLocaleString()} - {post.montant_max_fcfa.toLocaleString()} FCFA</span>
              </div>
            )}
            {post.date_limite && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: colors.gray100, padding: "6px 12px", borderRadius: 20 }}>
                <Calendar size={14} color={colors.gray500} />
                <span style={{ fontSize: 12 }}>{new Date(post.date_limite).toLocaleDateString("fr-FR")}</span>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: `${niveauColor}10`, padding: "6px 12px", borderRadius: 20 }}>
              <TrendingUp size={14} color={niveauColor} />
              <span style={{ fontSize: 12, fontWeight: 500, color: niveauColor }}>{niveau} ({score}%)</span>
            </div>
          </div>

          {/* Audio */}
          {hasAudio && (
            <button
              onClick={() => isPlaying ? stopAudio() : playAudio(audioField)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                borderRadius: 20,
                border: `1px solid ${colors.beninGreen}`,
                background: isPlaying ? colors.beninGreen : "transparent",
                color: isPlaying ? colors.white : colors.beninGreen,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                marginTop: 8,
                transition: "all 0.2s ease",
              }}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              <Volume2 size={14} />
              {isPlaying ? "Pause" : "Écouter le résumé"}
            </button>
          )}
          {audioError && <p style={{ fontSize: 11, color: colors.beninRed, marginTop: 8 }}>{audioError}</p>}
        </div>

        {/* Carte d'action principale */}
        <div style={{ 
          background: canApply ? colors.beninGreen : colors.beninYellow, 
          borderRadius: 20, 
          padding: 20, 
          marginBottom: 16, 
          textAlign: "center",
          transition: "all 0.2s ease",
        }}>
          {canApply ? (
            <>
              <CheckCircle size={32} color={colors.white} style={{ margin: "0 auto 12px" }} />
              <h2 style={{ fontSize: 18, fontWeight: 700, color: colors.white, marginBottom: 8 }}>Vous êtes éligible !</h2>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginBottom: 16 }}>Votre profil correspond aux critères de cette opportunité</p>
              <button
                onClick={() => router.push(`/opportunites/${post.id}/postuler`)}
                style={{ 
                  width: "100%", 
                  padding: "12px", 
                  borderRadius: 12, 
                  border: "none", 
                  background: colors.white, 
                  color: colors.beninGreen, 
                  fontWeight: 600, 
                  cursor: "pointer",
                  transition: "transform 0.2s ease",
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
              >
                Postuler maintenant <ExternalLink size={14} style={{ display: "inline", marginLeft: 6 }} />
              </button>
            </>
          ) : (
            <>
              <XCircle size={32} color={colors.white} style={{ margin: "0 auto 12px" }} />
              <h2 style={{ fontSize: 18, fontWeight: 700, color: colors.white, marginBottom: 8 }}>Complétez votre profil</h2>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginBottom: 16 }}>Ajoutez vos documents pour débloquer cette opportunité</p>
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={() => router.push("/profil/documents")}
                  style={{ 
                    flex: 1, 
                    padding: "12px", 
                    borderRadius: 12, 
                    border: "none", 
                    background: colors.white, 
                    color: colors.deepBlue, 
                    fontWeight: 600, 
                    cursor: "pointer", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    gap: 6,
                    transition: "transform 0.2s ease",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                >
                  <Upload size={14} /> Documents
                </button>
                <button
                  onClick={() => router.push("/profil")}
                  style={{ 
                    flex: 1, 
                    padding: "12px", 
                    borderRadius: 12, 
                    border: "none", 
                    background: "rgba(255,255,255,0.2)", 
                    color: colors.white, 
                    fontWeight: 600, 
                    cursor: "pointer", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    gap: 6,
                    transition: "transform 0.2s ease",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                >
                  <Shield size={14} /> Profil
                </button>
              </div>
            </>
          )}
        </div>

        {/* Description */}
        <div style={{ background: colors.white, borderRadius: 20, padding: 20, marginBottom: 16, border: `1px solid ${colors.gray200}` }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: colors.gray800, marginBottom: 12 }}>Description</h2>
          <p style={{ fontSize: 14, color: colors.gray600, lineHeight: 1.6 }}>{post.description}</p>
        </div>

        {/* Documents requis */}
        {post.documents_requis && post.documents_requis.length > 0 && (
          <div style={{ background: colors.white, borderRadius: 20, padding: 20, marginBottom: 16, border: `1px solid ${colors.gray200}` }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: colors.gray800, marginBottom: 12 }}>Documents requis</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {post.documents_requis.map((doc, idx) => {
                const isMissing = match?.missing_documents?.includes(doc);
                return (
                  <span key={idx} style={{
                    display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20,
                    background: isMissing ? `${colors.beninRed}10` : `${colors.beninGreen}10`,
                    color: isMissing ? colors.beninRed : colors.beninGreen,
                    fontSize: 12, fontWeight: 500
                  }}>
                    {isMissing ? <XCircle size={12} /> : <CheckCircle size={12} />}
                    {doc}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Raisons du matching */}
        {match?.matching_reasons && match.matching_reasons.length > 0 && (
          <div style={{ background: `${colors.deepBlue}05`, borderRadius: 20, padding: 20, border: `1px solid ${colors.deepBlue}20` }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: colors.deepBlue, marginBottom: 12 }}>Pourquoi cette offre ?</h2>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {match.matching_reasons.slice(0, 3).map((reason, idx) => (
                <li key={idx} style={{ fontSize: 13, color: colors.gray600, marginBottom: 6 }}>{reason}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Infos pratiques compactes */}
        {(post.lieu || post.duree_mois || post.type_traitement) && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 16 }}>
            {post.lieu && (
              <div style={{ background: colors.white, borderRadius: 16, padding: 12, textAlign: "center", border: `1px solid ${colors.gray200}` }}>
                <MapPin size={20} color={colors.gray500} style={{ margin: "0 auto 6px" }} />
                <p style={{ fontSize: 11, color: colors.gray600 }}>{post.lieu}</p>
              </div>
            )}
            {post.duree_mois && (
              <div style={{ background: colors.white, borderRadius: 16, padding: 12, textAlign: "center", border: `1px solid ${colors.gray200}` }}>
                <Clock size={20} color={colors.gray500} style={{ margin: "0 auto 6px" }} />
                <p style={{ fontSize: 11, color: colors.gray600 }}>{post.duree_mois} mois</p>
              </div>
            )}
            {post.type_traitement && (
              <div style={{ background: colors.white, borderRadius: 16, padding: 12, textAlign: "center", border: `1px solid ${colors.gray200}` }}>
                {post.type_traitement === "auto" ? (
                  <CheckCircle size={20} color={colors.beninGreen} style={{ margin: "0 auto 6px" }} />
                ) : (
                  <Clock size={20} color={colors.beninYellow} style={{ margin: "0 auto 6px" }} />
                )}
                <p style={{ fontSize: 11, color: colors.gray600 }}>{post.type_traitement === "auto" ? "Auto" : "Manuel"}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}