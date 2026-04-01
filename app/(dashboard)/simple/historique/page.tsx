"use client";

import { useState, useEffect } from "react";
import supabase from "@/src/lib/supabase/browser";
import {
  TrendingUp,
  TrendingDown,
  Download,
  ArrowRight,
  Calendar
} from "lucide-react";

const colors = {
  white: "#FFFFFF",
  deepBlue: "#1a3c6b",
  beninGreen: "#008751",
  beninYellow: "#FCD116",
  beninRed: "#E8112D",
  beninBlue: "#3498db",
  grayBg: "#F8FAFC",
  grayBorder: "#E2E8F0",
  grayLight: "#F1F5F9",
  gray50: "#F9FAFB",
  gray200: "#E5E7EB",
  gray500: "#6B7280",
  grayText: "#64748B",
  grayTitle: "#1E293B",
};

type Transaction = {
  id: string;
  type: "vente" | "achat" | "depense" | "dette" | "paiement";
  montant: number;
  created_at: string;
  profile_id: string;
  metadata?: any;
};

type Stats = {
  totalVentes: number;
  totalAchats: number;
  totalDepenses: number;
  balance: number;
  transactionCount: number;
};

export default function HistoriquePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalVentes: 0,
    totalAchats: 0,
    totalDepenses: 0,
    balance: 0,
    transactionCount: 0,
  });

  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 12;
  
  // Récupérer les transactions de l'utilisateur connecté UNIQUEMENT
  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté");

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) throw new Error("Profil non trouvé");

      // Récupérer les transactions
      let query = supabase
        .from("boitier_transactions")
        .select("*")
        .eq("profile_id", profile.id)
        .order("created_at", { ascending: false });

      if (dateRange.start) query = query.gte("created_at", dateRange.start);
      if (dateRange.end) query = query.lte("created_at", `${dateRange.end}T23:59:59`);

      const { data: transactionsData } = await query;

      setTransactions(transactionsData || []);
      calculateStats(transactionsData || []);
    } catch (err) {
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const calculateStats = (data: Transaction[]) => {
    const ventes = data.filter(t => t.type === "vente").reduce((sum, t) => sum + t.montant, 0);
    const achats = data.filter(t => t.type === "achat").reduce((sum, t) => sum + t.montant, 0);
    const depenses = data.filter(t => t.type === "depense").reduce((sum, t) => sum + t.montant, 0);
    const totalDepenses = achats + depenses;
    const balance = ventes - totalDepenses;

    setStats({
      totalVentes: ventes,
      totalAchats: achats,
      totalDepenses: totalDepenses,
      balance: balance,
      transactionCount: data.length,
    });
  };

  const getPaginatedTransactions = () => {
    const start = currentPage * itemsPerPage;
    return transactions.slice(start, start + itemsPerPage);
  };

  const exportData = async (format: "pdf" | "csv") => {
    if (format === "csv") {
      const headers = ["Date", "Type", "Montant"];
      const rows = transactions.map(t => [
        new Date(t.created_at).toLocaleDateString("fr-FR"),
        t.type,
        t.montant,
      ]);
      const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `historique_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      try {
        const html2pdf = (await import("html2pdf.js")).default;
        const getCurrentDate = () => {
          const d = new Date();
          return d.toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
        };

        const element = document.createElement("div");
        element.innerHTML = `
          <div style="font-family: 'Courier New', monospace; font-size: 11px; line-height: 1.4; color: #000;">
            <!-- En-tête -->
            <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 15px;">
              <h1 style="margin: 0; font-size: 16px; font-weight: bold;">RAPPORT D'HISTORIQUE COMPLET</h1>
              <p style="margin: 5px 0; font-size: 10px;">Exercice comptable - ${getCurrentDate()}</p>
            </div>

            <!-- Tableau des transactions -->
            <div style="margin-bottom: 20px;">
              <h2 style="font-size: 12px; font-weight: bold; margin: 10px 0 8px 0; border-bottom: 1px solid #000; padding-bottom: 5px;">HISTORIQUE DES TRANSACTIONS</h2>
              <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
                <thead>
                  <tr style="border-bottom: 2px solid #000;">
                    <th style="padding: 6px 4px; text-align: left; border-right: 1px solid #999;">DATE</th>
                    <th style="padding: 6px 4px; text-align: left; border-right: 1px solid #999;">TYPE</th>
                    <th style="padding: 6px 4px; text-align: right; border-right: 1px solid #999;">DÉBIT</th>
                    <th style="padding: 6px 4px; text-align: right;">CRÉDIT</th>
                  </tr>
                </thead>
                <tbody>
                  ${transactions.map(t => `
                    <tr style="border-bottom: 1px solid #ddd;">
                      <td style="padding: 4px 4px; border-right: 1px solid #ddd;">${new Date(t.created_at).toLocaleDateString("fr-FR")}</td>
                      <td style="padding: 4px 4px; border-right: 1px solid #ddd; text-transform: uppercase;">${t.type}</td>
                      <td style="padding: 4px 4px; text-align: right; border-right: 1px solid #ddd; font-weight: ${t.type === "vente" || t.type === "paiement" ? "bold" : "normal"};">${t.type === "vente" || t.type === "paiement" ? t.montant.toLocaleString("fr-FR") : "-"}</td>
                      <td style="padding: 4px 4px; text-align: right; font-weight: ${t.type !== "vente" && t.type !== "paiement" ? "bold" : "normal"};">${t.type !== "vente" && t.type !== "paiement" ? t.montant.toLocaleString("fr-FR") : "-"}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>

            <!-- Bilan comptable -->
            <div style="margin-bottom: 20px; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 12px 0;">
              <h2 style="font-size: 12px; font-weight: bold; margin: 0 0 8px 0;">BILAN COMPTABLE</h2>
              <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
                <tr>
                  <td style="padding: 5px 4px; width: 70%;">TOTAL VENTES (CRÉDIT)</td>
                  <td style="padding: 5px 4px; text-align: right; border-right: 1px solid #000; font-weight: bold; width: 15%;">${stats.totalVentes.toLocaleString("fr-FR")}</td>
                  <td style="padding: 5px 4px; width: 15%;"></td>
                </tr>
                <tr style="border-top: 1px solid #ddd;">
                  <td style="padding: 5px 4px;">TOTAL DÉPENSES (DÉBIT)</td>
                  <td style="padding: 5px 4px; text-align: right; border-right: 1px solid #000;"></td>
                  <td style="padding: 5px 4px; text-align: right; font-weight: bold;">${stats.totalDepenses.toLocaleString("fr-FR")}</td>
                </tr>
                <tr style="border-top: 2px solid #000; border-bottom: 2px solid #000;">
                  <td style="padding: 8px 4px; font-weight: bold;">SOLDE NET</td>
                  <td style="padding: 8px 4px; text-align: right; border-right: 1px solid #000; font-weight: bold;">${stats.balance >= 0 ? stats.balance.toLocaleString("fr-FR") : "-"}</td>
                  <td style="padding: 8px 4px; text-align: right; font-weight: bold;">${stats.balance < 0 ? Math.abs(stats.balance).toLocaleString("fr-FR") : "-"}</td>
                </tr>
              </table>
            </div>

            <!-- Pied de page -->
            <div style="text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #000; font-size: 9px; color: #666;">
              <p style="margin: 3px 0;">Document généré automatiquement - ${getCurrentDate()}</p>
              <p style="margin: 3px 0;">Confidentiel - Usage interne uniquement</p>
            </div>
          </div>
        `;
        await html2pdf().set({ margin: 5, filename: `historique_complet_${new Date().toISOString().split("T")[0]}.pdf` }).from(element).save();
      } catch (err) {
        console.error("Erreur PDF:", err);
        alert("Erreur lors de l'export PDF");
      }
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: colors.gray50, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "40px", height: "40px", border: `3px solid ${colors.gray200}`, borderTopColor: colors.deepBlue, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: colors.gray500 }}>Chargement de vos transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, ${colors.grayBg} 0%, white 100%)` }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "48px 24px 24px 24px" }}>
        {/* Header */}
        <div style={{ marginBottom: "48px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "24px" }}>
            <div>
              <h1 style={{ fontSize: "clamp(24px, 5vw, 42px)", fontWeight: 700, color: colors.grayTitle, margin: "0 0 12px 0" }}>
                Historique Complet
              </h1>
              <p style={{ fontSize: "clamp(14px, 2vw, 16px)", color: colors.grayText, margin: "0" }}>
                {transactions.length} transaction{transactions.length > 1 ? "s" : ""} chargée{transactions.length > 1 ? "s" : ""}
              </p>
            </div>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "flex-end" }}>
              <button
                onClick={() => exportData("csv")}
                disabled={transactions.length === 0}
                style={{
                  padding: "12px 20px",
                  background: colors.white,
                  border: `1px solid ${colors.grayBorder}`,
                  borderRadius: "12px",
                  color: colors.grayText,
                  cursor: transactions.length === 0 ? "not-allowed" : "pointer",
                  opacity: transactions.length === 0 ? 0.5 : 1,
                  fontWeight: 500,
                  transition: "all 0.3s ease",
                }}
                onMouseOver={(e) => {
                  if (transactions.length > 0) {
                    (e.currentTarget as HTMLButtonElement).style.background = colors.grayLight;
                    (e.currentTarget as HTMLButtonElement).style.borderColor = colors.grayText;
                  }
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = colors.white;
                  (e.currentTarget as HTMLButtonElement).style.borderColor = colors.grayBorder;
                }}
              >
                CSV
              </button>
              <button
                onClick={() => exportData("pdf")}
                disabled={transactions.length === 0}
                style={{
                  padding: "12px 20px",
                  background: colors.beninGreen,
                  border: "none",
                  borderRadius: "12px",
                  color: colors.white,
                  cursor: transactions.length === 0 ? "not-allowed" : "pointer",
                  opacity: transactions.length === 0 ? 0.5 : 1,
                  fontWeight: 500,
                  transition: "all 0.3s ease",
                }}
                onMouseOver={(e) => {
                  if (transactions.length > 0) {
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                  }
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                }}
              >
                PDF du Rapport
              </button>
            </div>
          </div>
        </div>

        {/* Cartes Statistiques */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px",
          marginBottom: "40px",
        }}>
          {[
            { label: "Ventes Totales", value: stats.totalVentes, icon: TrendingDown, color: colors.beninGreen },
            { label: "Dépenses Totales", value: stats.totalDepenses, icon: Calendar, color: colors.beninRed },
            { label: "Solde Net", value: stats.balance, icon: ArrowRight, color: stats.balance >= 0 ? colors.beninGreen : colors.beninRed },
          ].map((stat) => (
            <div key={stat.label} style={{
              background: colors.white,
              padding: "28px",
              borderRadius: "16px",
              border: `1px solid ${colors.grayBorder}`,
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              cursor: "pointer",
            }}
            onMouseOver={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.transform = "translateY(-8px)";
              el.style.borderColor = stat.color;
              el.style.boxShadow = `0 12px 24px ${stat.color}15`;
            }}
            onMouseOut={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.transform = "translateY(0)";
              el.style.borderColor = colors.grayBorder;
              el.style.boxShadow = "none";
            }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <div style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "12px",
                  background: `${stat.color}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <stat.icon size={28} color={stat.color} />
                </div>
                <span style={{ fontSize: "14px", color: colors.grayText, fontWeight: 500 }}>{stat.label}</span>
              </div>
              <div style={{ fontSize: "clamp(28px, 4vw, 36px)", fontWeight: 700, color: stat.color }}>
                {stat.value.toLocaleString("fr-FR")}
              </div>
            </div>
          ))}
        </div>

        {/* Section Filtres */}
        <div style={{
          background: colors.white,
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "32px",
          border: `1px solid ${colors.grayBorder}`,
        }}>
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: colors.grayTitle, marginBottom: "16px", margin: "0 0 16px 0" }}>
            Filtrer par Période
          </h3>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "150px" }}>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: `1px solid ${colors.grayBorder}`,
                  borderRadius: "8px",
                  fontSize: "14px",
                  transition: "all 0.2s ease",
                }}
              />
            </div>
            <div style={{ flex: 1, minWidth: "150px" }}>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: `1px solid ${colors.grayBorder}`,
                  borderRadius: "8px",
                  fontSize: "14px",
                  transition: "all 0.2s ease",
                }}
              />
            </div>
            {(dateRange.start || dateRange.end) && (
              <button
                onClick={() => setDateRange({ start: "", end: "" })}
                style={{
                  padding: "10px 16px",
                  background: colors.grayLight,
                  border: `1px solid ${colors.grayBorder}`,
                  borderRadius: "8px",
                  fontSize: "14px",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* Tableau des Transactions */}
        <div style={{
          background: colors.white,
          borderRadius: "16px",
          overflow: "hidden",
          border: `1px solid ${colors.grayBorder}`,
          marginBottom: "32px",
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: colors.grayLight, borderBottom: `2px solid ${colors.grayBorder}` }}>
                  <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, color: colors.grayText, fontSize: "13px" }}>DATE</th>
                  <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, color: colors.grayText, fontSize: "13px" }}>TYPE</th>
                  <th style={{ padding: "16px", textAlign: "right", fontWeight: 600, color: colors.grayText, fontSize: "13px" }}>DÉBIT</th>
                  <th style={{ padding: "16px", textAlign: "right", fontWeight: 600, color: colors.grayText, fontSize: "13px" }}>CRÉDIT</th>
                </tr>
              </thead>
              <tbody>
                {getPaginatedTransactions().length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: "40px", textAlign: "center", color: colors.grayText }}>
                      Aucune transaction trouvée
                    </td>
                  </tr>
                ) : (
                  getPaginatedTransactions().map((t) => (
                    <tr key={t.id} style={{ borderBottom: `1px solid ${colors.grayBorder}` }}>
                      <td style={{ padding: "16px", fontSize: "14px", color: colors.grayText }}>
                        {new Date(t.created_at).toLocaleDateString("fr-FR")}
                      </td>
                      <td style={{ padding: "16px", fontSize: "14px", textTransform: "uppercase", fontWeight: 600, color: colors.grayTitle }}>
                        {t.type}
                      </td>
                      <td style={{
                        padding: "16px",
                        fontSize: "14px",
                        textAlign: "right",
                        fontWeight: 600,
                        color: ["vente", "paiement"].includes(t.type) ? colors.grayText : colors.beninRed,
                      }}>
                        {["vente", "paiement"].includes(t.type) ? "-" : t.montant.toLocaleString("fr-FR")}
                      </td>
                      <td style={{
                        padding: "16px",
                        fontSize: "14px",
                        textAlign: "right",
                        fontWeight: 600,
                        color: ["vente", "paiement"].includes(t.type) ? colors.beninGreen : colors.grayText,
                      }}>
                        {["vente", "paiement"].includes(t.type) ? t.montant.toLocaleString("fr-FR") : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {transactions.length > itemsPerPage && (
            <div style={{
              padding: "16px 24px",
              borderTop: `1px solid ${colors.grayBorder}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
              background: colors.grayLight,
            }}>
              <span style={{ fontSize: "13px", color: colors.grayText }}>
                Page {currentPage + 1} de {Math.ceil(transactions.length / itemsPerPage)}
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  style={{
                    padding: "8px 12px",
                    border: `1px solid ${colors.grayBorder}`,
                    borderRadius: "6px",
                    background: currentPage === 0 ? colors.grayLight : colors.white,
                    cursor: currentPage === 0 ? "not-allowed" : "pointer",
                    opacity: currentPage === 0 ? 0.5 : 1,
                    fontSize: "13px",
                    fontWeight: 500,
                  }}
                >
                  ← Précédent
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(transactions.length / itemsPerPage) - 1, p + 1))}
                  disabled={currentPage >= Math.ceil(transactions.length / itemsPerPage) - 1}
                  style={{
                    padding: "8px 12px",
                    border: `1px solid ${colors.grayBorder}`,
                    borderRadius: "6px",
                    background: currentPage >= Math.ceil(transactions.length / itemsPerPage) - 1 ? colors.grayLight : colors.white,
                    cursor: currentPage >= Math.ceil(transactions.length / itemsPerPage) - 1 ? "not-allowed" : "pointer",
                    opacity: currentPage >= Math.ceil(transactions.length / itemsPerPage) - 1 ? 0.5 : 1,
                    fontSize: "13px",
                    fontWeight: 500,
                  }}
                >
                  Suivant →
                </button>
              </div>
            </div>
          )}
        </div>



        {/* Loading State */}
        {loading && (
          <div style={{
            position: "fixed",
            inset: "0",
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}>
            <div style={{
              background: colors.white,
              padding: "32px",
              borderRadius: "16px",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "16px", color: colors.grayText, marginBottom: "16px" }}>
                Chargement des données...
              </div>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                border: `3px solid ${colors.grayLight}`,
                borderTop: `3px solid ${colors.beninGreen}`,
                animation: "spin 1s linear infinite",
              }} />
            </div>
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}
      </div>
    </div>
  );
}