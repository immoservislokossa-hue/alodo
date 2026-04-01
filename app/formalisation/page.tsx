"use client";

import { useState, useRef, useEffect } from "react";

type Message = {
  id: string;
  type: "user" | "bot";
  text: string;
  images?: string[];
  timestamp: Date;
};

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "bot",
      text: "Bonjour! Je suis votre assistant. Vous pouvez écrire vos messages et partager des images. Comment puis-je vous aider?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageSelect = (files: FileList | null) => {
    if (!files) return;
    setSelectedImages(Array.from(files));
  };

  const handleSendMessage = async () => {
    if (!input.trim() && selectedImages.length === 0) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      text: input,
      images: selectedImages.map((file) => URL.createObjectURL(file)),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSelectedImages([]);
    setLoading(true);

    // Simulated bot response
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        text: `Vous avez écrit: "${userMessage.text}"${selectedImages.length > 0 ? ` et partagé ${selectedImages.length} image(s).` : ""}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setLoading(false);
    }, 500);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
        padding: "20px",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          height: "90vh",
          backgroundColor: "#fff",
          borderRadius: "12px",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid #e0e0e0",
            backgroundColor: "#1d9e75",
            color: "#fff",
          }}
        >
          <h1 style={{ margin: 0, fontSize: "20px", fontWeight: 600 }}>
            Assistant Conversationnel
          </h1>
          <p style={{ margin: "5px 0 0", fontSize: "14px", opacity: 0.9 }}>
            Conversation textuelle avec support d'images
          </p>
        </div>

        {/* Messages Area */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {messages.map((message) => (
            <div
              key={message.id}
              style={{
                display: "flex",
                justifyContent: message.type === "user" ? "flex-end" : "flex-start",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  maxWidth: "70%",
                  backgroundColor: message.type === "user" ? "#1d9e75" : "#e8e8e8",
                  color: message.type === "user" ? "#fff" : "#333",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  wordWrap: "break-word",
                  whiteSpace: "pre-wrap",
                }}
              >
                <p style={{ margin: 0, marginBottom: message.images?.length ? "8px" : 0 }}>
                  {message.text}
                </p>
                {message.images && message.images.length > 0 && (
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
                    {message.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`shared-${idx}`}
                        style={{
                          maxWidth: "150px",
                          maxHeight: "150px",
                          borderRadius: "8px",
                          marginTop: "8px",
                        }}
                      />
                    ))}
                  </div>
                )}
                <div
                  style={{
                    fontSize: "12px",
                    opacity: 0.7,
                    marginTop: "6px",
                  }}
                >
                  {message.timestamp.toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div
                style={{
                  backgroundColor: "#e8e8e8",
                  color: "#333",
                  padding: "12px 16px",
                  borderRadius: "12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "4px",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "8px",
                      animation: "blink 1.4s infinite",
                    }}
                  >
                    ●
                  </span>
                  <span
                    style={{
                      fontSize: "8px",
                      animation: "blink 1.4s infinite",
                      animationDelay: "0.2s",
                    }}
                  >
                    ●
                  </span>
                  <span
                    style={{
                      fontSize: "8px",
                      animation: "blink 1.4s infinite",
                      animationDelay: "0.4s",
                    }}
                  >
                    ●
                  </span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div
          style={{
            borderTop: "1px solid #e0e0e0",
            padding: "16px",
            backgroundColor: "#fafafa",
          }}
        >
          {selectedImages.length > 0 && (
            <div
              style={{
                marginBottom: "12px",
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              {selectedImages.map((file, idx) => (
                <div
                  key={idx}
                  style={{
                    position: "relative",
                    width: "60px",
                    height: "60px",
                    borderRadius: "8px",
                    overflow: "hidden",
                    backgroundColor: "#e8e8e8",
                  }}
                >
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`preview-${idx}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  <button
                    onClick={() =>
                      setSelectedImages(selectedImages.filter((_, i) => i !== idx))
                    }
                    style={{
                      position: "absolute",
                      top: "-8px",
                      right: "-8px",
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      backgroundColor: "#ff4444",
                      color: "#fff",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "bold",
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "flex-end",
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleImageSelect(e.target.files)}
              multiple
              accept="image/*"
              style={{ display: "none" }}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: "10px 14px",
                backgroundColor: "#f0f0f0",
                border: "1px solid #d0d0d0",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Ajouter des images"
            >
              📷
            </button>

            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Écrivez votre message..."
              style={{
                flex: 1,
                padding: "10px 14px",
                border: "1px solid #d0d0d0",
                borderRadius: "8px",
                fontSize: "14px",
                fontFamily: "inherit",
                resize: "none",
                maxHeight: "100px",
              }}
            />

            <button
              onClick={handleSendMessage}
              disabled={(!input.trim() && selectedImages.length === 0) || loading}
              style={{
                padding: "10px 20px",
                backgroundColor: (!input.trim() && selectedImages.length === 0) || loading ? "#ccc" : "#1d9e75",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: (!input.trim() && selectedImages.length === 0) || loading ? "not-allowed" : "pointer",
                fontWeight: 600,
                fontSize: "14px",
              }}
            >
              Envoyer
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blink {
          0%, 60%, 100% { opacity: 0.5; }
          30% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
