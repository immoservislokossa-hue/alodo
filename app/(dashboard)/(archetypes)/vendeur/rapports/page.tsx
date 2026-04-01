"use client";

import { useState, useEffect } from "react";
import supabase from "@/src/lib/supabase/browser";
import {
  TrendingUp,
  TrendingDown,
} from "lucide-react";

const colors = {
  beninGreen: "#008751",
  beninRed: "#E8112D",
  deepBlue: "#1a3c6b",
};

type Transaction = {
  id: string;
  type: "vente" | "achat" | "depense" | "dette" | "paiement";
  montant: number;
  created_at: string;
  produit_id: string | null;
  metadata: any;
};

type Stats = {
  totalVentes: number;
  totalAchats: number;
  totalDepenses: number;
  balance: number;
  transactionCount: number;
};

type Produit = {
  id: string;
  nom: string;
  prix_achat: number | null;
  prix_vente: number | null;
  stock: number;
};

export default function RapportsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalVentes: 0,
    totalAchats: 0,
    totalDepenses: 0,
    balance: 0,
    transactionCount: 0,
  });

  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [selectedProduct, setSelectedProduct] = useState<string | "">("");
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profileError || !profile) throw new Error("Profil non trouvé");

      let query = supabase
        .from("transactions")
        .select("*")
        .eq("profile_id", profile.id)
        .order("created_at", { ascending: false });

      if (dateRange.start) query = query.gte("created_at", dateRange.start);
      if (dateRange.end) query = query.lte("created_at", `${dateRange.end}T23:59:59`);

      const { data: transactionsData, error: transError } = await query;
      if (transError) throw transError;
      
      // Fetch products
      const { data: produitsData, error: prodError } = await supabase
        .from("produits")
        .select("*")
        .eq("profile_id", profile.id)
        .order("created_at", { ascending: false });

      if (prodError) throw prodError;

      setTransactions(transactionsData || []);
      setProduits(produitsData || []);
      calculateStats(transactionsData || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur lors du chargement des données";
      setError(message);
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(0);
    setSelectedProduct("");
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
    const filtered = selectedProduct 
      ? transactions.filter(t => t.produit_id === selectedProduct)
      : transactions;
    return filtered.slice(start, start + itemsPerPage);
  };

  const getFilteredTransactionsCount = () => {
    return selectedProduct
      ? transactions.filter(t => t.produit_id === selectedProduct).length
      : transactions.length;
  };

  const getProductName = (productId: string | null) => {
    if (!productId) return "Aucun produit";
    const product = produits.find(p => p.id === productId);
    return product ? product.nom : "Produit supprimé";
  };

  const getTransactionsForProduct = (productId: string) => {
    return transactions.filter(t => t.produit_id === productId);
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
      a.download = `rapports_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      try {
        const html2pdf = (await import("html2pdf.js")).default;
        const getCurrentDate = () => {
          const d = new Date();
          return d.toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
        };

        // Calculer les marges
        const produitsAvecMarges = produits.filter(p => p.prix_achat && p.prix_vente).map(p => ({
          ...p,
          marge: (p.prix_vente || 0) - (p.prix_achat || 0),
          pourcentageMarge: ((((p.prix_vente || 0) - (p.prix_achat || 0)) / (p.prix_achat || 1)) * 100).toFixed(1)
        }));

        const totalMargeTheorique = produitsAvecMarges.reduce((sum, p) => sum + (p.marge * p.stock), 0);
        
        // Calculer achats et depenses séparément pour le PDF
        const achats = transactions.filter(t => t.type === "achat").reduce((sum, t) => sum + t.montant, 0);
        const depenses = transactions.filter(t => t.type === "depense").reduce((sum, t) => sum + t.montant, 0);

        const element = document.createElement("div");
        element.innerHTML = `
          <div style="font-family: 'Courier New', monospace; font-size: 11px; line-height: 1.4; color: #000;">
            <!-- En-tête -->
            <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 15px;">
              <h1 style="margin: 0; font-size: 16px; font-weight: bold;">RAPPORT FINANCIER DÉTAILLÉ</h1>
              <p style="margin: 5px 0; font-size: 10px;">Exercice comptable - ${getCurrentDate()}</p>
            </div>

            <!-- Tableau des transactions -->
            <div style="margin-bottom: 20px;">
              <h2 style="font-size: 12px; font-weight: bold; margin: 10px 0 8px 0; border-bottom: 1px solid #000; padding-bottom: 5px;">DÉTAIL DES TRANSACTIONS</h2>
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

            <!-- Analyse des marges -->
            <div style="margin-bottom: 20px;">
              <h2 style="font-size: 12px; font-weight: bold; margin: 10px 0 8px 0; border-bottom: 1px solid #000; padding-bottom: 5px;">ANALYSE DES MARGES COMMERCIALES</h2>
              <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
                <thead>
                  <tr style="border-bottom: 2px solid #000;">
                    <th style="padding: 6px 4px; text-align: left; border-right: 1px solid #999;">PRODUIT</th>
                    <th style="padding: 6px 4px; text-align: right; border-right: 1px solid #999;">P.ACHAT</th>
                    <th style="padding: 6px 4px; text-align: right; border-right: 1px solid #999;">P.VENTE</th>
                    <th style="padding: 6px 4px; text-align: right; border-right: 1px solid #999;">MARGE</th>
                    <th style="padding: 6px 4px; text-align: right; border-right: 1px solid #999;">%</th>
                    <th style="padding: 6px 4px; text-align: right;">STOCK</th>
                  </tr>
                </thead>
                <tbody>
                  ${produitsAvecMarges.map(p => `
                    <tr style="border-bottom: 1px solid #ddd;">
                      <td style="padding: 4px 4px; border-right: 1px solid #ddd;">${p.nom}</td>
                      <td style="padding: 4px 4px; text-align: right; border-right: 1px solid #ddd;">${(p.prix_achat || 0).toLocaleString("fr-FR")}</td>
                      <td style="padding: 4px 4px; text-align: right; border-right: 1px solid #ddd;">${(p.prix_vente || 0).toLocaleString("fr-FR")}</td>
                      <td style="padding: 4px 4px; text-align: right; border-right: 1px solid #ddd; font-weight: bold;">${p.marge.toLocaleString("fr-FR")}</td>
                      <td style="padding: 4px 4px; text-align: right; border-right: 1px solid #ddd;">${p.pourcentageMarge}%</td>
                      <td style="padding: 4px 4px; text-align: right;">${p.stock}</td>
                    </tr>
                  `).join("")}
                </tbody>
                <tfoot>
                  <tr style="border-top: 2px solid #000; border-bottom: 1px solid #000; font-weight: bold;">
                    <td colspan="5" style="padding: 6px 4px; border-right: 1px solid #ddd; text-align: right;">Marge théorique totale (stock):</td>
                    <td style="padding: 6px 4px; text-align: right;">${totalMargeTheorique.toLocaleString("fr-FR")}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <!-- Résumé comptable -->
            <div style="margin-bottom: 20px; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 12px 0;">
              <h2 style="font-size: 12px; font-weight: bold; margin: 0 0 8px 0;">BILAN COMPTABLE</h2>
              <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
                <tr>
                  <td style="padding: 5px 4px; width: 70%;">TOTAL VENTES (CRÉDIT)</td>
                  <td style="padding: 5px 4px; text-align: right; border-right: 1px solid #000; font-weight: bold; width: 15%;">${stats.totalVentes.toLocaleString("fr-FR")}</td>
                  <td style="padding: 5px 4px; width: 15%;"></td>
                </tr>
                <tr style="border-top: 1px solid #ddd;">
                  <td style="padding: 5px 4px;">Total Achats (Débit)</td>
                  <td style="padding: 5px 4px; text-align: right; border-right: 1px solid #000;"></td>
                  <td style="padding: 5px 4px; text-align: right; font-weight: bold;">${achats.toLocaleString("fr-FR")}</td>
                </tr>
                <tr style="border-top: 1px solid #ddd;">
                  <td style="padding: 5px 4px;">Total Dépenses (Débit)</td>
                  <td style="padding: 5px 4px; text-align: right; border-right: 1px solid #000;"></td>
                  <td style="padding: 5px 4px; text-align: right; font-weight: bold;">${depenses.toLocaleString("fr-FR")}</td>
                </tr>
                <tr style="border-top: 2px solid #000; border-bottom: 2px solid #000;">
                  <td style="padding: 8px 4px; font-weight: bold;">SOLDE NET</td>
                  <td style="padding: 8px 4px; text-align: right; border-right: 1px solid #000; font-weight: bold;">${stats.balance >= 0 ? stats.balance.toLocaleString("fr-FR") : "-"}</td>
                  <td style="padding: 8px 4px; text-align: right; font-weight: bold;">${stats.balance < 0 ? Math.abs(stats.balance).toLocaleString("fr-FR") : "-"}</td>
                </tr>
              </table>
            </div>

            <!-- Statistiques -->
            <div style="margin-bottom: 15px;">
              <h2 style="font-size: 12px; font-weight: bold; margin: 0 0 8px 0; border-bottom: 1px solid #000; padding-bottom: 5px;">STATISTIQUES</h2>
              <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
                <tr>
                  <td style="padding: 4px 4px; width: 50%;">Nombre de transactions</td>
                  <td style="padding: 4px 4px; text-align: right; font-weight: bold;">${stats.transactionCount}</td>
                </tr>
                <tr style="border-top: 1px solid #ddd;">
                  <td style="padding: 4px 4px;">Nombre de produits</td>
                  <td style="padding: 4px 4px; text-align: right; font-weight: bold;">${produits.length}</td>
                </tr>
                <tr style="border-top: 1px solid #ddd;">
                  <td style="padding: 4px 4px;">Marge théorique maximale</td>
                  <td style="padding: 4px 4px; text-align: right; font-weight: bold;">${totalMargeTheorique.toLocaleString("fr-FR")}</td>
                </tr>
                <tr style="border-top: 1px solid #ddd;">
                  <td style="padding: 4px 4px;">Commission/Frais estimés (3%)</td>
                  <td style="padding: 4px 4px; text-align: right; font-weight: bold;">${(stats.totalVentes * 0.03).toLocaleString("fr-FR")}</td>
                </tr>
                <tr style="border-top: 1px solid #ddd;">
                  <td style="padding: 4px 4px;">Marge nette (solde - frais)</td>
                  <td style="padding: 4px 4px; text-align: right; font-weight: bold;">${(stats.balance - stats.totalVentes * 0.03).toLocaleString("fr-FR")}</td>
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
        await html2pdf().set({ margin: 5, filename: `etat_financier_${new Date().toISOString().split("T")[0]}.pdf` }).from(element).save();
      } catch (err) {
        console.error("Erreur PDF:", err);
        alert("Erreur lors de l'export PDF");
      }
    }
  };

  if (loading) return <div style={{ padding: "20px", paddingTop: "100px", textAlign: "center", color: "#666" }}>
    <div style={{ fontSize: "16px", fontWeight: "500" }}>Chargement des données...</div>
  </div>;

  if (error) return <div style={{ padding: "20px", paddingTop: "100px" }}>
    <div style={{
      backgroundColor: "#ffe5e5",
      border: "1px solid #ff6b6b",
      color: "#d63031",
      padding: "16px",
      borderRadius: "8px",
      fontSize: "14px"
    }}>
      ❌ {error}
    </div>
  </div>;

  return (
    <div style={{ 
      padding: "20px",
      paddingTop: "100px",
      maxWidth: "1400px",
      margin: "0 auto",
    }}>
      <h1 style={{ marginBottom: "30px", color: "#333", fontSize: "28px" }}>Rapports financiers</h1>

      {/* Cartes de statistiques principales */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", 
        gap: "15px", 
        marginBottom: "30px" 
      }}>
        {[
          { label: "Ventes", value: stats.totalVentes, color: colors.beninGreen },
          { label: "Dépenses", value: stats.totalDepenses, color: colors.beninRed },
          { label: "Solde", value: stats.balance, color: colors.deepBlue },
        ].map((stat) => (
          <div key={stat.label} style={{
            backgroundColor: "#fff",
            padding: "20px",
            borderRadius: "8px",
            border: `1px solid #e0e0e0`,
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
            minHeight: "100px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}>
            <div style={{ fontSize: "12px", color: "#666", fontWeight: "500" }}>
              {stat.label}
            </div>
            <div style={{ fontSize: "22px", fontWeight: "bold", color: stat.color }}>
              {stat.value.toLocaleString("fr-FR")}
            </div>
          </div>
        ))}
      </div>

      {/* Tableau des transactions */}
      <div style={{ 
        backgroundColor: "#fff", 
        padding: "20px", 
        borderRadius: "8px", 
        border: "1px solid #e0e0e0",
        marginBottom: "30px"
      }}>
        <h2 style={{ marginBottom: "15px", fontSize: "16px", color: "#333" }}>Historique des Transactions</h2>
        
        {/* Filtre par produit */}
        <div style={{ 
          marginBottom: "15px",
          padding: "12px",
          backgroundColor: "#f9f9f9",
          borderRadius: "4px",
          border: "1px solid #e0e0e0"
        }}>
          <label style={{ display: "block", fontSize: "12px", marginBottom: "8px", fontWeight: "600", color: "#333" }}>
            Filtrer par produit
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "8px" }}>
            <button
              onClick={() => {
                setSelectedProduct("");
                setCurrentPage(0);
              }}
              style={{
                padding: "8px 12px",
                backgroundColor: selectedProduct === "" ? colors.beninGreen : "#f0f0f0",
                color: selectedProduct === "" ? "white" : "#333",
                border: "1px solid #d0d0d0",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "600",
                transition: "all 0.2s"
              }}
            >
              Tous ({transactions.length})
            </button>
            
            {produits.map(product => {
              const productTransactionsCount = getTransactionsForProduct(product.id).length;
              return (
                <button
                  key={product.id}
                  onClick={() => {
                    setSelectedProduct(product.id);
                    setCurrentPage(0);
                  }}
                  style={{
                    padding: "8px 12px",
                    backgroundColor: selectedProduct === product.id ? colors.beninGreen : "#f0f0f0",
                    color: selectedProduct === product.id ? "white" : "#333",
                    border: "1px solid #d0d0d0",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "600",
                    transition: "all 0.2s",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis"
                  }}
                  title={`${product.nom} - ${productTransactionsCount} transactions`}
                >
                  {product.nom} ({productTransactionsCount})
                </button>
              );
            })}
          </div>
        </div>
        
        <div style={{ overflowX: "auto" }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "14px"
          }}>
            <thead>
              <tr style={{ backgroundColor: "#f9f9f9", borderBottom: "2px solid #d0d0d0" }}>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "#666", fontSize: "12px" }}>Date</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "#666", fontSize: "12px" }}>Type</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "#666", fontSize: "12px" }}>Produit</th>
                <th style={{ padding: "12px", textAlign: "right", fontWeight: "600", color: "#666", fontSize: "12px" }}>Montant</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "#666", fontSize: "12px" }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {getPaginatedTransactions().map((transaction) => (
                <tr key={transaction.id} style={{ borderBottom: "1px solid #e0e0e0" }}>
                  <td style={{ padding: "12px", color: "#333", fontSize: "13px" }}>
                    {new Date(transaction.created_at).toLocaleDateString("fr-FR")}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <span style={{
                      padding: "4px 10px",
                      borderRadius: "4px",
                      backgroundColor: transaction.type === "vente" ? "#d4edda" : transaction.type === "achat" ? "#cfe2ff" : "#fff3cd",
                      color: transaction.type === "vente" ? colors.beninGreen : transaction.type === "achat" ? "#0c5de4" : "#997404",
                      fontSize: "12px",
                      fontWeight: "600"
                    }}>
                      {transaction.type}
                    </span>
                  </td>
                  <td style={{ padding: "12px", color: "#333", fontSize: "13px", fontWeight: "500" }}>
                    {getProductName(transaction.produit_id)}
                  </td>
                  <td style={{ padding: "12px", textAlign: "right", fontWeight: "600", color: "#333", fontSize: "13px" }}>
                    {transaction.montant.toLocaleString("fr-FR")} FCFA
                  </td>
                  <td style={{ padding: "12px", color: "#666", fontSize: "13px" }}>
                    {transaction.metadata?.notes || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ 
          marginTop: "20px", 
          display: "flex", 
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          fontSize: "13px"
        }}>
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            style={{
              padding: "8px 14px",
              backgroundColor: currentPage === 0 ? "#e0e0e0" : colors.beninGreen,
              color: currentPage === 0 ? "#999" : "white",
              border: "none",
              borderRadius: "4px",
              cursor: currentPage === 0 ? "default" : "pointer",
              fontWeight: "500"
            }}
          >
            Préc.
          </button>

          <span style={{ color: "#666" }}>
            Page {currentPage + 1} sur {Math.ceil(getFilteredTransactionsCount() / itemsPerPage) || 1}
          </span>

          <button
            onClick={() => setCurrentPage(Math.min(Math.ceil(getFilteredTransactionsCount() / itemsPerPage) - 1, currentPage + 1))}
            disabled={currentPage >= Math.ceil(getFilteredTransactionsCount() / itemsPerPage) - 1}
            style={{
              padding: "8px 14px",
              backgroundColor: currentPage >= Math.ceil(getFilteredTransactionsCount() / itemsPerPage) - 1 ? "#e0e0e0" : colors.beninGreen,
              color: currentPage >= Math.ceil(getFilteredTransactionsCount() / itemsPerPage) - 1 ? "#999" : "white",
              border: "none",
              borderRadius: "4px",
              cursor: currentPage >= Math.ceil(getFilteredTransactionsCount() / itemsPerPage) - 1 ? "default" : "pointer",
              fontWeight: "500"
            }}
          >
            Suiv.
          </button>
        </div>
      </div>

      {/* Filtres et export */}
      <div style={{ 
        backgroundColor: "#fff", 
        padding: "20px", 
        borderRadius: "8px", 
        border: "1px solid #e0e0e0",
        marginBottom: "20px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
        gap: "12px",
        alignItems: "end"
      }}>
        <div>
          <label style={{ display: "block", fontSize: "12px", marginBottom: "6px", fontWeight: "600", color: "#333" }}>Du</label>
          <input 
            type="date" 
            value={dateRange.start} 
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            style={{ 
              width: "100%", 
              padding: "8px 10px", 
              border: "1px solid #d0d0d0", 
              borderRadius: "4px",
              fontSize: "14px"
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "12px", marginBottom: "6px", fontWeight: "600", color: "#333" }}>Au</label>
          <input 
            type="date" 
            value={dateRange.end} 
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            style={{ 
              width: "100%", 
              padding: "8px 10px", 
              border: "1px solid #d0d0d0", 
              borderRadius: "4px",
              fontSize: "14px"
            }}
          />
        </div>

        <button
          onClick={() => setDateRange({ start: "", end: "" })}
          style={{
            padding: "8px 16px",
            backgroundColor: "#f0f0f0",
            border: "1px solid #d0d0d0",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: "500"
          }}
        >
          Réinit
        </button>

        <button
          onClick={() => exportData("pdf")}
          style={{
            padding: "8px 16px",
            backgroundColor: colors.beninRed,
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: "500"
          }}
        >
          PDF
        </button>

        <button
          onClick={() => exportData("csv")}
          style={{
            padding: "8px 16px",
            backgroundColor: colors.beninGreen,
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: "500"
          }}
        >
          CSV
        </button>
      </div>

      {/* Tableau des produits et marges */}
      <div style={{ 
        backgroundColor: "#fff", 
        padding: "20px", 
        borderRadius: "8px", 
        border: "1px solid #e0e0e0",
        marginBottom: "20px"
      }}>
        <h2 style={{ marginBottom: "15px", fontSize: "16px", color: "#333" }}>Produits et Marges Commerciales</h2>
        
        {produits.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "14px"
            }}>
              <thead>
                <tr style={{ backgroundColor: "#f9f9f9", borderBottom: "2px solid #d0d0d0" }}>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "#666", fontSize: "12px" }}>Produit</th>
                  <th style={{ padding: "12px", textAlign: "right", fontWeight: "600", color: "#666", fontSize: "12px" }}>P. Achat</th>
                  <th style={{ padding: "12px", textAlign: "right", fontWeight: "600", color: "#666", fontSize: "12px" }}>P. Vente</th>
                  <th style={{ padding: "12px", textAlign: "right", fontWeight: "600", color: "#666", fontSize: "12px" }}>Marge</th>
                  <th style={{ padding: "12px", textAlign: "center", fontWeight: "600", color: "#666", fontSize: "12px" }}>%</th>
                  <th style={{ padding: "12px", textAlign: "right", fontWeight: "600", color: "#666", fontSize: "12px" }}>Stock</th>
                </tr>
              </thead>
              <tbody>
                {produits.filter(p => p.prix_achat && p.prix_vente).map((produit) => {
                  const marge = (produit.prix_vente || 0) - (produit.prix_achat || 0);
                  const pourcentageMarge = ((marge / (produit.prix_achat || 1)) * 100).toFixed(1);
                  return (
                    <tr key={produit.id} style={{ borderBottom: "1px solid #e0e0e0" }}>
                      <td style={{ padding: "12px", color: "#333", fontSize: "13px", fontWeight: "500" }}>
                        {produit.nom}
                      </td>
                      <td style={{ padding: "12px", textAlign: "right", color: "#666", fontSize: "13px" }}>
                        {(produit.prix_achat || 0).toLocaleString("fr-FR")}
                      </td>
                      <td style={{ padding: "12px", textAlign: "right", color: "#666", fontSize: "13px" }}>
                        {(produit.prix_vente || 0).toLocaleString("fr-FR")}
                      </td>
                      <td style={{ padding: "12px", textAlign: "right", fontWeight: "600", color: colors.beninGreen, fontSize: "13px" }}>
                        {marge.toLocaleString("fr-FR")}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center", fontWeight: "600", color: colors.beninGreen, fontSize: "13px" }}>
                        {pourcentageMarge}%
                      </td>
                      <td style={{ padding: "12px", textAlign: "right", fontWeight: "600", color: "#333", fontSize: "13px" }}>
                        {produit.stock}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: "20px", textAlign: "center", color: "#999" }}>
            Aucun produit pour le moment
          </div>
        )}
      </div>
    </div>
  );
}
