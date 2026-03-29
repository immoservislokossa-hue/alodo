"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/auth-helpers-nextjs";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Wallet,
  ShoppingBag,
  HandCoins,
  CreditCard,
  Calendar,
  Search,
  Download,
  RefreshCw,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  PieChart,
  LineChart,
  Activity
} from "lucide-react";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
);

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
  avgTransaction: number;
};

export default function TransactionsDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalVentes: 0,
    totalAchats: 0,
    totalDettes: 0,
    totalPaiements: 0,
    balance: 0,
    transactionCount: 0,
    avgTransaction: 0,
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
  const [chartData, setChartData] = useState<{ date: string; montant: number; type: string }[]>([]);
  
  // Récupérer les transactions
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("boitier_transactions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setTransactions(data || []);
      calculateStats(data || []);
      prepareChartData(data || []);
    } catch (error) {
      console.error("Erreur:", error);
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
      avgTransaction: data.length > 0 ? (ventes + achats + dettes + paiements) / data.length : 0,
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
    
    const chart = Object.entries(grouped).map(([date, montant]) => ({
      date,
      montant: montant as number,
      type: montant as number > 0 ? "vente" : "achat",
    })).slice(0, 7);
    
    setChartData(chart);
  };

  // Appliquer les filtres
  useEffect(() => {
    let filtered = [...transactions];
    
    // Filtre par type
    if (selectedType !== "all") {
      filtered = filtered.filter(t => t.type === selectedType);
    }
    
    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.montant.toString().includes(searchTerm)
      );
    }
    
    // Filtre par date
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

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  // Export PDF via impression du navigateur
  const exportPDF = () => {
    if (typeof window === "undefined") {
      return;
    }

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      return;
    }

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
          <title>Transactions Alodo</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 32px;
              color: #111827;
            }
            h1 {
              margin: 0 0 8px;
              color: #1a3c6b;
            }
            .meta {
              margin-bottom: 24px;
              color: #6b7280;
              font-size: 14px;
            }
            .stats {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 12px;
              margin-bottom: 24px;
            }
            .stat {
              border: 1px solid #e5e7eb;
              border-radius: 12px;
              padding: 12px 14px;
            }
            .label {
              font-size: 12px;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 0.08em;
            }
            .value {
              margin-top: 6px;
              font-size: 18px;
              font-weight: 700;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              border: 1px solid #e5e7eb;
              padding: 10px 12px;
              text-align: left;
              font-size: 13px;
            }
            th {
              background: #f9fafb;
            }
            @media print {
              body {
                margin: 16mm;
              }
            }
          </style>
        </head>
        <body>
          <h1>Transactions Alodo</h1>
          <div class="meta">
            Export genere le ${new Date().toLocaleString()} - ${filteredTransactions.length} transaction(s)
          </div>
          <div class="stats">
            <div class="stat">
              <div class="label">Total ventes</div>
              <div class="value">${stats.totalVentes.toLocaleString()} FCFA</div>
            </div>
            <div class="stat">
              <div class="label">Solde actuel</div>
              <div class="value">${stats.balance.toLocaleString()} FCFA</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Montant</th>
                <th>Date</th>
                <th>ID</th>
              </tr>
            </thead>
            <tbody>
              ${rows || `<tr><td colspan="4">Aucune transaction</td></tr>`}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
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

  return (
    <div style={{
      minHeight: "100vh",
      background: colors.gray50,
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px" }}>
        
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h1 style={{ fontSize: "28px", fontWeight: 700, color: colors.deepBlue, marginBottom: "8px" }}>
                Tableau de bord
              </h1>
              <p style={{ color: colors.gray600 }}>Suivi des transactions et statistiques</p>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={exportPDF}
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
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                <RefreshCw size={18} />
                Actualiser
              </button>
            </div>
          </div>
          
          {/* Barre tricolore */}
          <div style={{ display: "flex", gap: "4px", marginTop: "8px" }}>
            <div style={{ flex: 1, height: "3px", background: colors.beninGreen, borderRadius: "2px" }} />
            <div style={{ flex: 1, height: "3px", background: colors.beninYellow, borderRadius: "2px" }} />
            <div style={{ flex: 1, height: "3px", background: colors.beninRed, borderRadius: "2px" }} />
          </div>
        </div>

        {/* Cartes statistiques */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "32px",
        }}>
          {[
            { label: "Total Ventes", value: stats.totalVentes, icon: TrendingUp, color: colors.beninGreen, prefix: "+" },
            { label: "Total Achats", value: stats.totalAchats, icon: ShoppingBag, color: colors.deepBlue, prefix: "-" },
            { label: "Total Dettes", value: stats.totalDettes, icon: HandCoins, color: colors.beninYellow, prefix: "" },
            { label: "Total Paiements", value: stats.totalPaiements, icon: CreditCard, color: colors.beninRed, prefix: "-" },
            { label: "Solde Actuel", value: stats.balance, icon: Wallet, color: stats.balance >= 0 ? colors.beninGreen : colors.beninRed, prefix: "" },
            { label: "Transactions", value: stats.transactionCount, icon: Activity, color: colors.gray600, prefix: "" },
          ].map((stat) => (
            <div key={stat.label} style={{
              background: colors.white,
              padding: "20px",
              borderRadius: "20px",
              border: `1px solid ${colors.gray200}`,
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <stat.icon size={20} color={stat.color} />
                <span style={{ fontSize: "12px", color: colors.gray400 }}>24h</span>
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
        <div style={{
          background: colors.white,
          borderRadius: "20px",
          padding: "24px",
          marginBottom: "32px",
          border: `1px solid ${colors.gray200}`,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 600, color: colors.deepBlue }}>Évolution des transactions</h2>
              <p style={{ fontSize: "12px", color: colors.gray500 }}>Solde journalier (7 derniers jours)</p>
            </div>
            <LineChart size={20} color={colors.gray400} />
          </div>
          
          <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "200px" }}>
            {chartData.map((item, index) => {
              const maxMontant = Math.max(...chartData.map(d => Math.abs(d.montant)), 1);
              const height = (Math.abs(item.montant) / maxMontant) * 160;
              return (
                <div key={index} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{
                    width: "100%",
                    height: `${height}px`,
                    background: item.montant >= 0 ? colors.beninGreen : colors.beninRed,
                    borderRadius: "8px 8px 4px 4px",
                    transition: "height 0.3s",
                    opacity: 0.7,
                  }} />
                  <div style={{ fontSize: "10px", color: colors.gray500, marginTop: "8px", textAlign: "center" }}>
                    {item.date.slice(0, 5)}
                  </div>
                  <div style={{ fontSize: "10px", fontWeight: 500, color: item.montant >= 0 ? colors.beninGreen : colors.beninRed }}>
                    {item.montant >= 0 ? "+" : ""}{Math.abs(item.montant).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

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
            <div style={{ flex: 1, minWidth: "200px" }}>
              <div style={{ position: "relative" }}>
                <Search size={16} style={{ position: "absolute", left: "12px", top: "12px", color: colors.gray400 }} />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px 10px 36px",
                    border: `1px solid ${colors.gray300}`,
                    borderRadius: "12px",
                    fontSize: "14px",
                  }}
                />
              </div>
            </div>
            
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
                  <th style={{ padding: "16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: colors.gray600 }}>Type</th>
                  <th style={{ padding: "16px", textAlign: "right", fontSize: "12px", fontWeight: 600, color: colors.gray600 }}>Montant</th>
                  <th style={{ padding: "16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: colors.gray600 }}>Date</th>
                  <th style={{ padding: "16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: colors.gray600 }}>ID</th>
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
                      <td style={{ padding: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "8px",
                            background: `${getTypeColor(transaction.type)}15`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}>
                            {getTypeIcon(transaction.type)}
                          </div>
                          <span style={{
                            textTransform: "capitalize",
                            fontWeight: 500,
                            color: getTypeColor(transaction.type),
                          }}>
                            {transaction.type}
                          </span>
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
                      <td style={{ padding: "16px", fontSize: "13px", color: colors.gray600 }}>
                        {new Date(transaction.created_at).toLocaleString()}
                      </td>
                      <td style={{ padding: "16px", fontSize: "12px", color: colors.gray400, fontFamily: "monospace" }}>
                        {transaction.id.slice(0, 8)}...
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
