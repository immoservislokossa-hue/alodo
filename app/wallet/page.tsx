"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import supabase from "@/src/lib/supabase/browser";
import { 
  ArrowLeft,
  Wallet, 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  X,
  Calendar,
  TrendingUp,
  CreditCard,
  Banknote,
  History,
  ChevronRight,
  Shield,
  Clock,
  ArrowRight
} from "lucide-react";

// Couleurs du branding Alɔdó
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
  gray900: "#111827",
};

type Credit = {
  id: string;
  amount: number;
  currency: string;
  description: string;
  status: string;
  created_at: string;
  totalRepaid: number;
  remainingBalance: number;
  due_date?: string;
  interest_rate?: number;
  profiles?: {
    full_name: string;
    archetype: string;
  };
};

export default function WalletPage() {
  const router = useRouter();
  const [credits, setCredits] = useState<Credit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null);
  const [repaymentAmount, setRepaymentAmount] = useState("");
  const [repaymentLoading, setRepaymentLoading] = useState(false);
  const [repaymentError, setRepaymentError] = useState("");
  const [repaymentSuccess, setRepaymentSuccess] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadCreditsData() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;

        if (!user) {
          router.replace("/institutions/login");
          return;
        }

        if (!active) return;
        setUserId(user.id);

        // Load credits received by user
        try {
          const creditsResponse = await fetch("/api/credits/user");
          if (creditsResponse.ok) {
            const creditsData = await creditsResponse.json();
            if (creditsData.data && active) {
              setCredits(creditsData.data);
            }
          }
        } catch (err: any) {
          console.error("Error loading credits:", err);
        }

        // Pour la démo - données mock
        if (active && credits.length === 0) {
          setCredits([
            {
              id: "1",
              amount: 150000,
              currency: "FCFA",
              description: "Prêt pour expansion d'activité",
              status: "received",
              created_at: "2026-03-15",
              totalRepaid: 50000,
              remainingBalance: 100000,
              due_date: "2026-06-15",
              interest_rate: 8.5,
              profiles: {
                full_name: "Microfinance Bénin",
                archetype: "Institution financière",
              },
            },
            {
              id: "2",
              amount: 75000,
              currency: "FCFA",
              description: "Crédit équipement",
              status: "received",
              created_at: "2026-02-10",
              totalRepaid: 25000,
              remainingBalance: 50000,
              due_date: "2026-05-10",
              interest_rate: 7.5,
              profiles: {
                full_name: "Banque Atlantique",
                archetype: "Banque",
              },
            },
            {
              id: "3",
              amount: 200000,
              currency: "FCFA",
              description: "Prêt de campagne",
              status: "received",
              created_at: "2026-01-20",
              totalRepaid: 150000,
              remainingBalance: 50000,
              due_date: "2026-04-20",
              interest_rate: 9,
              profiles: {
                full_name: "Crédit Agricole",
                archetype: "Banque agricole",
              },
            },
          ]);
        }
      } catch (err: any) {
        if (active) setError(err?.message ?? "Erreur au chargement des crédits.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadCreditsData();
    return () => {
      active = false;
    };
  }, [router]);

  const handleRepayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCredit || !repaymentAmount) return;

    setRepaymentError("");
    setRepaymentSuccess(false);
    setRepaymentLoading(true);

    try {
      const amount = parseFloat(repaymentAmount);
      if (isNaN(amount) || amount <= 0 || amount > selectedCredit.remainingBalance) {
        throw new Error("Montant de remboursement invalide");
      }

      const response = await fetch("/api/repayments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creditId: selectedCredit.id,
          amount: Math.floor(amount),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors du remboursement");
      }

      const data = await response.json();
      setRepaymentSuccess(true);
      setRepaymentAmount("");

      setTimeout(() => {
        if (data.data?.checkoutUrl) {
          window.location.href = data.data.checkoutUrl;
        } else {
          setSelectedCredit(null);
          router.refresh();
        }
      }, 2000);
    } catch (err: any) {
      setRepaymentError(err.message || "Une erreur est survenue");
    } finally {
      setRepaymentLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getTotalRemainingBalance = () => {
    return credits.reduce((sum, credit) => sum + credit.remainingBalance, 0);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: colors.gray100,
      }}>
        <Loader2 size={40} color={colors.deepBlue} style={{ animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", padding: "24px", background: colors.gray100 }}>
        <div style={{ color: colors.beninRed, textAlign: "center", padding: "48px" }}>{error}</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: colors.gray100, paddingTop: "80px", paddingBottom: "48px" }}>
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
        <div style={{ flex: 1, background: colors.beninGreen }} />
        <div style={{ flex: 1, background: colors.beninYellow }} />
        <div style={{ flex: 1, background: colors.beninRed }} />
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 20px" }}>
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "8px" }}>
            <Link
              href="/dashboard"
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
                margin: 0,
              }}>
                Mes prêts
              </h1>
              <p style={{ color: colors.gray500, marginTop: "4px" }}>
                Gérez vos crédits et effectuez vos remboursements
              </p>
            </div>
          </div>
        </div>

        {/* Résumé des prêts */}
        <div style={{
          background: `linear-gradient(135deg, ${colors.deepBlue} 0%, ${colors.deepBlueDark} 100%)`,
          borderRadius: "24px",
          padding: "24px",
          marginBottom: "32px",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{
            position: "absolute",
            top: -40,
            right: -40,
            width: "150px",
            height: "150px",
            background: colors.beninGreen,
            borderRadius: "50%",
            opacity: 0.1,
          }} />
          
          <div style={{ position: "relative", zIndex: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <Wallet size={20} color={colors.beninYellow} />
              <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.8)" }}>Total à rembourser</span>
            </div>
            
            <div style={{ fontSize: "36px", fontWeight: 700, color: colors.white, marginBottom: "8px" }}>
              {getTotalRemainingBalance().toLocaleString("fr-FR")} FCFA
            </div>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>
              Sur {credits.length} prêt{credits.length > 1 ? "s" : ""} en cours
            </div>
          </div>
        </div>

        {/* Liste des prêts */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {credits.length === 0 ? (
            <div style={{
              background: colors.white,
              borderRadius: "24px",
              padding: "48px",
              textAlign: "center",
              border: `1px solid ${colors.gray200}`,
            }}>
              <Banknote size={48} color={colors.gray400} />
              <h3 style={{ fontSize: "18px", fontWeight: 600, color: colors.gray600, marginTop: "16px" }}>
                Aucun prêt en cours
              </h3>
              <p style={{ fontSize: "14px", color: colors.gray500, marginTop: "8px" }}>
                Les prêts que vous recevrez apparaîtront ici
              </p>
            </div>
          ) : (
            credits.map((credit) => {
              const daysUntilDue = credit.due_date ? getDaysUntilDue(credit.due_date) : null;
              const isUrgent = daysUntilDue !== null && daysUntilDue <= 7 && daysUntilDue > 0;
              const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
              const progressPercent = ((credit.amount - credit.remainingBalance) / credit.amount) * 100;
              
              return (
                <div
                  key={credit.id}
                  style={{
                    background: colors.white,
                    borderRadius: "24px",
                    padding: "24px",
                    border: `1px solid ${colors.gray200}`,
                    transition: "all 0.2s",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                  }}
                >
                  {/* En-tête */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
                    <div>
                      <div style={{ fontSize: "22px", fontWeight: 700, color: colors.deepBlue }}>
                        {credit.amount.toLocaleString("fr-FR")} {credit.currency}
                      </div>
                      <div style={{ fontSize: "13px", color: colors.gray500, marginTop: "4px" }}>
                        {credit.profiles?.full_name || "Institution"}
                      </div>
                      <div style={{ fontSize: "12px", color: colors.gray400, marginTop: "4px" }}>
                        {credit.description}
                      </div>
                    </div>
                    <div style={{
                      padding: "4px 12px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: 600,
                      background: `${colors.beninGreen}10`,
                      color: colors.beninGreen,
                    }}>
                      En cours
                    </div>
                  </div>

                  {/* Barre de progression */}
                  <div style={{ marginBottom: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "8px" }}>
                      <span style={{ color: colors.gray500 }}>Progression du remboursement</span>
                      <span style={{ fontWeight: 600, color: colors.beninGreen }}>{Math.round(progressPercent)}%</span>
                    </div>
                    <div style={{
                      height: "8px",
                      background: colors.gray100,
                      borderRadius: "4px",
                      overflow: "hidden",
                    }}>
                      <div style={{
                        width: `${progressPercent}%`,
                        height: "100%",
                        background: colors.beninGreen,
                        borderRadius: "4px",
                        transition: "width 0.3s",
                      }} />
                    </div>
                  </div>

                  {/* Détails du prêt */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                    gap: "16px",
                    marginBottom: "20px",
                    padding: "16px",
                    background: colors.gray50,
                    borderRadius: "16px",
                  }}>
                    <div>
                      <div style={{ fontSize: "11px", color: colors.gray500 }}>Montant total</div>
                      <div style={{ fontSize: "15px", fontWeight: 600, color: colors.gray700 }}>
                        {credit.amount.toLocaleString("fr-FR")} FCFA
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "11px", color: colors.gray500 }}>Déjà remboursé</div>
                      <div style={{ fontSize: "15px", fontWeight: 600, color: colors.beninGreen }}>
                        {credit.totalRepaid.toLocaleString("fr-FR")} FCFA
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "11px", color: colors.gray500 }}>Reste à payer</div>
                      <div style={{ fontSize: "15px", fontWeight: 700, color: colors.beninRed }}>
                        {credit.remainingBalance.toLocaleString("fr-FR")} FCFA
                      </div>
                    </div>
                    {credit.interest_rate && (
                      <div>
                        <div style={{ fontSize: "11px", color: colors.gray500 }}>Taux d'intérêt</div>
                        <div style={{ fontSize: "15px", fontWeight: 600, color: colors.gray700 }}>
                          {credit.interest_rate}%
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Date d'échéance */}
                  {credit.due_date && (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "12px",
                      borderRadius: "12px",
                      background: isOverdue ? `${colors.beninRed}10` : isUrgent ? `${colors.beninYellow}10` : colors.gray50,
                      marginBottom: "20px",
                    }}>
                      <Calendar size={16} color={isOverdue ? colors.beninRed : isUrgent ? colors.beninYellow : colors.gray500} />
                      <span style={{ fontSize: "13px", color: isOverdue ? colors.beninRed : isUrgent ? colors.beninYellow : colors.gray600 }}>
                        Échéance : {formatDate(credit.due_date)}
                        {isOverdue && <span style={{ marginLeft: "8px", fontWeight: 600 }}>(En retard)</span>}
                        {!isOverdue && daysUntilDue !== null && daysUntilDue <= 30 && (
                          <span style={{ marginLeft: "8px" }}>({daysUntilDue} jours restants)</span>
                        )}
                      </span>
                    </div>
                  )}

                  {/* Bouton de remboursement */}
                  <button
                    onClick={() => {
                      setSelectedCredit(credit);
                      setRepaymentAmount("");
                    }}
                    style={{
                      width: "100%",
                      padding: "14px",
                      background: colors.beninGreen,
                      color: colors.white,
                      border: "none",
                      borderRadius: "14px",
                      fontSize: "15px",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = colors.beninGreen + "dd"}
                    onMouseLeave={(e) => e.currentTarget.style.background = colors.beninGreen}
                  >
                    <ArrowRight size={18} />
                    Rembourser
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal de remboursement */}
      {selectedCredit && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setSelectedCredit(null)}
        >
          <div
            style={{
              background: colors.white,
              width: "100%",
              maxWidth: "500px",
              borderRadius: "28px 28px 0 0",
              padding: "28px 24px",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h3 style={{ fontSize: "22px", fontWeight: 700, color: colors.gray800, margin: 0 }}>
                Remboursement
              </h3>
              <button
                onClick={() => setSelectedCredit(null)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}
              >
                <X size={22} color={colors.gray400} />
              </button>
            </div>

            {repaymentSuccess && (
              <div style={{
                marginBottom: "20px",
                padding: "14px",
                background: `${colors.beninGreen}10`,
                borderRadius: "14px",
                display: "flex",
                gap: "10px",
                alignItems: "center",
              }}>
                <CheckCircle size={20} color={colors.beninGreen} />
                <div style={{ fontSize: "14px", color: colors.beninGreen }}>
                  Remboursement initié. Redirection en cours...
                </div>
              </div>
            )}

            {repaymentError && (
              <div style={{
                marginBottom: "20px",
                padding: "14px",
                background: `${colors.beninRed}10`,
                borderRadius: "14px",
                display: "flex",
                gap: "10px",
                alignItems: "center",
              }}>
                <AlertCircle size={20} color={colors.beninRed} />
                <div style={{ fontSize: "14px", color: colors.beninRed }}>{repaymentError}</div>
              </div>
            )}

            <form onSubmit={handleRepayment} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <div style={{ fontSize: "13px", color: colors.gray500, marginBottom: "4px" }}>
                  Montant du prêt
                </div>
                <div style={{ fontSize: "28px", fontWeight: 700, color: colors.deepBlue }}>
                  {selectedCredit.amount.toLocaleString("fr-FR")} {selectedCredit.currency}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "13px", color: colors.gray500, marginBottom: "4px" }}>
                  Reste à rembourser
                </div>
                <div style={{ fontSize: "24px", fontWeight: 700, color: colors.beninRed }}>
                  {selectedCredit.remainingBalance.toLocaleString("fr-FR")} {selectedCredit.currency}
                </div>
              </div>

              <div>
                <label style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: colors.gray700,
                  marginBottom: "8px",
                }}>
                  Montant à rembourser *
                </label>
                <input
                  type="number"
                  value={repaymentAmount}
                  onChange={(e) => setRepaymentAmount(e.target.value)}
                  placeholder="Entrez le montant"
                  max={selectedCredit.remainingBalance}
                  step="1000"
                  required
                  style={{
                    width: "100%",
                    padding: "14px",
                    border: `1px solid ${colors.gray200}`,
                    borderRadius: "14px",
                    fontSize: "16px",
                    outline: "none",
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = colors.deepBlue}
                  onBlur={(e) => e.currentTarget.style.borderColor = colors.gray200}
                />
                <p style={{ fontSize: "11px", color: colors.gray400, marginTop: "6px" }}>
                  Montant minimum : 1 000 FCFA
                </p>
              </div>

              <button
                type="submit"
                disabled={repaymentLoading || repaymentSuccess}
                style={{
                  width: "100%",
                  padding: "16px",
                  background: colors.beninGreen,
                  color: colors.white,
                  border: "none",
                  borderRadius: "14px",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: repaymentLoading || repaymentSuccess ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  opacity: repaymentLoading || repaymentSuccess ? 0.6 : 1,
                }}
              >
                {repaymentLoading && <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />}
                {repaymentLoading ? "Traitement..." : "Confirmer le remboursement"}
              </button>
            </form>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}