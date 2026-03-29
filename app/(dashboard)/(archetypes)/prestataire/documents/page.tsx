// app/(dashboard)/(archetypes)/prestataire/documents/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  X,
  Eye,
  Download,
  Trash2,
  Plus,
  Calendar,
  Loader2
} from "lucide-react";

// Couleurs du branding
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

type Document = {
  id: string;
  nom: string;
  type: string;
  url: string;
  statut: "valide" | "en_attente" | "rejete";
  created_at: string;
};

type DocumentFormData = {
  nom: string;
  type: string;
  fichier: File | null;
};

const STATUT_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  valide: {
    label: "Validé",
    color: colors.beninGreen,
    bgColor: `${colors.beninGreen}10`,
  },
  en_attente: {
    label: "En attente",
    color: colors.beninYellow,
    bgColor: `${colors.beninYellow}10`,
  },
  rejete: {
    label: "Rejeté",
    color: colors.beninRed,
    bgColor: `${colors.beninRed}10`,
  },
};

const DOCUMENT_TYPES = [
  { value: "cni", label: "Carte d'identité nationale" },
  { value: "passeport", label: "Passeport" },
  { value: "permis", label: "Permis de conduire" },
  { value: "attestation", label: "Attestation de résidence" },
  { value: "autre", label: "Autre document" },
];

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState<DocumentFormData>({
    nom: "",
    type: "",
    fichier: null,
  });

  // Récupérer les documents
  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError("");
    
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profileError) throw profileError;
      if (!profile) throw new Error("Profil non trouvé");

      const { data, error: fetchError } = await supabase
        .from("documents")
        .select("*")
        .eq("profile_id", profile.id)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setDocuments(data || []);
    } catch (err) {
      console.error("Erreur:", err);
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, fichier: file }));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nom || !formData.type || !formData.fichier) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté");

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) throw new Error("Profil non trouvé");

      // Upload du fichier
      const fileExt = formData.fichier.name.split(".").pop();
      const fileName = `${profile.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(fileName, formData.fichier);

      if (uploadError) throw uploadError;

      // Récupérer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from("documents")
        .getPublicUrl(fileName);

      // Sauvegarder dans la base de données
      const { error: insertError } = await supabase
        .from("documents")
        .insert({
          profile_id: profile.id,
          nom: formData.nom,
          type: formData.type,
          url: publicUrl,
          statut: "en_attente",
        });

      if (insertError) throw insertError;

      setSuccess("Document uploadé avec succès");
      setShowUploadModal(false);
      setFormData({ nom: "", type: "", fichier: null });
      fetchDocuments();
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Erreur upload:", err);
      setError(err instanceof Error ? err.message : "Erreur lors de l'upload");
    } finally {
      setUploading(false);
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
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression");
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getDocumentTypeLabel = (type: string) => {
    return DOCUMENT_TYPES.find(t => t.value === type)?.label || type;
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: colors.gray100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <Loader2 size={32} color={colors.deepBlue} style={{ animation: "spin 1s linear infinite" }} />
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: colors.gray100,
      fontFamily: "system-ui, -apple-system, sans-serif",
      padding: "24px",
    }}>
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
      }}>
        
        {/* Barre tricolore */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "24px" }}>
          <div style={{ flex: 1, height: "3px", background: colors.beninGreen, borderRadius: "2px" }} />
          <div style={{ flex: 1, height: "3px", background: colors.beninYellow, borderRadius: "2px" }} />
          <div style={{ flex: 1, height: "3px", background: colors.beninRed, borderRadius: "2px" }} />
        </div>

        {/* Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
          flexWrap: "wrap",
          gap: "16px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Link
              href="/prestataire"
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
                textDecoration: "none",
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
                Mes documents
              </h1>
              <p style={{ fontSize: "14px", color: colors.gray500 }}>
                Gérez vos documents administratifs
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setShowUploadModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 24px",
              background: colors.deepBlue,
              color: colors.white,
              border: "none",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <Plus size={18} />
            Ajouter un document
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div style={{
            padding: "12px 16px",
            background: `${colors.beninRed}10`,
            border: `1px solid ${colors.beninRed}20`,
            borderRadius: "12px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: colors.beninRed,
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{
            padding: "12px 16px",
            background: `${colors.beninGreen}10`,
            border: `1px solid ${colors.beninGreen}20`,
            borderRadius: "12px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: colors.beninGreen,
          }}>
            <CheckCircle size={18} />
            <span>{success}</span>
          </div>
        )}

        {/* Liste des documents */}
        {documents.length === 0 ? (
          <div style={{
            background: colors.white,
            borderRadius: "20px",
            padding: "48px",
            textAlign: "center",
            border: `1px solid ${colors.gray200}`,
          }}>
            <FileText size={48} color={colors.gray400} style={{ marginBottom: "16px" }} />
            <h3 style={{ fontSize: "18px", fontWeight: 600, color: colors.gray600, marginBottom: "8px" }}>
              Aucun document
            </h3>
            <p style={{ fontSize: "14px", color: colors.gray500, marginBottom: "24px" }}>
              Commencez par ajouter vos documents administratifs
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                background: colors.deepBlue,
                color: colors.white,
                border: "none",
                borderRadius: "10px",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              <Plus size={16} />
              Ajouter un document
            </button>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "20px",
          }}>
            {documents.map((doc) => {
              const statutConfig = STATUT_CONFIG[doc.statut] || STATUT_CONFIG.en_attente;
              return (
                <div
                  key={doc.id}
                  style={{
                    background: colors.white,
                    borderRadius: "20px",
                    padding: "20px",
                    border: `1px solid ${colors.gray200}`,
                    transition: "all 0.2s",
                    cursor: "pointer",
                  }}
                  onClick={() => setSelectedDocument(doc)}
                >
                  <div style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    marginBottom: "16px",
                  }}>
                    <div style={{
                      width: "48px",
                      height: "48px",
                      background: `${colors.deepBlue}10`,
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <FileText size={24} color={colors.deepBlue} />
                    </div>
                    <div style={{
                      padding: "4px 8px",
                      background: statutConfig.bgColor,
                      borderRadius: "8px",
                      fontSize: "11px",
                      fontWeight: 500,
                      color: statutConfig.color,
                    }}>
                      {statutConfig.label}
                    </div>
                  </div>
                  
                  <h3 style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color: colors.gray800,
                    marginBottom: "4px",
                  }}>
                    {doc.nom}
                  </h3>
                  
                  <p style={{
                    fontSize: "12px",
                    color: colors.gray500,
                    marginBottom: "12px",
                  }}>
                    {getDocumentTypeLabel(doc.type)}
                  </p>
                  
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    fontSize: "11px",
                    color: colors.gray400,
                    borderTop: `1px solid ${colors.gray100}`,
                    paddingTop: "12px",
                    marginTop: "8px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Calendar size={12} />
                      <span>{formatDate(doc.created_at)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal d'upload */}
        {showUploadModal && (
          <div style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}>
            <div style={{
              background: colors.white,
              borderRadius: "24px",
              padding: "32px",
              maxWidth: "500px",
              width: "90%",
              maxHeight: "90vh",
              overflow: "auto",
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}>
                <h2 style={{ fontSize: "20px", fontWeight: 600, color: colors.gray800 }}>
                  Ajouter un document
                </h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                >
                  <X size={20} color={colors.gray400} />
                </button>
              </div>
              
              <form onSubmit={handleUpload}>
                <div style={{ marginBottom: "20px" }}>
                  <label style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: colors.gray700,
                    marginBottom: "8px",
                  }}>
                    Nom du document *
                  </label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                    placeholder="Ex: Carte d'identité"
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: `1px solid ${colors.gray200}`,
                      borderRadius: "12px",
                      fontSize: "14px",
                      outline: "none",
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: "20px" }}>
                  <label style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: colors.gray700,
                    marginBottom: "8px",
                  }}>
                    Type de document *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: `1px solid ${colors.gray200}`,
                      borderRadius: "12px",
                      fontSize: "14px",
                      background: colors.white,
                    }}
                  >
                    <option value="">Sélectionner un type</option>
                    {DOCUMENT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div style={{ marginBottom: "24px" }}>
                  <label style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: colors.gray700,
                    marginBottom: "8px",
                  }}>
                    Fichier *
                  </label>
                  <div
                    onClick={() => document.getElementById("file-input")?.click()}
                    style={{
                      border: `2px dashed ${colors.gray300}`,
                      borderRadius: "12px",
                      padding: "24px",
                      textAlign: "center",
                      cursor: "pointer",
                    }}
                  >
                    <Upload size={32} color={colors.gray400} style={{ marginBottom: "8px" }} />
                    <p style={{ fontSize: "13px", color: colors.gray500 }}>
                      {formData.fichier ? formData.fichier.name : "Cliquez pour sélectionner un fichier"}
                    </p>
                    <p style={{ fontSize: "11px", color: colors.gray400, marginTop: "4px" }}>
                      PDF, JPG, PNG (max. 5 Mo)
                    </p>
                  </div>
                  <input
                    id="file-input"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                </div>
                
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    style={{
                      flex: 1,
                      padding: "12px",
                      background: colors.white,
                      border: `1px solid ${colors.gray300}`,
                      borderRadius: "12px",
                      fontSize: "14px",
                      fontWeight: 500,
                      color: colors.gray600,
                      cursor: "pointer",
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    style={{
                      flex: 1,
                      padding: "12px",
                      background: colors.deepBlue,
                      border: "none",
                      borderRadius: "12px",
                      fontSize: "14px",
                      fontWeight: 500,
                      color: colors.white,
                      cursor: uploading ? "not-allowed" : "pointer",
                      opacity: uploading ? 0.7 : 1,
                    }}
                  >
                    {uploading ? "Upload..." : "Uploader"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de visualisation */}
        {selectedDocument && (
          <div style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}>
            <div style={{
              background: colors.white,
              borderRadius: "24px",
              padding: "32px",
              maxWidth: "500px",
              width: "90%",
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}>
                <h2 style={{ fontSize: "20px", fontWeight: 600, color: colors.gray800 }}>
                  {selectedDocument.nom}
                </h2>
                <button
                  onClick={() => setSelectedDocument(null)}
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                >
                  <X size={20} color={colors.gray400} />
                </button>
              </div>
              
              <div style={{ marginBottom: "20px" }}>
                <div style={{
                  width: "100%",
                  height: "200px",
                  background: colors.gray100,
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "16px",
                }}>
                  <FileText size={48} color={colors.gray400} />
                </div>
                
                <p style={{ fontSize: "13px", color: colors.gray600, marginBottom: "8px" }}>
                  <strong>Type:</strong> {getDocumentTypeLabel(selectedDocument.type)}
                </p>
                <p style={{ fontSize: "13px", color: colors.gray600, marginBottom: "8px" }}>
                  <strong>Statut:</strong> {STATUT_CONFIG[selectedDocument.statut]?.label || "En attente"}
                </p>
                <p style={{ fontSize: "13px", color: colors.gray600, marginBottom: "16px" }}>
                  <strong>Date:</strong> {formatDate(selectedDocument.created_at)}
                </p>
              </div>
              
              <div style={{ display: "flex", gap: "12px" }}>
                <a
                  href={selectedDocument.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "12px",
                    background: colors.white,
                    border: `1px solid ${colors.deepBlue}`,
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: colors.deepBlue,
                    textDecoration: "none",
                  }}
                >
                  <Eye size={16} />
                  Voir
                </a>
                <a
                  href={selectedDocument.url}
                  download
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "12px",
                    background: colors.white,
                    border: `1px solid ${colors.gray300}`,
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: colors.gray600,
                    textDecoration: "none",
                  }}
                >
                  <Download size={16} />
                  Télécharger
                </a>
                <button
                  onClick={() => handleDelete(selectedDocument.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "12px",
                    background: colors.white,
                    border: `1px solid ${colors.beninRed}`,
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: colors.beninRed,
                    cursor: "pointer",
                  }}
                >
                  <Trash2 size={16} />
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}