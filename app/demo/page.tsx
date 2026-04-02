"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/src/lib/supabase/browser";
import {
  Phone,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Loader2,
  Headphones,
  Signal,
  Battery,
  Wifi,
  X
} from "lucide-react";

// Couleurs du branding Alɔdó
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
  gray900: "#111827",
};

type Opportunite = {
  id: string;
  titre: string;
  description: string;
  institution_nom: string;
  audio_fr: string | null;
  montant_min_fcfa: number | null;
  montant_max_fcfa: number | null;
  score_match: number;
  can_apply: boolean;
};

type USSDState = "dial" | "calling" | "call";

export default function USSDDemo() {
  const router = useRouter();
  const [state, setState] = useState<USSDState>("dial");
  const [dialInput, setDialInput] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [opportunities, setOpportunities] = useState<Opportunite[]>([]);
  const [currentOppIndex, setCurrentOppIndex] = useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState("");
  const [menuMessage, setMenuMessage] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Mettre à jour l'heure
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  // Auto-lancer l'appel quand 202 est composé
  useEffect(() => {
    if (dialInput === "202" && state === "dial") {
      setTimeout(() => {
        makeCall();
      }, 300);
    }
  }, [dialInput, state]);

  // Timer d'appel
  useEffect(() => {
    if (state === "call") {
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
      setCallDuration(0);
    }
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [state]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Jouer un audio
  const playAudio = useCallback(async (audioPath: string) => {
    if (isMuted || !audioPath) return;
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    const audio = new Audio(audioPath);
    audioRef.current = audio;
    
    return new Promise<void>((resolve) => {
      audio.onended = () => {
        setIsAudioPlaying(false);
        resolve();
      };
      audio.onplay = () => setIsAudioPlaying(true);
      audio.onerror = () => {
        setIsAudioPlaying(false);
        resolve();
      };
      audio.play().catch(() => resolve());
    });
  }, [isMuted]);

  // Lire un message texte (synthèse vocale)
  const speak = useCallback((text: string) => {
    if (isMuted) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR";
    utterance.rate = 0.9;
    utterance.onstart = () => setIsAudioPlaying(true);
    utterance.onend = () => setIsAudioPlaying(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [isMuted]);

  // Charger le profil et les opportunités
  const loadProfileAndOpportunities = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      const { data: matches } = await supabase
        .from("post_institution_matches")
        .select(`
          *,
          post_institutions (*)
        `)
        .eq("profile_id", profileData?.id)
        .order("score", { ascending: false });

      if (matches && matches.length > 0) {
        const opps = matches.map((match: any) => ({
          id: match.post_institutions.id,
          titre: match.post_institutions.titre,
          description: match.post_institutions.description,
          institution_nom: match.post_institutions.contact_nom || "Institution",
          audio_fr: match.post_institutions.audio_fr,
          montant_min_fcfa: match.post_institutions.montant_min_fcfa,
          montant_max_fcfa: match.post_institutions.montant_max_fcfa,
          score_match: match.score,
          can_apply: match.can_apply,
        }));
        setOpportunities(opps);
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  }, [router]);

  // Lancer l'appel
  const makeCall = async () => {
    if (dialInput !== "202") {
      alert("Code invalide. Composez 202 pour lancer le service.");
      setDialInput("");
      return;
    }
    
    setState("calling");
    setTimeout(async () => {
      await loadProfileAndOpportunities();
      setState("call");
      
      await playAudio("/demo/welcome.mp3");
      
      setMenuMessage("Tapez 1 pour vos opportunités. Tapez 2 pour plus de crédit.");
      speak("Tapez 1 pour vos opportunités. Tapez 2 pour plus de crédit.");
    }, 2000);
  };

  // Gérer les touches pendant l'appel
  const handleKeyPress = async (key: string) => {
    if (state !== "call") return;
    
    if (key === "1") {
      if (opportunities.length === 0) {
        speak("Aucune opportunité pour le moment.");
        return;
      }
      setCurrentOppIndex(0);
      await playCurrentOpportunity(0);
    } else if (key === "2") {
      speak("Pour obtenir plus de crédit, contactez votre agent Alodo ou visitez notre site web.");
    } else if (key === "*") {
      if (currentOppIndex >= 0 && opportunities[currentOppIndex]) {
        await playCurrentOpportunity(currentOppIndex);
      }
    } else if (key === "#") {
      if (currentOppIndex + 1 < opportunities.length) {
        const nextIndex = currentOppIndex + 1;
        setCurrentOppIndex(nextIndex);
        await playCurrentOpportunity(nextIndex);
      } else {
        speak("C'était la dernière opportunité.");
      }
    }
  };

  const playCurrentOpportunity = async (index: number) => {
    const opp = opportunities[index];
    if (!opp) return;
    
    const message = `Opportunité ${index + 1} sur ${opportunities.length}. ${opp.titre}. ${opp.description}. Score de matching: ${opp.score_match} pour cent. ${opp.can_apply ? "Vous pouvez postuler." : "Vous ne pouvez pas postuler pour le moment."}`;
    
    if (opp.audio_fr) {
      await playAudio(opp.audio_fr);
    } else {
      speak(message);
    }
    
    setTimeout(() => {
      speak("Tapez dièse pour passer à l'opportunité suivante. Tapez étoile pour répéter.");
    }, 1000);
  };

  const endCall = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    window.speechSynthesis.cancel();
    setState("dial");
    setDialInput("");
    setMenuMessage("");
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted && audioRef.current) {
      audioRef.current.pause();
    }
    if (!isMuted) {
      window.speechSynthesis.cancel();
    }
  };

  const keypadButtons = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["*", "0", "#"]
  ];

  // ========== INTERFACE 1 : ÉCRAN DE NUMÉROTATION ==========
  if (state === "dial") {
    return (
      <div style={{
        minHeight: "100vh",
        background: colors.gray100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}>
        <div style={{
          width: "100%",
          maxWidth: "380px",
          background: colors.white,
          borderRadius: "48px",
          overflow: "hidden",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.5)",
          border: `1px solid ${colors.gray200}`,
          transform: "perspective(1000px) rotateX(2deg)",
        }}>
          {/* Status Bar */}
          <div style={{
            padding: "14px 24px 8px",
            display: "flex",
            justifyContent: "space-between",
            fontSize: "14px",
            fontWeight: 500,
            color: colors.gray600,
            background: colors.white,
          }}>
            <span>{currentTime}</span>
            <div style={{ display: "flex", gap: "6px" }}>
              <Signal size={12} color={colors.gray500} />
              <Battery size={12} color={colors.gray500} />
            </div>
          </div>

          {/* Logo Alɔdó */}
          <div style={{ textAlign: "center", padding: "16px 20px 8px" }}>
            <div style={{
              width: "48px",
              height: "48px",
              background: `linear-gradient(135deg, ${colors.deepBlue} 0%, ${colors.deepBlueDark} 100%)`,
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 8px",
              boxShadow: "0 6px 16px rgba(26, 60, 107, 0.2)",
            }}>
              <span style={{ fontSize: "24px", fontWeight: "bold", color: colors.white }}>A</span>
            </div>
            <h1 style={{
              fontSize: "18px",
              fontWeight: 700,
              fontFamily: "'Playfair Display', serif",
              color: colors.deepBlue,
              marginBottom: "0px",
              letterSpacing: "-0.5px",
            }}>Alɔdó</h1>
            <p style={{ fontSize: "10px", color: colors.gray400, textTransform: "uppercase", letterSpacing: "0.5px", margin: "2px 0 0" }}>Service vocal</p>
          </div>

          {/* Numéro composé */}
          <div style={{ textAlign: "center", padding: "8px 20px" }}>
            <div style={{
              fontSize: "32px",
              fontWeight: 600,
              fontFamily: "monospace",
              color: colors.gray800,
              letterSpacing: "6px",
              background: colors.gray50,
              padding: "12px",
              borderRadius: "20px",
              border: `1px solid ${colors.gray200}`,
              minHeight: "52px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              {dialInput || "___"}
            </div>
            <p style={{ fontSize: "10px", color: colors.gray400, marginTop: "6px" }}>
              Composez <strong style={{ color: colors.beninGreen }}>202</strong>
            </p>
          </div>

          {/* Clavier */}
          <div style={{ padding: "8px 20px 16px" }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "8px",
              marginBottom: "12px",
            }}>
              {keypadButtons.map((row, rowIndex) => (
                <div key={rowIndex} style={{ display: "contents" }}>
                  {row.map((key) => (
                    <button
                      key={key}
                      onClick={() => setDialInput(prev => prev.length < 3 ? prev + key : prev)}
                      style={{
                        aspectRatio: "1",
                        borderRadius: "50px",
                        background: colors.white,
                        border: `1px solid ${colors.gray300}`,
                        fontSize: "20px",
                        fontWeight: 500,
                        color: colors.gray700,
                        cursor: "pointer",
                        transition: "all 0.1s ease",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)",
                      }}
                      onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.95)"}
                      onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
                      onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setDialInput(prev => prev.slice(0, -1))}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "30px",
                  background: colors.gray100,
                  border: `1px solid ${colors.gray200}`,
                  fontSize: "12px",
                  fontWeight: 500,
                  color: colors.gray600,
                  cursor: "pointer",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                }}
              >
                Effacer
              </button>
            </div>
          </div>

          {/* Home Indicator */}
          <div style={{ padding: "16px 0 20px", display: "flex", justifyContent: "center" }}>
            <div style={{ width: "100px", height: "4px", background: colors.gray300, borderRadius: "2px" }} />
          </div>
        </div>
      </div>
    );
  }

  // ========== INTERFACE 2 : APPEL EN COURS ==========
  if (state === "calling") {
    return (
      <div style={{
        minHeight: "100vh",
        background: colors.gray100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}>
        <div style={{
          width: "100%",
          maxWidth: "380px",
          background: colors.white,
          borderRadius: "48px",
          overflow: "hidden",
          textAlign: "center",
          padding: "48px 24px",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.5)",
          border: `1px solid ${colors.gray200}`,
          transform: "perspective(1000px) rotateX(1deg)",
        }}>
          <div style={{
            width: "80px",
            height: "80px",
            background: colors.gray100,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            border: `1px solid ${colors.gray200}`,
          }}>
            <Loader2 size={36} color={colors.deepBlue} style={{ animation: "spin 1s linear infinite" }} />
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: 600, color: colors.gray800 }}>Appel en cours</h2>
          <p style={{ color: colors.gray500, marginTop: "8px", fontFamily: "monospace" }}>202</p>
          <p style={{ color: colors.gray400, fontSize: "12px", marginTop: "16px" }}>Connexion au service Alɔdó...</p>
          <button
            onClick={endCall}
            style={{
              marginTop: "32px",
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: colors.beninRed,
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginLeft: "auto",
              marginRight: "auto",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(232, 17, 45, 0.3)",
            }}
          >
            <Phone size={28} color={colors.white} style={{ transform: "rotate(135deg)" }} />
          </button>
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

  // ========== INTERFACE 3 : APPEL ACTIF ==========
  return (
    <div style={{
      minHeight: "100vh",
      background: colors.gray100,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "380px",
        background: colors.white,
        borderRadius: "48px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "580px",
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.5)",
        border: `1px solid ${colors.gray200}`,
        transform: "perspective(1000px) rotateX(1deg)",
      }}>
        {/* Status Bar */}
        <div style={{
          padding: "14px 24px 8px",
          display: "flex",
          justifyContent: "space-between",
          fontSize: "14px",
          color: colors.gray600,
          background: colors.white,
        }}>
          <span>{currentTime}</span>
          <div style={{ display: "flex", gap: "6px" }}>
            <Signal size={12} color={colors.gray500} />
            <Battery size={12} color={colors.gray500} />
          </div>
        </div>

        {/* Info appel */}
        <div style={{ textAlign: "center", padding: "16px 20px" }}>
          <div style={{
            width: "72px",
            height: "72px",
            background: colors.beninGreen,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 12px",
            boxShadow: "0 8px 20px rgba(0, 135, 81, 0.25)",
          }}>
            <Phone size={32} color={colors.white} />
          </div>
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: colors.gray800 }}>Service Alɔdó</h2>
          <p style={{ color: colors.gray500, fontSize: "12px" }}>Appel vocal • {formatDuration(callDuration)}</p>
        </div>

        {/* Zone de message */}
        <div style={{
          flex: 1,
          margin: "12px 20px",
          background: colors.gray50,
          borderRadius: "28px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          border: `1px solid ${colors.gray200}`,
        }}>
          {isAudioPlaying ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ display: "flex", gap: "4px", justifyContent: "center", marginBottom: "12px" }}>
                <div style={{ width: "3px", height: "16px", background: colors.beninGreen, borderRadius: "2px", animation: "pulse 0.5s ease infinite" }} />
                <div style={{ width: "3px", height: "28px", background: colors.beninGreen, borderRadius: "2px", animation: "pulse 0.5s ease infinite 0.1s" }} />
                <div style={{ width: "3px", height: "22px", background: colors.beninGreen, borderRadius: "2px", animation: "pulse 0.5s ease infinite 0.2s" }} />
                <div style={{ width: "3px", height: "24px", background: colors.beninGreen, borderRadius: "2px", animation: "pulse 0.5s ease infinite 0.3s" }} />
                <div style={{ width: "3px", height: "18px", background: colors.beninGreen, borderRadius: "2px", animation: "pulse 0.5s ease infinite 0.4s" }} />
              </div>
              <p style={{ color: colors.gray500, fontSize: "12px" }}>Message vocal en cours</p>
            </div>
          ) : (
            <div style={{ textAlign: "center" }}>
              <Headphones size={28} color={colors.gray400} style={{ marginBottom: "12px" }} />
              <p style={{ color: colors.gray600, fontSize: "13px", lineHeight: 1.5 }}>
                {menuMessage || "Tapez 1 pour opportunités, 2 pour crédit"}
              </p>
            </div>
          )}
        </div>

        {/* Clavier */}
        <div style={{ padding: "16px 20px 20px" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "10px",
            marginBottom: "16px",
          }}>
            {keypadButtons.map((row, rowIndex) => (
              <div key={rowIndex} style={{ display: "contents" }}>
                {row.map((key) => (
                  <button
                    key={key}
                    onClick={() => handleKeyPress(key)}
                    style={{
                      aspectRatio: "1",
                      borderRadius: "60px",
                      background: colors.white,
                      border: `1px solid ${colors.gray200}`,
                      fontSize: "24px",
                      fontWeight: 500,
                      color: colors.gray700,
                      cursor: "pointer",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)",
                    }}
                  >
                    {key}
                  </button>
                ))}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={toggleMute}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "40px",
                background: colors.gray100,
                border: `1px solid ${colors.gray200}`,
                fontSize: "13px",
                fontWeight: 500,
                color: colors.gray600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              {isMuted ? <MicOff size={14} /> : <Mic size={14} />}
              {isMuted ? "Activer" : "Couper"}
            </button>
            <button
              onClick={endCall}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "40px",
                background: colors.beninRed,
                border: "none",
                fontSize: "13px",
                fontWeight: 600,
                color: colors.white,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                boxShadow: "0 4px 12px rgba(232, 17, 45, 0.3)",
              }}
            >
              <Phone size={14} style={{ transform: "rotate(135deg)" }} />
              Raccrocher
            </button>
          </div>
        </div>

        {/* Home Indicator */}
        <div style={{ padding: "12px 0 16px", display: "flex", justifyContent: "center" }}>
          <div style={{ width: "100px", height: "4px", background: colors.gray300, borderRadius: "2px" }} />
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scaleY(0.7); }
          50% { opacity: 1; transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}