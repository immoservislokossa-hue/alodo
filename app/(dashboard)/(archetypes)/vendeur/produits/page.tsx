"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/src/lib/supabase/browser";
import Link from "next/link";
import { 
  Package, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
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
};

type Produit = {
  id: string;
  nom: string;
  prix_achat: number | null;
  prix_vente: number | null;
  stock: number;
  created_at: string;
};

export default function ProduitsPage() {
  const router = useRouter();
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Charger les produits
  const fetchProduits = async () => {
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setError("Veuillez vous connecter");
        setLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profileError || !profile) {
        setError("Profil non trouvé. Finalisez votre inscription.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("produits")
        .select("*")
        .eq("profile_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProduits(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduits();
  }, []);

  // Supprimer un produit
  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("produits")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setSuccess("Produit supprimé avec succès");
      fetchProduits();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression");
      setTimeout(() => setError(""), 3000);
    } finally {
      setDeleteConfirm(null);
    }
  };

  // Filtrer les produits
  const filteredProduits = produits.filter(produit =>
    produit.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculer la marge bénéficiaire
  const getMarge = (prixAchat: number | null, prixVente: number | null) => {
    if (!prixAchat || !prixVente) return null;
    const marge = prixVente - prixAchat;
    const pourcentage = (marge / prixAchat) * 100;
    return { marge, pourcentage };
  };

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
          <div>
            <h1 style={{
              fontSize: "28px",
              fontWeight: 700,
              fontFamily: "'Playfair Display', serif",
              color: colors.deepBlue,
              marginBottom: "4px",
            }}>
              Mes produits
            </h1>
            <p style={{ fontSize: "14px", color: colors.gray500 }}>
              Gérez votre catalogue de produits
            </p>
          </div>
          <Link
            href="/vendeur/produits/nouveau"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 24px",
              background: colors.deepBlue,
              color: colors.white,
              textDecoration: "none",
              borderRadius: "12px",
              fontWeight: 500,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = colors.deepBlueDark}
            onMouseLeave={(e) => e.currentTarget.style.background = colors.deepBlue}
          >
            <Plus size={18} />
            Nouveau produit
          </Link>
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
            {error}
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
            {success}
          </div>
        )}

        {/* Barre de recherche */}
        <div style={{
          background: colors.white,
          borderRadius: "16px",
          padding: "16px",
          marginBottom: "24px",
          border: `1px solid ${colors.gray200}`,
        }}>
          <div style={{ position: "relative" }}>
            <Search size={18} style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              color: colors.gray400,
            }} />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px 12px 44px",
                border: `1px solid ${colors.gray200}`,
                borderRadius: "12px",
                fontSize: "14px",
                outline: "none",
                transition: "all 0.2s",
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = colors.deepBlue}
              onBlur={(e) => e.currentTarget.style.borderColor = colors.gray200}
            />
          </div>
        </div>

        {/* Liste des produits */}
        {loading ? (
          <div style={{
            background: colors.white,
            borderRadius: "20px",
            padding: "48px",
            textAlign: "center",
            color: colors.gray500,
            border: `1px solid ${colors.gray200}`,
          }}>
            Chargement...
          </div>
        ) : filteredProduits.length === 0 ? (
          <div style={{
            background: colors.white,
            borderRadius: "20px",
            padding: "48px",
            textAlign: "center",
            border: `1px solid ${colors.gray200}`,
          }}>
            <Package size={48} color={colors.gray400} style={{ marginBottom: "16px" }} />
            <h3 style={{ fontSize: "18px", fontWeight: 600, color: colors.gray600, marginBottom: "8px" }}>
              Aucun produit
            </h3>
            <p style={{ fontSize: "14px", color: colors.gray500, marginBottom: "24px" }}>
              Commencez par ajouter votre premier produit
            </p>
            <Link
              href="/vendeur/produits/nouveau"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                background: colors.deepBlue,
                color: colors.white,
                textDecoration: "none",
                borderRadius: "10px",
                fontSize: "14px",
              }}
            >
              <Plus size={16} />
              Ajouter un produit
            </Link>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "20px",
          }}>
            {filteredProduits.map((produit) => {
              const marge = getMarge(produit.prix_achat, produit.prix_vente);
              const stockFaible = produit.stock < 10 && produit.stock > 0;
              const stockRupture = produit.stock === 0;
              
              return (
                <div
                  key={produit.id}
                  style={{
                    background: colors.white,
                    borderRadius: "20px",
                    padding: "20px",
                    border: `1px solid ${colors.gray200}`,
                    transition: "all 0.2s",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {/* Badge stock */}
                  {stockRupture && (
                    <div style={{
                      position: "absolute",
                      top: "12px",
                      right: "12px",
                      padding: "4px 8px",
                      background: colors.beninRed,
                      color: colors.white,
                      borderRadius: "8px",
                      fontSize: "10px",
                      fontWeight: 600,
                    }}>
                      Rupture
                    </div>
                  )}
                  {stockFaible && (
                    <div style={{
                      position: "absolute",
                      top: "12px",
                      right: "12px",
                      padding: "4px 8px",
                      background: colors.beninYellow,
                      color: colors.deepBlue,
                      borderRadius: "8px",
                      fontSize: "10px",
                      fontWeight: 600,
                    }}>
                      Stock faible
                    </div>
                  )}

                  {/* Icône produit */}
                  <div style={{
                    width: "48px",
                    height: "48px",
                    background: `${colors.deepBlue}10`,
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "16px",
                  }}>
                    <Package size={24} color={colors.deepBlue} />
                  </div>

                  {/* Nom produit */}
                  <h3 style={{
                    fontSize: "18px",
                    fontWeight: 600,
                    color: colors.gray800,
                    marginBottom: "12px",
                  }}>
                    {produit.nom}
                  </h3>

                  {/* Prix */}
                  <div style={{
                    display: "flex",
                    gap: "16px",
                    marginBottom: "12px",
                    paddingBottom: "12px",
                    borderBottom: `1px solid ${colors.gray100}`,
                  }}>
                    {produit.prix_achat && (
                      <div>
                        <span style={{ fontSize: "11px", color: colors.gray500 }}>Achat</span>
                        <div style={{ fontSize: "16px", fontWeight: 600, color: colors.gray700 }}>
                          {produit.prix_achat.toLocaleString()} FCFA
                        </div>
                      </div>
                    )}
                    {produit.prix_vente && (
                      <div>
                        <span style={{ fontSize: "11px", color: colors.gray500 }}>Vente</span>
                        <div style={{ fontSize: "16px", fontWeight: 600, color: colors.beninGreen }}>
                          {produit.prix_vente.toLocaleString()} FCFA
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Stock et marge */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "16px",
                  }}>
                    <div>
                      <span style={{ fontSize: "11px", color: colors.gray500 }}>Stock</span>
                      <div style={{
                        fontSize: "20px",
                        fontWeight: 700,
                        color: stockRupture ? colors.beninRed : colors.deepBlue,
                      }}>
                        {produit.stock}
                      </div>
                    </div>
                    {marge && (
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "11px", color: colors.gray500 }}>Marge</span>
                        <div style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: marge.marge > 0 ? colors.beninGreen : colors.beninRed,
                        }}>
                          {marge.marge > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {marge.marge.toLocaleString()} FCFA
                          <span style={{ fontSize: "11px", color: colors.gray400 }}>
                            ({marge.pourcentage.toFixed(0)}%)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{
                    display: "flex",
                    gap: "8px",
                    borderTop: `1px solid ${colors.gray100}`,
                    paddingTop: "16px",
                    marginTop: "8px",
                  }}>
                    <Link
                      href={`/vendeur/produits/${produit.id}`}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        padding: "8px",
                        background: colors.white,
                        border: `1px solid ${colors.gray200}`,
                        borderRadius: "10px",
                        fontSize: "13px",
                        color: colors.gray600,
                        textDecoration: "none",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = colors.deepBlue;
                        e.currentTarget.style.color = colors.deepBlue;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = colors.gray200;
                        e.currentTarget.style.color = colors.gray600;
                      }}
                    >
                      <Edit size={14} />
                      Modifier
                    </Link>
                    <button
                      onClick={() => setDeleteConfirm(produit.id)}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        padding: "8px",
                        background: colors.white,
                        border: `1px solid ${colors.gray200}`,
                        borderRadius: "10px",
                        fontSize: "13px",
                        color: colors.gray600,
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = colors.beninRed;
                        e.currentTarget.style.color = colors.beninRed;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = colors.gray200;
                        e.currentTarget.style.color = colors.gray600;
                      }}
                    >
                      <Trash2 size={14} />
                      Supprimer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal confirmation suppression */}
        {deleteConfirm && (
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
              maxWidth: "400px",
              width: "90%",
              textAlign: "center",
            }}>
              <div style={{
                width: "48px",
                height: "48px",
                background: `${colors.beninRed}10`,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}>
                <Trash2 size={24} color={colors.beninRed} />
              </div>
              <h3 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "8px" }}>
                Supprimer ce produit ?
              </h3>
              <p style={{ fontSize: "14px", color: colors.gray500, marginBottom: "24px" }}>
                Cette action est irréversible.
              </p>
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: colors.white,
                    border: `1px solid ${colors.gray300}`,
                    borderRadius: "12px",
                    cursor: "pointer",
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: colors.beninRed,
                    border: "none",
                    borderRadius: "12px",
                    color: colors.white,
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
    </div>
  );
}