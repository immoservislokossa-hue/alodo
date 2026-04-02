"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Mic, 
  MicOff, 
  Send, 
  Image as ImageIcon, 
  X, 
  Volume2, 
  VolumeX, 
  Loader2,
  ChevronRight,
  ExternalLink,
  FileText,
  Headphones
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
};

type Message = {
  id: string;
  type: "user" | "bot";
  text: string;
  steps?: string;
  link?: string | null;
  audio?: string | null;
  image?: string | null;
  timestamp: Date;
};

// Validation simple et fiable
const isValidAudio = (base64: string): boolean => {
  return !!base64 && base64.length > 1000;
};

// Extraction robuste du texte
const extractTextFromResponse = (data: any): { text: string; steps: string; link: string | null } => {
  if (typeof data === 'object' && data !== null) {
    if (typeof data.text === 'string') {
      return {
        text: data.text,
        steps: data.steps || "",
        link: data.link || null,
      };
    }
    const possibleText = data.text || data.message || data.response || data.content;
    if (typeof possibleText === 'string') {
      return {
        text: possibleText,
        steps: data.steps || "",
        link: data.link || null,
      };
    }
  }
  
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      if (typeof parsed === 'object' && parsed !== null) {
        return {
          text: parsed.text || parsed.message || parsed.response || "Réponse reçue",
          steps: parsed.steps || "",
          link: parsed.link || null,
        };
      }
    } catch {
      return {
        text: data,
        steps: "",
        link: null,
      };
    }
  }
  
  return {
    text: "Je cherche encore une réponse fiable. Réessaie dans quelques secondes.",
    steps: "",
    link: null,
  };
};

