"use client";

import { useEffect, useState, useRef } from "react";
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

// Styles responsives
const responsiveStyles = {
  container: {
    minHeight: "100vh",
    background: colors.gray50,
    padding: "16px",
    "@media (minWidth: 768px)": { padding: "24px" },
  },
  content: {
    maxWidth: 1200,
    margin: "0 auto",
    paddingTop: "16px",
    "@media (minWidth: 768px)": { paddingTop: "24px" },
  },
  header: {
    marginBottom: "24px",
    "@media (minWidth: 768px)": { marginBottom: "32px" },
  },
  title: {
    fontSize: "24px",
    fontWeight: 700,
    fontFamily: "'Playfair Display', serif",
    color: colors.deepBlue,
    marginBottom: "4px",
    "@media (minWidth: 768px)": { fontSize: "32px", marginBottom: "8px" },
    "@media (minWidth: 1024px)": { fontSize: "36px" },
  },
  subtitle: {
    fontSize: "14px",
    color: colors.gray600,
    "@media (minWidth: 768px)": { fontSize: "16px" },
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "12px",
    marginBottom: "24px",
    "@media (minWidth: 640px)": { gridTemplateColumns: "repeat(4, 1fr)" },
    "@media (minWidth: 768px)": { gap: "16px", marginBottom: "32px" },
  },
  statCard: {
    background: colors.white,
    borderRadius: "16px",
    padding: "12px",
    border: `1px solid ${colors.gray200}`,
    "@media (minWidth: 768px)": { padding: "16px" },
  },
  statValue: {
    fontSize: "24px",
    fontWeight: 700,
    "@media (minWidth: 768px)": { fontSize: "28px" },
  },
  statLabel: {
    fontSize: "11px",
    color: colors.gray500,
    "@media (minWidth: 768px)": { fontSize: "13px" },
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
    "@media (minWidth: 768px)": { marginBottom: "20px" },
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: 600,
    color: colors.gray800,
    "@media (minWidth: 768px)": { fontSize: "20px" },
  },
  card: {
    background: colors.white,
    borderRadius: "16px",
    padding: "16px",
    marginBottom: "12px",
    border: `1px solid ${colors.gray200}`,
    transition: "all 0.2s ease",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    "@media (minWidth: 768px)": { padding: "24px", marginBottom: "16px", borderRadius: "20px" },
  },
  cardContent: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    "@media (minWidth: 768px)": { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" },
  },
  leftSection: {
    flex: 1,
  },
  rightSection: {
    minWidth: "auto",
    textAlign: "left",
    "@media (minWidth: 768px)": { minWidth: "140px", textAlign: "right" },
  },
  titleCard: {
    fontSize: "16px",
    fontWeight: 700,
    color: colors.gray800,
    marginBottom: "8px",
    "@media (minWidth: 768px)": { fontSize: "18px" },
  },
  metaInfo: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "12px",
    "@media (minWidth: 768px)": { gap: "16px", marginBottom: "16px" },
  },
  metaItem: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "11px",
    "@media (minWidth: 768px)": { gap: "6px", fontSize: "12px" },
  },
  audioButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "5px 12px",
    borderRadius: "20px",
    border: `1px solid ${colors.beninGreen}`,
    fontSize: "11px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
    marginBottom: "12px",
    "@media (minWidth: 768px)": { padding: "6px 14px", fontSize: "12px", marginBottom: "16px" },
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "3px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: 500,
    marginBottom: "12px",
    "@media (minWidth: 768px)": { gap: "6px", padding: "4px 12px", fontSize: "12px", marginBottom: "16px" },
  },
  buttonPrimary: {
    width: "100%",
    padding: "8px 12px",
    borderRadius: "12px",
    fontWeight: 600,
    fontSize: "13px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    marginBottom: "8px",
    "@media (minWidth: 768px)": { padding: "10px 16px", fontSize: "14px", gap: "8px", marginBottom: "12px" },
  },
  buttonSecondary: {
    width: "100%",
    padding: "8px 12px",
    borderRadius: "12px",
    fontWeight: 600,
    fontSize: "13px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    "@media (minWidth: 768px)": { padding: "10px 16px", fontSize: "14px", gap: "8px" },
  },
};

