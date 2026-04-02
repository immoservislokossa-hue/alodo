"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Send, Image, X, Volume2, VolumeX, Loader2, ArrowLeft } from "lucide-react";

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

export default function ChatbotPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toBase64 = (file: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const playAudio = (base64: string) => {
    if (isMuted) return;
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    setIsPlaying(true);
    const audio = new Audio(`data:audio/wav;base64,${base64}`);
    audioRef.current = audio;
    
    audio.onended = () => {
      setIsPlaying(false);
      audioRef.current = null;
    };
    
    audio.onerror = () => {
      setIsPlaying(false);
      audioRef.current = null;
    };
    
    audio.play().catch(() => {
      setIsPlaying(false);
    });
  };

  // =========================
  // ENREGISTREMENT VOCAL
  // =========================
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/webm",
      });

      const base64 = await toBase64(audioBlob);

      sendMessage({ audioBase64: base64, mimeType: "audio/webm" });
    };

    mediaRecorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  // =========================
  // ENVOI MESSAGE
  // =========================
  const sendMessage = async ({
    audioBase64 = null,
    mimeType = null,
  }: any = {}) => {
    if (!input && !image && !audioBase64) return;

    setLoading(true);

    let imageBase64 = null;
    if (image) {
      imageBase64 = await toBase64(image);
    }

    setMessages((prev) => [
      ...prev,
      {
        type: "user",
        text: input || (audioBase64 ? "🎤 Message vocal envoyé" : ""),
        image: image ? URL.createObjectURL(image) : null,
      },
      {
        type: "bot",
        text: "Un instant, je vérifie les informations...",
      },
    ]);

    const res = await fetch("/api/gemini/chat", {
      method: "POST",
      body: JSON.stringify({
        message: input,
        imageBase64,
        imageMimeType: image?.type,
        audioBase64,
        audioMimeType: mimeType,
      }),
    });

    const data = await res.json();

    setMessages((prev) => {
      const filtered = prev.filter((_, i) => i !== prev.length - 1);
      return [
        ...filtered,
        {
          type: "bot",
          text: data.text,
          steps: data.steps,
          link: data.link,
          audio: data.audio,
        },
      ];
    });

    if (data.audio) playAudio(data.audio);

    setInput("");
    setImage(null);
    setLoading(false);
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
      {/* Barre tricolore béninoise */}
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
                transition: "all 0.2s",
              }}
              aria-label={isMuted ? "Activer le son" : "Couper le son"}
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
                <Mic size={32} color={colors.deepBlue} />
              </div>
              <p style={{ fontSize: "14px", margin: 0 }}>
                Posez votre question par texte, image ou vocal
              </p>
              <p style={{ fontSize: "12px", marginTop: "8px" }}>
                Je vous répondrai avec un message vocal
              </p>
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: m.type === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "80%",
                    background: m.type === "user" ? colors.deepBlue : colors.white,
                    color: m.type === "user" ? colors.white : colors.gray800,
                    padding: "14px 18px",
                    borderRadius: "20px",
                    borderBottomRightRadius: m.type === "user" ? "4px" : "20px",
                    borderBottomLeftRadius: m.type === "user" ? "20px" : "4px",
                    boxShadow: m.type === "bot" ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                    border: m.type === "bot" ? `1px solid ${colors.gray200}` : "none",
                  }}
                >
                  {m.image && (
                    <div style={{ marginBottom: "8px" }}>
                      <img
                        src={m.image}
                        alt="Uploaded"
                        style={{
                          maxWidth: "200px",
                          maxHeight: "150px",
                          borderRadius: "12px",
                        }}
                      />
                    </div>
                  )}
                  <div style={{ fontSize: "14px", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                    {m.text}
                  </div>

                  {m.steps && (
                    <div style={{
                      marginTop: "10px",
                      padding: "10px",
                      background: colors.gray50,
                      borderRadius: "12px",
                      fontSize: "13px",
                    }}>
                      {m.steps}
                    </div>
                  )}

                  {m.link && (
                    <a
                      href={m.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-block",
                        marginTop: "10px",
                        color: colors.beninGreen,
                        textDecoration: "none",
                        fontSize: "13px",
                        fontWeight: 500,
                      }}
                    >
                      Voir le lien →
                    </a>
                  )}

                  {m.audio && (
                    <button
                      onClick={() => playAudio(m.audio)}
                      disabled={isMuted}
                      style={{
                        marginTop: "10px",
                        background: `${colors.beninGreen}10`,
                        border: "none",
                        color: colors.beninGreen,
                        padding: "6px 12px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: 500,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        transition: "all 0.2s",
                      }}
                    >
                      <Volume2 size={14} />
                      Écouter la réponse
                    </button>
                  )}
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
          {/* Image preview */}
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
              <Image size={16} color={colors.gray500} />
              <span style={{ fontSize: "12px", color: colors.gray600 }}>{image.name}</span>
              <button
                onClick={removeImage}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "2px",
                  display: "flex",
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
                transition: "all 0.2s",
              }}
            >
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
                style={{ display: "none" }}
              />
              <Image size={18} color={colors.gray500} />
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
                transition: "all 0.2s",
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = colors.deepBlue}
              onBlur={(e) => e.currentTarget.style.borderColor = colors.gray200}
            />

            {/* BOUTON VOCAL */}
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
                  transition: "all 0.2s",
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
                transition: "all 0.2s",
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