function ChatbotContent() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasSentQuery, setHasSentQuery] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ✅ Récupérer la query param ?q=... et envoyer automatiquement
  useEffect(() => {
    const query = searchParams.get("q");
    if (query && query.trim() && !hasSentQuery) {
      // 1. Remplir l'input
      setInput(query);
      
      // 2. Envoyer automatiquement après un court délai
      setTimeout(() => {
        sendMessage({ 
          skipUserMessage: false, 
          preFilledQuestion: query 
        });
        setHasSentQuery(true);
      }, 500);
    }
  }, [searchParams, hasSentQuery]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toBase64 = (file: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // Lecture audio robuste multi-format
  const playAudio = (base64: string) => {
    if (isMuted || !base64) return;

    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      setIsPlaying(true);
      
      const src = `data:audio/mp3;base64,${base64}`;
      const audio = new Audio(src);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        audioRef.current = null;
      };

      audio.onerror = () => {
        const fallbackSrc = `data:audio/wav;base64,${base64}`;
        const fallbackAudio = new Audio(fallbackSrc);
        audioRef.current = fallbackAudio;
        fallbackAudio.onended = () => {
          setIsPlaying(false);
          audioRef.current = null;
        };
        fallbackAudio.onerror = () => {
          console.log("Audio error, fallback failed");
          setIsPlaying(false);
          audioRef.current = null;
        };
        fallbackAudio.play().catch((err) => {
          console.log("Fallback play failed:", err);
          setIsPlaying(false);
        });
      };

      audio.play().catch((err) => {
        console.log("Play failed, trying fallback:", err);
        const fallbackSrc = `data:audio/wav;base64,${base64}`;
        const fallbackAudio = new Audio(fallbackSrc);
        audioRef.current = fallbackAudio;
        fallbackAudio.onended = () => {
          setIsPlaying(false);
          audioRef.current = null;
        };
        fallbackAudio.onerror = () => {
          setIsPlaying(false);
          audioRef.current = null;
        };
        fallbackAudio.play().catch(() => setIsPlaying(false));
      });
    } catch (err) {
      console.log("Audio crash:", err);
      setIsPlaying(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const base64 = await toBase64(audioBlob);
        sendMessage({ audioBase64: base64, mimeType: "audio/webm" });
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (error) {
      console.error("Erreur microphone:", error);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const sendMessage = async ({
    audioBase64 = null,
    mimeType = null,
    skipUserMessage = false,
    preFilledQuestion = null,
  }: { 
    audioBase64?: string | null; 
    mimeType?: string | null;
    skipUserMessage?: boolean;
    preFilledQuestion?: string | null;
  } = {}) => {
    const messageText = preFilledQuestion || input;
    if (!messageText && !image && !audioBase64) return;

    setLoading(true);

    let imageBase64 = null;
    let imageMimeType = null;
    if (image) {
      imageBase64 = await toBase64(image);
      imageMimeType = image.type;
    }

    // Message utilisateur
    if (!skipUserMessage) {
      const userMessage: Message = {
        id: Date.now().toString(),
        type: "user",
        text: messageText || (audioBase64 ? "🎤 Message vocal" : ""),
        image: image ? URL.createObjectURL(image) : null,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
    }

    const waitingMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: "bot",
      text: "Un instant, je vérifie les informations...",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, waitingMessage]);

    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          imageBase64,
          imageMimeType,
          audioBase64,
          audioMimeType: mimeType,
        }),
      });

      const rawData = await response.json();
      
      console.log("AUDIO LENGTH:", rawData.audio?.length);
      
      const extracted = extractTextFromResponse(rawData);
      
      const hasValidAudio = rawData.audio ? isValidAudio(rawData.audio) : false;
      
      if (hasValidAudio) {
        console.log("✅ Audio valide, longueur:", rawData.audio.length);
      } else {
        console.log("⚠️ Audio trop court ou absent");
      }

      setMessages((prev) => {
        const filtered = prev.filter(m => m.id !== waitingMessage.id);
        return [
          ...filtered,
          {
            id: (Date.now() + 2).toString(),
            type: "bot",
            text: extracted.text,
            steps: extracted.steps,
            link: extracted.link,
            audio: rawData.audio || null,
            timestamp: new Date(),
          },
        ];
      });

      if (rawData.audio && !isMuted) {
        setTimeout(() => {
          playAudio(rawData.audio);
        }, 100);
      }
    } catch (error) {
      console.error("Erreur:", error);
      setMessages((prev) => {
        const filtered = prev.filter(m => m.id !== waitingMessage.id);
        return [
          ...filtered,
          {
            id: (Date.now() + 2).toString(),
            type: "bot",
            text: "Oups, je consulte encore les informations officielles pour mieux te répondre.",
            timestamp: new Date(),
          },
        ];
      });
    } finally {
      setLoading(false);
      setInput("");
      setImage(null);
    }
  };

  const removeImage = () => {
    setImage(null);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlaying(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${colors.gray100} 0%, ${colors.white} 100%)`,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "20px",
      fontFamily: "system-ui, -apple-system, sans-serif",
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

      <div style={{
        width: "100%",
        maxWidth: "800px",
        height: "85vh",
        background: colors.white,
        borderRadius: "32px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.15)",
        border: `1px solid ${colors.gray200}`,
      }}>
        {/* HEADER */}
        <div style={{
          padding: "20px 24px",
          background: `linear-gradient(135deg, ${colors.deepBlue} 0%, ${colors.deepBlueDark} 100%)`,
          color: colors.white,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>
                Assistant Admin Bénin
              </h2>
              <p style={{ margin: "4px 0 0", fontSize: "12px", opacity: 0.8 }}>
                Texte, image ou vocal • Réponses audio
              </p>
            </div>
            <button
              onClick={toggleMute}
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "none",
                borderRadius: "40px",
                padding: "8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: colors.white,
              }}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </div>
        </div>

        {/* MESSAGES */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          background: colors.gray50,
        }}>
          {messages.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "48px 24px",
              color: colors.gray400,
            }}>
              <div style={{
                width: "64px",
                height: "64px",
                background: `${colors.deepBlue}10`,
                borderRadius: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}>
                <Headphones size={32} color={colors.deepBlue} />
              </div>
              <p style={{ fontSize: "14px", margin: 0 }}>
                Posez votre question par texte, image ou vocal
              </p>
              <p style={{ fontSize: "12px", marginTop: "8px" }}>
                Je vous répondrai avec un message vocal
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  justifyContent: msg.type === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "80%",
                    background: msg.type === "user" ? colors.deepBlue : colors.white,
                    color: msg.type === "user" ? colors.white : colors.gray800,
                    padding: "14px 18px",
                    borderRadius: "20px",
                    borderBottomRightRadius: msg.type === "user" ? "4px" : "20px",
                    borderBottomLeftRadius: msg.type === "user" ? "20px" : "4px",
                    boxShadow: msg.type === "bot" ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                    border: msg.type === "bot" ? `1px solid ${colors.gray200}` : "none",
                  }}
                >
                  {msg.image && (
                    <div style={{ marginBottom: "8px" }}>
                      <img
                        src={msg.image}
                        alt="Uploaded"
                        style={{
                          maxWidth: "200px",
                          maxHeight: "150px",
                          borderRadius: "12px",
                        }}
                      />
                    </div>
                  )}

                  <div style={{
                    fontSize: "14px",
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                    color: colors.gray800,
                  }}>
                    {msg.text}
                  </div>

                  {msg.steps && (
                    <div style={{
                      marginTop: "12px",
                      padding: "12px",
                      background: `${colors.beninYellow}15`,
                      borderRadius: "12px",
                      borderLeft: `3px solid ${colors.beninYellow}`,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                        <FileText size={12} color={colors.beninYellow} />
                        <span style={{ fontSize: "11px", fontWeight: 600, color: colors.gray600 }}>
                          Démarches à suivre
                        </span>
                      </div>
                      <p style={{
                        fontSize: "13px",
                        margin: 0,
                        lineHeight: 1.5,
                        color: colors.gray700,
                      }}>
                        {msg.steps}
                      </p>
                    </div>
                  )}

                  {msg.link && (
                    <a
                      href={msg.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        marginTop: "12px",
                        color: colors.beninGreen,
                        textDecoration: "none",
                        fontSize: "13px",
                        fontWeight: 500,
                        padding: "6px 12px",
                        background: `${colors.beninGreen}10`,
                        borderRadius: "20px",
                      }}
                    >
                      <ExternalLink size={12} />
                      Voir le lien officiel
                      <ChevronRight size={12} />
                    </a>
                  )}

                  {msg.audio && (
                    <button
                      onClick={() => playAudio(msg.audio!)}
                      disabled={isMuted}
                      style={{
                        marginTop: "12px",
                        background: `${colors.beninGreen}10`,
                        border: "none",
                        color: colors.beninGreen,
                        padding: "6px 12px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: 500,
                        cursor: isMuted ? "not-allowed" : "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Volume2 size={14} />
                      Écouter la réponse
                    </button>
                  )}

                  <div style={{
                    fontSize: "10px",
                    opacity: 0.5,
                    marginTop: "8px",
                    textAlign: msg.type === "user" ? "right" : "left",
                    color: colors.gray500,
                  }}>
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
              </div>
            ))
          )}

          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div style={{
                background: colors.white,
                padding: "14px 18px",
                borderRadius: "20px",
                border: `1px solid ${colors.gray200}`,
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}>
                <Loader2 size={18} color={colors.beninGreen} style={{ animation: "spin 1s linear infinite" }} />
                <span style={{ fontSize: "13px", color: colors.gray500 }}>L'assistant réfléchit...</span>
              </div>
            </div>
          )}

          {isPlaying && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div style={{
                background: colors.white,
                padding: "10px 16px",
                borderRadius: "20px",
                border: `1px solid ${colors.gray200}`,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}>
                <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
                  <div style={{ width: "3px", height: "12px", background: colors.beninGreen, animation: "pulse 0.5s ease infinite" }} />
                  <div style={{ width: "3px", height: "20px", background: colors.beninGreen, animation: "pulse 0.5s ease infinite 0.1s" }} />
                  <div style={{ width: "3px", height: "16px", background: colors.beninGreen, animation: "pulse 0.5s ease infinite 0.2s" }} />
                  <div style={{ width: "3px", height: "24px", background: colors.beninGreen, animation: "pulse 0.5s ease infinite 0.3s" }} />
                </div>
                <span style={{ fontSize: "12px", color: colors.gray500 }}>Lecture audio en cours...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* INPUT */}
        <div style={{
          padding: "16px 20px",
          borderTop: `1px solid ${colors.gray200}`,
          background: colors.white,
        }}>
          {image && (
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 12px 6px 8px",
              background: colors.gray100,
              borderRadius: "40px",
              marginBottom: "12px",
            }}>
              <ImageIcon size={16} color={colors.gray500} />
              <span style={{ fontSize: "12px", color: colors.gray600 }}>{image.name}</span>
              <button
                onClick={removeImage}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "2px",
                }}
              >
                <X size={14} color={colors.gray400} />
              </button>
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <label
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "22px",
                background: colors.gray100,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                border: `1px solid ${colors.gray200}`,
              }}
            >
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
                style={{ display: "none" }}
              />
              <ImageIcon size={18} color={colors.gray500} />
            </label>

            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Posez votre question..."
              style={{
                flex: 1,
                padding: "12px 16px",
                borderRadius: "24px",
                border: `1px solid ${colors.gray200}`,
                fontSize: "14px",
                outline: "none",
                fontFamily: "inherit",
                background: colors.gray50,
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = colors.deepBlue}
              onBlur={(e) => e.currentTarget.style.borderColor = colors.gray200}
            />

            {!recording ? (
              <button
                onClick={startRecording}
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "22px",
                  background: colors.beninRed,
                  color: colors.white,
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Mic size={18} />
              </button>
            ) : (
              <button
                onClick={stopRecording}
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "22px",
                  background: colors.beninYellow,
                  color: colors.deepBlue,
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  animation: "pulseBg 1s infinite",
                }}
              >
                <MicOff size={18} />
              </button>
            )}

            <button
              onClick={() => sendMessage()}
              disabled={(!input && !image) || loading}
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "22px",
                background: (!input && !image) || loading ? colors.gray300 : colors.beninGreen,
                color: colors.white,
                border: "none",
                cursor: (!input && !image) || loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {loading ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={18} />}
            </button>
          </div>

          <p style={{
            fontSize: "10px",
            color: colors.gray400,
            margin: "10px 0 0 12px",
          }}>
            Envoyez un texte, une image ou un message vocal • Réponse audio automatique
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scaleY(0.7); }
          50% { opacity: 1; transform: scaleY(1); }
        }
        @keyframes pulseBg {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}

export default function ChatbotPage() {
  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      background: `linear-gradient(135deg, #1a3c6b 0%, #0e2a4a 100%)`,
      padding: "20px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
    }}>
      <Suspense fallback={
        <div style={{
          width: "100%",
          maxWidth: "800px",
          height: "85vh",
          background: "#FFFFFF",
          borderRadius: "32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.15)",
        }}>
          <Loader2 size={32} style={{ animation: "spin 1s linear infinite" }} color="#008751" />
        </div>
      }>
        <ChatbotContent />
      </Suspense>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}