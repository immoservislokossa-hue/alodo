"use client";

import { useState, useEffect } from "react";
import supabase from "@/src/lib/supabase/browser";

const colors = {
  white: "#FFFFFF",
  deepBlue: "#1a3c6b",
  beninGreen: "#008751",
  beninYellow: "#FCD116",
  beninRed: "#E8112D",
  gray100: "#F3F4F6",
  gray300: "#D1D5DB",
  gray400: "#9CA3AF",
  gray600: "#4B5563",
};

// Touches de la calculatrice
const keys = [
  { label: "7", type: "number" },
  { label: "8", type: "number" },
  { label: "9", type: "number" },
  { label: "+", type: "operator", color: colors.beninYellow },
  { label: "4", type: "number" },
  { label: "5", type: "number" },
  { label: "6", type: "number" },
  { label: "-", type: "operator", color: colors.beninYellow },
  { label: "1", type: "number" },
  { label: "2", type: "number" },
  { label: "3", type: "number" },
  { label: "×", type: "operator", color: colors.beninYellow },
  { label: "0", type: "number" },
  { label: "C", type: "clear", color: colors.beninRed },
  { label: "=", type: "equals", color: colors.beninGreen },
  { label: "÷", type: "operator", color: colors.beninYellow },
];

export default function BoitierUI() {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [balance, setBalance] = useState(125000);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  // Récupérer le profil utilisateur
  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("id")
            .eq("user_id", user.id)
            .single();

          if (error && !profile) {
            // No profile found — create a minimal profile so transactions can be saved
            const { data: created, error: createErr } = await supabase
              .from("profiles")
              .insert({ user_id: user.id, role: "user" })
              .select("id")
              .single();

            if (createErr) {
              console.error("Erreur création profil minimal:", createErr);
            } else if (created) {
              setProfileId(created.id);
            }
          } else if (profile) {
            setProfileId(profile.id);
          }
        } catch (err) {
          console.error("Erreur récupération profil:", err);
        }
      }
    };
    getProfile();
  }, [supabase]);

  // Enregistrer une transaction
  const saveTransaction = async (type: string, montant: number): Promise<boolean> => {
    if (!profileId) {
      console.error("Profil non trouvé");
      return false;
    }

    try {
      const { error } = await supabase
        .from("boitier_transactions")
        .insert({
          profile_id: profileId,
          type: type as any,
          montant: Math.abs(montant),
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      return false;
    }
  };

  // Mettre à jour le solde
  const updateBalance = async (type: string, amount: number) => {
    setLoading(true);
    
    let newBalance = balance;
    let success = false;
    
    if (type === "vente") {
      newBalance = balance + amount;
      success = await saveTransaction("vente", amount);
    } else if (type === "achat") {
      if (balance >= amount) {
        newBalance = balance - amount;
        success = await saveTransaction("achat", amount);
      } else {
        setMessage("Solde insuffisant");
        setTimeout(() => setMessage(""), 2000);
        setLoading(false);
        return;
      }
    } else if (type === "dette") {
      success = await saveTransaction("dette", amount);
    } else if (type === "paiement") {
      if (balance >= amount) {
        newBalance = balance - amount;
        success = await saveTransaction("paiement", amount);
      } else {
        setMessage("Solde insuffisant");
        setTimeout(() => setMessage(""), 2000);
        setLoading(false);
        return;
      }
    }
    
    if (success) {
      setBalance(newBalance);
      setMessage(`${type.toUpperCase()} de ${amount.toLocaleString()} FCFA effectuée`);
      setTimeout(() => setMessage(""), 2000);
    } else {
      setMessage("Erreur lors de la transaction");
      setTimeout(() => setMessage(""), 2000);
    }
    
    setLoading(false);
  };

  // Gestion du clavier calculatrice
  const handleNumber = (num: string) => {
    if (waitingForOperand) {
      setDisplay(num);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? num : display + num);
    }
  };

  const handleOperator = (op: string) => {
    const currentValue = parseFloat(display);
    
    if (previousValue === null) {
      setPreviousValue(currentValue);
    } else if (operator) {
      const result = calculate(previousValue, currentValue, operator);
      setDisplay(String(result));
      setPreviousValue(result);
    }
    
    setOperator(op);
    setWaitingForOperand(true);
  };

  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case "+": return a + b;
      case "-": return a - b;
      case "×": return a * b;
      case "÷": return b !== 0 ? a / b : 0;
      default: return b;
    }
  };

  const handleEquals = () => {
    if (previousValue !== null && operator) {
      const currentValue = parseFloat(display);
      const result = calculate(previousValue, currentValue, operator);
      setDisplay(String(result));
      setPreviousValue(null);
      setOperator(null);
      setWaitingForOperand(true);
    }
  };

  const handleClear = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  };

  const handleAction = (type: string) => {
    const amount = Math.floor(parseFloat(display));
    if (isNaN(amount) || amount <= 0) {
      setMessage("Montant invalide");
      setTimeout(() => setMessage(""), 2000);
      return;
    }
    
    updateBalance(type, amount);
    handleClear();
  };

  const handleKeyPress = (key: string) => {
    if (/[0-9]/.test(key)) handleNumber(key);
    if (["+", "-", "×", "÷"].includes(key)) handleOperator(key);
    if (key === "=" || key === "Enter") handleEquals();
    if (key === "C" || key === "c" || key === "Escape") handleClear();
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: colors.gray100,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      <div style={{
        maxWidth: "420px",
        width: "100%",
        background: colors.white,
        borderRadius: "32px",
        padding: "24px",
        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)",
        border: `1px solid ${colors.gray300}`,
      }}>
        
        {/* Barre tricolore */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "24px" }}>
          <div style={{ flex: 1, height: "3px", background: colors.beninGreen, borderRadius: "2px" }} />
          <div style={{ flex: 1, height: "3px", background: colors.beninYellow, borderRadius: "2px" }} />
          <div style={{ flex: 1, height: "3px", background: colors.beninRed, borderRadius: "2px" }} />
        </div>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "20px" }}>
          <span style={{ fontWeight: 600, fontSize: "18px", color: colors.deepBlue }}>Alɔdó</span>
          
        </div>

        {/* Écran */}
        <div style={{
          background: colors.gray100,
          borderRadius: "20px",
          padding: "20px",
          marginBottom: "20px",
          border: `1px solid ${colors.gray300}`,
        }}>
          <div style={{ fontSize: "11px", color: colors.gray400, marginBottom: "8px" }}>
            CALCULATEUR
          </div>
          <div style={{
            fontSize: "36px",
            fontWeight: 500,
            fontFamily: "monospace",
            color: colors.deepBlue,
            wordBreak: "break-all",
            minHeight: "70px",
            textAlign: "right",
          }}>
            {display}
          </div>
          {operator && previousValue !== null && (
            <div style={{ fontSize: "12px", color: colors.gray400, textAlign: "right" }}>
              {previousValue} {operator}
            </div>
          )}
        </div>

        {/* Message */}
        {message && (
          <div style={{
            padding: "10px 12px",
            background: `${colors.beninGreen}10`,
            borderRadius: "12px",
            fontSize: "13px",
            color: colors.beninGreen,
            textAlign: "center",
            marginBottom: "16px",
          }}>
            {message}
          </div>
        )}

        {/* Actions rapides */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginBottom: "20px" }}>
          {["VENTE", "ACHAT", "DETTE", "PAIEMENT"].map((label) => (
            <button
              key={label}
              onClick={() => handleAction(label.toLowerCase())}
              disabled={loading}
              style={{
                padding: "12px",
                background: label === "VENTE" ? colors.beninGreen : 
                           label === "ACHAT" ? colors.deepBlue : colors.gray100,
                border: `1px solid ${label === "DETTE" ? colors.beninYellow : colors.gray300}`,
                borderRadius: "12px",
                fontWeight: 500,
                fontSize: "12px",
                color: label === "VENTE" || label === "ACHAT" ? colors.white : colors.gray600,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Clavier calculatrice */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
          {keys.map((key) => (
            <button
              key={key.label}
              onClick={() => {
                if (key.type === "number") handleNumber(key.label);
                if (key.type === "operator") handleOperator(key.label);
                if (key.type === "equals") handleEquals();
                if (key.type === "clear") handleClear();
              }}
              style={{
                background: key.type === "operator" ? key.color : 
                           key.type === "clear" ? key.color :
                           key.type === "equals" ? key.color : colors.white,
                border: `1px solid ${colors.gray300}`,
                borderRadius: "16px",
                padding: "16px 8px",
                cursor: "pointer",
                fontSize: key.label === "0" ? "20px" : "18px",
                fontWeight: 500,
                color: key.type === "operator" || key.type === "clear" || key.type === "equals" 
                       ? colors.white : colors.deepBlue,
                transition: "all 0.1s",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.96)"}
              onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              {key.label}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: "20px", textAlign: "center", fontSize: "10px", color: colors.gray400 }}>
          Terminal sécurisé • Calculatrice intégrée
        </div>
      </div>
    </div>
  );
}