export default function OpportunitesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [userLangue, setUserLangue] = useState<string>("fr");
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function isUrl(str: string): boolean {
    return str.startsWith("http://") || str.startsWith("https://") || str.startsWith("blob:");
  }

  async function playSummaryAudio(postId: string, audioField: "audio_fr" | "audio_yor") {
    try {
      setAudioError(null);
      
      const { data: post, error } = await supabase
        .from("post_institutions")
        .select(audioField)
        .eq("id", postId)
        .single();

      if (error) throw error;
      if (!post || !post[audioField]) {
        setAudioError("Audio non disponible");
        return;
      }

      const audioValue = post[audioField];
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const audio = new Audio();
      
      if (isUrl(audioValue)) {
        audio.src = audioValue;
      } else {
        audio.src = `data:audio/mpeg;base64,${audioValue}`;
      }
      
      audioRef.current = audio;

      audio.onplay = () => setPlayingAudio(`${postId}-${audioField}`);
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
      setAudioError("Impossible de charger l'audio");
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

    async function initAuthAndLoad() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user ?? null;

        if (!user) {
          router.replace("/institutions/login");
          return;
        }

        await loadMatchesForUser(user.id);
      } catch (err: any) {
        if (active) setError(err?.message ?? "Erreur lors du chargement");
      } finally {
        if (active) setLoading(false);
      }
    }

    async function loadMatchesForUser(userId: string) {
      const { data: profileRow, error: profileErr } = await supabase
        .from("profiles")
        .select("id, langue")
        .eq("user_id", userId)
        .maybeSingle();

      if (profileErr) throw profileErr;
      if (!profileRow?.id) {
        setError("Profil introuvable");
        return;
      }

      if (profileRow.langue) setUserLangue(profileRow.langue);
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

    initAuthAndLoad();

    return () => {
      active = false;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [router]);

  const very = items.filter((i) => i.match?.niveau === "tres_pertinent");
  const pertinent = items.filter((i) => i.match?.niveau === "pertinent");
  const canApply = items.filter((i) => i.match?.can_apply === true);
  const cannotApply = items.filter((i) => i.match?.can_apply === false);

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
          <button onClick={() => window.location.reload()} style={{ marginTop: 20, padding: "10px 20px", background: colors.deepBlue, color: colors.white, border: "none", borderRadius: 12, cursor: "pointer" }}>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  function renderItem(item: any) {
    const post = item.post;
    const match = item.match;
    
    const audioField = userLangue === "yor" ? "audio_yor" : "audio_fr";
    const audioKey = `${post?.id}-${audioField}`;
    const isPlaying = playingAudio === audioKey;
    const hasAudio = post && (post.audio_fr || post.audio_yor);
    const isPostulable = match.can_apply === true;
    
    return (
      <div
        key={match.id}
        style={responsiveStyles.card}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.05)";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        <div style={responsiveStyles.cardContent}>
          <div style={responsiveStyles.leftSection}>
            {/* Titre */}
            <div style={{ marginBottom: 12 }}>
              <h3 style={responsiveStyles.titleCard}>{post?.titre ?? "Titre manquant"}</h3>
              <div style={responsiveStyles.metaInfo}>
                {post?.montant_min && post?.montant_max && (
                  <div style={responsiveStyles.metaItem}>
                    <DollarSign size={12} color={colors.gray400} />
                    <span>{post.montant_min.toLocaleString()} - {post.montant_max.toLocaleString()} FCFA</span>
                  </div>
                )}
                {post?.date_limite && (
                  <div style={responsiveStyles.metaItem}>
                    <Calendar size={12} color={colors.gray400} />
                    <span>{new Date(post.date_limite).toLocaleDateString("fr-FR")}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Audio */}
            {hasAudio && (
              <div style={{ marginBottom: 12 }}>
                <button
                  onClick={() => isPlaying ? stopAudio() : playSummaryAudio(post.id, audioField)}
                  style={{
                    ...responsiveStyles.audioButton,
                    background: isPlaying ? colors.beninGreen : "transparent",
                    color: isPlaying ? colors.white : colors.beninGreen,
                  }}
                >
                  {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                  <Volume2 size={12} />
                  {isPlaying ? "Pause" : "Écouter"}
                </button>
                
                {audioError && playingAudio === audioKey && (
                  <div style={{ marginTop: 6, fontSize: 11, color: colors.beninRed }}>{audioError}</div>
                )}
              </div>
            )}
            
            {/* Pertinence */}
            <div style={{
              ...responsiveStyles.badge,
              background: match.niveau === "tres_pertinent" ? `${colors.beninGreen}10` : `${colors.deepBlue}10`,
            }}>
              <TrendingUp size={12} color={match.niveau === "tres_pertinent" ? colors.beninGreen : colors.deepBlue} />
              <span style={{ color: match.niveau === "tres_pertinent" ? colors.beninGreen : colors.deepBlue }}>
                Score: {match.score}% - {match.niveau === "tres_pertinent" ? "Très pertinent" : "Pertinent"}
              </span>
            </div>
          </div>
          
          {/* Boutons côté droit */}
          <div style={responsiveStyles.rightSection}>
            {/* Badge Postulable / Non postulable */}
            <div style={{
              ...responsiveStyles.badge,
              background: isPostulable ? `${colors.beninGreen}10` : `${colors.beninYellow}10`,
            }}>
              {isPostulable ? <CheckCircle size={12} color={colors.beninGreen} /> : <AlertCircle size={12} color={colors.beninYellow} />}
              <span style={{ color: isPostulable ? colors.beninGreen : colors.beninYellow }}>
                {isPostulable ? "Postulable" : "Non postulable"}
              </span>
            </div>
            
            {/* Bouton Voir plus */}
            <button
              onClick={() => router.push(`/opportunites/${post?.id}`)}
              style={{
                ...responsiveStyles.buttonPrimary,
                border: `1px solid ${colors.deepBlue}`,
                background: colors.white,
                color: colors.deepBlue,
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
            
            {/* Bouton Postuler - visible seulement si postulable */}
            {isPostulable && (
              <button
                onClick={() => router.push(`/opportunites/${post?.id}/postuler`)}
                style={{
                  ...responsiveStyles.buttonSecondary,
                  background: colors.beninGreen,
                  color: colors.white,
                  border: "none",
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
    <div style={responsiveStyles.container}>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "4px", display: "flex", zIndex: 50 }}>
        <div style={{ flex: 1, background: colors.beninGreen }} />
        <div style={{ flex: 1, background: colors.beninYellow }} />
        <div style={{ flex: 1, background: colors.beninRed }} />
      </div>

      <div style={responsiveStyles.content}>
        <div style={responsiveStyles.header}>
          <h1 style={responsiveStyles.title}>Opportunités de financement</h1>
          <p style={responsiveStyles.subtitle}>Découvrez les offres adaptées à votre profil</p>
        </div>

        <div style={responsiveStyles.statsGrid}>
          <div style={responsiveStyles.statCard}>
            <div style={{ ...responsiveStyles.statValue, color: colors.beninGreen }}>{very.length}</div>
            <div style={responsiveStyles.statLabel}>Très pertinentes</div>
          </div>
          <div style={responsiveStyles.statCard}>
            <div style={{ ...responsiveStyles.statValue, color: colors.deepBlue }}>{pertinent.length}</div>
            <div style={responsiveStyles.statLabel}>Pertinentes</div>
          </div>
          <div style={responsiveStyles.statCard}>
            <div style={{ ...responsiveStyles.statValue, color: colors.beninGreen }}>{canApply.length}</div>
            <div style={responsiveStyles.statLabel}>Postulables</div>
          </div>
          <div style={responsiveStyles.statCard}>
            <div style={{ ...responsiveStyles.statValue, color: colors.beninYellow }}>{cannotApply.length}</div>
            <div style={responsiveStyles.statLabel}>Non postulables</div>
          </div>
        </div>

        {very.length > 0 && (
          <section style={{ marginBottom: 24 }}>
            <div style={responsiveStyles.sectionHeader}>
              <div style={{ width: 4, height: 24, background: colors.beninGreen, borderRadius: 2 }} />
              <h2 style={responsiveStyles.sectionTitle}>Très pertinentes ({very.length})</h2>
            </div>
            {very.map(renderItem)}
          </section>
        )}

        {pertinent.length > 0 && (
          <section style={{ marginBottom: 24 }}>
            <div style={responsiveStyles.sectionHeader}>
              <div style={{ width: 4, height: 24, background: colors.deepBlue, borderRadius: 2 }} />
              <h2 style={responsiveStyles.sectionTitle}>Pertinentes ({pertinent.length})</h2>
            </div>
            {pertinent.map(renderItem)}
          </section>
        )}

        {cannotApply.length > 0 && (
          <section>
            <div style={responsiveStyles.sectionHeader}>
              <div style={{ width: 4, height: 24, background: colors.beninYellow, borderRadius: 2 }} />
              <h2 style={responsiveStyles.sectionTitle}>Non postulables ({cannotApply.length})</h2>
            </div>
            {cannotApply.map(renderItem)}
          </section>
        )}

        {items.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 24px", background: colors.white, borderRadius: 20, border: `1px solid ${colors.gray200}` }}>
            <Briefcase size={48} color={colors.gray400} />
            <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 16, color: colors.gray800 }}>Aucune opportunité pour le moment</h2>
            <p style={{ fontSize: 14, color: colors.gray500, marginTop: 8 }}>De nouvelles opportunités seront disponibles bientôt.</p>
          </div>
        )}
      </div>
    </div>
  );
}