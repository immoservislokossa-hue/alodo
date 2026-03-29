"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/auth-helpers-nextjs";
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  FolderOpen,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  Users,
  Briefcase,
  DollarSign,
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
  client_id: string | null;
  client?: Client;
};

type Document = {
  id: string;
  type: "devis" | "facture" | "contrat";
  status: string;
  file_url: string | null;
  created_at: string;
};

export default function ProjetsPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  );
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showClientModal, setShowClientModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const [projectForm, setProjectForm] = useState({
    title: "",
    description: "",
    client_id: "",
    budget: "",
    start_date: new Date().toISOString().split("T")[0],
    status: "draft" as const,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Récupérer les projets avec leurs clients
      const { data: projectsData } = await supabase
        .from("projects")
        .select(`
          *,
          client:clients(*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // Récupérer tous les clients
      const { data: clientsData } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

      if (projectsData) setProjects(projectsData as Project[]);
      if (clientsData) setClients(clientsData);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("clients")
        .insert({
          user_id: user.id,
          name: formData.name,
          phone: formData.phone,
          email: formData.email || null,
          address: formData.address || null,
        });

      if (!error) {
        setShowClientModal(false);
        setFormData({ name: "", phone: "", email: "", address: "" });
        fetchData();
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          title: projectForm.title,
          description: projectForm.description || null,
          client_id: projectForm.client_id || null,
          budget: parseFloat(projectForm.budget) || 0,
          start_date: projectForm.start_date,
          status: projectForm.status,
        });

      if (!error) {
        setShowProjectModal(false);
        setProjectForm({
          title: "",
          description: "",
          client_id: "",
          budget: "",
          start_date: new Date().toISOString().split("T")[0],
          status: "draft",
        });
        fetchData();
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", id);

      if (!error) {
        setShowDeleteConfirm(null);
        fetchData();
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const handleDeleteClient = async (id: string) => {
    try {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", id);

      if (!error) {
        setShowDeleteConfirm(null);
        fetchData();
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case "ongoing": return colors.beninGreen;
      case "completed": return colors.deepBlue;
      case "cancelled": return colors.beninRed;
      default: return colors.gray500;
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case "ongoing": return <Clock size={14} />;
      case "completed": return <CheckCircle size={14} />;
      case "cancelled": return <XCircle size={14} />;
      default: return <FolderOpen size={14} />;
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case "ongoing": return "En cours";
      case "completed": return "Terminé";
      case "cancelled": return "Annulé";
      default: return "Brouillon";
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

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "80px 24px 40px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
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
              Projets & Clients
            </h1>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={() => setShowClientModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                backgroundColor: colors.white,
                color: colors.deepBlue,
                border: `1px solid ${colors.gray200}`,
                borderRadius: "10px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.gray50}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.white}
            >
              <Users size={18} />
              Nouveau client
            </button>
            <button
              onClick={() => setShowProjectModal(true)}
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
              Nouveau projet
            </button>
          </div>
        </div>

        {/* Stats rapides */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "32px",
        }}>
          <div style={{
            backgroundColor: colors.white,
            padding: "16px",
            borderRadius: "12px",
            border: `1px solid ${colors.gray200}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <Users size={16} color={colors.deepBlue} />
              <span style={{ fontSize: "12px", color: colors.gray500 }}>Clients</span>
            </div>
            <div style={{ fontSize: "24px", fontWeight: 600, color: colors.deepBlue }}>{clients.length}</div>
          </div>
          <div style={{
            backgroundColor: colors.white,
            padding: "16px",
            borderRadius: "12px",
            border: `1px solid ${colors.gray200}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <Briefcase size={16} color={colors.deepBlue} />
              <span style={{ fontSize: "12px", color: colors.gray500 }}>Projets</span>
            </div>
            <div style={{ fontSize: "24px", fontWeight: 600, color: colors.deepBlue }}>{projects.length}</div>
          </div>
          <div style={{
            backgroundColor: colors.white,
            padding: "16px",
            borderRadius: "12px",
            border: `1px solid ${colors.gray200}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <Clock size={16} color={colors.beninGreen} />
              <span style={{ fontSize: "12px", color: colors.gray500 }}>En cours</span>
            </div>
            <div style={{ fontSize: "24px", fontWeight: 600, color: colors.beninGreen }}>
              {projects.filter(p => p.status === "ongoing").length}
            </div>
          </div>
          <div style={{
            backgroundColor: colors.white,
            padding: "16px",
            borderRadius: "12px",
            border: `1px solid ${colors.gray200}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <DollarSign size={16} color={colors.beninGreen} />
              <span style={{ fontSize: "12px", color: colors.gray500 }}>Budget total</span>
            </div>
            <div style={{ fontSize: "24px", fontWeight: 600, color: colors.beninGreen }}>
              {projects.reduce((sum, p) => sum + p.budget, 0).toLocaleString()} FCFA
            </div>
          </div>
        </div>

        {/* Section Clients */}
        <div style={{ marginBottom: "48px" }}>
          <h2 style={{
            fontSize: "20px",
            fontWeight: 600,
            color: colors.deepBlue,
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            <Users size={20} />
            Clients
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "12px",
          }}>
            {clients.map((client) => (
              <div
                key={client.id}
                style={{
                  backgroundColor: colors.white,
                  padding: "16px",
                  borderRadius: "12px",
                  border: `1px solid ${colors.gray200}`,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)"}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 600, color: colors.gray800 }}>{client.name}</div>
                    <div style={{ fontSize: "13px", color: colors.gray500 }}>{client.phone}</div>
                    {client.email && <div style={{ fontSize: "12px", color: colors.gray400 }}>{client.email}</div>}
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => {
                        setProjectForm({ ...projectForm, client_id: client.id });
                        setShowProjectModal(true);
                      }}
                      style={{
                        padding: "6px",
                        backgroundColor: `${colors.deepBlue}10`,
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}
                      title="Créer un projet"
                    >
                      <Plus size={14} color={colors.deepBlue} />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(client.id)}
                      style={{
                        padding: "6px",
                        backgroundColor: `${colors.beninRed}10`,
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}
                      title="Supprimer"
                    >
                      <Trash2 size={14} color={colors.beninRed} />
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: "11px", color: colors.gray400, marginTop: "8px" }}>
                  {projects.filter(p => p.client_id === client.id).length} projet(s)
                </div>
              </div>
            ))}
            {clients.length === 0 && (
              <div style={{
                backgroundColor: colors.white,
                padding: "40px",
                borderRadius: "12px",
                border: `1px solid ${colors.gray200}`,
                textAlign: "center",
                color: colors.gray500,
              }}>
                Aucun client. Cliquez sur "Nouveau client" pour commencer.
              </div>
            )}
          </div>
        </div>

        {/* Section Projets */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
            <h2 style={{
              fontSize: "20px",
              fontWeight: 600,
              color: colors.deepBlue,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
              <Briefcase size={20} />
              Projets
            </h2>
            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ position: "relative" }}>
                <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: colors.gray400 }} />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    padding: "8px 12px 8px 36px",
                    border: `1px solid ${colors.gray200}`,
                    borderRadius: "8px",
                    fontSize: "14px",
                    width: "200px",
                    outline: "none",
                  }}
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: "8px 12px",
                  border: `1px solid ${colors.gray200}`,
                  borderRadius: "8px",
                  fontSize: "14px",
                  backgroundColor: colors.white,
                  outline: "none",
                }}
              >
                <option value="all">Tous les statuts</option>
                <option value="draft">Brouillon</option>
                <option value="ongoing">En cours</option>
                <option value="completed">Terminé</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                style={{
                  backgroundColor: colors.white,
                  padding: "16px 20px",
                  borderRadius: "12px",
                  border: `1px solid ${colors.gray200}`,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onClick={() => router.push(`/prestataire/projets/${project.id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";
                  e.currentTarget.style.borderColor = colors.deepBlue;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = colors.gray200;
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <h3 style={{ fontWeight: 600, color: colors.gray800 }}>{project.title}</h3>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "2px 8px",
                        borderRadius: "20px",
                        fontSize: "11px",
                        backgroundColor: `${getStatusColor(project.status)}10`,
                        color: getStatusColor(project.status),
                      }}>
                        {getStatusIcon(project.status)}
                        {getStatusText(project.status)}
                      </span>
                    </div>
                    {project.client && (
                      <div style={{ fontSize: "13px", color: colors.gray500 }}>
                        Client: {project.client.name}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "8px" }} onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        setSelectedProject(project);
                        setShowProjectModal(true);
                      }}
                      style={{
                        padding: "6px",
                        backgroundColor: `${colors.deepBlue}10`,
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}
                      title="Modifier"
                    >
                      <Edit size={14} color={colors.deepBlue} />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(project.id)}
                      style={{
                        padding: "6px",
                        backgroundColor: `${colors.beninRed}10`,
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}
                      title="Supprimer"
                    >
                      <Trash2 size={14} color={colors.beninRed} />
                    </button>
                  </div>
                </div>
                {project.description && (
                  <div style={{ fontSize: "13px", color: colors.gray500, marginBottom: "12px" }}>
                    {project.description}
                  </div>
                )}
                <div style={{ display: "flex", gap: "24px", fontSize: "13px", color: colors.gray600 }}>
                  <div>Budget: {project.budget.toLocaleString()} FCFA</div>
                  <div>Revenus: {project.total_income.toLocaleString()} FCFA</div>
                  <div>Marge: {project.margin.toLocaleString()} FCFA</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Calendar size={12} />
                    {new Date(project.start_date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
            {filteredProjects.length === 0 && (
              <div style={{
                backgroundColor: colors.white,
                padding: "60px",
                borderRadius: "12px",
                border: `1px solid ${colors.gray200}`,
                textAlign: "center",
                color: colors.gray500,
              }}>
                Aucun projet trouvé.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Nouveau Client */}
      {showClientModal && (
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
              <h2 style={{ fontSize: "20px", fontWeight: 600, color: colors.deepBlue }}>Nouveau client</h2>
              <button onClick={() => setShowClientModal(false)} style={{ padding: "8px", background: "transparent", border: "none", cursor: "pointer" }}>
                <XCircle size={20} color={colors.gray500} />
              </button>
            </div>
            <form onSubmit={handleCreateClient} style={{ padding: "24px" }}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px", color: colors.gray700 }}>Nom complet *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{ width: "100%", padding: "12px", border: `1px solid ${colors.gray200}`, borderRadius: "10px", outline: "none" }}
                />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px", color: colors.gray700 }}>Téléphone *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  style={{ width: "100%", padding: "12px", border: `1px solid ${colors.gray200}`, borderRadius: "10px", outline: "none" }}
                />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px", color: colors.gray700 }}>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{ width: "100%", padding: "12px", border: `1px solid ${colors.gray200}`, borderRadius: "10px", outline: "none" }}
                />
              </div>
              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px", color: colors.gray700 }}>Adresse</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                  style={{ width: "100%", padding: "12px", border: `1px solid ${colors.gray200}`, borderRadius: "10px", outline: "none", resize: "vertical" }}
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: "100%",
                  padding: "14px",
                  backgroundColor: colors.deepBlue,
                  color: colors.white,
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: 500,
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  opacity: isSubmitting ? 0.5 : 1,
                }}
              >
                {isSubmitting ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite", margin: "0 auto" }} /> : "Créer le client"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nouveau/Modifier Projet */}
      {showProjectModal && (
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
            maxWidth: "600px",
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
                {selectedProject ? "Modifier le projet" : "Nouveau projet"}
              </h2>
              <button onClick={() => {
                setShowProjectModal(false);
                setSelectedProject(null);
                setProjectForm({
                  title: "",
                  description: "",
                  client_id: "",
                  budget: "",
                  start_date: new Date().toISOString().split("T")[0],
                  status: "draft",
                });
              }} style={{ padding: "8px", background: "transparent", border: "none", cursor: "pointer" }}>
                <XCircle size={20} color={colors.gray500} />
              </button>
            </div>
            <form onSubmit={handleCreateProject} style={{ padding: "24px" }}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px", color: colors.gray700 }}>Titre du projet *</label>
                <input
                  type="text"
                  value={projectForm.title}
                  onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                  required
                  style={{ width: "100%", padding: "12px", border: `1px solid ${colors.gray200}`, borderRadius: "10px", outline: "none" }}
                />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px", color: colors.gray700 }}>Description</label>
                <textarea
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  rows={3}
                  style={{ width: "100%", padding: "12px", border: `1px solid ${colors.gray200}`, borderRadius: "10px", outline: "none", resize: "vertical" }}
                />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px", color: colors.gray700 }}>Client</label>
                <select
                  value={projectForm.client_id}
                  onChange={(e) => setProjectForm({ ...projectForm, client_id: e.target.value })}
                  style={{ width: "100%", padding: "12px", border: `1px solid ${colors.gray200}`, borderRadius: "10px", outline: "none", backgroundColor: colors.white }}
                >
                  <option value="">Sélectionner un client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px", color: colors.gray700 }}>Budget (FCFA)</label>
                <input
                  type="number"
                  value={projectForm.budget}
                  onChange={(e) => setProjectForm({ ...projectForm, budget: e.target.value })}
                  style={{ width: "100%", padding: "12px", border: `1px solid ${colors.gray200}`, borderRadius: "10px", outline: "none" }}
                />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px", color: colors.gray700 }}>Date de début</label>
                <input
                  type="date"
                  value={projectForm.start_date}
                  onChange={(e) => setProjectForm({ ...projectForm, start_date: e.target.value })}
                  style={{ width: "100%", padding: "12px", border: `1px solid ${colors.gray200}`, borderRadius: "10px", outline: "none" }}
                />
              </div>
              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px", color: colors.gray700 }}>Statut</label>
                <select
                  value={projectForm.status}
                  onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value as any })}
                  style={{ width: "100%", padding: "12px", border: `1px solid ${colors.gray200}`, borderRadius: "10px", outline: "none", backgroundColor: colors.white }}
                >
                  <option value="draft">Brouillon</option>
                  <option value="ongoing">En cours</option>
                  <option value="completed">Terminé</option>
                  <option value="cancelled">Annulé</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: "100%",
                  padding: "14px",
                  backgroundColor: colors.deepBlue,
                  color: colors.white,
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: 500,
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  opacity: isSubmitting ? 0.5 : 1,
                }}
              >
                {isSubmitting ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite", margin: "0 auto" }} /> : (selectedProject ? "Modifier" : "Créer le projet")}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmation Suppression */}
      {showDeleteConfirm && (
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
            maxWidth: "400px",
            padding: "24px",
            textAlign: "center",
          }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "24px",
              backgroundColor: `${colors.beninRed}10`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <Trash2 size={24} color={colors.beninRed} />
            </div>
            <h3 style={{ fontSize: "18px", fontWeight: 600, color: colors.gray800, marginBottom: "8px" }}>Confirmer la suppression</h3>
            <p style={{ fontSize: "14px", color: colors.gray500, marginBottom: "24px" }}>
              Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setShowDeleteConfirm(null)}
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
                onClick={() => {
                  const isClient = clients.some(c => c.id === showDeleteConfirm);
                  if (isClient) {
                    handleDeleteClient(showDeleteConfirm);
                  } else {
                    handleDeleteProject(showDeleteConfirm);
                  }
                }}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: colors.beninRed,
                  color: colors.white,
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
