"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/src/lib/supabase/browser";
import Link from "next/link";
import { 
  ArrowLeft, 
  Package, 
  TrendingUp, 
  TrendingDown, 
  HandCoins, 
  CreditCard,
  AlertCircle,
  CheckCircle,
  Search,
  Plus,
  Minus,
  Calculator,
  Save,
  Download
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
};

type TransactionType = "vente" | "achat" | "depense" | "dette" | "paiement";

const transactionTypes = [
  { id: "vente", label: "Vente", icon: TrendingUp, color: colors.beninGreen, bgColor: `${colors.beninGreen}10`, type: "positive" },
  { id: "depense", label: "Dépense", icon: Minus, color: colors.beninRed, bgColor: `${colors.beninRed}10`, type: "negative" },
  { id: "dette", label: "Dette", icon: HandCoins, color: colors.beninYellow, bgColor: `${colors.beninYellow}10`, type: "neutral" },
  { id: "paiement", label: "Paiement", icon: CreditCard, color: colors.deepBlue, bgColor: `${colors.deepBlue}10`, type: "negative" },
];

export default function TransactionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [produits, setProduits] = useState<Produit[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [formData, setFormData] = useState({
    type: "vente" as TransactionType,
    montant: "",
    produit_id: "",
    notes: "",
    nom_client: "",
    quantite: 1,
  });

  const [selectedProduit, setSelectedProduit] = useState<Produit | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Charger les produits et transactions
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (!profile) return;

        const { data: produitsData } = await supabase
          .from("produits")
          .select("*")
          .eq("profile_id", profile.id)
          .order("nom");

        setProduits(produitsData || []);

        const { data: transactionsData } = await supabase
          .from("transactions")
          .select("*")
          .eq("profile_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(10);

        setTransactions(transactionsData || []);
      } catch (err) {
        console.error("Erreur chargement données:", err);
      }
    };

    fetchData();
  }, []);

  // Mettre à jour le produit sélectionné
  useEffect(() => {
    if (formData.produit_id) {
      const produit = produits.find(p => p.id === formData.produit_id);
      setSelectedProduit(produit || null);
      
      // Auto-remplir le montant avec le prix du produit
      if (produit && formData.type === "vente" && produit.prix_vente) {
        setFormData(prev => ({ ...prev, montant: produit.prix_vente?.toString() || "" }));
      } else if (produit && formData.type === "achat" && produit.prix_achat) {
        setFormData(prev => ({ ...prev, montant: produit.prix_achat?.toString() || "" }));
      }
    } else {
      setSelectedProduit(null);
    }
  }, [formData.produit_id, produits, formData.type]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const montant = parseInt(formData.montant);
    if (isNaN(montant) || montant <= 0) {
      setError("Le montant est requis et doit être supérieur à 0");
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté");

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) throw new Error("Profil non trouvé");

      // Créer la transaction avec metadata incluant nom_client, notes et quantite
      const metadata = { quantite: formData.quantite };
      if (formData.nom_client) (metadata as any).nom_client = formData.nom_client;
      if (formData.notes) (metadata as any).notes = formData.notes;

      const { error: insertError } = await supabase
        .from("transactions")
        .insert({
          profile_id: profile.id,
          type: formData.type,
          montant: montant,
          produit_id: formData.produit_id || null,
          metadata: metadata,
        });

      if (insertError) throw insertError;

      // Mettre à jour le stock pour les ventes et achats
      if (selectedProduit && (formData.type === "vente" || formData.type === "achat")) {
        const newStock = formData.type === "vente" 
          ? selectedProduit.stock - 1
          : selectedProduit.stock + 1;

        await supabase
          .from("produits")
          .update({ stock: newStock })
          .eq("id", selectedProduit.id);
      }

      setSuccess(`${transactionTypes.find(t => t.id === formData.type)?.label} de ${montant.toLocaleString()} FCFA enregistrée`);
      
      // Réinitialiser le formulaire
      setFormData({
        type: "vente",
        montant: "",
        produit_id: "",
        notes: "",
        nom_client: "",
        quantite: 1,
      });
      setSelectedProduit(null);
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const filteredProduits = produits.filter(produit =>
    produit.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentTypeConfig = transactionTypes.find(t => t.id === formData.type);

  return (
    <div style={{
      minHeight: "100vh",
      background: colors.gray100,
      fontFamily: "system-ui, -apple-system, sans-serif",
      padding: "24px",
    }}>
      <div style={{
        maxWidth: "800px",
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
            href="/vendeur"
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
              Nouvelle transaction
            </h1>
            <p style={{ fontSize: "14px", color: colors.gray500 }}>
              Enregistrez une vente, un achat, une dépense, une dette ou un paiement
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
          
          {/* Type de transaction */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{
              display: "block",
              fontSize: "14px",
              fontWeight: 500,
              color: colors.gray700,
              marginBottom: "12px",
            }}>
              Type de transaction *
            </label>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
              gap: "8px",
            }}>
              {transactionTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = formData.type === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, type: type.id as TransactionType, produit_id: "", montant: "" }));
                      setSelectedProduit(null);
                    }}
                    style={{
                      padding: "12px 8px",
                      background: isSelected ? type.bgColor : colors.white,
                      border: isSelected ? `2px solid ${type.color}` : `1px solid ${colors.gray200}`,
                      borderRadius: "12px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      textAlign: "center",
                    }}
                  >
                    <Icon size={20} color={isSelected ? type.color : colors.gray400} style={{ margin: "0 auto 4px" }} />
                    <div style={{
                      fontSize: "12px",
                      fontWeight: 500,
                      color: isSelected ? type.color : colors.gray600,
                    }}>
                      {type.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Produit (optionnel) */}
          {(formData.type === "vente" || formData.type === "achat") && (
            <div style={{ marginBottom: "24px" }}>
              <label style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 500,
                color: colors.gray700,
                marginBottom: "8px",
              }}>
                Produit (optionnel)
              </label>
              <div style={{ position: "relative" }}>
                <Package size={18} style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: colors.gray400,
                }} />
                <select
                  name="produit_id"
                  value={formData.produit_id}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "12px 16px 12px 44px",
                    border: `1px solid ${colors.gray200}`,
                    borderRadius: "12px",
                    fontSize: "14px",
                    background: colors.white,
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value="">Sélectionner un produit</option>
                  {produits.map(produit => (
                    <option key={produit.id} value={produit.id}>
                      {produit.nom} {produit.prix_vente && `- ${produit.prix_vente.toLocaleString()} FCFA`}
                    </option>
                  ))}
                </select>
              </div>
              {selectedProduit && (
                <div style={{
                  marginTop: "8px",
                  fontSize: "12px",
                  color: colors.gray500,
                }}>
                  Stock actuel: {selectedProduit.stock} unités
                </div>
              )}
            </div>
          )}

          {/* Nom du client */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{
              display: "block",
              fontSize: "14px",
              fontWeight: 500,
              color: colors.gray700,
              marginBottom: "8px",
            }}>
              Nom du client (optionnel)
            </label>
            <input
              type="text"
              name="nom_client"
              value={formData.nom_client}
              onChange={handleChange}
              placeholder="Nom du client"
              style={{
                width: "100%",
                padding: "12px 16px",
                border: `1px solid ${colors.gray200}`,
                borderRadius: "12px",
                fontSize: "14px",
                outline: "none",
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = colors.deepBlue}
              onBlur={(e) => e.currentTarget.style.borderColor = colors.gray200}
            />
          </div>

          {/* Quantité */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{
              display: "block",
              fontSize: "14px",
              fontWeight: 500,
              color: colors.gray700,
              marginBottom: "8px",
            }}>
              Quantité (optionnel)
            </label>
            <input
              type="number"
              name="quantite"
              value={formData.quantite}
              onChange={handleChange}
              min="1"
              placeholder="1"
              style={{
                width: "100%",
                padding: "12px 16px",
                border: `1px solid ${colors.gray200}`,
                borderRadius: "12px",
                fontSize: "14px",
                outline: "none",
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = colors.deepBlue}
              onBlur={(e) => e.currentTarget.style.borderColor = colors.gray200}
            />
          </div>

          {/* Montant */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{
              display: "block",
              fontSize: "14px",
              fontWeight: 500,
              color: colors.gray700,
              marginBottom: "8px",
            }}>
              Montant (FCFA) *
            </label>
            <div style={{ position: "relative" }}>
              <Calculator size={18} style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: colors.gray400,
              }} />
              <input
                type="number"
                name="montant"
                value={formData.montant}
                onChange={handleChange}
                placeholder="0"
                style={{
                  width: "100%",
                  padding: "12px 16px 12px 44px",
                  border: `1px solid ${colors.gray200}`,
                  borderRadius: "12px",
                  fontSize: "16px",
                  fontWeight: 500,
                  outline: "none",
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = colors.deepBlue}
                onBlur={(e) => e.currentTarget.style.borderColor = colors.gray200}
              />
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: "32px" }}>
            <label style={{
              display: "block",
              fontSize: "14px",
              fontWeight: 500,
              color: colors.gray700,
              marginBottom: "8px",
            }}>
              Notes (optionnel)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Ajoutez une note..."
              rows={3}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: `1px solid ${colors.gray200}`,
                borderRadius: "12px",
                fontSize: "14px",
                fontFamily: "inherit",
                resize: "vertical",
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
              href="/vendeur"
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
                background: currentTypeConfig?.color || colors.deepBlue,
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
              {loading ? "Enregistrement..." : "Enregistrer et générer une facture"}
            </button>
          </div>
        </form>

        {/* Liste rapide des produits */}
        {produits.length > 0 && (
          <div style={{
            marginTop: "32px",
            background: colors.white,
            borderRadius: "20px",
            padding: "20px",
            border: `1px solid ${colors.gray200}`,
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, color: colors.gray700 }}>
                Mes produits
              </h3>
              <Link
                href="/vendeur/produits"
                style={{
                  fontSize: "12px",
                  color: colors.deepBlue,
                  textDecoration: "none",
                }}
              >
                Voir tout
              </Link>
            </div>
            <div style={{ position: "relative", marginBottom: "16px" }}>
              <Search size={16} style={{
                position: "absolute",
                left: "12px",
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
                  padding: "10px 12px 10px 36px",
                  border: `1px solid ${colors.gray200}`,
                  borderRadius: "10px",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
            </div>
            <div style={{ maxHeight: "200px", overflowY: "auto" }}>
              {filteredProduits.slice(0, 5).map(produit => (
                <div
                  key={produit.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom: `1px solid ${colors.gray100}`,
                  }}
                >
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 500, color: colors.gray700 }}>
                      {produit.nom}
                    </div>
                    <div style={{ fontSize: "11px", color: colors.gray400 }}>
                      Stock: {produit.stock}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {produit.prix_vente && (
                      <span style={{ fontSize: "12px", fontWeight: 600, color: colors.beninGreen }}>
                        {produit.prix_vente.toLocaleString()} FCFA
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          type: "vente",
                          produit_id: produit.id,
                          montant: produit.prix_vente?.toString() || "",
                        });
                        setSearchTerm("");
                      }}
                      style={{
                        padding: "4px 12px",
                        background: colors.beninGreen,
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "11px",
                        color: colors.white,
                        cursor: "pointer",
                      }}
                    >
                      Vendre
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Facture et historique */}
        {transactions.length > 0 && (
          <div style={{
            marginTop: "32px",
            background: colors.white,
            borderRadius: "20px",
            padding: "24px",
            border: `1px solid ${colors.gray200}`,
          }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: colors.gray800, marginBottom: "20px" }}>
              📋 Dernières transactions
            </h3>
            
            <div id="facture-content" style={{
              background: colors.white,
              padding: "24px",
              borderRadius: "12px",
              border: `2px solid ${colors.gray200}`,
              marginBottom: "20px",
              fontFamily: "Arial, sans-serif",
            }}>
              <div style={{ borderBottom: `2px solid ${colors.gray300}`, paddingBottom: "16px", marginBottom: "16px" }}>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: colors.deepBlue, marginBottom: "8px" }}>📄 FACTURE</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: colors.gray600 }}>
                  <div>Date: {new Date().toLocaleDateString("fr-FR")}</div>
                  <div>Numéro: #{Math.random().toString(36).substr(2, 9).toUpperCase()}</div>
                </div>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: colors.gray100, borderBottom: `1px solid ${colors.gray300}` }}>
                    <th style={{ padding: "10px", textAlign: "left", fontWeight: "600", color: colors.gray700 }}>Type</th>
                    <th style={{ padding: "10px", textAlign: "left", fontWeight: "600", color: colors.gray700 }}>Montant</th>
                    <th style={{ padding: "10px", textAlign: "left", fontWeight: "600", color: colors.gray700 }}>Quantité</th>
                    <th style={{ padding: "10px", textAlign: "left", fontWeight: "600", color: colors.gray700 }}>Client</th>
                    <th style={{ padding: "10px", textAlign: "left", fontWeight: "600", color: colors.gray700 }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 5).map((trans, idx) => {
                    const transType = transactionTypes.find(t => t.id === trans.type);
                    const quantity = trans.metadata?.quantite || 1;
                    const clientName = trans.metadata?.nom_client || "—";
                    return (
                      <tr key={idx} style={{ borderBottom: `1px solid ${colors.gray200}` }}>
                        <td style={{ padding: "10px", color: transType?.color }}>{transType?.label || trans.type}</td>
                        <td style={{ padding: "10px", fontWeight: "600", color: colors.deepBlue }}>{trans.montant.toLocaleString()} FCFA</td>
                        <td style={{ padding: "10px" }}>{quantity}</td>
                        <td style={{ padding: "10px" }}>{clientName}</td>
                        <td style={{ padding: "10px", color: colors.gray600 }}>{new Date(trans.created_at).toLocaleDateString("fr-FR")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "20px", paddingTop: "16px", borderTop: `2px solid ${colors.gray300}`, marginTop: "16px" }}>
                <div>
                  <div style={{ fontSize: "12px", color: colors.gray600 }}>TOTAL</div>
                  <div style={{ fontSize: "20px", fontWeight: "bold", color: colors.beninGreen }}>
                    {transactions.slice(0, 5).reduce((sum, t) => sum + (t.montant || 0), 0).toLocaleString()} FCFA
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: `1px solid ${colors.gray200}`, textAlign: "center", fontSize: "11px", color: colors.gray500 }}>
                <div>Alodo • Plateforme de commerce et de services</div>
                <div>Généré le {new Date().toLocaleString("fr-FR")}</div>
              </div>
            </div>

            <button
              onClick={async () => {
                try {
                  const html2pdf = (await import('html2pdf.js')).default;
                  const element = document.getElementById('facture-content');
                  if (!element) return;

                  const opt = {
                    margin: 10,
                    filename: `facture_${new Date().toISOString().split('T')[0]}.pdf`,
                    image: { type: "png" as const, quality: 0.98 },
                    html2canvas: { scale: 2 },
                    jsPDF: { orientation: 'portrait' as const, unit: 'mm', format: 'a4' }
                  };
                  html2pdf().set(opt).from(element).save();
                } catch (err) {
                  console.error('Erreur génération PDF:', err);
                  alert('Erreur lors du téléchargement du PDF');
                }
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 24px",
                background: colors.beninGreen,
                color: colors.white,
                border: "none",
                borderRadius: "12px",
                fontSize: "15px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
            >
              <Download size={18} />
              Télécharger en PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
}