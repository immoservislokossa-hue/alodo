"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import supabase from "@/src/lib/supabase/browser";
import { ArrowLeft, Package, Save, Trash2, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";

const colors = {
  white: "#FFFFFF",
  deepBlue: "#1a3c6b",
  deepBlueDark: "#0e2a4a",
  beninGreen: "#008751",
  beninYellow: "#FCD116",
  beninRed: "#E8112D",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray300: "#D1D5DB",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray600: "#4B5563",
  gray700: "#374151",
};

type Produit = {
  id: string;
  nom: string;
  prix_achat: number | null;
  prix_vente: number | null;
  stock: number;
  created_at: string;
};

export default function EditerProduitPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [formData, setFormData] = useState({
    nom: "",
    prix_achat: "",
    prix_vente: "",
    stock: "",
  });

  // Charger le produit
  useEffect(() => {
    const fetchProduit = async () => {
      setFetching(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Utilisateur non connecté");

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (!profile) throw new Error("Profil non trouvé");

        const { data, error } = await supabase
          .from("produits")
          .select("*")
          .eq("id", productId)
          .eq("profile_id", profile.id)
          .single();

        if (error) throw error;
        if (!data) throw new Error("Produit non trouvé");

        const produit = data as Produit;
        setFormData({
          nom: produit.nom,
          prix_achat: produit.prix_achat?.toString() || "",
          prix_vente: produit.prix_vente?.toString() || "",
          stock: produit.stock.toString(),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de chargement");
      } finally {
        setFetching(false);
      }
    };

    if (productId) fetchProduit();
  }, [productId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!formData.nom.trim()) {
      setError("Le nom du produit est requis");
      setLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from("produits")
        .update({
          nom: formData.nom.trim(),
          prix_achat: formData.prix_achat ? parseInt(formData.prix_achat) : null,
          prix_vente: formData.prix_vente ? parseInt(formData.prix_vente) : null,
          stock: parseInt(formData.stock) || 0,
        })
        .eq("id", productId);

      if (updateError) throw updateError;

      setSuccess("Produit modifié avec succès !");
      setTimeout(() => {
        router.push("/vendeur/produits");
      }, 1500);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la modification");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError("");

    try {
      const { error: deleteError } = await supabase
        .from("produits")
        .delete()
        .eq("id", productId);

      if (deleteError) throw deleteError;

      setSuccess("Produit supprimé avec succès !");
      setTimeout(() => {
        router.push("/vendeur/produits");
      }, 1500);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression");
      setShowDeleteConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div style={{
        minHeight: "100vh",
        background: colors.gray100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{ textAlign: "center", color: colors.gray500 }}>
          Chargement...
        </div>
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
        maxWidth: "700px",
        margin: "0 auto",
      }}>
        
        {/* Barre tricolore */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "24px" }}>
          <div style={{ flex: 1, height: "3px", background: colors.beninGreen, borderRadius: "2px" }} />
          <div style={{ flex: 1, height: "3px", background: colors.beninYellow, borderRadius: "2px" }} />
          <div style={{ flex: 1, height: "3px", background: colors.beninRed, borderRadius: "2px" }} />
        </div>

        {/* Header */}
        <div style={{ marginBottom: "32px", display: "flex", alignItems: "center", gap: "16px" }}>
          <Link
            href="/vendeur/produits"
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
              transition: "all 0.2s",
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
              Modifier le produit
            </h1>
            <p style={{ fontSize: "14px", color: colors.gray500 }}>
              Modifiez les informations du produit
            </p>
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} style={{
          background: colors.white,
          borderRadius: "24px",
          padding: "32px",
          border: `1px solid ${colors.gray200}`,
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        }}>
          
          {/* Nom du produit */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{
              display: "block",
              fontSize: "14px",
              fontWeight: 500,
              color: colors.gray700,
              marginBottom: "8px",
            }}>
              Nom du produit *
            </label>
            <div style={{ position: "relative" }}>
              <Package size={18} style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: colors.gray400,
              }} />
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "12px 16px 12px 44px",
                  border: `1px solid ${colors.gray200}`,
                  borderRadius: "12px",
                  fontSize: "15px",
                  outline: "none",
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = colors.deepBlue}
                onBlur={(e) => e.currentTarget.style.borderColor = colors.gray200}
              />
            </div>
          </div>

          {/* Prix achat et vente */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
            <div>
              <label style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 500,
                color: colors.gray700,
                marginBottom: "8px",
              }}>
                Prix d'achat (FCFA)
              </label>
              <input
                type="number"
                name="prix_achat"
                value={formData.prix_achat}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: `1px solid ${colors.gray200}`,
                  borderRadius: "12px",
                  fontSize: "15px",
                  outline: "none",
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = colors.deepBlue}
                onBlur={(e) => e.currentTarget.style.borderColor = colors.gray200}
              />
            </div>
            <div>
              <label style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 500,
                color: colors.gray700,
                marginBottom: "8px",
              }}>
                Prix de vente (FCFA)
              </label>
              <input
                type="number"
                name="prix_vente"
                value={formData.prix_vente}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: `1px solid ${colors.gray200}`,
                  borderRadius: "12px",
                  fontSize: "15px",
                  outline: "none",
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = colors.deepBlue}
                onBlur={(e) => e.currentTarget.style.borderColor = colors.gray200}
              />
            </div>
          </div>

          {/* Stock */}
          <div style={{ marginBottom: "32px" }}>
            <label style={{
              display: "block",
              fontSize: "14px",
              fontWeight: 500,
              color: colors.gray700,
              marginBottom: "8px",
            }}>
              Stock
            </label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: `1px solid ${colors.gray200}`,
                borderRadius: "12px",
                fontSize: "15px",
                outline: "none",
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = colors.deepBlue}
              onBlur={(e) => e.currentTarget.style.borderColor = colors.gray200}
            />
          </div>

          {/* Messages */}
          {error && (
            <div style={{
              padding: "12px 16px",
              background: `${colors.beninRed}10`,
              border: `1px solid ${colors.beninRed}20`,
              borderRadius: "12px",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              color: colors.beninRed,
              fontSize: "14px",
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
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              color: colors.beninGreen,
              fontSize: "14px",
            }}>
              <CheckCircle size={18} />
              {success}
            </div>
          )}

          {/* Boutons */}
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={loading}
              style={{
                padding: "14px 24px",
                background: colors.white,
                border: `1px solid ${colors.beninRed}`,
                borderRadius: "12px",
                fontSize: "15px",
                fontWeight: 500,
                color: colors.beninRed,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                opacity: loading ? 0.7 : 1,
              }}
            >
              <Trash2 size={18} />
              Supprimer
            </button>
            <div style={{ flex: 1, display: "flex", gap: "12px" }}>
              <Link
                href="/vendeur/produits"
                style={{
                  flex: 1,
                  padding: "14px",
                  textAlign: "center",
                  background: colors.white,
                  border: `1px solid ${colors.gray300}`,
                  borderRadius: "12px",
                  fontSize: "15px",
                  fontWeight: 500,
                  color: colors.gray600,
                  textDecoration: "none",
                }}
              >
                Annuler
              </Link>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "14px",
                  background: colors.deepBlue,
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "15px",
                  fontWeight: 500,
                  color: colors.white,
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                <Save size={18} />
                {loading ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Modal de confirmation suppression */}
      {showDeleteConfirm && (
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
              Supprimer le produit ?
            </h3>
            <p style={{ fontSize: "14px", color: colors.gray500, marginBottom: "24px" }}>
              Cette action est irréversible. Toutes les transactions liées à ce produit seront affectées.
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
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
                onClick={handleDelete}
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
  );
}