"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createBrowserClient } from "@supabase/auth-helpers-nextjs";
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2,
  FileText,
  DollarSign,
  Calendar,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  Eye,
  Loader2,
  Send,
  Printer
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

type Client = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
};

type Project = {
  id: string;
  title: string;
  description: string | null;
  status: "draft" | "ongoing" | "completed" | "cancelled";
  budget: number;
  total_income: number;
  total_expense: number;
  margin: number;
  start_date: string;
  end_date: string | null;
  created_at: string;
  client: Client | null;
};

type Document = {
  id: string;
  type: "devis" | "facture" | "contrat";
  status: "draft" | "sent" | "accepted" | "rejected" | "paid";
  data: any;
  file_url: string | null;
  created_at: string;
};

type Transaction = {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string | null;
  notes: any;
  date: string;
};

type Intervention = {
  id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  status: "pending" | "done" | "cancelled";
  location: string | null;
  created_at: string;
};

type DocumentTemplate = {
  id: string;
  name: string;
  type: "devis" | "facture" | "contrat";
  html_template: string;
};

export default function ProjetDetailPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  );
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"documents" | "transactions" | "interventions">("documents");
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showInterventionModal, setShowInterventionModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [transactionForm, setTransactionForm] = useState({
    type: "income" as "income" | "expense",
    amount: "",
    category: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [interventionForm, setInterventionForm] = useState({
    title: "",
    description: "",
    scheduled_at: new Date().toISOString().slice(0, 16),
    location: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Récupérer le projet avec son client
      const { data: projectData } = await supabase
        .from("projects")
        .select(`
          *,
          client:clients(*)
        `)
        .eq("id", projectId)
        .eq("user_id", user.id)
        .single();

      if (projectData) setProject(projectData as Project);

      // Récupérer les documents du projet
      const { data: documentsData } = await supabase
        .from("documents")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (documentsData) setDocuments(documentsData);

      // Récupérer les transactions du projet
      const { data: transactionsData } = await supabase
        .from("service_transactions")
        .select("*")
        .eq("project_id", projectId)
        .order("date", { ascending: false });

      if (transactionsData) setTransactions(transactionsData);

      // Récupérer les interventions du projet
      const { data: interventionsData } = await supabase
        .from("interventions")
        .select("*")
        .eq("project_id", projectId)
        .order("scheduled_at", { ascending: false });

      if (interventionsData) setInterventions(interventionsData);

      // Récupérer les templates de documents
      const { data: templatesData } = await supabase
        .from("document_templates")
        .select("*")
        .eq("user_id", user.id);

      if (templatesData) setTemplates(templatesData);

    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateDocument = async (templateId: string, type: string) => {
    setIsGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !project) return;

      // Créer le document
      const { data: document, error } = await supabase
        .from("documents")
        .insert({
          user_id: user.id,
          type,
          project_id: project.id,
          client_id: project.client?.id,
          template_id: templateId,
          status: "draft",
          data: {
            project_title: project.title,
            client_name: project.client?.name,
            client_phone: project.client?.phone,
            client_email: project.client?.email,
            budget: project.budget,
            date: new Date().toISOString(),
          }
        })
        .select()
        .single();

      if (error) throw error;

      // Générer le PDF (appel à une fonction edge ou service externe)
      // Pour l'instant, on simule un fichier
      const mockUrl = `https://example.com/documents/${document.id}.pdf`;
      
      await supabase
        .from("documents")
        .update({ file_url: mockUrl })
        .eq("id", document.id);

      fetchData();
      setShowDocumentModal(false);
      
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const addTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !project) return;

      const { error } = await supabase
        .from("service_transactions")
        .insert({
          user_id: user.id,
          type: transactionForm.type,
          amount: parseFloat(transactionForm.amount),
          category: transactionForm.category || null,
          project_id: project.id,
          date: transactionForm.date,
          notes: transactionForm.notes ? { note: transactionForm.notes } : null,
        });

      if (!error) {
        // Mettre à jour le total_income/total_expense du projet
        const newIncome = transactionForm.type === "income" 
          ? project.total_income + parseFloat(transactionForm.amount)
          : project.total_income;
        const newExpense = transactionForm.type === "expense"
          ? project.total_expense + parseFloat(transactionForm.amount)
          : project.total_expense;
        const newMargin = newIncome - newExpense;

        await supabase
          .from("projects")
          .update({
            total_income: newIncome,
            total_expense: newExpense,
            margin: newMargin,
          })
          .eq("id", project.id);

        setShowTransactionModal(false);
        setTransactionForm({
          type: "income",
          amount: "",
          category: "",
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

  const addIntervention = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !project) return;

      const { error } = await supabase
        .from("interventions")
        .insert({
          user_id: user.id,
          project_id: project.id,
          client_id: project.client?.id,
          title: interventionForm.title,
          description: interventionForm.description || null,
          scheduled_at: interventionForm.scheduled_at,
          location: interventionForm.location || null,
          status: "pending",
        });

      if (!error) {
        setShowInterventionModal(false);
        setInterventionForm({
          title: "",
          description: "",
          scheduled_at: new Date().toISOString().slice(0, 16),
          location: "",
        });
        fetchData();
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateDocumentStatus = async (docId: string, status: string) => {
    try {
      await supabase
        .from("documents")
        .update({ status })
        .eq("id", docId);
      fetchData();
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "ongoing": return colors.beninGreen;
      case "completed": return colors.deepBlue;
      case "cancelled": return colors.beninRed;
      case "sent": return colors.beninYellow;
      case "accepted": return colors.beninGreen;
      case "paid": return colors.beninGreen;
      case "done": return colors.beninGreen;
      case "pending": return colors.beninYellow;
      default: return colors.gray500;
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case "ongoing": return "En cours";
      case "completed": return "Terminé";
      case "cancelled": return "Annulé";
      case "draft": return "Brouillon";
      case "sent": return "Envoyé";
      case "accepted": return "Accepté";
      case "paid": return "Payé";
      case "pending": return "En attente";
      case "done": return "Effectué";
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: "100vh",
        backgroundColor: colors.gray50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <Loader2 size={32} style={{ animation: "spin 1s linear infinite", color: colors.deepBlue }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ backgroundColor: colors.gray50, minHeight: "100vh", padding: "80px 24px", textAlign: "center" }}>
        <h1 style={{ fontSize: "24px", color: colors.gray600 }}>Projet non trouvé</h1>
        <button onClick={() => router.push("/prestataire/projets")} style={{ marginTop: "16px", padding: "10px 20px", backgroundColor: colors.deepBlue, color: colors.white, border: "none", borderRadius: "8px", cursor: "pointer" }}>
          Retour aux projets
        </button>
      </div>
    );
  }

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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              onClick={() => router.push("/prestataire/projets")}
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
            <div>
              <h1 style={{
                fontSize: "28px",
                fontWeight: 700,
                fontFamily: "'Playfair Display', serif",
                color: colors.deepBlue,
                marginBottom: "4px",
              }}>
                {project.title}
              </h1>
              {project.client && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: colors.gray500, fontSize: "14px" }}>
                  <Users size={14} />
                  {project.client.name} • {project.client.phone}
                </div>
              )}
            </div>
          </div>
          <span style={{
            padding: "6px 12px",
            borderRadius: "20px",
            fontSize: "13px",
            backgroundColor: `${getStatusColor(project.status)}10`,
            color: getStatusColor(project.status),
          }}>
            {getStatusText(project.status)}
          </span>
        </div>

        {/* Infos projet */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "32px",
          padding: "20px",
          backgroundColor: colors.white,
          borderRadius: "16px",
          border: `1px solid ${colors.gray200}`,
        }}>
          <div>
            <div style={{ fontSize: "12px", color: colors.gray500, marginBottom: "4px" }}>Budget</div>
            <div style={{ fontSize: "20px", fontWeight: 600, color: colors.deepBlue }}>
              {project.budget.toLocaleString()} FCFA
            </div>
          </div>
          <div>
            <div style={{ fontSize: "12px", color: colors.gray500, marginBottom: "4px" }}>Revenus</div>
            <div style={{ fontSize: "20px", fontWeight: 600, color: colors.beninGreen }}>
              {project.total_income.toLocaleString()} FCFA
            </div>
          </div>
          <div>
            <div style={{ fontSize: "12px", color: colors.gray500, marginBottom: "4px" }}>Dépenses</div>
            <div style={{ fontSize: "20px", fontWeight: 600, color: colors.beninRed }}>
              {project.total_expense.toLocaleString()} FCFA
            </div>
          </div>
          <div>
            <div style={{ fontSize: "12px", color: colors.gray500, marginBottom: "4px" }}>Marge</div>
            <div style={{ fontSize: "20px", fontWeight: 600, color: project.margin >= 0 ? colors.beninGreen : colors.beninRed }}>
              {project.margin.toLocaleString()} FCFA
            </div>
          </div>
          <div>
            <div style={{ fontSize: "12px", color: colors.gray500, marginBottom: "4px" }}>Date de début</div>
            <div style={{ fontSize: "14px", color: colors.gray700 }}>
              {new Date(project.start_date).toLocaleDateString()}
            </div>
          </div>
          {project.end_date && (
            <div>
              <div style={{ fontSize: "12px", color: colors.gray500, marginBottom: "4px" }}>Date de fin</div>
              <div style={{ fontSize: "14px", color: colors.gray700 }}>
                {new Date(project.end_date).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>

        {project.description && (
          <div style={{
            backgroundColor: colors.white,
            padding: "16px 20px",
            borderRadius: "12px",
            border: `1px solid ${colors.gray200}`,
            marginBottom: "32px",
          }}>
            <div style={{ fontSize: "12px", color: colors.gray500, marginBottom: "8px" }}>Description</div>
            <p style={{ fontSize: "14px", color: colors.gray700, lineHeight: 1.5 }}>{project.description}</p>
          </div>
        )}

        {/* Actions rapides */}
        <div style={{
          display: "flex",
          gap: "12px",
          marginBottom: "32px",
          flexWrap: "wrap",
        }}>
          <button
            onClick={() => setShowDocumentModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              backgroundColor: colors.white,
              border: `1px solid ${colors.gray200}`,
              borderRadius: "10px",
              cursor: "pointer",
            }}
          >
            <FileText size={18} color={colors.deepBlue} />
            Générer document
          </button>
          <button
            onClick={() => setShowTransactionModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              backgroundColor: colors.white,
              border: `1px solid ${colors.gray200}`,
              borderRadius: "10px",
              cursor: "pointer",
            }}
          >
            <DollarSign size={18} color={colors.beninGreen} />
            Ajouter transaction
          </button>
          <button
            onClick={() => setShowInterventionModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              backgroundColor: colors.white,
              border: `1px solid ${colors.gray200}`,
              borderRadius: "10px",
              cursor: "pointer",
            }}
          >
            <Calendar size={18} color={colors.beninYellow} />
            Planifier intervention
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex",
          gap: "8px",
          borderBottom: `1px solid ${colors.gray200}`,
          marginBottom: "24px",
        }}>
          {[
            { id: "documents", label: "Documents", count: documents.length },
            { id: "transactions", label: "Transactions", count: transactions.length },
            { id: "interventions", label: "Interventions", count: interventions.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: "12px 20px",
                backgroundColor: "transparent",
                border: "none",
                borderBottom: activeTab === tab.id ? `2px solid ${colors.deepBlue}` : "2px solid transparent",
                color: activeTab === tab.id ? colors.deepBlue : colors.gray500,
                fontWeight: activeTab === tab.id ? 600 : 400,
                cursor: "pointer",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {tab.label}
              <span style={{
                fontSize: "12px",
                padding: "2px 6px",
                borderRadius: "12px",
                backgroundColor: colors.gray100,
                color: colors.gray600,
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Documents */}
        {activeTab === "documents" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {documents.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px", backgroundColor: colors.white, borderRadius: "12px", border: `1px solid ${colors.gray200}`, color: colors.gray500 }}>
                Aucun document. Cliquez sur "Générer document" pour commencer.
              </div>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    backgroundColor: colors.white,
                    padding: "16px 20px",
                    borderRadius: "12px",
                    border: `1px solid ${colors.gray200}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <FileText size={16} color={colors.deepBlue} />
                      <span style={{ fontWeight: 600, color: colors.gray800 }}>
                        {doc.type === "devis" ? "Devis" : doc.type === "facture" ? "Facture" : "Contrat"}
                      </span>
                      <span style={{
                        padding: "2px 8px",
                        borderRadius: "12px",
                        fontSize: "11px",
                        backgroundColor: `${getStatusColor(doc.status)}10`,
                        color: getStatusColor(doc.status),
                      }}>
                        {getStatusText(doc.status)}
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: colors.gray400 }}>
                      {new Date(doc.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {doc.status === "draft" && (
                      <>
                        <button
                          onClick={() => updateDocumentStatus(doc.id, "sent")}
                          style={{
                            padding: "6px 12px",
                            backgroundColor: `${colors.beninYellow}10`,
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "12px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <Send size={12} />
                          Envoyer
                        </button>
                      </>
                    )}
                    {doc.file_url && (
                      <>
                        <button
                          onClick={() => window.open(doc.file_url!, "_blank")}
                          style={{
                            padding: "6px",
                            backgroundColor: `${colors.deepBlue}10`,
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                          }}
                        >
                          <Eye size={14} color={colors.deepBlue} />
                        </button>
                        <button
                          onClick={() => {
                            const link = document.createElement("a");
                            link.href = doc.file_url!;
                            link.download = `${doc.type}_${doc.id}.pdf`;
                            link.click();
                          }}
                          style={{
                            padding: "6px",
                            backgroundColor: `${colors.beninGreen}10`,
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                          }}
                        >
                          <Download size={14} color={colors.beninGreen} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Transactions */}
        {activeTab === "transactions" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {transactions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px", backgroundColor: colors.white, borderRadius: "12px", border: `1px solid ${colors.gray200}`, color: colors.gray500 }}>
                Aucune transaction. Cliquez sur "Ajouter transaction" pour commencer.
              </div>
            ) : (
              transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  style={{
                    backgroundColor: colors.white,
                    padding: "16px 20px",
                    borderRadius: "12px",
                    border: `1px solid ${colors.gray200}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 600, color: transaction.type === "income" ? colors.beninGreen : colors.beninRed }}>
                        {transaction.type === "income" ? "+" : "-"}{transaction.amount.toLocaleString()} FCFA
                      </span>
                      {transaction.category && (
                        <span style={{ fontSize: "12px", color: colors.gray500 }}>{transaction.category}</span>
                      )}
                    </div>
                    <div style={{ fontSize: "12px", color: colors.gray400 }}>
                      {new Date(transaction.date).toLocaleDateString()}
                    </div>
                  </div>
                  {transaction.notes && (
                    <div style={{ fontSize: "11px", color: colors.gray400, maxWidth: "200px" }}>
                      {typeof transaction.notes === 'object' ? JSON.stringify(transaction.notes).slice(0, 50) : transaction.notes}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Interventions */}
        {activeTab === "interventions" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {interventions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px", backgroundColor: colors.white, borderRadius: "12px", border: `1px solid ${colors.gray200}`, color: colors.gray500 }}>
                Aucune intervention. Cliquez sur "Planifier intervention" pour commencer.
              </div>
            ) : (
              interventions.map((intervention) => (
                <div
                  key={intervention.id}
                  style={{
                    backgroundColor: colors.white,
                    padding: "16px 20px",
                    borderRadius: "12px",
                    border: `1px solid ${colors.gray200}`,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <div>
                      <div style={{ fontWeight: 600, color: colors.gray800 }}>{intervention.title}</div>
                      <div style={{ fontSize: "13px", color: colors.gray500 }}>{intervention.description}</div>
                    </div>
                    <span style={{
                      padding: "2px 8px",
                      borderRadius: "12px",
                      fontSize: "11px",
                      backgroundColor: `${getStatusColor(intervention.status)}10`,
                      color: getStatusColor(intervention.status),
                    }}>
                      {getStatusText(intervention.status)}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: colors.gray500, marginTop: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Calendar size={12} />
                      {new Date(intervention.scheduled_at).toLocaleString()}
                    </div>
                    {intervention.location && (
                      <div>{intervention.location}</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal Générer Document */}
      {showDocumentModal && (
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
            padding: "24px",
          }}>
            <h2 style={{ fontSize: "20px", fontWeight: 600, color: colors.deepBlue, marginBottom: "16px" }}>Générer un document</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => generateDocument(template.id, template.type)}
                  disabled={isGenerating}
                  style={{
                    padding: "16px",
                    backgroundColor: colors.gray50,
                    border: `1px solid ${colors.gray200}`,
                    borderRadius: "12px",
                    textAlign: "left",
                    cursor: isGenerating ? "not-allowed" : "pointer",
                    opacity: isGenerating ? 0.5 : 1,
                  }}
                >
                  <div style={{ fontWeight: 600, color: colors.gray800 }}>{template.name}</div>
                  <div style={{ fontSize: "12px", color: colors.gray500, marginTop: "4px" }}>
                    {template.type === "devis" ? "Devis" : template.type === "facture" ? "Facture" : "Contrat"}
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowDocumentModal(false)}
              style={{
                width: "100%",
                marginTop: "20px",
                padding: "12px",
                backgroundColor: colors.white,
                border: `1px solid ${colors.gray200}`,
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Modal Ajouter Transaction */}
      {showTransactionModal && (
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
            <div style={{ padding: "24px", borderBottom: `1px solid ${colors.gray100}` }}>
              <h2 style={{ fontSize: "20px", fontWeight: 600, color: colors.deepBlue }}>Nouvelle transaction</h2>
            </div>
            <form onSubmit={addTransaction} style={{ padding: "24px" }}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>Type</label>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    type="button"
                    onClick={() => setTransactionForm({ ...transactionForm, type: "income" })}
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: "8px",
                      border: `1px solid ${transactionForm.type === "income" ? colors.beninGreen : colors.gray200}`,
                      backgroundColor: transactionForm.type === "income" ? `${colors.beninGreen}10` : colors.white,
                      color: transactionForm.type === "income" ? colors.beninGreen : colors.gray600,
                      cursor: "pointer",
                    }}
                  >
                    Revenu
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransactionForm({ ...transactionForm, type: "expense" })}
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: "8px",
                      border: `1px solid ${transactionForm.type === "expense" ? colors.beninRed : colors.gray200}`,
                      backgroundColor: transactionForm.type === "expense" ? `${colors.beninRed}10` : colors.white,
                      color: transactionForm.type === "expense" ? colors.beninRed : colors.gray600,
                      cursor: "pointer",
                    }}
                  >
                    Dépense
                  </button>
                </div>
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>Montant (FCFA)</label>
                <input
                  type="number"
                  value={transactionForm.amount}
                  onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                  required
                  style={{ width: "100%", padding: "12px", border: `1px solid ${colors.gray200}`, borderRadius: "8px", outline: "none" }}
                />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>Catégorie</label>
                <input
                  type="text"
                  value={transactionForm.category}
                  onChange={(e) => setTransactionForm({ ...transactionForm, category: e.target.value })}
                  placeholder="Ex: Matériel, Transport, Honoraires..."
                  style={{ width: "100%", padding: "12px", border: `1px solid ${colors.gray200}`, borderRadius: "8px", outline: "none" }}
                />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>Date</label>
                <input
                  type="date"
                  value={transactionForm.date}
                  onChange={(e) => setTransactionForm({ ...transactionForm, date: e.target.value })}
                  style={{ width: "100%", padding: "12px", border: `1px solid ${colors.gray200}`, borderRadius: "8px", outline: "none" }}
                />
              </div>
              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>Notes</label>
                <textarea
                  value={transactionForm.notes}
                  onChange={(e) => setTransactionForm({ ...transactionForm, notes: e.target.value })}
                  rows={2}
                  style={{ width: "100%", padding: "12px", border: `1px solid ${colors.gray200}`, borderRadius: "8px", outline: "none", resize: "vertical" }}
                />
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => setShowTransactionModal(false)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    backgroundColor: colors.white,
                    border: `1px solid ${colors.gray200}`,
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    flex: 1,
                    padding: "12px",
                    backgroundColor: colors.deepBlue,
                    color: colors.white,
                    border: "none",
                    borderRadius: "8px",
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    opacity: isSubmitting ? 0.5 : 1,
                  }}
                >
                  {isSubmitting ? "Ajout..." : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Planifier Intervention */}
      {showInterventionModal && (
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
            <div style={{ padding: "24px", borderBottom: `1px solid ${colors.gray100}` }}>
              <h2 style={{ fontSize: "20px", fontWeight: 600, color: colors.deepBlue }}>Planifier une intervention</h2>
            </div>
            <form onSubmit={addIntervention} style={{ padding: "24px" }}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>Titre *</label>
                <input
                  type="text"
                  value={interventionForm.title}
                  onChange={(e) => setInterventionForm({ ...interventionForm, title: e.target.value })}
                  required
                  style={{ width: "100%", padding: "12px", border: `1px solid ${colors.gray200}`, borderRadius: "8px", outline: "none" }}
                />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>Description</label>
                <textarea
                  value={interventionForm.description}
                  onChange={(e) => setInterventionForm({ ...interventionForm, description: e.target.value })}
                  rows={3}
                  style={{ width: "100%", padding: "12px", border: `1px solid ${colors.gray200}`, borderRadius: "8px", outline: "none", resize: "vertical" }}
                />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>Date et heure *</label>
                <input
                  type="datetime-local"
                  value={interventionForm.scheduled_at}
                  onChange={(e) => setInterventionForm({ ...interventionForm, scheduled_at: e.target.value })}
                  required
                  style={{ width: "100%", padding: "12px", border: `1px solid ${colors.gray200}`, borderRadius: "8px", outline: "none" }}
                />
              </div>
              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>Lieu</label>
                <input
                  type="text"
                  value={interventionForm.location}
                  onChange={(e) => setInterventionForm({ ...interventionForm, location: e.target.value })}
                  placeholder="Adresse ou lieu de rendez-vous"
                  style={{ width: "100%", padding: "12px", border: `1px solid ${colors.gray200}`, borderRadius: "8px", outline: "none" }}
                />
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => setShowInterventionModal(false)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    backgroundColor: colors.white,
                    border: `1px solid ${colors.gray200}`,
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    flex: 1,
                    padding: "12px",
                    backgroundColor: colors.deepBlue,
                    color: colors.white,
                    border: "none",
                    borderRadius: "8px",
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    opacity: isSubmitting ? 0.5 : 1,
                  }}
                >
                  {isSubmitting ? "Planification..." : "Planifier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
