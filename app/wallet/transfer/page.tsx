"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import supabase from "@/src/lib/supabase/browser";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

const colors = {
  white: "#ffffff",
  ink: "#163f2e",
  blue: "#1a3c6b",
  green: "#008751",
  yellow: "#fcd116",
  red: "#e8112d",
  soft: "#f6faf7",
  line: "#d7e4da",
  muted: "#5d7667",
};

export default function WalletTransferPage() {
  const router = useRouter();
  const [destinataire, setDestinataire] = useState("");
  const [montant, setMontant] = useState("");
  const [motif, setMotif] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [solde, setSolde] = useState(50000);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function checkAuth() {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;

      if (!user && active) {
        router.replace("/institutions/login");
        return;
      }

      if (active) setUserId(user?.id ?? null);
    }

    void checkAuth();
    return () => {
      active = false;
    };
  }, [router]);

  async function handleSubmit() {
    if (!destinataire.trim()) {
      setError("Veuillez entrer un numéro ou email.");
      return;
    }

    if (!montant || isNaN(Number(montant)) || Number(montant) <= 0) {
      setError("Montant invalide.");
      return;
    }

    if (Number(montant) > solde) {
      setError("Solde insuffisant.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // TODO: Intégrer avec API de transfert réelle
      // const { data, error } = await supabase
      //   .from("wallet_transactions")
      //   .insert({
      //     user_id: userId,
      //     type: "transfert",
      //     montant: Number(montant),
      //     destinataire,
      //     motif,
      //     statut: "en_attente",
      //   });

      // Simulation:
      await new Promise((res) => setTimeout(res, 2000));
      setSuccess(true);
      setTimeout(() => router.push("/wallet"), 2000);
    } catch (err: any) {
      setError(err?.message ?? "Erreur lors du transfert.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: colors.soft,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <CheckCircle2 size={64} color={colors.green} />
          <h1 style={{ margin: "16px 0", fontSize: 24 }}>Transfert réussi!</h1>
          <p style={{ color: colors.muted }}>Vous serez redirigé dans quelques secondes…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: colors.soft, padding: "24px 18px" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        {/* Header */}
        <Link
          href="/wallet"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: colors.blue,
            textDecoration: "none",
            marginBottom: 24,
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={20} />
          Retour au portefeuille
        </Link>

        {/* Formulaire */}
        <div style={{ background: colors.white, borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <h1 style={{ margin: "0 0 8px 0", fontSize: 28 }}>Effectuer un transfert</h1>
          <p style={{ color: colors.muted, margin: "0 0 24px 0" }}>Solde disponible: {solde.toLocaleString("fr-FR")} FCFA</p>

          {error && (
            <div style={{ background: "#ffe6e6", color: colors.red, padding: 12, borderRadius: 8, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <div style={{ display: "grid", gap: 16 }}>
            {/* Destinataire */}
            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
                Destinataire (Numéro ou Email)
              </label>
              <input
                type="text"
                placeholder="01XXXXXXXX ou email@example.com"
                value={destinataire}
                onChange={(e) => setDestinataire(e.target.value)}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: `1px solid ${colors.line}`,
                  borderRadius: 8,
                  fontSize: 16,
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Montant */}
            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
                Montant (FCFA)
              </label>
              <input
                type="number"
                placeholder="Entrez le montant"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: `1px solid ${colors.line}`,
                  borderRadius: 8,
                  fontSize: 16,
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Motif */}
            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
                Motif (Optionnel)
              </label>
              <textarea
                placeholder="Raison du transfert"
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: `1px solid ${colors.line}`,
                  borderRadius: 8,
                  fontSize: 16,
                  boxSizing: "border-box",
                  minHeight: 80,
                  fontFamily: "inherit",
                  resize: "vertical",
                }}
              />
            </div>

            {/* Résumé */}
            {montant && !isNaN(Number(montant)) && (
              <div style={{ background: colors.soft, padding: 16, borderRadius: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span>Montant:</span>
                  <strong>{Number(montant).toLocaleString("fr-FR")} FCFA</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span>Frais:</span>
                  <strong>{(Number(montant) * 0.02).toLocaleString("fr-FR")} FCFA</strong>
                </div>
                <div style={{ borderTop: `1px solid ${colors.line}`, paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 600 }}>Total débité:</span>
                  <strong style={{ color: colors.red }}>{(Number(montant) * 1.02).toLocaleString("fr-FR")} FCFA</strong>
                </div>
              </div>
            )}

            {/* Button */}
            <button
              onClick={handleSubmit}
              disabled={loading || !montant || !destinataire}
              style={{
                padding: "14px 24px",
                background: loading ? colors.muted : colors.green,
                color: colors.white,
                border: "none",
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity: loading || !montant || !destinataire ? 0.6 : 1,
              }}
            >
              {loading ? <Loader2 size={20} /> : "Confirmer le transfert"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
