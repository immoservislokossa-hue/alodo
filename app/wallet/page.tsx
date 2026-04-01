"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import supabase from "@/src/lib/supabase/browser";
import { ArrowDown, ArrowUp, ArrowRight, Wallet, AlertCircle, CheckCircle, Loader, X } from "lucide-react";

const colors = {
  white: "#ffffff",
  ink: "#163f2e",
  blue: "#1a3c6b",
  green: "#008751",
  line: "#d7e4da",
  muted: "#5d7667",
  soft: "#f6faf7",
};

type WalletSession = {
  id: string;
  type: "dépôt" | "transfert" | "retrait";
  montant: number;
  date: string;
  statut: "en_cours" | "terminé" | "échoué";
};

type Credit = {
  id: string;
  amount: number;
  currency: string;
  description: string;
  status: string;
  created_at: string;
  totalRepaid: number;
  remainingBalance: number;
  profiles?: {
    full_name: string;
    archetype: string;
  };
};

export default function WalletPage() {
  const router = useRouter();
  const [solde, setSolde] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletSession[]>([]);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null);
  const [repaymentAmount, setRepaymentAmount] = useState("");
  const [repaymentLoading, setRepaymentLoading] = useState(false);
  const [repaymentError, setRepaymentError] = useState("");
  const [repaymentSuccess, setRepaymentSuccess] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadWalletData() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;

        if (!user) {
          router.replace("/institutions/login");
          return;
        }

        if (!active) return;
        setUserId(user.id);

        // Load credits received by user
        try {
          const creditsResponse = await fetch("/api/credits/user");
          if (creditsResponse.ok) {
            const creditsData = await creditsResponse.json();
            if (creditsData.data && active) {
              setCredits(creditsData.data);
            }
          }
        } catch (err: any) {
          console.error("Error loading credits:", err);
        }

        // TODO: Récupérer le solde et les transactions depuis Supabase
        // const { data: walletData } = await supabase
        //   .from("wallets")
        //   .select("*")
        //   .eq("user_id", user.id)
        //   .single();

        // const { data: txns } = await supabase
        //   .from("wallet_transactions")
        //   .select("*")
        //   .eq("user_id", user.id)
        //   .order("date", { ascending: false });

        // Pour la démo:
        setSolde(50000);
        setTransactions([
          {
            id: "1",
            type: "dépôt",
            montant: 25000,
            date: "2026-03-28",
            statut: "terminé",
          },
          {
            id: "2",
            type: "transfert",
            montant: 5000,
            date: "2026-03-27",
            statut: "terminé",
          },
        ]);
      } catch (err: any) {
        if (active) setError(err?.message ?? "Erreur au chargement du portefeuille.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadWalletData();
    return () => {
      active = false;
    };
  }, [router]);

  const handleRepayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCredit || !repaymentAmount) return;

    setRepaymentError("");
    setRepaymentSuccess(false);
    setRepaymentLoading(true);

    try {
      const amount = parseFloat(repaymentAmount);
      if (isNaN(amount) || amount <= 0 || amount > selectedCredit.remainingBalance) {
        throw new Error("Montant de remboursement invalide");
      }

      const response = await fetch("/api/repayments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creditId: selectedCredit.id,
          amount: Math.floor(amount),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors du remboursement");
      }

      const data = await response.json();
      setRepaymentSuccess(true);
      setRepaymentAmount("");

      // Redirect to Moneroo after a delay
      setTimeout(() => {
        if (data.data?.checkoutUrl) {
          window.location.href = data.data.checkoutUrl;
        }
      }, 2000);
    } catch (err: any) {
      setRepaymentError(err.message || "Une erreur est survenue");
    } finally {
      setRepaymentLoading(false);
    }
  };

  if (loading) return <div style={{ padding: 20 }}>Chargement du portefeuille…</div>;
  if (error) return <div style={{ color: "red", padding: 20 }}>{error}</div>;

  return (
    <div style={{ minHeight: "100vh", background: colors.soft, padding: "24px 18px 64px", color: colors.ink }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gap: 20 }}>
        {/* Solde Principal */}
        <section
          style={{
            background: `linear-gradient(135deg, ${colors.blue} 0%, ${colors.green} 100%)`,
            color: colors.white,
            borderRadius: 20,
            padding: "32px 24px",
            display: "grid",
            gap: 16,
            boxShadow: "0 10px 32px rgba(10, 26, 45, 0.15)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Wallet size={24} />
            <h1 style={{ margin: 0, fontSize: 28 }}>Mon Portefeuille</h1>
          </div>

          <div>
            <div style={{ fontSize: 14, opacity: 0.9 }}>Solde disponible</div>
            <div style={{ fontSize: 42, fontWeight: 700, marginTop: 8 }}>
              {solde.toLocaleString("fr-FR")} FCFA
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
            <Link href="/wallet/deposit" style={primaryButtonStyle}>
              <ArrowDown size={18} />
              Dépôt
            </Link>
            <Link href="/wallet/transfer" style={secondaryButtonStyle}>
              <ArrowRight size={18} />
              Transfert
            </Link>
          </div>
        </section>

        {/* Crédits Reçus */}
        {credits.length > 0 && (
          <section style={{ background: colors.white, borderRadius: 16, padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <h2 style={{ margin: "0 0 16px 0", fontSize: 20, fontWeight: 600 }}>Crédits reçus</h2>

            <div style={{ display: "grid", gap: 12 }}>
              {credits.map((credit) => (
                <div
                  key={credit.id}
                  style={{
                    padding: "16px",
                    border: `1px solid ${colors.line}`,
                    borderRadius: 8,
                    display: "grid",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 16 }}>
                        {credit.amount.toLocaleString("fr-FR")} {credit.currency}
                      </div>
                      <div style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>
                        {credit.profiles?.full_name || "Institution"}
                      </div>
                      <div style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                        {credit.description}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "6px 12px",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        background:
                          credit.status === "received"
                            ? "#dffcf0"
                            : credit.status === "repaid"
                              ? "#e8f5e9"
                              : "#fff3cd",
                        color:
                          credit.status === "received"
                            ? colors.green
                            : credit.status === "repaid"
                              ? colors.green
                              : "#856404",
                      }}
                    >
                      {credit.status === "received"
                        ? "Reçu"
                        : credit.status === "repaid"
                          ? "Remboursé"
                          : "En cours"}
                    </div>
                  </div>

                  {credit.remainingBalance > 0 && (
                    <div style={{ padding: "12px", background: colors.soft, borderRadius: 6 }}>
                      <div style={{ fontSize: 12, color: colors.muted }}>À rembourser</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: colors.green, marginTop: 4 }}>
                        {credit.remainingBalance.toLocaleString("fr-FR")} {credit.currency}
                      </div>
                    </div>
                  )}

                  {credit.remainingBalance > 0 && (
                    <button
                      onClick={() => {
                        setSelectedCredit(credit);
                        setRepaymentAmount("");
                      }}
                      style={{
                        padding: "10px 16px",
                        background: colors.green,
                        color: colors.white,
                        border: "none",
                        borderRadius: 6,
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Rembourser
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Historique des Transactions */}
        <section style={{ background: colors.white, borderRadius: 16, padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <h2 style={{ margin: "0 0 16px 0", fontSize: 20, fontWeight: 600 }}>Historique</h2>

          {transactions.length === 0 ? (
            <div style={{ color: colors.muted, textAlign: "center", padding: "32px 0" }}>
              Aucune transaction pour le moment.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 0",
                    borderBottom: `1px solid ${colors.line}`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ fontSize: 20 }}>
                      {tx.type === "dépôt" ? "▼" : tx.type === "transfert" ? "→" : "▲"}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500 }}>{tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</div>
                      <div style={{ fontSize: 12, color: colors.muted }}>{tx.date}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 600 }}>{tx.montant.toLocaleString("fr-FR")} FCFA</div>
                    <div style={{ fontSize: 12, color: tx.statut === "terminé" ? colors.green : colors.muted }}>
                      {tx.statut.charAt(0).toUpperCase() + tx.statut.slice(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Repayment Modal */}
      {selectedCredit && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "flex-end",
            zIndex: 50,
          }}
          onClick={() => setSelectedCredit(null)}
        >
          <div
            style={{
              background: colors.white,
              width: "100%",
              maxWidth: 500,
              borderRadius: "20px 20px 0 0",
              padding: "24px",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Rembourser</h3>
              <button
                onClick={() => setSelectedCredit(null)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 24 }}
              >
                <X size={24} />
              </button>
            </div>

            {repaymentSuccess && (
              <div style={{ marginBottom: 16, padding: 12, background: "#dffcf0", borderRadius: 8, display: "flex", gap: 8 }}>
                <CheckCircle size={20} color={colors.green} />
                <div style={{ fontSize: 14, color: colors.green }}>
                  Remboursement initié. Redirection en cours...
                </div>
              </div>
            )}

            {repaymentError && (
              <div style={{ marginBottom: 16, padding: 12, background: "#f8d7da", borderRadius: 8, display: "flex", gap: 8 }}>
                <AlertCircle size={20} color="#721c24" />
                <div style={{ fontSize: 14, color: "#721c24" }}>{repaymentError}</div>
              </div>
            )}

            <form onSubmit={handleRepayment} style={{ display: "grid", gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>Montant à rembourser</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: colors.green }}>
                  {selectedCredit.amount.toLocaleString("fr-FR")} {selectedCredit.currency}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>Solde restant</div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>
                  {selectedCredit.remainingBalance.toLocaleString("fr-FR")} {selectedCredit.currency}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 14, fontWeight: 500, marginBottom: 8, display: "block" }}>
                  Montant du remboursement *
                </label>
                <input
                  type="number"
                  value={repaymentAmount}
                  onChange={(e) => setRepaymentAmount(e.target.value)}
                  placeholder="Entrez le montant"
                  max={selectedCredit.remainingBalance}
                  step="100"
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: `1px solid ${colors.line}`,
                    borderRadius: 8,
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={repaymentLoading || repaymentSuccess}
                style={{
                  padding: "12px",
                  background: colors.green,
                  color: colors.white,
                  border: "none",
                  borderRadius: 8,
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  opacity: repaymentLoading || repaymentSuccess ? 0.6 : 1,
                }}
              >
                {repaymentLoading && <Loader size={20} className="animate-spin" />}
                {repaymentLoading ? "Traitement..." : "Confirmer le remboursement"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const primaryButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 20px",
  background: colors.white,
  color: colors.blue,
  border: "none",
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  textDecoration: "none",
  transition: "all 0.2s",
} as React.CSSProperties;

const secondaryButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 20px",
  background: "rgba(255, 255, 255, 0.2)",
  color: colors.white,
  border: `1px solid rgba(255, 255, 255, 0.3)`,
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  textDecoration: "none",
  transition: "all 0.2s",
} as React.CSSProperties;
