// app/(dashboard)/(archetypes)/prestataire/documents/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import supabase from "@/src/lib/supabase/browser";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  X,
  Trash2,
  Plus,
  Calendar,
  Loader2,
  Printer,
  Download,
  User,
  Briefcase,
  TestTube
} from "lucide-react";

// Dynamically import html2pdf only on client side
const loadHtml2pdf = async () => {
  try {
    const module = await import("html2pdf.js");
    return module.default || module;
  } catch (error) {
    console.error("Erreur lors du chargement de html2pdf:", error);
    return null;
  }
};

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

interface Document {
  id: string;
  user_id: string;
  type: "devis" | "facture" | "contrat";
  status: "draft" | "sent" | "accepted" | "rejected" | "paid";
  data: Record<string, any>;
  file_url: string | null;
  created_at: string;
  project_id: string | null;
  template_id: string | null;
  client_id: string | null;
  clients?: Client;
  projects?: Project;
}

interface DocumentTemplate {
  id: string;
  user_id: string | null;
  name: string;
  type: "devis" | "facture" | "contrat";
  html_template: string;
  variables: Record<string, string> | any[];
  created_at: string;
}

interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: Record<string, any> | null;
  created_at: string;
}

interface Project {
  id: string;
  user_id: string;
  client_id: string | null;
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
}

interface Item {
  designation: string;
  description: string;
  quantite: number;
  prix_unitaire: number;
  total: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  draft: { label: "Brouillon", color: colors.gray600, bgColor: `${colors.gray200}` },
  sent: { label: "Envoyé", color: colors.beninYellow, bgColor: `${colors.beninYellow}20` },
  accepted: { label: "Accepté", color: colors.beninGreen, bgColor: `${colors.beninGreen}20` },
  rejected: { label: "Rejeté", color: colors.beninRed, bgColor: `${colors.beninRed}20` },
  paid: { label: "Payé", color: colors.deepBlue, bgColor: `${colors.deepBlue}20` },
};

const DOCUMENT_TYPES = [
  { value: "devis" as const, label: "DEVIS", color: colors.beninGreen, icon: FileText },
  { value: "facture" as const, label: "FACTURE", color: colors.beninYellow, icon: FileText },
  { value: "contrat" as const, label: "CONTRAT", color: colors.deepBlue, icon: FileText },
];

// Données de test pour un plombier
const PLOMBIER_TEST_DATA = {
  devis: {
    client: {
      name: "Jean Dupont",
      email: "jean.dupont@email.com",
      phone: "+229 97 00 00 00",
      address: "Cotonou, Bénin",
    },
    items: [
      { designation: "Réparation fuite d'eau", description: "Réparation d'une fuite sur canalisation principale", quantite: 1, prix_unitaire: 25000 },
      { designation: "Remplacement robinet", description: "Installation d'un nouveau robinet mitigeur", quantite: 2, prix_unitaire: 15000 },
      { designation: "Débouchage canalisation", description: "Débouchage mécanique des canalisations", quantite: 1, prix_unitaire: 20000 },
      { designation: "Main d'œuvre", description: "Main d'œuvre qualifiée", quantite: 4, prix_unitaire: 5000 },
    ],
    variables: {
      objet: "Travaux de plomberie - Rénovation salle de bain",
      conditions: "Paiement à réception de la facture. Garantie 6 mois sur les travaux.",
      validite: "30 jours",
      delai_livraison: "5 jours ouvrés",
    }
  },
  facture: {
    client: {
      name: "Jean Dupont",
      email: "jean.dupont@email.com",
      phone: "+229 97 00 00 00",
      address: "Cotonou, Bénin",
    },
    items: [
      { designation: "Fournitures plomberie", description: "Tuyaux, raccords, joints, colle", quantite: 1, prix_unitaire: 45000 },
      { designation: "Robinetterie", description: "Robinet mitigeur bain + lavabo", quantite: 2, prix_unitaire: 35000 },
      { designation: "Main d'œuvre", description: "Installation et montage", quantite: 8, prix_unitaire: 7500 },
    ],
    variables: {
      reference_commande: "CMD-2024-001",
      modalites_paiement: "Virement bancaire ou espèces",
      banque: "BOA Bénin",
      compte: "1234 5678 9012 3456",
    }
  },
  contrat: {
    client: {
      name: "Jean Dupont",
      email: "jean.dupont@email.com",
      phone: "+229 97 00 00 00",
      address: "Cotonou, Bénin",
    },
    variables: {
      objet: "Contrat de prestation de services de plomberie",
      duree: "12 mois",
      montant: "1 500 000",
      modalites_paiement: "Paiement mensuel de 125 000 FCFA",
      obligations_prestataire: "Le Prestataire s'engage à intervenir dans un délai maximum de 24h pour toute urgence.",
      obligations_client: "Le Client s'engage à payer les factures dans un délai de 30 jours.",
      resiliation: "Le contrat peut être résilié par l'une ou l'autre des parties moyennant un préavis de 30 jours.",
      lieu: "Cotonou",
    }
  }
};

