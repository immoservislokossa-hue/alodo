// app/(dashboard)/(archetypes)/prestataire/transactions/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/src/lib/supabase/browser";
import { 
  Plus, 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown,
  X,
  Loader2,
  Search,
  Calendar,
  Trash2,
  Edit,
  Filter,
  Wallet,
  Building2,
  Tag,
  Receipt,
  PieChart
} from "lucide-react";
import type { ServiceTransaction, Project } from "@/src/types/projects";

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

const CATEGORIES = {
  income: [
    "Prestation de service",
    "Vente de matériel",
    "Honoraires",
    "Remboursement",
    "Autre revenu"
  ],
  expense: [
    "Matériel et équipement",
    "Transport",
    "Main d'œuvre",
    "Location",
    "Services publics",
    "Communication",
    "Marketing",
    "Impôts et taxes",
    "Assurance",
    "Autre dépense"
  ]
};

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<ServiceTransaction[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<ServiceTransaction | null>(null);
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: ""
  });
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
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    fetchProfileAndData();
  }, []);

  const fetchProfileAndData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        setProfileId(profile.id);
        await Promise.all([
          fetchTransactions(profile.id),
          fetchProjects(profile.id)
        ]);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTransactions = async (userId: string) => {
    const { data, error } = await supabase
      .from("service_transactions")
      .select(`
        *,
        projects:project_id (
          id,
          title,
          status
        )
      `)
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (error) throw error;
    setTransactions(data || []);
  };

  const fetchProjects = async (userId: string) => {
    const { data, error } = await supabase
      .from("projects")
      .select("id, title, status, budget")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    setProjects((data as any) || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Montant invalide");
      }

      const transactionData = {
        user_id: profileId,
        type: formData.type,
        amount: amount,
        category: formData.category,
        project_id: formData.project_id || null,
        date: formData.date,
        notes: { text: formData.notes, created_at: new Date().toISOString() },
      };

      let error;
      if (editingTransaction) {
        const { error: updateError } = await supabase
          .from("service_transactions")
          .update(transactionData)
          .eq("id", editingTransaction.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from("service_transactions")
          .insert(transactionData);
        error = insertError;
      }

      if (error) throw error;

      setShowModal(false);
      setEditingTransaction(null);
      resetForm();
      if (profileId) {
        await fetchTransactions(profileId);
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de l'enregistrement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette transaction ?")) return;

    try {
      const { error } = await supabase
        .from("service_transactions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      if (profileId) {
        await fetchTransactions(profileId);
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la suppression");
    }
  };

  const handleEdit = (transaction: ServiceTransaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type,
      amount: transaction.amount.toString(),
      category: transaction.category || "",
      project_id: transaction.project_id || "",
      date: transaction.date ? transaction.date.split("T")[0] : new Date().toISOString().split("T")[0],
      notes: transaction.notes?.text || "",
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      type: "income",
      amount: "",
      category: "",
      project_id: "",
      date: new Date().toISOString().split("T")[0],
      notes: "",
    });
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = 
      t.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.projects?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.notes?.text?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "all" || t.type === filterType;
    
    const matchesDate = () => {
      if (!dateRange.start && !dateRange.end) return true;
      const transactionDate = new Date(t.date);
      const start = dateRange.start ? new Date(dateRange.start) : null;
      const end = dateRange.end ? new Date(dateRange.end) : null;
      
      if (start && end) {
        return transactionDate >= start && transactionDate <= end;
      }
      if (start) return transactionDate >= start;
      if (end) return transactionDate <= end;
      return true;
    };
    
    return matchesSearch && matchesType && matchesDate();
  });

  const totalIncome = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  const getCategoryIcon = (type: string) => {
    return type === "income" ? <TrendingUp size={16} /> : <TrendingDown size={16} />;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  // Calcul des statistiques par projet
  const getProjectStats = (projectId: string | null) => {
    if (!projectId) return { income: 0, expense: 0 };
    const projectTransactions = transactions.filter(t => t.project_id === projectId);
    const income = projectTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    const expense = projectTransactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, margin: income - expense };
  };

  // Récupérer le projet sélectionné dans le formulaire
  const selectedProject = formData.project_id ? projects.find(p => p.id === formData.project_id) : null;

  return (
    <div style={{ backgroundColor: colors.gray50, minHeight: "100vh" }}>
      {/* Barre tricolore */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "4px",
        display: "flex",
        zIndex: 50,
      }}>
        <div style={{ flex: 1, backgroundColor: colors.beninGreen }} />
        <div style={{ flex: 1, backgroundColor: colors.beninYellow }} />
        <div style={{ flex: 1, backgroundColor: colors.beninRed }} />
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "80px 24px 40px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              onClick={() => router.back()}
              style={{
                padding: "8px",
                background: colors.white,
                border: `1px solid ${colors.gray200}`,
                borderRadius: "12px",
                cursor: "pointer",
                color: colors.gray500,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "40px",
                height: "40px",
              }}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 style={{
                fontSize: "28px",
                fontWeight: 700,
                fontFamily: "'Playfair Display', serif",
                color: colors.deepBlue,
                marginBottom: "4px",
              }}>
                Transactions
              </h1>
              <p style={{ fontSize: "14px", color: colors.gray500 }}>
                Gérez vos revenus et dépenses
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setEditingTransaction(null);
              resetForm();
              setShowModal(true);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 24px",
              backgroundColor: colors.deepBlue,
              color: colors.white,
              border: "none",
              borderRadius: "12px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <Plus size={18} />
            Nouvelle transaction
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px",
          marginBottom: "32px",
        }}>
          <div style={{
            background: `linear-gradient(135deg, ${colors.white} 0%, ${colors.gray50} 100%)`,
            padding: "24px",
            borderRadius: "20px",
            border: `1px solid ${colors.gray200}`,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "40px", height: "40px", background: `${colors.beninGreen}15`, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <TrendingUp size={20} color={colors.beninGreen} />
                </div>
                <span style={{ fontSize: "14px", fontWeight: 500, color: colors.gray600 }}>Revenus totaux</span>
              </div>
            </div>
            <div style={{ fontSize: "32px", fontWeight: 700, color: colors.beninGreen }}>
              {totalIncome.toLocaleString()} FCFA
            </div>
          </div>

          <div style={{
            background: `linear-gradient(135deg, ${colors.white} 0%, ${colors.gray50} 100%)`,
            padding: "24px",
            borderRadius: "20px",
            border: `1px solid ${colors.gray200}`,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "40px", height: "40px", background: `${colors.beninRed}15`, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <TrendingDown size={20} color={colors.beninRed} />
                </div>
                <span style={{ fontSize: "14px", fontWeight: 500, color: colors.gray600 }}>Dépenses totales</span>
              </div>
            </div>
            <div style={{ fontSize: "32px", fontWeight: 700, color: colors.beninRed }}>
              {totalExpense.toLocaleString()} FCFA
            </div>
          </div>

          <div style={{
            background: `linear-gradient(135deg, ${colors.deepBlue} 0%, ${colors.deepBlueDark} 100%)`,
            padding: "24px",
            borderRadius: "20px",
            color: colors.white,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "40px", height: "40px", background: "rgba(255,255,255,0.2)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Wallet size={20} />
                </div>
                <span style={{ fontSize: "14px", fontWeight: 500, opacity: 0.9 }}>Solde actuel</span>
              </div>
            </div>
            <div style={{ fontSize: "32px", fontWeight: 700 }}>
              {balance.toLocaleString()} FCFA
            </div>
          </div>
        </div>

        {/* Statistiques par projet */}
        {projects.length > 0 && (
          <div style={{ marginBottom: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <Building2 size={20} color={colors.deepBlue} />
              <h2 style={{ fontSize: "18px", fontWeight: 600, color: colors.deepBlue, margin: 0 }}>
                Statistiques par projet
              </h2>
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "16px",
            }}>
              {projects.map((project) => {
                const stats = getProjectStats(project.id);
                const budgetUtilization = project.budget ? Math.min(100, (stats.expense / project.budget) * 100) : 0;
                return (
                  <div
                    key={project.id}
                    style={{
                      backgroundColor: colors.white,
                      padding: "16px",
                      borderRadius: "16px",
                      border: `1px solid ${colors.gray200}`,
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
                      <div>
                        <h3 style={{ fontSize: "14px", fontWeight: 600, color: colors.deepBlue, margin: "0 0 4px 0" }}>
                          {project.title}
                        </h3>
                        <span style={{
                          fontSize: "11px",
                          padding: "3px 8px",
                          background: colors.gray100,
                          borderRadius: "4px",
                          color: colors.gray600,
                          display: "inline-block",
                        }}>
                          {project.status}
                        </span>
                      </div>
                      <PieChart size={16} color={colors.deepBlue} />
                    </div>

                    <div style={{ fontSize: "12px", marginBottom: "8px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ color: colors.gray600 }}>Revenu:</span>
                        <span style={{ color: colors.beninGreen, fontWeight: 600 }}>
                          +{stats.income.toLocaleString()} FCFA
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ color: colors.gray600 }}>Dépense:</span>
                        <span style={{ color: colors.beninRed, fontWeight: 600 }}>
                          -{stats.expense.toLocaleString()} FCFA
                        </span>
                      </div>
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        paddingTop: "8px",
                        borderTop: `1px solid ${colors.gray200}`,
                      }}>
                        <span style={{ color: colors.gray600, fontWeight: 500 }}>Marge:</span>
                        <span style={{
                          color: stats.margin >= 0 ? colors.beninGreen : colors.beninRed,
                          fontWeight: 700,
                        }}>
                          {stats.margin >= 0 ? "+" : ""}{stats.margin.toLocaleString()} FCFA
                        </span>
                      </div>
                    </div>

                    {project.budget && (
                      <div style={{ fontSize: "11px", marginTop: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                          <span style={{ color: colors.gray600 }}>Budget:</span>
                          <span style={{ color: colors.deepBlue, fontWeight: 600 }}>
                            {project.budget.toLocaleString()} FCFA
                          </span>
                        </div>
                        <div style={{
                          width: "100%",
                          height: "6px",
                          backgroundColor: colors.gray200,
                          borderRadius: "3px",
                          overflow: "hidden",
                        }}>
                          <div style={{
                            height: "100%",
                            width: `${budgetUtilization}%`,
                            backgroundColor: budgetUtilization > 80 ? colors.beninRed : budgetUtilization > 60 ? colors.beninYellow : colors.beninGreen,
                            transition: "all 0.3s",
                          }} />
                        </div>
                        <div style={{ marginTop: "4px", color: colors.gray500 }}>
                          {budgetUtilization.toFixed(0)}% utilisé
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ marginBottom: "24px", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: colors.gray400 }} />
            <input
              type="text"
              placeholder="Rechercher par catégorie, projet ou note..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 12px 12px 40px",
                border: `1px solid ${colors.gray200}`,
                borderRadius: "12px",
                fontSize: "14px",
                outline: "none",
                backgroundColor: colors.white,
              }}
            />
          </div>
          
          <div style={{ display: "flex", gap: "8px", background: colors.white, padding: "4px", borderRadius: "12px", border: `1px solid ${colors.gray200}` }}>
            <button
              onClick={() => setFilterType("all")}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                background: filterType === "all" ? colors.deepBlue : "transparent",
                color: filterType === "all" ? colors.white : colors.gray600,
                border: "none",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 500,
              }}
            >
              Tous
            </button>
            <button
              onClick={() => setFilterType("income")}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                background: filterType === "income" ? colors.beninGreen : "transparent",
                color: filterType === "income" ? colors.white : colors.gray600,
                border: "none",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 500,
              }}
            >
              Revenus
            </button>
            <button
              onClick={() => setFilterType("expense")}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                background: filterType === "expense" ? colors.beninRed : "transparent",
                color: filterType === "expense" ? colors.white : colors.gray600,
                border: "none",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 500,
              }}
            >
              Dépenses
            </button>
          </div>
        </div>

        {/* Liste des transactions */}
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "60px", background: colors.white, borderRadius: "20px" }}>
            <Loader2 size={32} style={{ animation: "spin 1s linear infinite", color: colors.deepBlue }} />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "60px",
            backgroundColor: colors.white,
            borderRadius: "20px",
            border: `1px solid ${colors.gray200}`,
          }}>
            <Receipt size={48} color={colors.gray400} style={{ marginBottom: "16px" }} />
            <p style={{ color: colors.gray500 }}>Aucune transaction trouvée</p>
            <button
              onClick={() => {
                setEditingTransaction(null);
                resetForm();
                setShowModal(true);
              }}
              style={{
                marginTop: "16px",
                padding: "10px 20px",
                background: colors.deepBlue,
                color: colors.white,
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
              }}
            >
              Ajouter une transaction
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                style={{
                  backgroundColor: colors.white,
                  padding: "16px 20px",
                  borderRadius: "16px",
                  border: `1px solid ${colors.gray200}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "all 0.2s",
                  cursor: "pointer",
                }}
                onClick={() => handleEdit(transaction)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1 }}>
                  <div style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: transaction.type === "income" ? `${colors.beninGreen}10` : `${colors.beninRed}10`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    {transaction.type === "income" ? (
                      <TrendingUp size={22} color={colors.beninGreen} />
                    ) : (
                      <TrendingDown size={22} color={colors.beninRed} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 600, color: colors.gray800, fontSize: "15px" }}>
                        {transaction.category || "Sans catégorie"}
                      </span>
                      {transaction.projects && (
                        <span style={{
                          fontSize: "11px",
                          padding: "2px 8px",
                          background: colors.gray100,
                          borderRadius: "20px",
                          color: colors.gray600,
                        }}>
                          <Building2 size={10} style={{ display: "inline", marginRight: "4px" }} />
                          {transaction.projects.title}
                        </span>
                      )}
                    </div>
                    {transaction.notes?.text && (
                      <p style={{ fontSize: "12px", color: colors.gray500, marginTop: "4px" }}>
                        {transaction.notes.text}
                      </p>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "6px" }}>
                      <span style={{ fontSize: "11px", color: colors.gray400, display: "flex", alignItems: "center", gap: "4px" }}>
                        <Calendar size={10} />
                        {formatDate(transaction.date)}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right", display: "flex", alignItems: "center", gap: "12px" }}>
                  <div>
                    <div style={{
                      fontWeight: 700,
                      fontSize: "16px",
                      color: transaction.type === "income" ? colors.beninGreen : colors.beninRed,
                    }}>
                      {transaction.type === "income" ? "+" : "-"}{transaction.amount.toLocaleString()} FCFA
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(transaction.id);
                    }}
                    style={{
                      padding: "8px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: colors.gray400,
                      borderRadius: "8px",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.gray100}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Ajout/Modification Transaction */}
      {showModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
          backdropFilter: "blur(4px)",
        }}>
          <div style={{
            backgroundColor: colors.white,
            borderRadius: "24px",
            width: "90%",
            maxWidth: "550px",
            maxHeight: "90vh",
            overflow: "auto",
            boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
          }}>
            <div style={{
              padding: "24px",
              borderBottom: `1px solid ${colors.gray100}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <h2 style={{ fontSize: "22px", fontWeight: 600, color: colors.deepBlue }}>
                {editingTransaction ? "Modifier la transaction" : "Nouvelle transaction"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingTransaction(null);
                  resetForm();
                }}
                style={{
                  padding: "8px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  borderRadius: "8px",
                }}
              >
                <X size={20} color={colors.gray500} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: "24px" }}>
              {/* Type */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "8px", color: colors.gray700 }}>
                  Type de transaction
                </label>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: "income", category: "" })}
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: "12px",
                      border: `2px solid ${formData.type === "income" ? colors.beninGreen : colors.gray200}`,
                      backgroundColor: formData.type === "income" ? `${colors.beninGreen}10` : colors.white,
                      color: formData.type === "income" ? colors.beninGreen : colors.gray600,
                      cursor: "pointer",
                      fontWeight: 500,
                      transition: "all 0.2s",
                    }}
                  >
                    <TrendingUp size={18} style={{ display: "inline", marginRight: "8px" }} />
                    Revenu
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: "expense", category: "" })}
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: "12px",
                      border: `2px solid ${formData.type === "expense" ? colors.beninRed : colors.gray200}`,
                      backgroundColor: formData.type === "expense" ? `${colors.beninRed}10` : colors.white,
                      color: formData.type === "expense" ? colors.beninRed : colors.gray600,
                      cursor: "pointer",
                      fontWeight: 500,
                      transition: "all 0.2s",
                    }}
                  >
                    <TrendingDown size={18} style={{ display: "inline", marginRight: "8px" }} />
                    Dépense
                  </button>
                </div>
              </div>

              {/* Montant */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "8px", color: colors.gray700 }}>
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
                    borderRadius: "12px",
                    fontSize: "16px",
                    fontWeight: 500,
                    outline: "none",
                    transition: "all 0.2s",
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = colors.deepBlue}
                  onBlur={(e) => e.currentTarget.style.borderColor = colors.gray200}
                />
              </div>

              {/* Catégorie */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "8px", color: colors.gray700 }}>
                  Catégorie
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: `1px solid ${colors.gray200}`,
                    borderRadius: "12px",
                    fontSize: "14px",
                    outline: "none",
                    backgroundColor: colors.white,
                  }}
                  required
                >
                  <option value="">Sélectionner une catégorie</option>
                  {CATEGORIES[formData.type].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Projet */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "8px", color: colors.gray700 }}>
                  Projet associé
                </label>
                <select
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: `1px solid ${colors.gray200}`,
                    borderRadius: "12px",
                    fontSize: "14px",
                    outline: "none",
                    backgroundColor: colors.white,
                  }}
                >
                  <option value="">Aucun projet</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title} {project.status && `(${project.status})`}
                    </option>
                  ))}
                </select>

                {/* Informations du projet sélectionné */}
                {selectedProject && (
                  <div style={{
                    marginTop: "12px",
                    padding: "12px",
                    backgroundColor: colors.gray50,
                    borderRadius: "12px",
                    border: `1px solid ${colors.gray200}`,
                    fontSize: "12px",
                  }}>
                    <div style={{ marginBottom: "8px" }}>
                      <span style={{ color: colors.gray600, fontWeight: 500 }}>Budget:</span>
                      <span style={{ marginLeft: "8px", color: colors.deepBlue, fontWeight: 600 }}>
                        {selectedProject.budget ? selectedProject.budget.toLocaleString() : "Non défini"} FCFA
                      </span>
                    </div>
                    <div style={{ marginBottom: "8px" }}>
                      <span style={{ color: colors.gray600, fontWeight: 500 }}>Revenu:</span>
                      <span style={{ marginLeft: "8px", color: colors.beninGreen, fontWeight: 600 }}>
                        +{getProjectStats(selectedProject.id).income.toLocaleString()} FCFA
                      </span>
                    </div>
                    <div style={{ marginBottom: "8px" }}>
                      <span style={{ color: colors.gray600, fontWeight: 500 }}>Dépense:</span>
                      <span style={{ marginLeft: "8px", color: colors.beninRed, fontWeight: 600 }}>
                        -{getProjectStats(selectedProject.id).expense.toLocaleString()} FCFA
                      </span>
                    </div>
                    <div style={{ paddingTop: "8px", borderTop: `1px solid ${colors.gray200}` }}>
                      <span style={{ color: colors.gray600, fontWeight: 500 }}>Marge actuelle:</span>
                      <span style={{
                        marginLeft: "8px",
                        color: getProjectStats(selectedProject.id).margin >= 0 ? colors.beninGreen : colors.beninRed,
                        fontWeight: 700,
                        fontSize: "13px"
                      }}>
                        {getProjectStats(selectedProject.id).margin >= 0 ? "+" : ""}{getProjectStats(selectedProject.id).margin.toLocaleString()} FCFA
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Date */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "8px", color: colors.gray700 }}>
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
                      borderRadius: "12px",
                      fontSize: "14px",
                      outline: "none",
                    }}
                    required
                  />
                </div>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "8px", color: colors.gray700 }}>
                  Notes (optionnel)
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
                    borderRadius: "12px",
                    fontSize: "14px",
                    outline: "none",
                    resize: "vertical",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !formData.amount || !formData.category}
                style={{
                  width: "100%",
                  padding: "14px",
                  backgroundColor: colors.deepBlue,
                  color: colors.white,
                  border: "none",
                  borderRadius: "12px",
                  fontWeight: 600,
                  cursor: isSubmitting || !formData.amount || !formData.category ? "not-allowed" : "pointer",
                  opacity: isSubmitting || !formData.amount || !formData.category ? 0.6 : 1,
                  fontSize: "14px",
                  transition: "all 0.2s",
                }}
              >
                {isSubmitting ? (
                  <Loader2 size={18} style={{ animation: "spin 1s linear infinite", margin: "0 auto" }} />
                ) : (
                  editingTransaction ? "Modifier la transaction" : "Ajouter la transaction"
                )}
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