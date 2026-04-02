"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Mic, 
  MicOff, 
  Send, 
  Image as ImageIcon, 
  X, 
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
  image?: string | null;
  timestamp: Date;
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
  const [hasSentQuery, setHasSentQuery] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ✅ Récupérer la query param ?q=... et envoyer automatiquement
  useEffect(() => {
    const query = searchParams.get("q");
    if (query && query.trim() && !hasSentQuery) {
      setInput(query);
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
      const extracted = extractTextFromResponse(rawData);

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
            timestamp: new Date(),
          },
        ];
      });
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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: colors.white,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "12px",
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
        maxWidth: "100%",
        height: "calc(100vh - 24px)",
        background: colors.white,
        borderRadius: "24px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        border: `1px solid ${colors.gray200}`,
      }}>
        {/* HEADER */}
        <div style={{
          padding: "16px 20px",
          background: `linear-gradient(135deg, ${colors.deepBlue} 0%, ${colors.deepBlueDark} 100%)`,
          color: colors.white,
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{ 
              margin: 0, 
              fontSize: "18px", 
              fontWeight: 700,
              fontFamily: "'Playfair Display', serif"
            }}>
              Assistant Admin Bénin
            </h2>
            <p style={{ 
              margin: "4px 0 0", 
              fontSize: "11px", 
              opacity: 0.8 
            }}>
              Texte, image ou vocal
            </p>
          </div>
        </div>

        {/* MESSAGES */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          background: colors.gray50,
        }}>
          {messages.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "40px 20px",
              color: colors.gray400,
            }}>
              <div style={{
                width: "56px",
                height: "56px",
                background: `${colors.deepBlue}10`,
                borderRadius: "28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}>
                <Headphones size= {28} color={colors.deepBlue} />
              </div>
              <p style={{ fontSize: "14px", margin: 0 }}>
                Posez votre question par texte, image ou vocal
              </p>
              <p style={{ fontSize: "12px", marginTop: "8px", color: colors.gray500 }}>
                Je vous répondrai avec des informations précises
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
                    maxWidth: "85%",
                    background: msg.type === "user" ? colors.deepBlue : colors.white,
                    color: msg.type === "user" ? colors.white : colors.gray800,
                    padding: "12px 16px",
                    borderRadius: "18px",
                    borderBottomRightRadius: msg.type === "user" ? "4px" : "18px",
                    borderBottomLeftRadius: msg.type === "user" ? "18px" : "4px",
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
                          maxWidth: "100%",
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
                    wordBreak: "break-word",
                  }}>
                    {msg.text}
                  </div>

                  {msg.steps && (
                    <div style={{
                      marginTop: "10px",
                      padding: "10px",
                      background: `${colors.beninYellow}15`,
                      borderRadius: "10px",
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
                        marginTop: "10px",
                        color: colors.beninGreen,
                        textDecoration: "none",
                        fontSize: "12px",
                        fontWeight: 500,
                        padding: "5px 10px",
                        background: `${colors.beninGreen}10`,
                        borderRadius: "16px",
                      }}
                    >
                      <ExternalLink size={12} />
                      Voir le lien officiel
                      <ChevronRight size={12} />
                    </a>
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
                padding: "12px 16px",
                borderRadius: "18px",
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

          <div ref={messagesEndRef} />
        </div>

        {/* INPUT */}
        <div style={{
          padding: "12px 16px",
          borderTop: `1px solid ${colors.gray200}`,
          background: colors.white,
          flexShrink: 0,
        }}>
          {image && (
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "4px 10px 4px 8px",
              background: colors.gray100,
              borderRadius: "32px",
              marginBottom: "10px",
            }}>
              <ImageIcon size={14} color={colors.gray500} />
              <span style={{ fontSize: "11px", color: colors.gray600 }}>{image.name}</span>
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
                <X size={12} color={colors.gray400} />
              </button>
            </div>
          )}

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <label
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "20px",
                background: colors.gray100,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                border: `1px solid ${colors.gray200}`,
                flexShrink: 0,
              }}
            >
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
                style={{ display: "none" }}
              />
              <ImageIcon size={16} color={colors.gray500} />
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
                padding: "10px 14px",
                borderRadius: "20px",
                border: `1px solid ${colors.gray200}`,
                fontSize: "14px",
                outline: "none",
                fontFamily: "inherit",
                background: colors.gray50,
                minWidth: 0,
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = colors.deepBlue}
              onBlur={(e) => e.currentTarget.style.borderColor = colors.gray200}
            />

            <button
              onClick={() => sendMessage()}
              disabled={(!input && !image) || loading}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "20px",
                background: (!input && !image) || loading ? colors.gray300 : colors.beninGreen,
                color: colors.white,
                border: "none",
                cursor: (!input && !image) || loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={16} />}
            </button>
          </div>

          <p style={{
            fontSize: "9px",
            color: colors.gray400,
            margin: "8px 0 0 12px",
          }}>
            Envoyez un texte ou une image • Réponse rapide
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
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
      background: colors.white,
      padding: "0",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
    }}>
      <Suspense fallback={
        <div style={{
          width: "100%",
          maxWidth: "100%",
          height: "100vh",
          background: colors.white,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
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