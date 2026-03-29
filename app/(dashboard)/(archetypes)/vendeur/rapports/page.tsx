"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Wallet,
  ShoppingBag,
  HandCoins,
  CreditCard,
  Calendar,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  LineChart,
  Package,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  X
} from "lucide-react";

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
  gray900: "#111827",
};

type Transaction = {
  id: string;
  type: "vente" | "achat" | "depense" | "dette" | "paiement";
  montant: number;
  created_at: string;
  produit_id: string | null;
  metadata: any;
};

type Produit = {
  id: string;
  nom: string;
  stock: number;
};

type Stats = {
  totalVentes: number;
  totalAchats: number;
  totalDepenses: number;
  totalDettes: number;
  totalPaiements: number;
  balance: number;
  transactionCount: number;
  avgTransaction: number;
  bestSellingProduct: { nom: string; total: number } | null;
};

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
);

export default function RapportsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalVentes: 0,
    totalAchats: 0,
    totalDepenses: 0,
    totalDettes: 0,
    totalPaiements: 0,
    balance: 0,
    transactionCount: 0,
    avgTransaction: 0,
    bestSellingProduct: null,
  });
  
  // Filtres
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [selectedType, setSelectedType] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [chartData, setChartData] = useState<{ date: string; ventes: number; depenses: number }[]>([]);
  const [productStats, setProductStats] = useState<{ nom: string; ventes: number; total: number }[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Charger les données
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
        .from("transactions")
        .select("*")
        .eq("profile_id", profile.id)
        .order("created_at", { ascending: false });

      if (dateRange.start) {
        query = query.gte("created_at", dateRange.start);
      }
      if (dateRange.end) {
        query = query.lte("created_at", `${dateRange.end}T23:59:59`);
      }

      const { data: transactionsData, error: transactionsError } = await query;
      if (transactionsError) throw transactionsError;

      // Récupérer les produits
      const { data: produitsData, error: produitsError } = await supabase
        .from("produits")
        .select("*")
        .eq("profile_id", profile.id);

      if (produitsError) throw produitsError;

      setTransactions(transactionsData || []);
      setProduits(produitsData || []);
      calculateStats(transactionsData || []);
      prepareChartData(transactionsData || []);
      calculateProductStats(transactionsData || [], produitsData || []);
      
    } catch (err) {
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  // Calculer les statistiques
  const calculateStats = (data: Transaction[]) => {
    const ventes = data.filter(t => t.type === "vente").reduce((sum, t) => sum + t.montant, 0);
    const achats = data.filter(t => t.type === "achat").reduce((sum, t) => sum + t.montant, 0);
    const depenses = data.filter(t => t.type === "depense").reduce((sum, t) => sum + t.montant, 0);
    const dettes = data.filter(t => t.type === "dette").reduce((sum, t) => sum + t.montant, 0);
    const paiements = data.filter(t => t.type === "paiement").reduce((sum, t) => sum + t.montant, 0);
    
    const balance = ventes - achats - depenses - paiements;
    
    setStats({
      totalVentes: ventes,
      totalAchats: achats,
      totalDepenses: depenses,
      totalDettes: dettes,
      totalPaiements: paiements,
      balance: balance,
      transactionCount: data.length,
      avgTransaction: data.length > 0 ? (ventes + achats + depenses + dettes + paiements) / data.length : 0,
      bestSellingProduct: null,
    });
  };

  // Préparer les données du graphique
  const prepareChartData = (data: Transaction[]) => {
    const grouped: { [key: string]: { ventes: number; depenses: number } } = {};
    
    data.forEach(t => {
      const date = new Date(t.created_at).toLocaleDateString();
      if (!grouped[date]) {
        grouped[date] = { ventes: 0, depenses: 0 };
      }
      if (t.type === "vente") {
        grouped[date].ventes += t.montant;
      } else if (t.type === "achat" || t.type === "depense" || t.type === "paiement") {
        grouped[date].depenses += t.montant;
      }
    });
    
    const chart = Object.entries(grouped)
      .map(([date, values]) => ({ date, ...values }))
      .slice(-7);
    
    setChartData(chart);
  };

  // Calculer les statistiques par produit
  const calculateProductStats = (transactionsData: Transaction[], produitsData: Produit[]) => {
    const productSales: { [key: string]: { nom: string; ventes: number; total: number } } = {};
    
    transactionsData.forEach(t => {
      if (t.type === "vente" && t.produit_id) {
        const produit = produitsData.find(p => p.id === t.produit_id);
        if (produit) {
          if (!productSales[t.produit_id]) {
            productSales[t.produit_id] = { nom: produit.nom, ventes: 0, total: 0 };
          }
          productSales[t.produit_id].ventes += 1;
          productSales[t.produit_id].total += t.montant;
        }
      }
    });
    
    const sorted = Object.values(productSales).sort((a, b) => b.total - a.total);
    setProductStats(sorted.slice(0, 5));
    
    if (sorted.length > 0) {
      setStats(prev => ({ ...prev, bestSellingProduct: sorted[0] }));
    }
  };

  // Filtrer les transactions pour l'affichage
  const filteredTransactions = transactions.filter(t => {
    if (selectedType !== "all" && t.type !== selectedType) return false;
    return true;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  // Export CSV
  const exportCSV = () => {
    const headers = ["Date", "Type", "Montant", "Produit ID", "Notes"];
    const rows = filteredTransactions.map(t => [
      new Date(t.created_at).toLocaleString(),
      t.type,
      t.montant,
      t.produit_id || "",
      t.metadata?.notes || "",
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapports_${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "vente": return colors.beninGreen;
      case "achat": return colors.deepBlue;
      case "depense": return colors.beninRed;
      case "dette": return colors.beninYellow;
      case "paiement": return colors.deepBlue;
      default: return colors.gray500;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "vente": return <TrendingUp size={14} />;
      case "achat": return <ShoppingBag size={14} />;
      case "depense": return <TrendingDown size={14} />;
      case "dette": return <HandCoins size={14} />;
      case "paiement": return <CreditCard size={14} />;
      default: return null;
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: colors.gray100,
      fontFamily: "system-ui, -apple-system, sans-serif",
      padding: "24px",
    }}>
      <div style={{
        maxWidth: "1400px",
        margin: "0 auto",
      }}>
        
        {/* Barre tricolore */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "24px" }}>
          <div style={{ flex: 1, height: "3px", background: colors.beninGreen, borderRadius: "2px" }} />
          <div style={{ flex: 1, height: "3px", background: colors.beninYellow, borderRadius: "2px" }} />
          <div style={{ flex: 1, height: "3px", background: colors.beninRed, borderRadius: "2px" }} />
        </div>

        {/* Header */}
        <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Link
              href="/vendeur"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: colors.white,
                border: `1px solid ${colors.gray200}`,
                color: colors.gray600,
                transition: "all 0.2s",
              }}
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 style={{
                fontSize: "28px",
                fontWeight: 700,
                fontFamily: "'Playfair Display', serif",
                color: colors.deepBlue,
                marginBottom: "4px",
              }}>
                Rapports
              </h1>
              <p style={{ fontSize: "14px", color: colors.gray500 }}>
                Analyse complète de vos transactions
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={exportCSV}
              style={{
                padding: "10px 20px",
                background: colors.white,
                border: `1px solid ${colors.gray300}`,
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              <Download size={18} />
              Exporter
            </button>
            <button
              onClick={fetchData}
              style={{
                padding: "10px 20px",
                background: colors.deepBlue,
                border: "none",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                color: colors.white,
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              <RefreshCw size={18} />
              Actualiser
            </button>
          </div>
        </div>

        {/* Cartes statistiques */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "16px",
          marginBottom: "32px",
        }}>
          {[
            { label: "Ventes", value: stats.totalVentes, icon: TrendingUp, color: colors.beninGreen, prefix: "+" },
            { label: "Achats", value: stats.totalAchats, icon: ShoppingBag, color: colors.deepBlue, prefix: "-" },
            { label: "Dépenses", value: stats.totalDepenses, icon: TrendingDown, color: colors.beninRed, prefix: "-" },
            { label: "Dettes", value: stats.totalDettes, icon: HandCoins, color: colors.beninYellow, prefix: "" },
            { label: "Paiements", value: stats.totalPaiements, icon: CreditCard, color: colors.deepBlue, prefix: "-" },
            { label: "Solde", value: stats.balance, icon: Wallet, color: stats.balance >= 0 ? colors.beninGreen : colors.beninRed, prefix: "" },
            { label: "Transactions", value: stats.transactionCount, icon: BarChart3, color: colors.gray600, prefix: "" },
            { label: "Moyenne", value: Math.round(stats.avgTransaction), icon: LineChart, color: colors.gray600, prefix: "" },
          ].map((stat) => (
            <div key={stat.label} style={{
              background: colors.white,
              padding: "20px",
              borderRadius: "20px",
              border: `1px solid ${colors.gray200}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <stat.icon size={20} color={stat.color} />
              </div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: stat.color }}>
                {stat.prefix}{stat.value.toLocaleString()} FCFA
              </div>
              <div style={{ fontSize: "12px", color: colors.gray500, marginTop: "4px" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Graphique d'évolution */}
        {chartData.length > 0 && (
          <div style={{
            background: colors.white,
            borderRadius: "20px",
            padding: "24px",
            marginBottom: "32px",
            border: `1px solid ${colors.gray200}`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: 600, color: colors.deepBlue }}>Évolution</h2>
                <p style={{ fontSize: "12px", color: colors.gray500 }}>Ventes vs Dépenses (7 derniers jours)</p>
              </div>
              <LineChart size={20} color={colors.gray400} />
            </div>
            
            <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "250px" }}>
              {chartData.map((item, index) => {
                const maxValue = Math.max(...chartData.map(d => Math.max(d.ventes, d.depenses)), 1);
                const ventesHeight = (item.ventes / maxValue) * 200;
                const depensesHeight = (item.depenses / maxValue) * 200;
                
                return (
                  <div key={index} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                    <div style={{ display: "flex", gap: "4px", alignItems: "flex-end", height: "200px" }}>
                      <div style={{
                        width: "20px",
                        height: `${ventesHeight}px`,
                        background: colors.beninGreen,
                        borderRadius: "4px 4px 0 0",
                        transition: "height 0.3s",
                      }} />
                      <div style={{
                        width: "20px",
                        height: `${depensesHeight}px`,
                        background: colors.beninRed,
                        borderRadius: "4px 4px 0 0",
                        transition: "height 0.3s",
                      }} />
                    </div>
                    <div style={{ fontSize: "10px", color: colors.gray500, textAlign: "center" }}>
                      {item.date.slice(0, 5)}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: "24px", marginTop: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "12px", height: "12px", background: colors.beninGreen, borderRadius: "2px" }} />
                <span style={{ fontSize: "11px", color: colors.gray600 }}>Ventes</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "12px", height: "12px", background: colors.beninRed, borderRadius: "2px" }} />
                <span style={{ fontSize: "11px", color: colors.gray600 }}>Dépenses</span>
              </div>
            </div>
          </div>
        )}

        {/* Top produits */}
        {productStats.length > 0 && (
          <div style={{
            background: colors.white,
            borderRadius: "20px",
            padding: "24px",
            marginBottom: "32px",
            border: `1px solid ${colors.gray200}`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: 600, color: colors.deepBlue }}>Top produits</h2>
                <p style={{ fontSize: "12px", color: colors.gray500 }}>Produits les plus vendus</p>
              </div>
              <Package size={20} color={colors.gray400} />
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {productStats.map((product, index) => (
                <div key={product.nom} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px",
                  background: colors.gray50,
                  borderRadius: "12px",
                }}>
                  <div style={{
                    width: "32px",
                    height: "32px",
                    background: colors.deepBlue,
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: colors.white,
                    fontWeight: 600,
                  }}>
                    {index + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, color: colors.gray800 }}>{product.nom}</div>
                    <div style={{ fontSize: "11px", color: colors.gray500 }}>{product.ventes} ventes</div>
                  </div>
                  <div style={{ fontWeight: 600, color: colors.beninGreen }}>
                    {product.total.toLocaleString()} FCFA
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filtres */}
        <div style={{
          background: colors.white,
          borderRadius: "20px",
          padding: "20px",
          marginBottom: "24px",
          border: `1px solid ${colors.gray200}`,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Filter size={18} color={colors.gray600} />
              <span style={{ fontWeight: 500 }}>Filtres</span>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              {showFilters ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>
          </div>
          
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{
                padding: "10px 16px",
                border: `1px solid ${colors.gray300}`,
                borderRadius: "12px",
                fontSize: "14px",
                background: colors.white,
              }}
            >
              <option value="all">Tous les types</option>
              <option value="vente">Ventes</option>
              <option value="achat">Achats</option>
              <option value="depense">Dépenses</option>
              <option value="dette">Dettes</option>
              <option value="paiement">Paiements</option>
            </select>
            
            {showFilters && (
              <>
                <input
                  type="date"
                  placeholder="Date début"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  style={{
                    padding: "10px 16px",
                    border: `1px solid ${colors.gray300}`,
                    borderRadius: "12px",
                    fontSize: "14px",
                  }}
                />
                <input
                  type="date"
                  placeholder="Date fin"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  style={{
                    padding: "10px 16px",
                    border: `1px solid ${colors.gray300}`,
                    borderRadius: "12px",
                    fontSize: "14px",
                  }}
                />
                {(dateRange.start || dateRange.end) && (
                  <button
                    onClick={() => setDateRange({ start: "", end: "" })}
                    style={{
                      padding: "10px 16px",
                      background: colors.gray100,
                      border: "none",
                      borderRadius: "12px",
                      cursor: "pointer",
                      fontSize: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <X size={14} /> Effacer
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Tableau des transactions */}
        <div style={{
          background: colors.white,
          borderRadius: "20px",
          overflow: "hidden",
          border: `1px solid ${colors.gray200}`,
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.gray200}`, background: colors.gray50 }}>
                  <th style={{ padding: "16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: colors.gray600 }}>Date</th>
                  <th style={{ padding: "16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: colors.gray600 }}>Type</th>
                  <th style={{ padding: "16px", textAlign: "right", fontSize: "12px", fontWeight: 600, color: colors.gray600 }}>Montant</th>
                  <th style={{ padding: "16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: colors.gray600 }}>Notes</th>
                 </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} style={{ padding: "48px", textAlign: "center", color: colors.gray400 }}>
                      Chargement...
                    </td>
                  </tr>
                ) : currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: "48px", textAlign: "center", color: colors.gray400 }}>
                      Aucune transaction trouvée
                    </td>
                  </tr>
                ) : (
                  currentItems.map((transaction) => (
                    <tr key={transaction.id} style={{ borderBottom: `1px solid ${colors.gray100}` }}>
                      <td style={{ padding: "16px", fontSize: "13px", color: colors.gray600 }}>
                        {new Date(transaction.created_at).toLocaleString()}
                      </td>
                      <td style={{ padding: "16px" }}>
                        <div style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "4px 12px",
                          background: `${getTypeColor(transaction.type)}10`,
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: 500,
                          color: getTypeColor(transaction.type),
                          textTransform: "capitalize",
                        }}>
                          {getTypeIcon(transaction.type)}
                          {transaction.type}
                        </div>
                      </td>
                      <td style={{
                        padding: "16px",
                        textAlign: "right",
                        fontWeight: 600,
                        color: transaction.type === "vente" ? colors.beninGreen : colors.deepBlue,
                      }}>
                        {transaction.type === "vente" ? "+" : "-"}{transaction.montant.toLocaleString()} FCFA
                      </td>
                      <td style={{ padding: "16px", fontSize: "12px", color: colors.gray500 }}>
                        {transaction.metadata?.notes || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {filteredTransactions.length > 0 && (
            <div style={{
              padding: "16px",
              borderTop: `1px solid ${colors.gray200}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}>
              <span style={{ fontSize: "12px", color: colors.gray500 }}>
                {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredTransactions.length)} sur {filteredTransactions.length}
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: "6px 12px",
                    border: `1px solid ${colors.gray300}`,
                    borderRadius: "8px",
                    background: colors.white,
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    opacity: currentPage === 1 ? 0.5 : 1,
                  }}
                >
                  Précédent
                </button>
                <span style={{ padding: "6px 12px", color: colors.gray600 }}>
                  Page {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: "6px 12px",
                    border: `1px solid ${colors.gray300}`,
                    borderRadius: "8px",
                    background: colors.white,
                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                    opacity: currentPage === totalPages ? 0.5 : 1,
                  }}
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}