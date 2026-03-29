"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown,
  X,
  Loader2,
  Search,
  Calendar
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
  type: "income" | "expense";
  amount: number;
  category: string;
  notes: any;
  date: string;
  project_id: string | null;
  project?: { title: string };
};

type Project = {
  id: string;
  title: string;
  status: string;
};

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    type: "income" as "income" | "expense",
    amount: "",
    category: "",
    project_id: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Récupérer les transactions
      const transactionsRes = await fetch("/api/prestataire/transactions");
      const transactionsData = await transactionsRes.json();
      setTransactions(transactionsData);

      // Récupérer les projets pour le formulaire
      const projectsRes = await fetch("/api/prestataire/projects");
      const projectsData = await projectsRes.json();
      setProjects(projectsData);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/prestataire/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setFormData({
          type: "income",
          amount: "",
          category: "",
          project_id: "",
          date: new Date().toISOString().split("T")[0],
          notes: "",
        });
        fetchData();
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTransactions = transactions.filter(t =>
    t.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.project?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalIncome = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  return (
    <div style={{ backgroundColor: colors.gray50, minHeight: "100vh" }}>
      {/* Barre tricolore */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "3px",
        display: "flex",
        zIndex: 50,
      }}>
        <div style={{ flex: 1, backgroundColor: colors.beninGreen }} />
        <div style={{ flex: 1, backgroundColor: colors.beninYellow }} />
        <div style={{ flex: 1, backgroundColor: colors.beninRed }} />
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "80px 24px 40px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              onClick={() => router.back()}
              style={{
                padding: "8px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: colors.gray500,
              }}
            >
              <ArrowLeft size={20} />
            </button>
            <h1 style={{
              fontSize: "28px",
              fontWeight: 700,
              fontFamily: "'Playfair Display', serif",
              color: colors.deepBlue,
            }}>
              Transactions
            </h1>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              backgroundColor: colors.deepBlue,
              color: colors.white,
              border: "none",
              borderRadius: "10px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.deepBlueDark}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.deepBlue}
          >
            <Plus size={18} />
            Nouvelle transaction
          </button>
        </div>

        {/* Stats */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "20px",
          marginBottom: "32px",
        }}>
          <div style={{
            backgroundColor: colors.white,
            padding: "20px",
            borderRadius: "16px",
            border: `1px solid ${colors.gray200}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <TrendingUp size={18} color={colors.beninGreen} />
              <span style={{ fontSize: "13px", color: colors.gray500 }}>Revenus</span>
            </div>
            <div style={{ fontSize: "28px", fontWeight: 600, color: colors.beninGreen }}>
              {totalIncome.toLocaleString()} FCFA
            </div>
          </div>

          <div style={{
            backgroundColor: colors.white,
            padding: "20px",
            borderRadius: "16px",
            border: `1px solid ${colors.gray200}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <TrendingDown size={18} color={colors.beninRed} />
              <span style={{ fontSize: "13px", color: colors.gray500 }}>Dépenses</span>
            </div>
            <div style={{ fontSize: "28px", fontWeight: 600, color: colors.beninRed }}>
              {totalExpense.toLocaleString()} FCFA
            </div>
          </div>

          <div style={{
            backgroundColor: colors.white,
            padding: "20px",
            borderRadius: "16px",
            border: `1px solid ${colors.gray200}`,
          }}>
            <div style={{ fontSize: "13px", color: colors.gray500, marginBottom: "8px" }}>Solde</div>
            <div style={{ fontSize: "28px", fontWeight: 600, color: colors.deepBlue }}>
              {balance.toLocaleString()} FCFA
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ position: "relative" }}>
            <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: colors.gray400 }} />
            <input
              type="text"
              placeholder="Rechercher par catégorie ou projet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 12px 12px 40px",
                border: `1px solid ${colors.gray200}`,
                borderRadius: "12px",
                fontSize: "14px",
                outline: "none",
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = colors.deepBlue}
              onBlur={(e) => e.currentTarget.style.borderColor = colors.gray200}
            />
          </div>
        </div>

        {/* Liste des transactions */}
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "60px" }}>
            <Loader2 size={32} style={{ animation: "spin 1s linear infinite", color: colors.deepBlue }} />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "60px",
            backgroundColor: colors.white,
            borderRadius: "16px",
            border: `1px solid ${colors.gray200}`,
          }}>
            <p style={{ color: colors.gray500 }}>Aucune transaction</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                style={{
                  backgroundColor: colors.white,
                  padding: "16px 20px",
                  borderRadius: "12px",
                  border: `1px solid ${colors.gray200}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    backgroundColor: transaction.type === "income" ? `${colors.beninGreen}10` : `${colors.beninRed}10`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    {transaction.type === "income" ? (
                      <TrendingUp size={18} color={colors.beninGreen} />
                    ) : (
                      <TrendingDown size={18} color={colors.beninRed} />
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, color: colors.gray800 }}>
                      {transaction.category || "Sans catégorie"}
                    </div>
                    {transaction.project && (
                      <div style={{ fontSize: "12px", color: colors.gray400 }}>
                        {transaction.project.title}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{
                    fontWeight: 600,
                    color: transaction.type === "income" ? colors.beninGreen : colors.beninRed,
                  }}>
                    {transaction.type === "income" ? "+" : "-"}{transaction.amount.toLocaleString()} FCFA
                  </div>
                  <div style={{ fontSize: "11px", color: colors.gray400 }}>
                    {new Date(transaction.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Ajout Transaction */}
      {showModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
        }}>
          <div style={{
            backgroundColor: colors.white,
            borderRadius: "24px",
            width: "90%",
            maxWidth: "500px",
            maxHeight: "90vh",
            overflow: "auto",
          }}>
            <div style={{
              padding: "24px",
              borderBottom: `1px solid ${colors.gray100}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <h2 style={{ fontSize: "20px", fontWeight: 600, color: colors.deepBlue }}>
                Nouvelle transaction
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: "8px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <X size={20} color={colors.gray500} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: "24px" }}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px", color: colors.gray700 }}>
                  Type
                </label>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: "income" })}
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: "10px",
                      border: `1px solid ${formData.type === "income" ? colors.beninGreen : colors.gray200}`,
                      backgroundColor: formData.type === "income" ? `${colors.beninGreen}10` : colors.white,
                      color: formData.type === "income" ? colors.beninGreen : colors.gray600,
                      cursor: "pointer",
                    }}
                  >
                    Revenu
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: "expense" })}
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: "10px",
                      border: `1px solid ${formData.type === "expense" ? colors.beninRed : colors.gray200}`,
                      backgroundColor: formData.type === "expense" ? `${colors.beninRed}10` : colors.white,
                      color: formData.type === "expense" ? colors.beninRed : colors.gray600,
                      cursor: "pointer",
                    }}
                  >
                    Dépense
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px", color: colors.gray700 }}>
                  Montant (FCFA)
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0"
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: `1px solid ${colors.gray200}`,
                    borderRadius: "10px",
                    fontSize: "16px",
                    outline: "none",
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = colors.deepBlue}
                  onBlur={(e) => e.currentTarget.style.borderColor = colors.gray200}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px", color: colors.gray700 }}>
                  Catégorie
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Ex: Matériel, Transport, Honoraires..."
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: `1px solid ${colors.gray200}`,
                    borderRadius: "10px",
                    fontSize: "14px",
                    outline: "none",
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = colors.deepBlue}
                  onBlur={(e) => e.currentTarget.style.borderColor = colors.gray200}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px", color: colors.gray700 }}>
                  Projet associé
                </label>
                <select
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: `1px solid ${colors.gray200}`,
                    borderRadius: "10px",
                    fontSize: "14px",
                    outline: "none",
                    backgroundColor: colors.white,
                  }}
                >
                  <option value="">Aucun projet</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px", color: colors.gray700 }}>
                  Date
                </label>
                <div style={{ position: "relative" }}>
                  <Calendar size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: colors.gray400 }} />
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "12px 12px 12px 40px",
                      border: `1px solid ${colors.gray200}`,
                      borderRadius: "10px",
                      fontSize: "14px",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px", color: colors.gray700 }}>
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Informations supplémentaires..."
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: `1px solid ${colors.gray200}`,
                    borderRadius: "10px",
                    fontSize: "14px",
                    outline: "none",
                    resize: "vertical",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !formData.amount}
                style={{
                  width: "100%",
                  padding: "14px",
                  backgroundColor: colors.deepBlue,
                  color: colors.white,
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: 500,
                  cursor: isSubmitting || !formData.amount ? "not-allowed" : "pointer",
                  opacity: isSubmitting || !formData.amount ? 0.5 : 1,
                }}
              >
                {isSubmitting ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite", margin: "0 auto" }} /> : "Ajouter la transaction"}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}