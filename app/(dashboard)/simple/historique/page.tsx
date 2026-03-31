"use client";

import { useState, useEffect } from "react";
import supabase from "@/src/lib/supabase/browser";
import {
  TrendingUp,
  ShoppingBag,
  HandCoins,
  CreditCard,
  Search,
  Download,
  RefreshCw,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  LineChart,
  Activity,
  Wallet
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
};

type Transaction = {
  id: string;
  type: "vente" | "achat" | "dette" | "paiement";
  montant: number;
  created_at: string;
  profile_id: string;
};

type Stats = {
  totalVentes: number;
  totalAchats: number;
  totalDettes: number;
  totalPaiements: number;
  balance: number;
  transactionCount: number;
};

export default function TransactionsDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalVentes: 0,
    totalAchats: 0,
    totalDettes: 0,
    totalPaiements: 0,
    balance: 0,
    transactionCount: 0,
  });
  
  // Filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Graphique
  const [chartData, setChartData] = useState<{ date: string; montant: number }[]>([]);
  
  // Récupérer les transactions de l'utilisateur connecté UNIQUEMENT
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      if (!user) {
        console.log("Aucun utilisateur connecté");
        setLoading(false);
        return;
      }

      setCurrentUserId(user.id);

      // Récupérer le profil utilisateur
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profileError || !profile) {
        console.error("Profil non trouvé");
        setLoading(false);
        return;
      }

      // Récupérer UNIQUEMENT les transactions de ce profil
      const { data, error } = await supabase
        .from("boitier_transactions")
        .select("*")
        .eq("profile_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erreur Supabase:", error);
        throw error;
      }

      console.log(`📊 Transactions pour ${profile.id}:`, data?.length || 0);
      setTransactions(data || []);
      calculateStats(data || []);
      prepareChartData(data || []);
    } catch (error) {
      console.error("Erreur lors de la récupération:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculer les statistiques
  const calculateStats = (data: Transaction[]) => {
    const ventes = data.filter(t => t.type === "vente").reduce((sum, t) => sum + t.montant, 0);
    const achats = data.filter(t => t.type === "achat").reduce((sum, t) => sum + t.montant, 0);
    const dettes = data.filter(t => t.type === "dette").reduce((sum, t) => sum + t.montant, 0);
    const paiements = data.filter(t => t.type === "paiement").reduce((sum, t) => sum + t.montant, 0);
    
    setStats({
      totalVentes: ventes,
      totalAchats: achats,
      totalDettes: dettes,
      totalPaiements: paiements,
      balance: ventes - achats - paiements,
      transactionCount: data.length,
    });
  };

  // Préparer les données pour le graphique
  const prepareChartData = (data: Transaction[]) => {
    const grouped = data.reduce((acc: any, t) => {
      const date = new Date(t.created_at).toLocaleDateString();
      if (!acc[date]) acc[date] = 0;
      if (t.type === "vente") acc[date] += t.montant;
      if (t.type === "achat" || t.type === "paiement") acc[date] -= t.montant;
      return acc;
    }, {});
    
    const chart = Object.entries(grouped)
      .map(([date, montant]) => ({
        date,
        montant: montant as number,
      }))
      .slice(-7);
    
    setChartData(chart);
  };

  // Appliquer les filtres
  useEffect(() => {
    let filtered = [...transactions];
    
    if (selectedType !== "all") {
      filtered = filtered.filter(t => t.type === selectedType);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.montant.toString().includes(searchTerm)
      );
    }
    
    if (dateRange.start) {
      filtered = filtered.filter(t => new Date(t.created_at) >= new Date(dateRange.start));
    }
    if (dateRange.end) {
      filtered = filtered.filter(t => new Date(t.created_at) <= new Date(dateRange.end));
    }
    
    setFilteredTransactions(filtered);
    setCurrentPage(1);
  }, [transactions, selectedType, searchTerm, dateRange]);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  const exportPDF = () => {
    if (typeof window === "undefined") return;

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    const rows = filteredTransactions
      .map(
        (transaction) => `
          <tr>
            <td>${transaction.type}</td>
            <td>${transaction.type === "vente" ? "+" : "-"}${transaction.montant.toLocaleString()} FCFA</td>
            <td>${new Date(transaction.created_at).toLocaleString()}</td>
            <td>${transaction.id.slice(0, 8)}...</td>
          </tr>
        `
      )
      .join("");

    const html = `
      <!doctype html>
      <html>
        <head>
          <title>Mes Transactions</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 32px; }
            h1 { color: #1a3c6b; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f5f5f5; }
          </style>
        </head>
        <body>
          <h1>Mes Transactions</h1>
          <p>Export du ${new Date().toLocaleString()} - ${filteredTransactions.length} transaction(s)</p>
          <table>
            <thead><tr><th>Type</th><th>Montant</th><th>Date</th><th>ID</th></tr></thead>
            <tbody>${rows || "<tr><td colspan='4'>Aucune transaction</td></tr>"}</tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "vente": return colors.beninGreen;
      case "achat": return colors.deepBlue;
      case "dette": return colors.beninYellow;
      case "paiement": return colors.beninRed;
      default: return colors.gray500;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "vente": return <TrendingUp size={16} />;
      case "achat": return <ShoppingBag size={16} />;
      case "dette": return <HandCoins size={16} />;
      case "paiement": return <CreditCard size={16} />;
      default: return <Activity size={16} />;
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
    <div style={{ minHeight: "100vh", background: colors.gray50 }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px" }}>
        
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "16px" }}>
            <div>
              <h1 style={{ fontSize: "28px", fontWeight: 700, color: colors.deepBlue, marginBottom: "8px" }}>
                                Transactions
              </h1>
              <p style={{ color: colors.gray600 }}>Suivi de vos transactions personnelles</p>
              {currentUserId && (
                <p style={{ fontSize: "11px", color: colors.gray400, marginTop: "4px" }}>
                  ✓ Vos transactions uniquement ({transactions.length})
                </p>
              )}
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={exportPDF}
                disabled={filteredTransactions.length === 0}
                style={{
                  padding: "10px 20px",
                  background: colors.white,
                  border: `1px solid ${colors.gray300}`,
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: filteredTransactions.length === 0 ? "not-allowed" : "pointer",
                  opacity: filteredTransactions.length === 0 ? 0.5 : 1,
                }}
              >
                <Download size={18} />
                Exporter PDF
              </button>
              <button
                onClick={fetchTransactions}
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
                }}
              >
                <RefreshCw size={18} />
                Actualiser
              </button>
            </div>
          </div>
          
          <div style={{ display: "flex", gap: "4px" }}>
            <div style={{ flex: 1, height: "3px", background: colors.beninGreen, borderRadius: "2px" }} />
            <div style={{ flex: 1, height: "3px", background: colors.beninYellow, borderRadius: "2px" }} />
            <div style={{ flex: 1, height: "3px", background: colors.beninRed, borderRadius: "2px" }} />
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
            { label: "Dettes", value: stats.totalDettes, icon: HandCoins, color: colors.beninYellow, prefix: "" },
            { label: "Paiements", value: stats.totalPaiements, icon: CreditCard, color: colors.beninRed, prefix: "-" },
            { label: "Solde", value: stats.balance, icon: Wallet, color: stats.balance >= 0 ? colors.beninGreen : colors.beninRed, prefix: "" },
            { label: "Nb transactions", value: stats.transactionCount, icon: Activity, color: colors.gray600, prefix: "" },
          ].map((stat) => (
            <div key={stat.label} style={{
              background: colors.white,
              padding: "20px",
              borderRadius: "20px",
              border: `1px solid ${colors.gray200}`,
            }}>
              <stat.icon size={20} color={stat.color} style={{ marginBottom: "12px" }} />
              <div style={{ fontSize: "24px", fontWeight: 700, color: stat.color }}>
                {stat.prefix}{stat.value.toLocaleString()} {stat.label !== "Nb transactions" && "FCFA"}
              </div>
              <div style={{ fontSize: "12px", color: colors.gray500 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Graphique */}
        {chartData.length > 0 && (
          <div style={{
            background: colors.white,
            borderRadius: "20px",
            padding: "24px",
            marginBottom: "32px",
            border: `1px solid ${colors.gray200}`,
          }}>
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: colors.deepBlue, marginBottom: "20px" }}>Évolution</h2>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "150px" }}>
              {chartData.map((item, i) => {
                const maxMontant = Math.max(...chartData.map(d => Math.abs(d.montant)), 1);
                const height = (Math.abs(item.montant) / maxMontant) * 120;
                return (
                  <div key={i} style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ height: `${height}px`, background: item.montant >= 0 ? colors.beninGreen : colors.beninRed, borderRadius: "4px 4px 0 0", opacity: 0.7 }} />
                    <div style={{ fontSize: "10px", marginTop: "8px", color: colors.gray500 }}>{item.date.slice(0, 5)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filtres */}
        <div style={{ background: colors.white, borderRadius: "20px", padding: "20px", marginBottom: "24px", border: `1px solid ${colors.gray200}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Filter size={18} />
              <span>Filtres</span>
            </div>
            <button onClick={() => setShowFilters(!showFilters)} style={{ background: "none", border: "none", cursor: "pointer" }}>
              {showFilters ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>
          </div>
          
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <div style={{ position: "relative" }}>
                <Search size={16} style={{ position: "absolute", left: "12px", top: "12px", color: colors.gray400 }} />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px 10px 36px", border: `1px solid ${colors.gray300}`, borderRadius: "12px" }}
                />
              </div>
            </div>
            
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{ padding: "10px 16px", border: `1px solid ${colors.gray300}`, borderRadius: "12px", background: colors.white }}
            >
              <option value="all">Tous les types</option>
              <option value="vente">Ventes</option>
              <option value="achat">Achats</option>
              <option value="dette">Dettes</option>
              <option value="paiement">Paiements</option>
            </select>
            
            {showFilters && (
              <>
                <input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} style={{ padding: "10px 16px", border: `1px solid ${colors.gray300}`, borderRadius: "12px" }} />
                <input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} style={{ padding: "10px 16px", border: `1px solid ${colors.gray300}`, borderRadius: "12px" }} />
                {(dateRange.start || dateRange.end) && (
                  <button onClick={() => setDateRange({ start: "", end: "" })} style={{ padding: "10px 16px", background: colors.gray100, border: "none", borderRadius: "12px", cursor: "pointer" }}>
                    <X size={14} /> Effacer
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Tableau */}
        <div style={{ background: colors.white, borderRadius: "20px", overflow: "hidden", border: `1px solid ${colors.gray200}` }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: colors.gray50 }}>
                <tr>
                  <th style={{ padding: "16px", textAlign: "left" }}>Type</th>
                  <th style={{ padding: "16px", textAlign: "right" }}>Montant</th>
                  <th style={{ padding: "16px", textAlign: "left" }}>Date</th>
                  <th style={{ padding: "16px", textAlign: "left" }}>ID</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: "48px", textAlign: "center", color: colors.gray400 }}>
                      Aucune transaction trouvée
                    </td>
                  </tr>
                ) : (
                  currentItems.map((t) => (
                    <tr key={t.id} style={{ borderBottom: `1px solid ${colors.gray100}` }}>
                      <td style={{ padding: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: `${getTypeColor(t.type)}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {getTypeIcon(t.type)}
                          </div>
                          <span style={{ textTransform: "capitalize", color: getTypeColor(t.type) }}>{t.type}</span>
                        </div>
                      </td>
                      <td style={{ padding: "16px", textAlign: "right", fontWeight: 600, color: t.type === "vente" ? colors.beninGreen : colors.deepBlue }}>
                        {t.type === "vente" ? "+" : "-"}{t.montant.toLocaleString()} FCFA
                      </td>
                      <td style={{ padding: "16px", fontSize: "13px", color: colors.gray600 }}>
                        {new Date(t.created_at).toLocaleString()}
                      </td>
                      <td style={{ padding: "16px", fontSize: "12px", color: colors.gray400, fontFamily: "monospace" }}>
                        {t.id.slice(0, 8)}...
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {filteredTransactions.length > 0 && (
            <div style={{ padding: "16px", borderTop: `1px solid ${colors.gray200}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <span style={{ fontSize: "12px", color: colors.gray500 }}>
                {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredTransactions.length)} sur {filteredTransactions.length}
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: "6px 12px", border: `1px solid ${colors.gray300}`, borderRadius: "8px", background: colors.white, cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? 0.5 : 1 }}>Précédent</button>
                <span style={{ padding: "6px 12px" }}>Page {currentPage} / {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ padding: "6px 12px", border: `1px solid ${colors.gray300}`, borderRadius: "8px", background: colors.white, cursor: currentPage === totalPages ? "not-allowed" : "pointer", opacity: currentPage === totalPages ? 0.5 : 1 }}>Suivant</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}