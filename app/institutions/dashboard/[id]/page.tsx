"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import supabase from "@/src/lib/supabase/browser";
import { ArrowLeft, Building2, CalendarDays, CircleDollarSign, Play, Pause, Volume2, AlertCircle, Edit2 } from "lucide-react";
import { getDefaultUserPath } from "@/src/lib/profiles/access";

const colors = {
  white: "#ffffff",
  ink: "#163f2e",
  blue: "#1a3c6b",
  green: "#008751",
  line: "#d7e4da",
  muted: "#5d7667",
  soft: "#f6faf7",
  yellow: "#fcd116",
  red: "#e8112d",
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
  updated_at: string | null;
  audio_fr: string | null;
  audio_yor: string | null;
};

export default function InstitutionPostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [post, setPost] = useState<InstitutionPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const postId = params?.id as string;

  function isUrl(str: string): boolean {
    return str.startsWith("http://") || str.startsWith("https://") || str.startsWith("blob:");
  }

  function getFileExtension(url: string): string {
    const match = url.match(/\.([0-9a-z]+)(?:[?#]|$)/i);
    return match ? match[1].toLowerCase() : "mp3";
  }

  async function playPostAudio(audioField: "audio_fr" | "audio_yor") {
    try {
      setAudioError(null);
      
      if (!post || !post[audioField]) {
        setAudioError("Audio non disponible pour cette opportunité");
        return;
      }

      // Arrêter l'audio en cours
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const audio = new Audio();
      const audioValue = post[audioField];
      
      if (isUrl(audioValue!)) {
        console.log("Lecture audio depuis URL:", audioValue);
        audio.src = audioValue!;
      } else {
        const extension = getFileExtension(audioValue!);
        const mimeType = extension === "mp3" ? "audio/mpeg" : "audio/wav";
        audio.src = `data:${mimeType};base64,${audioValue}`;
        console.log("Lecture audio depuis base64, format:", mimeType);
      }
      
      audioRef.current = audio;

      audio.onplay = () => {
        setPlayingAudio(`${postId}-${audioField}`);
        console.log("Lecture audio démarrée");
      };

      audio.onended = () => {
        console.log("Audio terminé");
        setPlayingAudio(null);
        audioRef.current = null;
      };

      audio.onerror = (err) => {
        console.error("Erreur lecture audio:", err);
        setAudioError("Impossible de lire l'audio. Vérifiez le format ou l'URL.");
        setPlayingAudio(null);
        audioRef.current = null;
      };

      await audio.play();
    } catch (err) {
      console.error("Erreur lors de la lecture audio:", err);
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

    async function loadPost() {
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

        const { data, error: postError } = await supabase
          .from("post_institutions")
          .select(
            "id, titre, description, statut, types_concernes, secteurs_concernes, montant_min_fcfa, montant_max_fcfa, date_limite, created_at, updated_at, audio_fr, audio_yor"
          )
          .eq("id", postId)
          .eq("institution_profile_id", profile.id)
          .single();

        if (postError) throw postError;
        if (active) setPost(data as InstitutionPost);
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error ? loadError.message : "Impossible de charger le post."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    if (postId) {
      void loadPost();
    }
    
    return () => {
      active = false;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [postId, router]);

  return (
    <div style={{ minHeight: "100vh", background: "#f8faf8", padding: "24px 18px 64px", color: colors.ink }}>
      <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gap: 24 }}>
        {/* Header */}
        <section style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <Link href="/institutions/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: colors.green, textDecoration: "none", fontWeight: 700 }}>
            <ArrowLeft size={20} />
            Retour au dashboard
          </Link>
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
        ) : loading ? (
          <div style={{ textAlign: "center", color: colors.muted }}>Chargement du post...</div>
        ) : post ? (
          <section style={panelStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
              <div style={{ display: "grid", gap: 12, flex: 1 }}>
                <div style={eyebrowStyle}>POST DÉTAIL</div>
                <h1 style={{ margin: 0, fontSize: 32, lineHeight: 1.2 }}>{post.titre}</h1>
                
                <div
                  style={{
                    borderRadius: 999,
                    padding: "8px 16px",
                    background: post.statut === "publie" ? "#ebf7f1" : "#fff7df",
                    color: post.statut === "publie" ? colors.green : "#9a7510",
                    fontWeight: 800,
                    textTransform: "capitalize",
                    width: "fit-content",
                  }}
                >
                  {post.statut}
                </div>
              </div>

              <Link
                href={`/institutions/dashboard/${postId}/edit`}
                style={{
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
                  whiteSpace: "nowrap",
                }}
              >
                <Edit2 size={18} />
                Modifier
              </Link>
            </div>

            {/* Description */}
            <div style={{ marginTop: 24, display: "grid", gap: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: colors.muted, letterSpacing: "0.08em" }}>DESCRIPTION</div>
              <div style={{ fontSize: 16, lineHeight: 1.7, color: colors.ink, background: colors.soft, padding: 16, borderRadius: 12 }}>
                {post.description}
              </div>
            </div>

            {/* Audio */}
            {(post.audio_fr || post.audio_yor) && (
              <div style={{ marginTop: 24, display: "grid", gap: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: colors.muted, letterSpacing: "0.08em" }}>AUDIO</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                  {post.audio_fr && (
                    <button
                      onClick={() => playingAudio === `${postId}-audio_fr` ? stopAudio() : playPostAudio("audio_fr")}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "10px 18px",
                        borderRadius: 20,
                        border: `1px solid ${colors.green}`,
                        background: playingAudio === `${postId}-audio_fr` ? colors.green : "transparent",
                        color: playingAudio === `${postId}-audio_fr` ? colors.white : colors.green,
                        cursor: "pointer",
                        fontSize: 14,
                        fontWeight: 600,
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (playingAudio !== `${postId}-audio_fr`) {
                          e.currentTarget.style.background = colors.green;
                          e.currentTarget.style.color = colors.white;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (playingAudio !== `${postId}-audio_fr`) {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = colors.green;
                        }
                      }}
                    >
                      {playingAudio === `${postId}-audio_fr` ? <Pause size={16} /> : <Play size={16} />}
                      <Volume2 size={16} />
                      {playingAudio === `${postId}-audio_fr` ? "Pause" : "Français"}
                    </button>
                  )}
                  
                  {post.audio_yor && (
                    <button
                      onClick={() => playingAudio === `${postId}-audio_yor` ? stopAudio() : playPostAudio("audio_yor")}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "10px 18px",
                        borderRadius: 20,
                        border: `1px solid ${colors.yellow}`,
                        background: playingAudio === `${postId}-audio_yor` ? colors.yellow : "transparent",
                        color: playingAudio === `${postId}-audio_yor` ? colors.ink : "#b78621",
                        cursor: "pointer",
                        fontSize: 14,
                        fontWeight: 600,
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (playingAudio !== `${postId}-audio_yor`) {
                          e.currentTarget.style.background = colors.yellow;
                          e.currentTarget.style.color = colors.ink;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (playingAudio !== `${postId}-audio_yor`) {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "#b78621";
                        }
                      }}
                    >
                      {playingAudio === `${postId}-audio_yor` ? <Pause size={16} /> : <Play size={16} />}
                      <Volume2 size={16} />
                      {playingAudio === `${postId}-audio_yor` ? "Pause" : "Yoruba"}
                    </button>
                  )}
                </div>
                
                {audioError && (
                  <div style={{
                    fontSize: 13,
                    color: colors.red,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}>
                    <AlertCircle size={14} />
                    {audioError}
                  </div>
                )}
              </div>
            )}

            {/* Metadata Grid */}
            <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
              {post.types_concernes && post.types_concernes.length > 0 && (
                <div style={metadataCardStyle}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: colors.muted, letterSpacing: "0.08em" }}>TYPES CONCERNÉS</div>
                  <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {post.types_concernes.map((type) => (
                      <span key={type} style={{ display: "inline-block", background: colors.soft, padding: "6px 10px", borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {post.secteurs_concernes && post.secteurs_concernes.length > 0 && (
                <div style={metadataCardStyle}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: colors.muted, letterSpacing: "0.08em" }}>SECTEURS CONCERNÉS</div>
                  <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {post.secteurs_concernes.map((secteur) => (
                      <span key={secteur} style={{ display: "inline-block", background: colors.soft, padding: "6px 10px", borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                        {secteur}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(post.montant_min_fcfa || post.montant_max_fcfa) && (
                <div style={metadataCardStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <CircleDollarSign size={16} color={colors.green} />
                    <div style={{ fontSize: 12, fontWeight: 800, color: colors.muted, letterSpacing: "0.08em" }}>MONTANT</div>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 16, fontWeight: 800 }}>
                    {(post.montant_min_fcfa ?? 0).toLocaleString("fr-FR")} -{" "}
                    {(post.montant_max_fcfa ?? 0).toLocaleString("fr-FR")} FCFA
                  </div>
                </div>
              )}

              {post.date_limite && (
                <div style={metadataCardStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <CalendarDays size={16} color={colors.green} />
                    <div style={{ fontSize: 12, fontWeight: 800, color: colors.muted, letterSpacing: "0.08em" }}>DATE LIMITE</div>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 16, fontWeight: 800 }}>
                    {new Date(post.date_limite).toLocaleDateString("fr-FR", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Timestamps */}
            <div style={{ marginTop: 24, padding: "14px 16px", borderRadius: 12, background: colors.soft, fontSize: 13, color: colors.muted }}>
              <div>
                Créé le {new Date(post.created_at).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </div>
              {post.updated_at && (
                <div style={{ marginTop: 6 }}>
                  Modifié le {new Date(post.updated_at).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
              )}
            </div>
          </section>
        ) : null}
      </div>
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

const metadataCardStyle = {
  background: colors.soft,
  border: `1px solid ${colors.line}`,
  borderRadius: 16,
  padding: 16,
} as const;

const eyebrowStyle = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.08em",
  color: colors.green,
} as const;