export default function DocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [creating, setCreating] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [enterpriseInfo, setEnterpriseInfo] = useState({
    nom: "",
    email: "",
    telephone: "",
    adresse: "",
    ifu: "",
  });
  
  const [formData, setFormData] = useState({
    type: "devis" as "devis" | "facture" | "contrat",
    template_id: "",
    client_id: "",
    project_id: "",
  });
  
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [items, setItems] = useState<Item[]>([{ designation: "", description: "", quantite: 1, prix_unitaire: 0, total: 0 }]);

  // Récupérer profil entreprise
  const getProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return null;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        setEnterpriseInfo({
          nom: profile.nom_entreprise || profile.nom || "MON ENTREPRISE",
          email: profile.email || user.email || "",
          telephone: profile.telephone || "",
          adresse: profile.adresse || "",
          ifu: profile.ifu || "",
        });
        setProfileId(profile.id);
      }
      return profile?.id;
    } catch (err) {
      console.error("Erreur profil:", err);
      return null;
    }
  }, [router]);

  // Récupérer les documents avec relations
  const fetchDocuments = useCallback(async () => {
    if (!profileId) return;
    
    setLoading(true);
    setError("");
    
    try {
      const { data, error: fetchError } = await supabase
        .from("documents")
        .select(`
          *,
          clients:client_id(*),
          document_templates:template_id(name, type),
          projects:project_id(title, status)
        `)
        .eq("user_id", profileId)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      
      setDocuments((data as unknown as Document[]) || []);
    } catch (err) {
      console.error("Erreur:", err);
      setError("Erreur de chargement des documents");
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  // Récupérer les templates par défaut ET les templates personnalisés
  const fetchTemplates = useCallback(async () => {
    if (!profileId) return;
    
    try {
      const { data, error } = await supabase
        .from("document_templates")
        .select("*")
        .or(`user_id.is.null,user_id.eq.${profileId}`)
        .order("type", { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      console.error("Erreur templates:", err);
    }
  }, [profileId]);

  // Récupérer les clients
  const fetchClients = useCallback(async () => {
    if (!profileId) return;
    
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", profileId)
        .order("name", { ascending: true });

      if (error) throw error;
      setClients(data || []);
    } catch (err) {
      console.error("Erreur clients:", err);
    }
  }, [profileId]);

  // Récupérer les projets
  const fetchProjects = useCallback(async () => {
    if (!profileId) return;
    
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", profileId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (err) {
      console.error("Erreur projets:", err);
    }
  }, [profileId]);

  useEffect(() => {
    const init = async () => {
      const pId = await getProfile();
      if (pId) {
        setProfileId(pId);
      }
    };
    init();
  }, [getProfile]);

  useEffect(() => {
    if (profileId) {
      fetchDocuments();
      fetchTemplates();
      fetchClients();
      fetchProjects();
    }
  }, [profileId, fetchDocuments, fetchTemplates, fetchClients, fetchProjects]);

  // Fonction pour préremplir avec les données de test (plombier)
  const loadTestData = () => {
    const testData = PLOMBIER_TEST_DATA[formData.type];
    
    // Ajouter ou sélectionner un client test
    const existingTestClient = clients.find(c => c.email === testData.client.email);
    if (existingTestClient) {
      setFormData(prev => ({ ...prev, client_id: existingTestClient.id }));
      handleClientChange(existingTestClient.id);
    } else {
      // Créer un nouveau client test
      setNewClient(testData.client);
      setShowClientModal(true);
    }
    
    // Charger les articles
    if (formData.type !== "contrat" && "items" in testData && testData.items) {
      const newItems = testData.items.map(item => ({
        ...item,
        total: item.quantite * item.prix_unitaire
      }));
      setItems(newItems);
    }
    
    // Charger les variables
    if (testData.variables) {
      setVariableValues(prev => ({
        ...prev,
        ...testData.variables
      }));
    }
    
    setSuccess("Données de test chargées avec succès !");
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleTypeChange = (type: "devis" | "facture" | "contrat") => {
    const template = templates.find(t => t.type === type);
    setFormData({ 
      type, 
      template_id: template?.id || "", 
      client_id: "",
      project_id: ""
    });
    setVariableValues({});
    setItems([{ designation: "", description: "", quantite: 1, prix_unitaire: 0, total: 0 }]);
    
    // Initialiser les variables du template
    if (template) {
      const initialValues: Record<string, string> = {};
      const vars = template.variables;
      
      // Vérifier si c'est un array ou un object
      if (Array.isArray(vars)) {
        vars.forEach((variable: string) => {
          initialValues[variable] = "";
        });
      } else if (typeof vars === 'object' && vars !== null) {
        Object.keys(vars).forEach(key => {
          initialValues[key] = "";
        });
      }
      
      setVariableValues(initialValues);
    }
  };

  const handleClientChange = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setVariableValues(prev => ({
        ...prev,
        client_nom: client.name || "",
        client_email: client.email || "",
        client_telephone: client.phone || "",
        client_adresse: client.address || "",
      }));
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profileId) {
      setError("Profil non trouvé");
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from("clients")
        .insert({
          user_id: profileId,
          name: newClient.name,
          email: newClient.email,
          phone: newClient.phone,
          address: newClient.address,
        })
        .select()
        .single();

      if (error) throw error;

      setClients([...clients, data]);
      setFormData(prev => ({ ...prev, client_id: data.id }));
      handleClientChange(data.id);
      setShowClientModal(false);
      setNewClient({ name: "", email: "", phone: "", address: "" });
      setSuccess("Client ajouté avec succès");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Erreur:", err);
      setError("Erreur lors de l'ajout du client");
    }
  };

  const updateItemTotal = (index: number) => {
    const newItems = [...items];
    newItems[index].total = newItems[index].quantite * newItems[index].prix_unitaire;
    setItems(newItems);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tva = 18;
    const tvaAmount = (subtotal * tva) / 100;
    const total = subtotal + tvaAmount;
    return { subtotal, tva, tvaAmount, total };
  };

  const generateItemsTable = () => {
    const validItems = items.filter(item => item.designation && item.quantite > 0);
    if (validItems.length === 0) return "";
    
    return validItems.map(item => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px; vertical-align: top;">
          <strong>${item.designation}</strong><br>
          <span style="font-size: 12px; color: #6b7280;">${item.description || ""}</span>
        </td>
        <td style="padding: 12px; text-align: center; vertical-align: middle;">${item.quantite}</td>
        <td style="padding: 12px; text-align: right; vertical-align: middle;">${item.prix_unitaire.toLocaleString()} FCFA</td>
        <td style="padding: 12px; text-align: right; vertical-align: middle; font-weight: 500;">${item.total.toLocaleString()} FCFA</td>
      </tr>
    `).join('');
  };

  const generateHTML = (template: DocumentTemplate, variables: Record<string, string>) => {
    let html = template.html_template;
    
    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + 30);
    
    const allVariables = {
      ...variables,
      entreprise_nom: enterpriseInfo.nom,
      entreprise_email: enterpriseInfo.email,
      entreprise_telephone: enterpriseInfo.telephone,
      entreprise_ifu: enterpriseInfo.ifu,
      entreprise_adresse: enterpriseInfo.adresse,
      numero_document: `${template.type.toUpperCase()}-${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`,
      date_emission: today.toLocaleDateString("fr-FR"),
      date_echeance: dueDate.toLocaleDateString("fr-FR"),
      statut: "En attente",
    };
    
    if (template.type !== "contrat") {
      const totals = calculateTotals();
      const itemsTable = generateItemsTable();
      
      Object.assign(allVariables, {
        items_table: itemsTable || '<tr><td colspan="4" style="padding: 20px; text-align: center;">Aucun article</td></tr>',
        sous_total: totals.subtotal.toLocaleString(),
        tva_taux: totals.tva.toString(),
        tva_montant: totals.tvaAmount.toLocaleString(),
        total_ttc: totals.total.toLocaleString(),
      });
    }
    
    Object.entries(allVariables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      html = html.replace(regex, value || "");
    });
    
    return html;
  };

  const downloadPDF = async (html: string, filename: string) => {
    const html2pdfLib = await loadHtml2pdf();
    
    if (!html2pdfLib) {
      alert("Impossible de charger la librairie PDF. Veuillez réessayer.");
      return;
    }
    
    const element = document.createElement('div');
    element.innerHTML = html;
    element.style.position = 'absolute';
    element.style.left = '-9999px';
    element.style.top = '-9999px';
    document.body.appendChild(element);
    
    const opt = {
      margin: [0.5, 0.5, 0.5, 0.5] as [number, number, number, number],
      filename: filename,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in' as const, format: 'a4' as const, orientation: 'portrait' as const }
    } as any;
    
    try {
      await html2pdfLib().set(opt).from(element).save();
    } finally {
      document.body.removeChild(element);
    }
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.type || !formData.template_id) {
      setError("Veuillez sélectionner un type et un template");
      return;
    }

    if (!formData.client_id) {
      setError("Veuillez sélectionner un client");
      return;
    }

    if (!profileId) {
      setError("Profil non trouvé");
      return;
    }

    setCreating(true);
    setError("");

    try {
      const template = templates.find(t => t.id === formData.template_id);
      if (!template) throw new Error("Template non trouvé");

      const finalHTML = generateHTML(template, variableValues);
      const filename = `${formData.type}_${Date.now()}.pdf`;
      
      await downloadPDF(finalHTML, filename);
      
      const { error: insertError } = await supabase
        .from("documents")
        .insert({
          user_id: profileId,
          type: formData.type,
          template_id: formData.template_id,
          client_id: formData.client_id,
          project_id: formData.project_id || null,
          status: "draft",
          data: {
            variables: variableValues,
            html: finalHTML,
            template_name: template.name,
            items: formData.type !== "contrat" ? items : null,
            totals: formData.type !== "contrat" ? calculateTotals() : null
          },
          file_url: filename,
        });

      if (insertError) throw insertError;

      setSuccess("Document créé avec succès");
      setShowCreateModal(false);
      setFormData({ type: "devis", template_id: "", client_id: "", project_id: "" });
      setVariableValues({});
      setItems([{ designation: "", description: "", quantite: 1, prix_unitaire: 0, total: 0 }]);
      fetchDocuments();
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Erreur création:", err);
      setError("Erreur lors de la création du document");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce document ?")) return;

    try {
      const { error: deleteError } = await supabase
        .from("documents")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      setSuccess("Document supprimé avec succès");
      fetchDocuments();
      setSelectedDocument(null);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Erreur lors de la suppression");
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const addItem = () => {
    setItems([...items, { designation: "", description: "", quantite: 1, prix_unitaire: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof Item, value: string | number) => {
    const newItems = [...items];
    newItems[index][field] = value as never;
    if (field === "quantite" || field === "prix_unitaire") {
      newItems[index].total = newItems[index].quantite * newItems[index].prix_unitaire;
    }
    setItems(newItems);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: colors.gray100, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={32} color={colors.deepBlue} style={{ animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const totals = calculateTotals();

  return (
    <div style={{ minHeight: "100vh", background: colors.gray100, fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", padding: "24px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Barre tricolore Bénin */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "24px" }}>
          <div style={{ flex: 1, height: "4px", background: colors.beninGreen }} />
          <div style={{ flex: 1, height: "4px", background: colors.beninYellow }} />
          <div style={{ flex: 1, height: "4px", background: colors.beninRed }} />
        </div>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Link href="/prestataire" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px", borderRadius: "12px", background: colors.white, border: `1px solid ${colors.gray200}`, color: colors.gray600, textDecoration: "none" }}>
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 style={{ fontSize: "28px", fontWeight: 700, color: colors.deepBlue, marginBottom: "4px" }}>Mes documents</h1>
              <p style={{ fontSize: "14px", color: colors.gray500 }}>Gérez vos devis, factures et contrats professionnels</p>
            </div>
          </div>
          
          <button onClick={() => setShowCreateModal(true)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 24px", background: colors.deepBlue, color: colors.white, border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>
            <Plus size={18} /> Nouveau document
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div style={{ padding: "12px 16px", background: `${colors.beninRed}10`, border: `1px solid ${colors.beninRed}30`, borderRadius: "12px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", color: colors.beninRed }}>
            <AlertCircle size={18} /><span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{ padding: "12px 16px", background: `${colors.beninGreen}10`, border: `1px solid ${colors.beninGreen}30`, borderRadius: "12px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", color: colors.beninGreen }}>
            <CheckCircle size={18} /><span>{success}</span>
          </div>
        )}

        {/* Liste des documents */}
        {documents.length === 0 ? (
          <div style={{ background: colors.white, borderRadius: "20px", padding: "48px", textAlign: "center", border: `1px solid ${colors.gray200}` }}>
            <FileText size={48} color={colors.gray400} style={{ marginBottom: "16px" }} />
            <h3 style={{ fontSize: "18px", fontWeight: 600, color: colors.gray600, marginBottom: "8px" }}>Aucun document</h3>
            <p style={{ fontSize: "14px", color: colors.gray500, marginBottom: "24px" }}>Créez votre premier devis, facture ou contrat</p>
            <button onClick={() => setShowCreateModal(true)} style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 20px", background: colors.deepBlue, color: colors.white, border: "none", borderRadius: "10px", fontSize: "14px", cursor: "pointer" }}>
              <Plus size={16} /> Créer un document
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "20px" }}>
            {documents.map((doc) => {
              const statusConfig = STATUS_CONFIG[doc.status] || STATUS_CONFIG.draft;
              const typeConfig = DOCUMENT_TYPES.find(t => t.value === doc.type);
              const IconComponent = typeConfig?.icon || FileText;
              return (
                <div key={doc.id} onClick={() => setSelectedDocument(doc)} style={{ background: colors.white, borderRadius: "20px", padding: "20px", border: `1px solid ${colors.gray200}`, cursor: "pointer", transition: "all 0.2s" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
                    <div style={{ width: "48px", height: "48px", background: `${typeConfig?.color}15`, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <IconComponent size={24} color={typeConfig?.color} />
                    </div>
                    <div style={{ padding: "4px 10px", background: statusConfig.bgColor, borderRadius: "20px", fontSize: "11px", fontWeight: 500, color: statusConfig.color }}>{statusConfig.label}</div>
                  </div>
                  <h3 style={{ fontSize: "16px", fontWeight: 600, color: colors.gray800, marginBottom: "4px" }}>{typeConfig?.label} - {doc.data?.template_name || "Document"}</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                    <User size={12} color={colors.gray400} />
                    <p style={{ fontSize: "13px", color: colors.gray600 }}>{doc.clients?.name || "Client non spécifié"}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "11px", color: colors.gray400, borderTop: `1px solid ${colors.gray100}`, paddingTop: "12px" }}>
                    <Calendar size={12} /><span>{formatDate(doc.created_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de création */}
        {showCreateModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: colors.white, borderRadius: "24px", padding: "32px", maxWidth: "900px", width: "90%", maxHeight: "90vh", overflow: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <h2 style={{ fontSize: "24px", fontWeight: 700, color: colors.deepBlue }}>Créer un document</h2>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={loadTestData}
                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", background: colors.gray100, border: `1px solid ${colors.gray300}`, borderRadius: "8px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}
                  >
                    <TestTube size={16} /> Charger exemple plombier
                  </button>
                  <button onClick={() => setShowCreateModal(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: "8px" }}>
                    <X size={24} color={colors.gray400} />
                  </button>
                </div>
              </div>
              
              <form onSubmit={handleCreateDocument}>
                {/* Sélection du type */}
                <div style={{ marginBottom: "24px" }}>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: colors.gray700, marginBottom: "12px" }}>Type de document</label>
                  <div style={{ display: "flex", gap: "12px" }}>
                    {DOCUMENT_TYPES.map(type => {
                      const IconComponent = type.icon;
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => handleTypeChange(type.value)}
                          style={{
                            flex: 1,
                            padding: "16px",
                            background: formData.type === type.value ? type.color : colors.white,
                            border: `2px solid ${formData.type === type.value ? type.color : colors.gray200}`,
                            borderRadius: "12px",
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                        >
                          <IconComponent size={24} style={{ marginBottom: "8px", color: formData.type === type.value ? colors.white : type.color }} />
                          <div style={{ fontWeight: 600, color: formData.type === type.value ? colors.white : colors.gray700 }}>{type.label}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                {/* Sélection du client */}
                <div style={{ marginBottom: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <label style={{ fontSize: "14px", fontWeight: 600, color: colors.gray700 }}>Client</label>
                    <button type="button" onClick={() => setShowClientModal(true)} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 12px", background: colors.gray100, border: "none", borderRadius: "8px", fontSize: "12px", cursor: "pointer" }}>
                      <Plus size={12} /> Nouveau client
                    </button>
                  </div>
                  <select 
                    value={formData.client_id} 
                    onChange={(e) => { 
                      setFormData(prev => ({ ...prev, client_id: e.target.value })); 
                      handleClientChange(e.target.value); 
                    }}
                    style={{ width: "100%", padding: "12px", border: `1px solid ${colors.gray200}`, borderRadius: "12px", fontSize: "14px", background: colors.white }}
                    required
                  >
                    <option value="">Sélectionner un client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name} - {client.email}</option>
                    ))}
                  </select>
                </div>

                {/* Sélection du projet (optionnel) */}
                {projects.length > 0 && (
                  <div style={{ marginBottom: "24px" }}>
                    <label style={{ fontSize: "14px", fontWeight: 600, color: colors.gray700, marginBottom: "12px", display: "block" }}>Projet (optionnel)</label>
                    <select 
                      value={formData.project_id} 
                      onChange={(e) => setFormData(prev => ({ ...prev, project_id: e.target.value }))}
                      style={{ width: "100%", padding: "12px", border: `1px solid ${colors.gray200}`, borderRadius: "12px", fontSize: "14px", background: colors.white }}
                    >
                      <option value="">Aucun projet</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>{project.title}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                {/* Articles pour devis et facture */}
                {formData.type !== "contrat" && (
                  <div style={{ marginBottom: "24px" }}>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: colors.gray700, marginBottom: "12px" }}>Prestations / Articles</label>
                    <div style={{ background: colors.gray50, borderRadius: "12px", padding: "16px" }}>
                      <table style={{ width: "100%", marginBottom: "16px", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ borderBottom: `2px solid ${colors.gray200}` }}>
                            <th style={{ textAlign: "left", padding: "8px", fontSize: "12px", color: colors.gray600 }}>Désignation</th>
                            <th style={{ textAlign: "left", padding: "8px", fontSize: "12px", color: colors.gray600 }}>Description</th>
                            <th style={{ textAlign: "center", padding: "8px", fontSize: "12px", color: colors.gray600, width: "80px" }}>Qté</th>
                            <th style={{ textAlign: "right", padding: "8px", fontSize: "12px", color: colors.gray600, width: "120px" }}>Prix unitaire</th>
                            <th style={{ textAlign: "right", padding: "8px", fontSize: "12px", color: colors.gray600, width: "120px" }}>Total</th>
                            <th style={{ width: "40px" }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item, index) => (
                            <tr key={index} style={{ borderBottom: `1px solid ${colors.gray200}` }}>
                              <td style={{ padding: "8px" }}>
                                <input type="text" value={item.designation} onChange={(e) => updateItem(index, "designation", e.target.value)} placeholder="Ex: Réparation fuite d'eau" style={{ width: "100%", padding: "8px", border: `1px solid ${colors.gray200}`, borderRadius: "6px", fontSize: "13px" }} />
                              </td>
                              <td style={{ padding: "8px" }}>
                                <input type="text" value={item.description} onChange={(e) => updateItem(index, "description", e.target.value)} placeholder="Description détaillée..." style={{ width: "100%", padding: "8px", border: `1px solid ${colors.gray200}`, borderRadius: "6px", fontSize: "13px" }} />
                              </td>
                              <td style={{ padding: "8px", textAlign: "center" }}>
                                <input type="number" value={item.quantite} onChange={(e) => updateItem(index, "quantite", parseInt(e.target.value) || 0)} style={{ width: "70px", padding: "8px", border: `1px solid ${colors.gray200}`, borderRadius: "6px", textAlign: "center", fontSize: "13px" }} />
                              </td>
                              <td style={{ padding: "8px", textAlign: "right" }}>
                                <input type="number" value={item.prix_unitaire} onChange={(e) => updateItem(index, "prix_unitaire", parseInt(e.target.value) || 0)} style={{ width: "100%", padding: "8px", border: `1px solid ${colors.gray200}`, borderRadius: "6px", textAlign: "right", fontSize: "13px" }} />
                              </td>
                              <td style={{ padding: "8px", textAlign: "right", fontSize: "13px", fontWeight: 500 }}>
                                {item.total.toLocaleString()} FCFA
                              </td>
                              <td style={{ padding: "8px", textAlign: "center" }}>
                                <button type="button" onClick={() => removeItem(index)} style={{ background: "none", border: "none", color: colors.beninRed, cursor: "pointer", fontSize: "20px" }}>×</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan={5} style={{ padding: "12px 8px 0 8px" }}>
                              <button type="button" onClick={addItem} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: colors.white, border: `1px solid ${colors.gray200}`, borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>
                                <Plus size={14} /> Ajouter une prestation
                              </button>
                            </td>
                          </tr>
                          <tr>
                            <td colSpan={4} style={{ padding: "12px 8px", textAlign: "right", fontWeight: 500 }}>Sous-total :</td>
                            <td style={{ padding: "12px 8px", textAlign: "right", fontWeight: 500 }}>{totals.subtotal.toLocaleString()} FCFA</td>
                          </tr>
                          <tr>
                            <td colSpan={4} style={{ padding: "4px 8px", textAlign: "right", fontSize: "13px", color: colors.gray600 }}>TVA (18%) :</td>
                            <td style={{ padding: "4px 8px", textAlign: "right", fontSize: "13px", color: colors.gray600 }}>{totals.tvaAmount.toLocaleString()} FCFA</td>
                          </tr>
                          <tr style={{ borderTop: `2px solid ${colors.gray300}` }}>
                            <td colSpan={4} style={{ padding: "12px 8px", textAlign: "right", fontWeight: 700, fontSize: "16px" }}>TOTAL TTC :</td>
                            <td style={{ padding: "12px 8px", textAlign: "right", fontWeight: 700, fontSize: "16px", color: colors.beninGreen }}>{totals.total.toLocaleString()} FCFA</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
                
                {/* Champs supplémentaires */}
                <div style={{ marginBottom: "24px" }}>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: colors.gray700, marginBottom: "12px" }}>Informations complémentaires</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
                    {Object.entries(variableValues)
                      .filter(([key]) => !["client_nom", "client_email", "client_telephone", "client_ifu", "client_adresse"].includes(key))
                      .map(([key, value]) => (
                        <input
                          key={key}
                          type="text"
                          value={value}
                          onChange={(e) => setVariableValues(prev => ({ ...prev, [key]: e.target.value }))}
                          placeholder={key.replace(/_/g, ' ').toUpperCase()}
                          style={{ padding: "10px", border: `1px solid ${colors.gray200}`, borderRadius: "8px", fontSize: "13px" }}
                        />
                      ))}
                  </div>
                </div>
                
                {/* Boutons */}
                <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                  <button type="button" onClick={() => setShowCreateModal(false)} style={{ flex: 1, padding: "14px", background: colors.white, border: `1px solid ${colors.gray300}`, borderRadius: "12px", fontSize: "14px", fontWeight: 500, color: colors.gray600, cursor: "pointer" }}>Annuler</button>
                  <button type="submit" disabled={creating} style={{ flex: 1, padding: "14px", background: colors.deepBlue, border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: 500, color: colors.white, cursor: creating ? "not-allowed" : "pointer", opacity: creating ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    {creating ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Download size={16} />}
                    {creating ? "Création..." : "Créer et télécharger"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal nouveau client */}
        {showClientModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1001 }}>
            <div style={{ background: colors.white, borderRadius: "24px", padding: "32px", maxWidth: "500px", width: "90%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: 600, color: colors.gray800 }}>Nouveau client</h2>
                <button onClick={() => setShowClientModal(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "24px" }}>×</button>
              </div>
              <form onSubmit={handleCreateClient}>
                <input type="text" placeholder="Nom complet *" value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} style={{ width: "100%", padding: "12px", marginBottom: "12px", border: `1px solid ${colors.gray200}`, borderRadius: "8px" }} required />
                <input type="email" placeholder="Email" value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} style={{ width: "100%", padding: "12px", marginBottom: "12px", border: `1px solid ${colors.gray200}`, borderRadius: "8px" }} />
                <input type="tel" placeholder="Téléphone" value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} style={{ width: "100%", padding: "12px", marginBottom: "12px", border: `1px solid ${colors.gray200}`, borderRadius: "8px" }} />
                <textarea placeholder="Adresse" value={newClient.address} onChange={(e) => setNewClient({ ...newClient, address: e.target.value })} style={{ width: "100%", padding: "12px", marginBottom: "20px", border: `1px solid ${colors.gray200}`, borderRadius: "8px" }} rows={3} />
                <button type="submit" style={{ width: "100%", padding: "12px", background: colors.deepBlue, color: colors.white, border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 500 }}>Ajouter le client</button>
              </form>
            </div>
          </div>
        )}

        {/* Modal visualisation */}
        {selectedDocument && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: colors.white, borderRadius: "24px", padding: "32px", maxWidth: "500px", width: "90%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div>
                  <h2 style={{ fontSize: "20px", fontWeight: 600, color: colors.gray800 }}>{selectedDocument.type.toUpperCase()}</h2>
                  <p style={{ fontSize: "13px", color: colors.gray500 }}>{selectedDocument.data?.template_name}</p>
                </div>
                <button onClick={() => setSelectedDocument(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "24px" }}>×</button>
              </div>
              
              <div style={{ background: colors.gray50, borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                  <User size={16} color={colors.gray500} />
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: 500 }}>{selectedDocument.clients?.name}</p>
                    <p style={{ fontSize: "12px", color: colors.gray500 }}>{selectedDocument.clients?.email}</p>
                  </div>
                </div>
                <p style={{ fontSize: "12px", color: colors.gray500 }}><Calendar size={12} style={{ display: "inline", marginRight: "4px" }} /> {formatDate(selectedDocument.created_at)}</p>
              </div>
              
              <div style={{ display: "flex", gap: "12px" }}>
                <button onClick={() => { if (selectedDocument.data?.html) downloadPDF(selectedDocument.data.html, `${selectedDocument.type}_${selectedDocument.id}.pdf`); }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px", background: colors.deepBlue, border: "none", borderRadius: "12px", color: colors.white, cursor: "pointer" }}>
                  <Printer size={16} /> Télécharger PDF
                </button>
                <button onClick={() => handleDelete(selectedDocument.id)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px", background: colors.white, border: `1px solid ${colors.beninRed}`, borderRadius: "12px", color: colors.beninRed, cursor: "pointer" }}>
                  <Trash2 size={16} /> Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}