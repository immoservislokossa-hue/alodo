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
  Paperclip,
  Trash2
} from "lucide-react";

// Couleurs du branding Alɔdó
const colors = {
  white: "#FFFFFF",
  deepBlue: "#1a3c6b",
  deepBlueDark: "#0e2a4a",
  beninGreen: "#008751",
  beninYellow: "#FCD116",
  beninRed: "#E8112D",
  gray50: "#FAFAFA",
  gray100: "#F5F5F5",
  gray200: "#E5E5E5",
  gray300: "#D4D4D4",
  gray400: "#A3A3A3",
  gray500: "#737373",
  gray600: "#525252",
  gray700: "#404040",
  gray800: "#262626",
  gradientStart: "#667eea",
  gradientEnd: "#764ba2",
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
  const inputRef = useRef<HTMLInputElement>(null);

  // Récupérer la query param ?q=... et envoyer automatiquement
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
        text: messageText || (audioBase64 ? "Message vocal" : ""),
        image: image ? URL.createObjectURL(image) : null,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
    }

    const waitingMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: "bot",
      text: "Recherche en cours...",
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
            text: "Désolé, une erreur est survenue. Veuillez réessayer dans quelques instants.",
            timestamp: new Date(),
          },
        ];
      });
    } finally {
      setLoading(false);
      setInput("");
      setImage(null);
      inputRef.current?.focus();
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
      padding: "24px",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* Barre tricolore Bénin */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "6px",
        display: "flex",
        zIndex: 50,
      }}>
        <div style={{ flex: 1, background: colors.beninGreen }} />
        <div style={{ flex: 1, background: colors.beninYellow }} />
        <div style={{ flex: 1, background: colors.beninRed }} />
      </div>

      {/* Container principal */}
      <div style={{
        width: "1200px",
        height: "85vh",
        maxHeight: "800px",
        background: colors.white,
        borderRadius: "32px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        border: `1px solid ${colors.gray200}`,
      }}>
        
        {/* HEADER */}
        <div style={{
          padding: "28px 32px",
          background: `linear-gradient(135deg, ${colors.deepBlue} 0%, ${colors.deepBlueDark} 100%)`,
          color: colors.white,
          flexShrink: 0,
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{ position: "relative", zIndex: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <div style={{
                width: "48px",
                height: "48px",
                background: "rgba(255,255,255,0.1)",
                borderRadius: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(10px)",
              }}>
                <FileText size={28} color={colors.beninYellow} />
              </div>
              <div>
                <h1 style={{ 
                  margin: 0, 
                  fontSize: "28px", 
                  fontWeight: 700,
                  letterSpacing: "-0.5px",
                }}>
                  Assistant Admin Bénin
                </h1>
                <p style={{ 
                  margin: "4px 0 0", 
                  fontSize: "14px", 
                  opacity: 0.9 
                }}>
                  Votre guide administratif intelligent
                </p>
              </div>
            </div>
          </div>
          {/* Décoration de fond */}
          <div style={{
            position: "absolute",
            top: "-50%",
            right: "-10%",
            width: "300px",
            height: "300px",
            background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)",
            borderRadius: "50%",
            pointerEvents: "none",
          }} />
        </div>

        {/* MESSAGES */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px 32px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          background: colors.gray50,
        }}>
          {messages.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "60px 40px",
              maxWidth: "500px",
              margin: "0 auto",
            }}>
              <div style={{
                width: "80px",
                height: "80px",
                background: `linear-gradient(135deg, ${colors.deepBlue}15, ${colors.deepBlue}08)`,
                borderRadius: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
              }}>
                <FileText size={40} color={colors.deepBlue} />
              </div>
              <h3 style={{ fontSize: "20px", fontWeight: 600, margin: "0 0 12px", color: colors.gray800 }}>
                Comment puis-je vous aider ?
              </h3>
              <p style={{ fontSize: "15px", margin: 0, color: colors.gray500, lineHeight: 1.6 }}>
                Posez votre question sur les démarches administratives au Bénin.<br />
                Texte • Image • Voix
              </p>
              <div style={{
                display: "flex",
                gap: "12px",
                justifyContent: "center",
                marginTop: "32px",
                flexWrap: "wrap",
              }}>
                {["Carte d'identité", "Passeport", "Acte de naissance", "CNSS"].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion);
                      setTimeout(() => sendMessage(), 100);
                    }}
                    style={{
                      padding: "8px 16px",
                      background: colors.white,
                      border: `1px solid ${colors.gray200}`,
                      borderRadius: "20px",
                      fontSize: "13px",
                      color: colors.gray700,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = colors.deepBlue;
                      e.currentTarget.style.color = colors.deepBlue;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = colors.gray200;
                      e.currentTarget.style.color = colors.gray700;
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  justifyContent: msg.type === "user" ? "flex-end" : "flex-start",
                  animation: "slideIn 0.3s ease-out",
                }}
              >
                <div
                  style={{
                    maxWidth: "70%",
                    background: msg.type === "user" 
                      ? `linear-gradient(135deg, ${colors.deepBlue} 0%, ${colors.deepBlueDark} 100%)`
                      : colors.white,
                    color: msg.type === "user" ? colors.white : colors.gray800,
                    padding: "16px 20px",
                    borderRadius: msg.type === "user" 
                      ? "20px 20px 4px 20px"
                      : "20px 20px 20px 4px",
                    boxShadow: msg.type === "bot" 
                      ? "0 2px 8px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.02)"
                      : "0 4px 12px rgba(0,0,0,0.15)",
                    transition: "transform 0.2s",
                  }}
                >
                  {msg.image && (

                    <div style={{ marginBottom: "12px" }}>
                      <img
                        src={msg.image}
                        alt="Uploaded"
                        style={{
                          maxWidth: "100%",
                          maxHeight: "200px",
                          borderRadius: "12px",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                  )}

                  <div style={{
                    fontSize: "15px",
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}>
                    {msg.text}
                  </div>

                  {msg.steps && (
                    <div style={{
                      marginTop: "14px",
                      padding: "14px",
                      background: msg.type === "user" 
                        ? "rgba(255,255,255,0.1)"
                        : `${colors.beninYellow}10`,
                      borderRadius: "12px",
                      borderLeft: `3px solid ${colors.beninYellow}`,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: msg.type === "user" ? colors.white : colors.gray600 }}>
                          Démarches à suivre
                        </span>
                      </div>
                      <p style={{
                        fontSize: "13px",
                        margin: 0,
                        lineHeight: 1.6,
                        color: msg.type === "user" ? colors.white : colors.gray700,
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
                        gap: "8px",
                        marginTop: "12px",
                        color: msg.type === "user" ? colors.beninYellow : colors.beninGreen,
                        textDecoration: "none",
                        fontSize: "13px",
                        fontWeight: 500,
                        padding: "6px 12px",
                        background: msg.type === "user" 
                          ? "rgba(255,255,255,0.1)"
                          : `${colors.beninGreen}10`,
                        borderRadius: "20px",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateX(4px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateX(0)";
                      }}
                    >
                      <ExternalLink size={14} />
                      Voir le lien officiel
                      <ChevronRight size={14} />
                    </a>
                  )}

                  <div style={{
                    fontSize: "10px",
                    opacity: 0.6,
                    marginTop: "10px",
                    textAlign: msg.type === "user" ? "right" : "left",
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
                padding: "16px 20px",
                borderRadius: "20px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}>
                <Loader2 size={20} color={colors.beninGreen} style={{ animation: "spin 1s linear infinite" }} />
                <span style={{ fontSize: "14px", color: colors.gray600 }}>Chargement...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* INPUT AREA */}
        <div style={{
          padding: "20px 32px",
          borderTop: `1px solid ${colors.gray200}`,
          background: colors.white,
          flexShrink: 0,
        }}>
          {image && (
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              padding: "6px 12px 6px 8px",
              background: colors.gray100,
              borderRadius: "40px",
              marginBottom: "16px",
              animation: "fadeIn 0.2s ease-out",
            }}>
              <img 
                src={URL.createObjectURL(image)} 
                alt="preview" 
                style={{ width: "32px", height: "32px", borderRadius: "8px", objectFit: "cover" }}
              />
              <span style={{ fontSize: "13px", color: colors.gray600 }}>{image.name.length > 30 ? image.name.substring(0, 30) + "..." : image.name}</span>
              <button
                onClick={removeImage}
                style={{
                  background: colors.gray200,
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                  borderRadius: "12px",
                  display: "flex",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colors.gray300;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = colors.gray200;
                }}
              >
                <Trash2 size={12} color={colors.gray600} />
              </button>
            </div>
          )}

          <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
            <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
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
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colors.gray200;
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = colors.gray100;
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files?.[0] || null)}
                  style={{ display: "none" }}
                />
                <Paperclip size={18} color={colors.gray600} />
              </label>

              <button
                onClick={recording ? stopRecording : startRecording}
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "22px",
                  background: recording ? colors.beninRed : colors.gray100,
                  border: `1px solid ${recording ? colors.beninRed : colors.gray200}`,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!recording) {
                    e.currentTarget.style.background = colors.gray200;
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!recording) {
                    e.currentTarget.style.background = colors.gray100;
                    e.currentTarget.style.transform = "translateY(0)";
                  }
                }}
              >
                {recording ? <MicOff size={18} color={colors.white} /> : <Mic size={18} color={colors.gray600} />}
              </button>
            </div>

            <div style={{ flex: 1, minWidth: "200px", position: "relative" }}>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Posez votre question sur les démarches administratives..."
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "24px",
                  border: `1.5px solid ${colors.gray200}`,
                  fontSize: "14px",
                  outline: "none",
                  fontFamily: "inherit",
                  background: colors.gray50,
                  transition: "all 0.2s",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = colors.deepBlue;
                  e.currentTarget.style.background = colors.white;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = colors.gray200;
                  e.currentTarget.style.background = colors.gray50;
                }}
              />
            </div>

            <button
              onClick={() => sendMessage()}
              disabled={(!input && !image) || loading}
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "22px",
                background: (!input && !image) || loading ? colors.gray300 : `linear-gradient(135deg, ${colors.beninGreen} 0%, ${colors.beninGreen}CC 100%)`,
                color: colors.white,
                border: "none",
                cursor: (!input && !image) || loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
                flexShrink: 0,
                minWidth: "44px",
              }}
              onMouseEnter={(e) => {
                if ((input || image) && !loading) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,135,81,0.3)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {loading ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={18} />}
            </button>
          </div>

          <p style={{
            fontSize: "11px",
            color: colors.gray400,
            margin: "12px 0 0 12px",
          }}>
            Assistant intelligent • Réponses basées sur les informations officielles
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        * {
          scrollbar-width: thin;
          scrollbar-color: ${colors.gray300} ${colors.gray100};
        }
        
        *::-webkit-scrollbar {
          width: 6px;
        }
        
        *::-webkit-scrollbar-track {
          background: ${colors.gray100};
          border-radius: 3px;
        }
        
        *::-webkit-scrollbar-thumb {
          background: ${colors.gray300};
          border-radius: 3px;
        }
        
        *::-webkit-scrollbar-thumb:hover {
          background: ${colors.gray400};
        }
      `}</style>
    </div>
  );
}

export default function ChatbotPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <Loader2 size={48} style={{ animation: "spin 1s linear infinite" }} color="#FFFFFF" />
      </div>
    }>
      <ChatbotContent />
    </Suspense>
  );
}