"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/src/lib/supabase/browser";
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  Eye,
  Loader2,
  Users,
  Briefcase,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  TrendingDown
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
  created_at: string;
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
  project: Project | null;
  client: Client | null;
};

type Transaction = {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string | null;
  notes: any;
  date: string;
  created_at: string;
  project_id: string | null;
  projects?: Project;
};

type Stats = {
  total_clients: number;
  total_projects: number;
  total_income: number;
  total_expense: number;
  balance: number;
  ongoing_projects: number;
  completed_projects: number;
  draft_documents: number;
  sent_documents: number;
};

export default function RapportsPage() {
  const router = useRouter();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats>({
    total_clients: 0,
    total_projects: 0,
    total_income: 0,
    total_expense: 0,
    balance: 0,
    ongoing_projects: 0,
    completed_projects: 0,
    draft_documents: 0,
    sent_documents: 0,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"clients" | "projects" | "documents" | "transactions">("clients");

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Récupérer les clients
      const { data: clientsData } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // Récupérer les projets avec les clients
      const { data: projectsData } = await supabase
        .from("projects")
        .select(`
          *,
          client:clients(*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // Récupérer les documents avec les projets et clients
      const { data: documentsData } = await supabase
        .from("documents")
        .select(`
          *,
          project:projects(*),
          client:clients(*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // Récupérer les transactions avec les projets
      const { data: transactionsData } = await supabase
        .from("service_transactions")
        .select(`
          *,
          projects(*)
        `)
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (clientsData) setClients(clientsData);
      if (projectsData) setProjects(projectsData as Project[]);
      if (documentsData) setDocuments(documentsData as Document[]);
      if (transactionsData) setTransactions(transactionsData as Transaction[]);

      // Calculer les statistiques
      const total_income = (transactionsData || [])
        .filter((t: any) => t.type === "income")
        .reduce((sum: number, t: any) => sum + t.amount, 0);
      
      const total_expense = (transactionsData || [])
        .filter((t: any) => t.type === "expense")
        .reduce((sum: number, t: any) => sum + t.amount, 0);

      const ongoing_projects = (projectsData || []).filter((p: any) => p.status === "ongoing").length;
      const completed_projects = (projectsData || []).filter((p: any) => p.status === "completed").length;
      
      const draft_documents = (documentsData || []).filter((d: any) => d.status === "draft").length;
      const sent_documents = (documentsData || []).filter((d: any) => d.status === "sent" || d.status === "accepted").length;

      setStats({
        total_clients: clientsData?.length || 0,
        total_projects: projectsData?.length || 0,
        total_income,
        total_expense,
        balance: total_income - total_expense,
        ongoing_projects,
        completed_projects,
        draft_documents,
        sent_documents,
      });

    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "ongoing": return colors.beninGreen;
      case "completed": return colors.deepBlue;
      case "cancelled": return colors.beninRed;
      case "draft": return colors.gray500;
      case "sent": return colors.beninYellow;
      case "accepted": return colors.beninGreen;
      case "paid": return colors.beninGreen;
      case "pending": return colors.beninYellow;
      case "done": return colors.beninGreen;
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

  const getProjectStats = (projectId: string) => {
    const projectTransactions = transactions.filter(t => t.project_id === projectId);
    const income = projectTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    const expense = projectTransactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, margin: income - expense };
  };

  const exportData = async (format: "pdf" | "csv") => {
    if (format === "csv") {
      const headers = ["Date", "Type", "Montant", "Catégorie", "Projet"];
      const rows = transactions.map(t => [
        new Date(t.date).toLocaleDateString("fr-FR"),
        t.type === "income" ? "Revenu" : "Dépense",
        t.amount,
        t.category || "N/A",
        t.projects?.title || "N/A",
      ]);
      const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rapports_prestataire_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      try {
        const html2pdf = (await import("html2pdf.js")).default;
        const getCurrentDate = () => {
          const d = new Date();
          return d.toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
        };

        const projectsWithStats = projects.map(p => ({
          ...p,
          stats: getProjectStats(p.id)
        }));

        const element = document.createElement("div");
        element.innerHTML = `
          <div style="font-family: 'Courier New', monospace; font-size: 11px; line-height: 1.4; color: #000;">
            <!-- En-tête -->
            <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 15px;">
              <h1 style="margin: 0; font-size: 16px; font-weight: bold;">RAPPORT D'ACTIVITÉ PRESTATAIRE</h1>
              <p style="margin: 5px 0; font-size: 10px;">Période d'activité - ${getCurrentDate()}</p>
            </div>

            <!-- Résumé global -->
            <div style="margin-bottom: 20px; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 12px 0;">
              <h2 style="font-size: 12px; font-weight: bold; margin: 0 0 8px 0;">BILAN FINANCIER GLOBAL</h2>
              <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
                <tr>
                  <td style="padding: 5px 4px; width: 70%;">TOTAL REVENUS</td>
                  <td style="padding: 5px 4px; text-align: right; border-right: 1px solid #000; font-weight: bold; width: 15%;">${stats.total_income.toLocaleString("fr-FR")}</td>
                  <td style="padding: 5px 4px; width: 15%;"></td>
                </tr>
                <tr style="border-top: 1px solid #ddd;">
                  <td style="padding: 5px 4px;">TOTAL DÉPENSES</td>
                  <td style="padding: 5px 4px; text-align: right; border-right: 1px solid #000;"></td>
                  <td style="padding: 5px 4px; text-align: right; font-weight: bold;">${stats.total_expense.toLocaleString("fr-FR")}</td>
                </tr>
                <tr style="border-top: 2px solid #000; border-bottom: 2px solid #000;">
                  <td style="padding: 8px 4px; font-weight: bold;">MARGE GLOBALE</td>
                  <td style="padding: 8px 4px; text-align: right; border-right: 1px solid #000; font-weight: bold;">${stats.balance >= 0 ? stats.balance.toLocaleString("fr-FR") : "-"}</td>
                  <td style="padding: 8px 4px; text-align: right; font-weight: bold;">${stats.balance < 0 ? Math.abs(stats.balance).toLocaleString("fr-FR") : "-"}</td>
                </tr>
              </table>
            </div>

            <!-- Détail par projet -->
            <div style="margin-bottom: 20px;">
              <h2 style="font-size: 12px; font-weight: bold; margin: 10px 0 8px 0; border-bottom: 1px solid #000; padding-bottom: 5px;">DÉTAIL PAR PROJET</h2>
              <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
                <thead>
                  <tr style="border-bottom: 2px solid #000;">
                    <th style="padding: 6px 4px; text-align: left; border-right: 1px solid #999;">PROJET</th>
                    <th style="padding: 6px 4px; text-align: right; border-right: 1px solid #999;">REVENUS</th>
                    <th style="padding: 6px 4px; text-align: right; border-right: 1px solid #999;">DÉPENSES</th>
                    <th style="padding: 6px 4px; text-align: right; border-right: 1px solid #999;">MARGE</th>
                    <th style="padding: 6px 4px; text-align: left;">STATUT</th>
                  </tr>
                </thead>
                <tbody>
                  ${projectsWithStats.map(p => `
                    <tr style="border-bottom: 1px solid #ddd;">
                      <td style="padding: 4px 4px; border-right: 1px solid #ddd; font-weight: bold;">${p.title}</td>
                      <td style="padding: 4px 4px; text-align: right; border-right: 1px solid #ddd; color: #008751; font-weight: bold;">+${p.stats.income.toLocaleString("fr-FR")}</td>
                      <td style="padding: 4px 4px; text-align: right; border-right: 1px solid #ddd; color: #E8112D; font-weight: bold;">-${p.stats.expense.toLocaleString("fr-FR")}</td>
                      <td style="padding: 4px 4px; text-align: right; border-right: 1px solid #ddd; font-weight: bold; color: ${p.stats.margin >= 0 ? '#008751' : '#E8112D'};">${p.stats.margin >= 0 ? '+' : ''}${p.stats.margin.toLocaleString("fr-FR")}</td>
                      <td style="padding: 4px 4px; text-transform: capitalize;">${p.status}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>

            <!-- Historique des transactions -->
            <div style="margin-bottom: 20px;">
              <h2 style="font-size: 12px; font-weight: bold; margin: 10px 0 8px 0; border-bottom: 1px solid #000; padding-bottom: 5px;">HISTORIQUE DES TRANSACTIONS</h2>
              <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
                <thead>
                  <tr style="border-bottom: 2px solid #000;">
                    <th style="padding: 4px 3px; text-align: left; border-right: 1px solid #999;">DATE</th>
                    <th style="padding: 4px 3px; text-align: left; border-right: 1px solid #999;">TYPE</th>
                    <th style="padding: 4px 3px; text-align: left; border-right: 1px solid #999;">CATÉGORIE</th>
                    <th style="padding: 4px 3px; text-align: left; border-right: 1px solid #999;">PROJET</th>
                    <th style="padding: 4px 3px; text-align: right;">MONTANT</th>
                  </tr>
                </thead>
                <tbody>
                  ${transactions.map(t => `
                    <tr style="border-bottom: 1px solid #ddd;">
                      <td style="padding: 3px 3px; border-right: 1px solid #ddd;">${new Date(t.date).toLocaleDateString("fr-FR")}</td>
                      <td style="padding: 3px 3px; border-right: 1px solid #ddd; text-transform: uppercase; font-weight: ${t.type === "income" ? "bold" : "normal"}; color: ${t.type === "income" ? "#008751" : "#E8112D"};">${t.type === "income" ? "REVENU" : "DÉPENSE"}</td>
                      <td style="padding: 3px 3px; border-right: 1px solid #ddd;">${t.category || "N/A"}</td>
                      <td style="padding: 3px 3px; border-right: 1px solid #ddd;">${t.projects?.title || "N/A"}</td>
                      <td style="padding: 3px 3px; text-align: right; font-weight: bold;">${t.amount.toLocaleString("fr-FR")}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>

            <!-- Statistiques -->
            <div style="margin-bottom: 15px;">
              <h2 style="font-size: 12px; font-weight: bold; margin: 0 0 8px 0; border-bottom: 1px solid #000; padding-bottom: 5px;">STATISTIQUES GÉNÉRALES</h2>
              <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
                <tr>
                  <td style="padding: 4px 4px; width: 50%;">Nombre de clients</td>
                  <td style="padding: 4px 4px; text-align: right; font-weight: bold;">${stats.total_clients}</td>
                </tr>
                <tr style="border-top: 1px solid #ddd;">
                  <td style="padding: 4px 4px;">Nombre de projets</td>
                  <td style="padding: 4px 4px; text-align: right; font-weight: bold;">${stats.total_projects}</td>
                </tr>
                <tr style="border-top: 1px solid #ddd;">
                  <td style="padding: 4px 4px;">Projets en cours</td>
                  <td style="padding: 4px 4px; text-align: right; font-weight: bold;">${stats.ongoing_projects}</td>
                </tr>
                <tr style="border-top: 1px solid #ddd;">
                  <td style="padding: 4px 4px;">Projets terminés</td>
                  <td style="padding: 4px 4px; text-align: right; font-weight: bold;">${stats.completed_projects}</td>
                </tr>
                <tr style="border-top: 1px solid #ddd;">
                  <td style="padding: 4px 4px;">Nombre de transactions</td>
                  <td style="padding: 4px 4px; text-align: right; font-weight: bold;">${transactions.length}</td>
                </tr>
                <tr style="border-top: 1px solid #ddd;">
                  <td style="padding: 4px 4px;">Taux de rentabilité</td>
                  <td style="padding: 4px 4px; text-align: right; font-weight: bold;">${stats.total_income > 0 ? ((stats.balance / stats.total_income) * 100).toFixed(1) : "0"}%</td>
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
        await html2pdf().set({ margin: 5, filename: `rapport_prestataire_${new Date().toISOString().split("T")[0]}.pdf` }).from(element).save();
      } catch (err) {
        console.error("Erreur PDF:", err);
        alert("Erreur lors de l'export PDF");
      }
    }
  };

  const renderStatsCards = () => (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
      gap: "16px",
      marginBottom: "32px",
    }}>
      <div style={{
        backgroundColor: colors.white,
        padding: "20px",
        borderRadius: "16px",
        border: `1px solid ${colors.gray200}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <Users size={18} color={colors.deepBlue} />
          <span style={{ fontSize: "13px", color: colors.gray500 }}>Clients</span>
        </div>
        <div style={{ fontSize: "28px", fontWeight: 600, color: colors.deepBlue }}>
          {stats.total_clients}
        </div>
      </div>

      <div style={{
        backgroundColor: colors.white,
        padding: "20px",
        borderRadius: "16px",
        border: `1px solid ${colors.gray200}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <Briefcase size={18} color={colors.deepBlue} />
          <span style={{ fontSize: "13px", color: colors.gray500 }}>Projets</span>
        </div>
        <div style={{ fontSize: "28px", fontWeight: 600, color: colors.deepBlue }}>
          {stats.total_projects}
        </div>
        <div style={{ fontSize: "12px", color: colors.gray400, marginTop: "4px" }}>
          {stats.ongoing_projects} en cours · {stats.completed_projects} terminés
        </div>
      </div>

      <div style={{
        backgroundColor: colors.white,
        padding: "20px",
        borderRadius: "16px",
        border: `1px solid ${colors.gray200}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <DollarSign size={18} color={colors.beninGreen} />
          <span style={{ fontSize: "13px", color: colors.gray500 }}>Revenus</span>
        </div>
        <div style={{ fontSize: "28px", fontWeight: 600, color: colors.beninGreen }}>
          {stats.total_income.toLocaleString()} FCFA
        </div>
      </div>

      <div style={{
        backgroundColor: colors.white,
        padding: "20px",
        borderRadius: "16px",
        border: `1px solid ${colors.gray200}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <FileText size={18} color={colors.beninRed} />
          <span style={{ fontSize: "13px", color: colors.gray500 }}>Documents</span>
        </div>
        <div style={{ fontSize: "28px", fontWeight: 600, color: colors.deepBlue }}>
          {documents.length}
        </div>
        <div style={{ fontSize: "12px", color: colors.gray400, marginTop: "4px" }}>
          {stats.draft_documents} brouillons · {stats.sent_documents} envoyés
        </div>
      </div>

      <div style={{
        backgroundColor: colors.white,
        padding: "20px",
        borderRadius: "16px",
        border: `1px solid ${colors.gray200}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <DollarSign size={18} color={colors.beninRed} />
          <span style={{ fontSize: "13px", color: colors.gray500 }}>Dépenses</span>
        </div>
        <div style={{ fontSize: "28px", fontWeight: 600, color: colors.beninRed }}>
          {stats.total_expense.toLocaleString()} FCFA
        </div>
      </div>
    </div>
  );

  const renderTabs = () => (
    <div style={{
      display: "flex",
      gap: "4px",
      borderBottom: `1px solid ${colors.gray200}`,
      marginBottom: "24px",
      overflowX: "auto",
    }}>
      {[
        { id: "clients", label: "Clients", count: clients.length },
        { id: "projects", label: "Projets", count: projects.length },
        { id: "documents", label: "Documents", count: documents.length },
        { id: "transactions", label: "Transactions", count: transactions.length }
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
            transition: "all 0.2s",
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
  );

  const renderClients = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {clients.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px", color: colors.gray500 }}>
          Aucun client
        </div>
      ) : (
        clients.map((client) => (
          <div
            key={client.id}
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
              <div style={{ fontWeight: 600, color: colors.gray800 }}>{client.name}</div>
              <div style={{ fontSize: "13px", color: colors.gray500 }}>{client.phone}</div>
              {client.email && <div style={{ fontSize: "12px", color: colors.gray400 }}>{client.email}</div>}
              <div style={{ fontSize: "11px", color: colors.gray400, marginTop: "4px" }}>
                Inscrit le {new Date(client.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderProjects = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {projects.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px", color: colors.gray500 }}>
          Aucun projet
        </div>
      ) : (
        projects.map((project) => (
          <div
            key={project.id}
            style={{
              backgroundColor: colors.white,
              padding: "16px 20px",
              borderRadius: "12px",
              border: `1px solid ${colors.gray200}`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
              <div>
                <div style={{ fontWeight: 600, color: colors.gray800 }}>{project.title}</div>
                {project.client && (
                  <div style={{ fontSize: "13px", color: colors.gray500 }}>Client: {project.client.name}</div>
                )}
              </div>
              <span style={{
                padding: "4px 8px",
                borderRadius: "20px",
                fontSize: "11px",
                backgroundColor: `${getStatusColor(project.status)}10`,
                color: getStatusColor(project.status),
              }}>
                {getStatusText(project.status)}
              </span>
            </div>
            {project.description && (
              <div style={{ fontSize: "13px", color: colors.gray500, marginBottom: "12px" }}>
                {project.description}
              </div>
            )}
            <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: colors.gray600 }}>
              {project.budget > 0 && (
                <div>Budget: {project.budget.toLocaleString()} FCFA</div>
              )}
              {project.total_income > 0 && (
                <div>Revenus: {project.total_income.toLocaleString()} FCFA</div>
              )}
              <div>Marge: {project.margin.toLocaleString()} FCFA</div>
            </div>
            <div style={{ fontSize: "11px", color: colors.gray400, marginTop: "8px" }}>
              Début: {new Date(project.start_date).toLocaleDateString()}
              {project.end_date && ` · Fin: ${new Date(project.end_date).toLocaleDateString()}`}
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderDocuments = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {documents.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px", color: colors.gray500 }}>
          Aucun document
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
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <span style={{ fontWeight: 600, color: colors.gray800 }}>
                  {doc.type === "devis" ? "Devis" : doc.type === "facture" ? "Facture" : "Contrat"}
                </span>
                <span style={{
                  padding: "2px 6px",
                  borderRadius: "12px",
                  fontSize: "10px",
                  backgroundColor: `${getStatusColor(doc.status)}10`,
                  color: getStatusColor(doc.status),
                }}>
                  {getStatusText(doc.status)}
                </span>
              </div>
              {doc.project && (
                <div style={{ fontSize: "13px", color: colors.gray500 }}>Projet: {doc.project.title}</div>
              )}
              {doc.client && (
                <div style={{ fontSize: "13px", color: colors.gray500 }}>Client: {doc.client.name}</div>
              )}
              <div style={{ fontSize: "11px", color: colors.gray400, marginTop: "4px" }}>
                {new Date(doc.created_at).toLocaleDateString()}
              </div>
            </div>
            {doc.file_url && (
              <button
                onClick={() => window.open(doc.file_url!, "_blank")}
                style={{
                  padding: "8px",
                  backgroundColor: `${colors.deepBlue}10`,
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                <Eye size={16} color={colors.deepBlue} />
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );

  const renderTransactions = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {transactions.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px", color: colors.gray500 }}>
          Aucune transaction
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
              {transaction.projects && (
                <div style={{ fontSize: "13px", color: colors.gray500 }}>Projet: {transaction.projects.title}</div>
              )}
              <div style={{ fontSize: "11px", color: colors.gray400 }}>
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
  );

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
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
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
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontSize: "28px",
              fontWeight: 700,
              fontFamily: "'Playfair Display', serif",
              color: colors.deepBlue,
            }}>
              Rapports
            </h1>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={() => exportData("csv")}
              disabled={transactions.length === 0}
              style={{
                padding: "10px 16px",
                background: colors.white,
                border: `1px solid ${colors.gray200}`,
                borderRadius: "12px",
                color: colors.gray600,
                cursor: transactions.length === 0 ? "not-allowed" : "pointer",
                opacity: transactions.length === 0 ? 0.5 : 1,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s",
              }}
            >
              <Download size={16} />
              CSV
            </button>
            <button
              onClick={() => exportData("pdf")}
              disabled={transactions.length === 0}
              style={{
                padding: "10px 16px",
                background: colors.deepBlue,
                border: "none",
                borderRadius: "12px",
                color: colors.white,
                cursor: transactions.length === 0 ? "not-allowed" : "pointer",
                opacity: transactions.length === 0 ? 0.5 : 1,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s",
              }}
            >
              <Download size={16} />
              PDF
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {renderStatsCards()}

        {/* Tabs */}
        {renderTabs()}

        {/* Content */}
        {activeTab === "clients" && renderClients()}
        {activeTab === "projects" && renderProjects()}
        {activeTab === "documents" && renderDocuments()}
        {activeTab === "transactions" && renderTransactions()}
      </div>
    </div>
  );
}
