"use client";

import Link from "next/link";
import { 
  ArrowRight, 
  Shield, 
  Smartphone, 
  Building2, 
  Handshake, 
  TrendingUp,
  Users,
  CheckCircle,
  Star,
  Play
} from "lucide-react";

// ============================================================================
// COULEURS DU BRANDING ALO̱DÓ
// ============================================================================

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

const features = [
  {
    icon: Smartphone,
    title: "Application mobile",
    description: "Interface adaptée aux smartphones pour une utilisation terrain simplifiée",
    color: colors.beninGreen,
  },
  {
    icon: Building2,
    title: "Gestion centralisée",
    description: "Tableau de bord unifié pour piloter toutes vos activités",
    color: colors.deepBlue,
  },
  {
    icon: Handshake,
    title: "Inclusion financière",
    description: "Connectez-vous aux institutions financières et opportunités de financement",
    color: colors.beninYellow,
  },
  {
    icon: TrendingUp,
    title: "Croissance durable",
    description: "Outils d'analyse et de développement pour pérenniser votre activité",
    color: colors.beninRed,
  },
];

const stats = [
  { value: "10k+", label: "Utilisateurs actifs", icon: Users },
  { value: "500+", label: "Agents terrain", icon: Users },
  { value: "50+", label: "Institutions", icon: Building2 },
  { value: "98%", label: "Satisfaction", icon: Star },
];

