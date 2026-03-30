"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/src/lib/supabase/browser";
import {
  Briefcase,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Building2,
  Calendar,
  MapPin,
  DollarSign,
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

type PostInstitution = {
  id: string;
  titre: string;
  description: string;
  institution_nom: string;
  montant_min_fcfa?: number;
  montant_max_fcfa?: number;
  date_limite?: string;
  audio_fr?: string;
  audio_yor?: string;
};

type Match = {
  id: string;
  score: number;
  niveau: string;
  can_apply: boolean;
};

type Item = {
  match: Match;
  post: PostInstitution | null;
};

// Composant Skeleton
function SkeletonLoader() {
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px", paddingTop: 24 }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ width: 280, height: 36, background: colors.gray200, borderRadius: 8, marginBottom: 8 }} />
        <div style={{ width: 200, height: 20, background: colors.gray200, borderRadius: 4 }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ background: colors.white, borderRadius: 16, padding: 16, border: `1px solid ${colors.gray200}` }}>
            <div style={{ width: 40, height: 28, background: colors.gray200, borderRadius: 4, marginBottom: 8 }} />
            <div style={{ width: 80, height: 14, background: colors.gray200, borderRadius: 4 }} />
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ width: 4, height: 24, background: colors.gray300, borderRadius: 2 }} />
        <div style={{ width: 150, height: 24, background: colors.gray200, borderRadius: 4 }} />
      </div>

      {[1, 2, 3].map((i) => (
        <div key={i} style={{ background: colors.white, borderRadius: 20, padding: 20, marginBottom: 16, border: `1px solid ${colors.gray200}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ width: 200, height: 20, background: colors.gray200, borderRadius: 4, marginBottom: 12 }} />
              <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                <div style={{ width: 120, height: 16, background: colors.gray200, borderRadius: 4 }} />
                <div style={{ width: 100, height: 16, background: colors.gray200, borderRadius: 4 }} />
              </div>
              <div style={{ width: 100, height: 32, background: colors.gray200, borderRadius: 20 }} />
            </div>
            <div style={{ minWidth: 140, textAlign: "right" }}>
              <div style={{ width: 100, height: 28, background: colors.gray200, borderRadius: 20, margin: "0 auto 12px" }} />
              <div style={{ width: "100%", height: 40, background: colors.gray200, borderRadius: 12, marginBottom: 8 }} />
              <div style={{ width: "100%", height: 40, background: colors.gray200, borderRadius: 12 }} />
            </div>
          </div>
        </div>
      ))}

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

export default function OpportunitesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [userLangue, setUserLangue] = useState<string>("fr");
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isMounted = useRef(true);

  function isUrl(str: string): boolean {
    return str.startsWith("http://") || str.startsWith("https://");
  }

  async function playSummaryAudio(postId: string, audioField: "audio_fr" | "audio_yor") {
    if (!isMounted.current) return;
    
    try {
      setAudioError(null);
      
      const { data: post, error } = await supabase
        .from("post_institutions")
        .select(audioField)
        .eq("id", postId)
        .single();

      if (error) throw error;
      if (!post) {
        setAudioError("Audio non disponible");
        return;
      }

      const audioValue = (post as any)[audioField];
      if (!audioValue) {
        setAudioError("Audio non disponible");
        return;
      }
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const audio = new Audio();
      audio.src = isUrl(audioValue) ? audioValue : `data:audio/mpeg;base64,${audioValue}`;
      audioRef.current = audio;

      audio.onplay = () => {
        if (isMounted.current) setPlayingAudio(`${postId}-${audioField}`);
      };
      audio.onended = () => {
        if (isMounted.current) {
          setPlayingAudio(null);
          audioRef.current = null;
        }
      };
      audio.onerror = () => {
        if (isMounted.current) {
          setAudioError("Impossible de lire l'audio");
          setPlayingAudio(null);
          audioRef.current = null;
        }
      };

      await audio.play();
    } catch (err) {
      if (isMounted.current) setAudioError("Impossible de charger l'audio");
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
    isMounted.current = true;
    let timeoutId: NodeJS.Timeout;

    async function loadData() {
      try {
        timeoutId = setTimeout(() => {
          if (isMounted.current && loading) {
            setError("Le chargement prend trop de temps. Vérifiez votre connexion.");
            setLoading(false);
          }
        }, 8000);

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

        if (profileRow.langue && isMounted.current) setUserLangue(profileRow.langue);
        const profileId = profileRow.id;

        const { data: matches, error: matchesErr } = await supabase
          .from("post_institution_matches")
          .select("*")
          .eq("profile_id", profileId)
          .order("score", { ascending: false });

        if (matchesErr) throw matchesErr;
        if (!matches || matches.length === 0) {
          if (isMounted.current) setItems([]);
          return;
        }

        const postIds = matches.map((m: any) => m.post_institution_id);
        const { data: posts, error: postsErr } = await supabase
          .from("post_institutions")
          .select("*")
          .in("id", postIds);

        if (postsErr) throw postsErr;

        const postsById = new Map((posts || []).map((p: any) => [p.id, p]));

        const combined: Item[] = matches.map((m: any) => ({
          match: {
            id: m.id,
            score: m.score,
            niveau: m.niveau,
            can_apply: m.can_apply,
          },
          post: postsById.get(m.post_institution_id) ?? null,
        }));

        if (isMounted.current) setItems(combined);
      } catch (err: any) {
        if (isMounted.current) setError(err?.message ?? "Erreur lors du chargement");
      } finally {
        if (isMounted.current) {
          clearTimeout(timeoutId);
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted.current = false;
      clearTimeout(timeoutId);
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
    header: {
      marginBottom: "24px",
    },
    title: {
      fontSize: "24px",
      fontWeight: 700,
      fontFamily: "'Playfair Display', serif",
      color: colors.deepBlue,
      marginBottom: "4px",
    },
    subtitle: {
      fontSize: "14px",
      color: colors.gray600,
    },
    statsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: "12px",
      marginBottom: "24px",
    },
    statCard: {
      background: colors.white,
      borderRadius: "16px",
      padding: "12px",
      border: `1px solid ${colors.gray200}`,
    },
    statValue: {
      fontSize: "24px",
      fontWeight: 700,
    },
    statLabel: {
      fontSize: "11px",
      color: colors.gray500,
    },
    sectionHeader: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginBottom: "16px",
    },
    sectionTitle: {
      fontSize: "18px",
      fontWeight: 600,
      color: colors.gray800,
    },
    card: {
      background: colors.white,
      borderRadius: "16px",
      padding: "16px",
      marginBottom: "12px",
      border: `1px solid ${colors.gray200}`,
      transition: "all 0.2s ease",
      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    },
    cardContent: {
      display: "flex",
      flexDirection: "column",
      gap: "16px",
    },
    leftSection: {
      flex: 1,
    },
    rightSection: {
      minWidth: "auto",
      textAlign: "left",
    },
    titleCard: {
      fontSize: "16px",
      fontWeight: 700,
      color: colors.gray800,
      marginBottom: "8px",
    },
    metaInfo: {
      display: "flex",
      flexWrap: "wrap",
      gap: "12px",
      marginBottom: "12px",
    },
    metaItem: {
      display: "flex",
      alignItems: "center",
      gap: "4px",
      fontSize: "11px",
    },
    audioButton: (isPlaying: boolean) => ({
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
      background: isPlaying ? colors.beninGreen : "transparent",
      color: isPlaying ? colors.white : colors.beninGreen,
    }),
    badge: (bgColor: string, textColor: string) => ({
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      padding: "3px 10px",
      borderRadius: "20px",
      fontSize: "11px",
      fontWeight: 500,
      marginBottom: "12px",
      background: bgColor,
      color: textColor,
    }),
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
      border: `1px solid ${colors.deepBlue}`,
      background: colors.white,
      color: colors.deepBlue,
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
      background: colors.beninGreen,
      color: colors.white,
      border: "none",
    },
  };

  function renderItem(item: Item) {
    const post = item.post;
    const match = item.match;
    
    const audioField = userLangue === "yor" ? "audio_yor" : "audio_fr";
    const audioKey = `${post?.id}-${audioField}`;
    const isPlaying = playingAudio === audioKey;
    const hasAudio = post && (post.audio_fr || post.audio_yor);
    const isPostulable = match.can_apply === true;
    const niveauColor = match.niveau === "tres_pertinent" ? colors.beninGreen : colors.deepBlue;
    
    return (
      <div
        key={match.id}
        style={styles.card as any}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.05)";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        <div style={styles.cardContent as any}>
          <div style={styles.leftSection as any}>
            <div style={{ marginBottom: 12 }}>
              <h3 style={styles.titleCard}>{post?.titre ?? "Titre manquant"}</h3>
              <div style={styles.metaInfo as any}>
                {post?.montant_min_fcfa && post?.montant_max_fcfa && (
                  <div style={styles.metaItem}>
                    <DollarSign size={12} color={colors.gray400} />
                    <span>{post.montant_min_fcfa.toLocaleString()} - {post.montant_max_fcfa.toLocaleString()} FCFA</span>
                  </div>
                )}
                {post?.date_limite && (
                  <div style={styles.metaItem}>
                    <Calendar size={12} color={colors.gray400} />
                    <span>{new Date(post.date_limite).toLocaleDateString("fr-FR")}</span>
                  </div>
                )}
              </div>
            </div>
            
            {hasAudio && (
              <div style={{ marginBottom: 12 }}>
                <button
                  onClick={() => isPlaying ? stopAudio() : playSummaryAudio(post!.id, audioField)}
                  style={styles.audioButton(isPlaying)}
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
            
            <div style={styles.badge(`${niveauColor}10`, niveauColor)}>
              <TrendingUp size={12} color={niveauColor} />
              <span>Score: {match.score}% - {match.niveau === "tres_pertinent" ? "Très pertinent" : "Pertinent"}</span>
            </div>
          </div>
          
          <div style={styles.rightSection as any}>
            <div style={styles.badge(
              isPostulable ? `${colors.beninGreen}10` : `${colors.beninYellow}10`,
              isPostulable ? colors.beninGreen : colors.beninYellow
            )}>
              {isPostulable ? <CheckCircle size={12} color={colors.beninGreen} /> : <AlertCircle size={12} color={colors.beninYellow} />}
              <span>{isPostulable ? "Postulable" : "Non postulable"}</span>
            </div>
            
            <button
              onClick={() => router.push(`/opportunites/${post?.id}`)}
              style={styles.buttonPrimary}
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
            
            {isPostulable && (
              <button
                onClick={() => router.push(`/opportunites/${post?.id}/postuler`)}
                style={styles.buttonSecondary}
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
    <div style={styles.container as any}>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "4px", display: "flex", zIndex: 50 }}>
        <div style={{ flex: 1, background: colors.beninGreen }} />
        <div style={{ flex: 1, background: colors.beninYellow }} />
        <div style={{ flex: 1, background: colors.beninRed }} />
      </div>

      <div style={styles.content as any}>
        <div style={styles.header as any}>
          <h1 style={styles.title as any}>Opportunités de financement</h1>
          <p style={styles.subtitle as any}>Découvrez les offres adaptées à votre profil</p>
        </div>

        <div style={styles.statsGrid as any}>
          <div style={styles.statCard}>
            <div style={{ ...styles.statValue, color: colors.beninGreen }}>{very.length}</div>
            <div style={styles.statLabel}>Très pertinentes</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statValue, color: colors.deepBlue }}>{pertinent.length}</div>
            <div style={styles.statLabel}>Pertinentes</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statValue, color: colors.beninGreen }}>{canApply.length}</div>
            <div style={styles.statLabel}>Postulables</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statValue, color: colors.beninYellow }}>{cannotApply.length}</div>
            <div style={styles.statLabel}>Non postulables</div>
          </div>
        </div>

        {very.length > 0 && (
          <section style={{ marginBottom: 24 }}>
            <div style={styles.sectionHeader}>
              <div style={{ width: 4, height: 24, background: colors.beninGreen, borderRadius: 2 }} />
              <h2 style={styles.sectionTitle}>Très pertinentes ({very.length})</h2>
            </div>
            {very.map(renderItem)}
          </section>
        )}

        {pertinent.length > 0 && (
          <section style={{ marginBottom: 24 }}>
            <div style={styles.sectionHeader}>
              <div style={{ width: 4, height: 24, background: colors.deepBlue, borderRadius: 2 }} />
              <h2 style={styles.sectionTitle}>Pertinentes ({pertinent.length})</h2>
            </div>
            {pertinent.map(renderItem)}
          </section>
        )}

        {cannotApply.length > 0 && (
          <section>
            <div style={styles.sectionHeader}>
              <div style={{ width: 4, height: 24, background: colors.beninYellow, borderRadius: 2 }} />
              <h2 style={styles.sectionTitle}>Non postulables ({cannotApply.length})</h2>
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