"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import supabase from "@/src/lib/supabase/browser";
import { ArrowDown, ArrowUp, ArrowRight, Wallet } from "lucide-react";

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

export default function WalletPage() {
  const router = useRouter();
  const [solde, setSolde] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

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