export default function PublicHomePage() {
  return (
    <div style={{ backgroundColor: colors.white, minHeight: "100vh" }}>
      {/* Skip to content link */}
      <a
        href="#main-content"
        style={{
          position: "absolute",
          top: "-40px",
          left: "16px",
          background: colors.beninYellow,
          color: colors.deepBlue,
          padding: "8px 16px",
          borderRadius: "8px",
          textDecoration: "none",
          fontWeight: 600,
          zIndex: 100,
        }}
        onFocus={(e) => e.currentTarget.style.top = "16px"}
        onBlur={(e) => e.currentTarget.style.top = "-40px"}
      >
        Passer au contenu principal
      </a>

      {/* Barre tricolore béninoise */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "4px",
        display: "flex",
        zIndex: 50,
      }}>
        <div style={{ flex: 1, backgroundColor: colors.beninGreen }} />
        <div style={{ flex: 1, backgroundColor: colors.beninYellow }} />
        <div style={{ flex: 1, backgroundColor: colors.beninRed }} />
      </div>

      {/* Navigation */}
      <nav style={{
        position: "fixed",
        top: "16px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 32px)",
        maxWidth: "1200px",
        zIndex: 40,
      }}>
        <div style={{
          backgroundColor: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(12px)",
          borderRadius: "16px",
          border: `1px solid ${colors.gray100}`,
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)",
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "32px",
              height: "32px",
              backgroundColor: colors.deepBlue,
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <span style={{ color: colors.white, fontWeight: "bold", fontSize: "18px" }}>A</span>
            </div>
            <span style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 700,
              fontSize: "20px",
              color: colors.deepBlue,
            }}>Alɔdó</span>
          </div>

          {/* Navigation links */}
          <div style={{ display: "flex", gap: "32px" }}>
            <a href="#features" style={{ color: colors.gray600, textDecoration: "none", fontSize: "14px", fontWeight: 500 }}>Fonctionnalités</a>
            <a href="#stats" style={{ color: colors.gray600, textDecoration: "none", fontSize: "14px", fontWeight: 500 }}>Chiffres</a>
            <a href="#cta" style={{ color: colors.gray600, textDecoration: "none", fontSize: "14px", fontWeight: 500 }}>Commencer</a>
          </div>

          {/* Boutons */}
          <div style={{ display: "flex", gap: "12px" }}>
            <Link href="/login" style={{
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: 600,
              color: colors.deepBlue,
              textDecoration: "none",
              borderRadius: "8px",
              transition: "all 200ms ease",
            }}>
              Connexion
            </Link>
            <Link href="/onboarding" style={{
              padding: "8px 20px",
              fontSize: "14px",
              fontWeight: 600,
              backgroundColor: colors.deepBlue,
              color: colors.white,
              textDecoration: "none",
              borderRadius: "8px",
              transition: "all 200ms ease",
            }}>
              S'inscrire
            </Link>
          </div>
        </div>
      </nav>

      <main id="main-content" style={{ paddingTop: "96px" }}>
        {/* Section unique */}
        <section style={{ position: "relative", overflow: "hidden" }}>
          {/* Décors de fond */}
          <div style={{
            position: "absolute",
            top: "-80px",
            right: "-80px",
            width: "400px",
            height: "400px",
            backgroundColor: `${colors.beninGreen}08`,
            borderRadius: "9999px",
            filter: "blur(64px)",
            pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute",
            bottom: "-80px",
            left: "-80px",
            width: "400px",
            height: "400px",
            backgroundColor: `${colors.deepBlue}08`,
            borderRadius: "9999px",
            filter: "blur(64px)",
            pointerEvents: "none",
          }} />

          <div style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "48px 24px",
          }}>
            {/* Hero section */}
            <div style={{ textAlign: "center", maxWidth: "800px", margin: "0 auto 80px" }}>
              {/* Badge */}
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "rgba(255,255,255,0.8)",
                backdropFilter: "blur(8px)",
                padding: "8px 16px",
                borderRadius: "9999px",
                border: `1px solid ${colors.gray200}`,
                marginBottom: "24px",
                boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)",
              }}>
                <Shield size={16} color={colors.beninGreen} />
                <span style={{ fontSize: "14px", color: colors.gray600 }}>Plateforme certifiée</span>
                <span style={{ width: "4px", height: "4px", borderRadius: "2px", backgroundColor: colors.gray300 }} />
                <span style={{ fontSize: "14px", fontWeight: 600, color: colors.deepBlue }}>Alɔdó</span>
              </div>

              {/* Titre principal */}
              <h1 style={{
                fontSize: "clamp(40px, 8vw, 72px)",
                fontWeight: 800,
                fontFamily: "'Playfair Display', serif",
                color: colors.deepBlue,
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                marginBottom: "24px",
              }}>
                L'inclusion financière
                <br />
                <span style={{
                  background: `linear-gradient(90deg, ${colors.beninGreen}, ${colors.beninYellow}, ${colors.beninRed})`,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}>
                  pour l'économie informelle
                </span>
              </h1>

              {/* Description */}
              <p style={{
                fontSize: "clamp(16px, 4vw, 20px)",
                color: colors.gray600,
                maxWidth: "600px",
                margin: "0 auto 32px",
                lineHeight: 1.5,
              }}>
                La première plateforme SaaS qui connecte les MPME, agents terrain et institutions financières 
                pour transformer l'économie informelle en un système structuré et prospère.
              </p>

              {/* Boutons CTA */}
              <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
                <Link href="/langue" style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  minHeight: "56px",
                  padding: "12px 32px",
                  backgroundColor: colors.deepBlue,
                  color: colors.white,
                  textDecoration: "none",
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "16px",
                  transition: "all 200ms ease",
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.deepBlueDark}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.deepBlue}>
                  Commencer maintenant
                  <ArrowRight size={18} />
                </Link>
                <button style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  minHeight: "56px",
                  padding: "12px 32px",
                  backgroundColor: "transparent",
                  color: colors.deepBlue,
                  border: `2px solid ${colors.deepBlue}`,
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "16px",
                  cursor: "pointer",
                  transition: "all 200ms ease",
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${colors.deepBlue}10`}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                  <Play size={18} />
                  Voir la démo
                </button>
              </div>
            </div>

            {/* Statistiques */}
            <div id="stats" style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "32px",
              borderTop: `1px solid ${colors.gray100}`,
              paddingTop: "48px",
              marginBottom: "80px",
            }}>
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} style={{ textAlign: "center" }}>
                    <Icon size={28} color={colors.deepBlue} style={{ marginBottom: "12px", opacity: 0.6 }} />
                    <div style={{
                      fontSize: "clamp(28px, 5vw, 36px)",
                      fontWeight: 700,
                      color: colors.deepBlue,
                      marginBottom: "4px",
                    }}>
                      {stat.value}
                    </div>
                    <div style={{ fontSize: "14px", color: colors.gray500 }}>
                      {stat.label}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Fonctionnalités */}
            <div id="features">
              <div style={{ textAlign: "center", marginBottom: "48px" }}>
                <h2 style={{
                  fontSize: "clamp(28px, 5vw, 40px)",
                  fontWeight: 700,
                  fontFamily: "'Playfair Display', serif",
                  color: colors.deepBlue,
                  marginBottom: "16px",
                }}>
                  Tout ce dont vous avez besoin
                </h2>
                <p style={{ fontSize: "18px", color: colors.gray600 }}>
                  Une suite complète d'outils pour réussir
                </p>
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "24px",
                marginBottom: "80px",
              }}>
                {features.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div key={feature.title} style={{
                      backgroundColor: colors.white,
                      padding: "32px",
                      borderRadius: "16px",
                      border: `1px solid ${colors.gray100}`,
                      transition: "all 300ms ease",
                      boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0,0,0,0.1)";
                      e.currentTarget.style.transform = "translateY(-4px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = "0 1px 2px 0 rgba(0,0,0,0.05)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}>
                      <div style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "12px",
                        backgroundColor: `${feature.color}10`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "20px",
                      }}>
                        <Icon size={28} color={feature.color} />
                      </div>
                      <h3 style={{
                        fontSize: "20px",
                        fontWeight: 700,
                        color: colors.deepBlue,
                        marginBottom: "12px",
                      }}>
                        {feature.title}
                      </h3>
                      <p style={{ fontSize: "14px", color: colors.gray600, lineHeight: 1.5 }}>
                        {feature.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CTA Finale */}
            <div id="cta" style={{
              textAlign: "center",
              backgroundColor: colors.deepBlue,
              borderRadius: "24px",
              padding: "64px 32px",
              background: `linear-gradient(135deg, ${colors.deepBlue} 0%, ${colors.deepBlueDark} 100%)`,
            }}>
              <h2 style={{
                fontSize: "clamp(28px, 5vw, 40px)",
                fontWeight: 700,
                fontFamily: "'Playfair Display', serif",
                color: colors.white,
                marginBottom: "16px",
              }}>
                Prêt à transformer votre activité ?
              </h2>
              <p style={{
                fontSize: "18px",
                color: "rgba(255,255,255,0.9)",
                maxWidth: "500px",
                margin: "0 auto 32px",
              }}>
                Rejoignez des milliers d'utilisateurs qui utilisent déjà Alɔdó
              </p>
              <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
                <Link href="/onboarding" style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  minHeight: "56px",
                  padding: "12px 32px",
                  backgroundColor: colors.beninYellow,
                  color: colors.deepBlue,
                  textDecoration: "none",
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "16px",
                  transition: "all 200ms ease",
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#e6a800"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.beninYellow}>
                  Créer mon compte
                  <ArrowRight size={18} />
                </Link>
                <Link href="/contact" style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  minHeight: "56px",
                  padding: "12px 32px",
                  backgroundColor: "transparent",
                  color: colors.white,
                  border: `2px solid ${colors.white}`,
                  textDecoration: "none",
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "16px",
                  transition: "all 200ms ease",
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                  Contacter l'équipe
                </Link>
              </div>
              <div style={{ marginTop: "32px", display: "flex", justifyContent: "center", gap: "24px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <CheckCircle size={16} color="rgba(255,255,255,0.7)" />
                  <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)" }}>Aucune obligation</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <CheckCircle size={16} color="rgba(255,255,255,0.7)" />
                  <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)" }}>Support inclus</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <CheckCircle size={16} color="rgba(255,255,255,0.7)" />
                  <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)" }}>Annulation à tout moment</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{
          backgroundColor: colors.gray900,
          padding: "48px 24px 32px",
          marginTop: "0",
        }}>
          <div style={{
            maxWidth: "1200px",
            margin: "0 auto",
          }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "48px",
              marginBottom: "48px",
            }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                  <div style={{
                    width: "32px",
                    height: "32px",
                    backgroundColor: colors.deepBlue,
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <span style={{ color: colors.white, fontWeight: "bold", fontSize: "18px" }}>A</span>
                  </div>
                  <span style={{
                    fontFamily: "'Playfair Display', serif",
                    fontWeight: 700,
                    fontSize: "20px",
                    color: colors.white,
                  }}>Alɔdó</span>
                </div>
                <p style={{ fontSize: "14px", color: colors.gray400, lineHeight: 1.5 }}>
                  Plateforme d'inclusion financière pour l'économie informelle
                </p>
              </div>

              <div>
                <h4 style={{ color: colors.white, fontWeight: 600, marginBottom: "16px", fontSize: "16px" }}>Produit</h4>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  <li style={{ marginBottom: "8px" }}><a href="#features" style={{ color: colors.gray400, textDecoration: "none", fontSize: "14px" }}>Fonctionnalités</a></li>
                  <li style={{ marginBottom: "8px" }}><a href="#" style={{ color: colors.gray400, textDecoration: "none", fontSize: "14px" }}>Tarifs</a></li>
                  <li><a href="#" style={{ color: colors.gray400, textDecoration: "none", fontSize: "14px" }}>Sécurité</a></li>
                </ul>
              </div>

              <div>
                <h4 style={{ color: colors.white, fontWeight: 600, marginBottom: "16px", fontSize: "16px" }}>Support</h4>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  <li style={{ marginBottom: "8px" }}><a href="#" style={{ color: colors.gray400, textDecoration: "none", fontSize: "14px" }}>Centre d'aide</a></li>
                  <li style={{ marginBottom: "8px" }}><a href="#" style={{ color: colors.gray400, textDecoration: "none", fontSize: "14px" }}>Contact</a></li>
                  <li><a href="#" style={{ color: colors.gray400, textDecoration: "none", fontSize: "14px" }}>FAQ</a></li>
                </ul>
              </div>

              <div>
                <h4 style={{ color: colors.white, fontWeight: 600, marginBottom: "16px", fontSize: "16px" }}>Légal</h4>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  <li style={{ marginBottom: "8px" }}><a href="#" style={{ color: colors.gray400, textDecoration: "none", fontSize: "14px" }}>Confidentialité</a></li>
                  <li><a href="#" style={{ color: colors.gray400, textDecoration: "none", fontSize: "14px" }}>Conditions d'utilisation</a></li>
                </ul>
              </div>
            </div>

            <div style={{
              borderTop: `1px solid ${colors.gray800}`,
              paddingTop: "32px",
              textAlign: "center",
              fontSize: "14px",
              color: colors.gray500,
            }}>
              <p>© {new Date().getFullYear()} Alɔdó. Tous droits réservés.</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}