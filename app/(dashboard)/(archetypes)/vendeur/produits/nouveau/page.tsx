"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/src/lib/supabase/browser";
import { ArrowLeft, Package, Save, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";

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
};

export default function NouveauProduitPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [formData, setFormData] = useState({
    nom: "",
    prix_achat: "",
    prix_vente: "",
    stock: "",
  });

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

    // Validation
    if (!formData.nom.trim()) {
      setError("Le nom du produit est requis");
      setLoading(false);
      return;
    }

    const prixAchat = parseInt(formData.prix_achat);
    const prixVente = parseInt(formData.prix_vente);
    const stock = parseInt(formData.stock) || 0;

    if (isNaN(prixAchat) && isNaN(prixVente)) {
      setError("Au moins un prix (achat ou vente) est requis");
      setLoading(false);
      return;
    }

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

      const { error: insertError } = await supabase
        .from("produits")
        .insert({
          profile_id: profile.id,
          nom: formData.nom.trim(),
          prix_achat: isNaN(prixAchat) ? null : prixAchat,
          prix_vente: isNaN(prixVente) ? null : prixVente,
          stock: stock,
        });

      if (insertError) throw insertError;

      setSuccess("Produit créé avec succès !");
      setTimeout(() => {
        router.push("/vendeur/produits");
      }, 1500);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

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
              Nouveau produit
            </h1>
            <p style={{ fontSize: "14px", color: colors.gray500 }}>
              Ajoutez un produit à votre catalogue
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
                placeholder="Ex: Sac de maïs 50kg"
                style={{
                  width: "100%",
                  padding: "12px 16px 12px 44px",
                  border: `1px solid ${colors.gray200}`,
                  borderRadius: "12px",
                  fontSize: "15px",
                  outline: "none",
                  transition: "all 0.2s",
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
                placeholder="0"
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
                placeholder="0"
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
              Stock initial
            </label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              placeholder="0"
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
                transition: "all 0.2s",
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
              {loading ? "Création..." : "Créer le produit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}