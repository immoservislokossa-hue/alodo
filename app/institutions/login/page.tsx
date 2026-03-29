"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import supabase from "@/src/lib/supabase/browser";
import { ArrowRight, Building2, Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import { getPathForProfile } from "@/src/lib/profiles/access";

const colors = {
  white: "#ffffff",
  ink: "#163f2e",
  blue: "#1a3c6b",
  blueDark: "#102748",
  green: "#008751",
  yellow: "#fcd116",
  red: "#e8112d",
  gray100: "#edf3ef",
  gray200: "#d7e4da",
  gray500: "#5d7667",
};

export default function InstitutionLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function checkSession() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !active) {
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, type")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile?.role === "admin") {
        router.replace("/institutions/dashboard");
        return;
      }

      router.replace(getPathForProfile(profile));
    }

    void checkSession();
    return () => {
      active = false;
    };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      const userId = signInData.user?.id;
      if (!userId) {
        throw new Error("Compte introuvable apres connexion.");
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, type")
        .eq("user_id", userId)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      if (profile?.role !== "admin") {
        await supabase.auth.signOut();
        throw new Error("Cet espace est reserve aux comptes admin.");
      }

      router.push("/institutions/dashboard");
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Connexion impossible."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${colors.blue} 0%, ${colors.blueDark} 55%, #eef4f1 100%)`,
        padding: "22px",
        display: "grid",
        placeItems: "center",
      }}
    >
      <div
        style={{
          maxWidth: 1080,
          width: "100%",
          background: colors.white,
          borderRadius: 28,
          overflow: "hidden",
          boxShadow: "0 28px 60px rgba(10, 26, 45, 0.24)",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
        }}
      >
        <section
          style={{
            padding: "44px 38px",
            background: `linear-gradient(180deg, ${colors.blue} 0%, ${colors.blueDark} 100%)`,
            color: colors.white,
            display: "grid",
            gap: 22,
          }}
        >
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, fontWeight: 800 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                background: colors.white,
                display: "grid",
                placeItems: "center",
                color: colors.blue,
                fontSize: 26,
                fontWeight: 900,
              }}
            >
              A
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 900 }}>Alodo</div>
              <div style={{ opacity: 0.82 }}>Espace institutions</div>
            </div>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", color: colors.yellow }}>
              ACCES PARTENAIRES
            </div>
            <h1 style={{ margin: 0, fontSize: 38, lineHeight: 1.05 }}>
              Publiez des offres et ciblez les bonnes MPME
            </h1>
            <div style={{ lineHeight: 1.7, opacity: 0.9 }}>
              Connectez-vous pour publier vos opportunites, definir vos criteres de
              ciblage et suivre les campagnes vers les vendeurs et prestataires.
            </div>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            {[
              "Publication d'offres ciblees",
              "Matching avec les profils compatibles",
              "Diffusion vers les bons utilisateurs",
            ].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <ShieldCheck size={18} color={colors.green} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section style={{ padding: "44px 38px", display: "grid", gap: 24 }}>
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", color: colors.green }}>
              CONNEXION
            </div>
            <h2 style={{ margin: 0, fontSize: 30, color: colors.ink }}>Acceder au dashboard</h2>
            <div style={{ color: colors.gray500, lineHeight: 1.6 }}>
              Utilisez le compte de votre institution pour gerer vos campagnes.
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 18 }}>
            <div style={{ display: "grid", gap: 8 }}>
              <label htmlFor="institution-email" style={labelStyle}>Adresse email</label>
              <div style={{ position: "relative" }}>
                <Mail size={18} color={colors.gray500} style={fieldIconLeft} />
                <input
                  id="institution-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="contact@institution.bj"
                  style={{ ...fieldStyle, paddingLeft: 46 }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <label htmlFor="institution-password" style={labelStyle}>Mot de passe</label>
              <div style={{ position: "relative" }}>
                <Lock size={18} color={colors.gray500} style={fieldIconLeft} />
                <input
                  id="institution-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Votre mot de passe"
                  style={{ ...fieldStyle, paddingLeft: 46, paddingRight: 46 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  style={togglePasswordStyle}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error ? (
              <div
                style={{
                  borderRadius: 16,
                  padding: "12px 14px",
                  background: "#fff2f4",
                  border: "1px solid #f5cad1",
                  color: colors.red,
                  fontWeight: 700,
                }}
              >
                {error}
              </div>
            ) : null}

            <button type="submit" disabled={loading} style={submitButtonStyle}>
              <Building2 size={18} />
              {loading ? "Connexion..." : "Se connecter"}
              {!loading ? <ArrowRight size={18} /> : null}
            </button>
          </form>

          <div
            style={{
              borderRadius: 18,
              border: `1px solid ${colors.gray200}`,
              background: colors.gray100,
              padding: 16,
              color: colors.gray500,
              lineHeight: 1.6,
            }}
          >
            Vous n'avez pas encore d'acces institution ? Passez d'abord par l'equipe
            Alodo pour l'activation de votre espace partenaire.
          </div>

          <Link href="/institutions" style={backLinkStyle}>
            Retour a l'espace institutions
          </Link>
        </section>
      </div>
    </div>
  );
}

const labelStyle = {
  fontSize: 13,
  fontWeight: 800,
  letterSpacing: "0.04em",
  color: colors.ink,
} as const;

const fieldStyle = {
  width: "100%",
  minHeight: 52,
  borderRadius: 16,
  border: `1px solid ${colors.gray200}`,
  padding: "0 16px",
  fontSize: 15,
  color: colors.ink,
  background: colors.white,
} as const;

const fieldIconLeft = {
  position: "absolute",
  left: 16,
  top: "50%",
  transform: "translateY(-50%)",
} as const;

const togglePasswordStyle = {
  position: "absolute",
  right: 14,
  top: "50%",
  transform: "translateY(-50%)",
  border: "none",
  background: "transparent",
  color: colors.gray500,
  cursor: "pointer",
} as const;

const submitButtonStyle = {
  minHeight: 54,
  borderRadius: 16,
  border: "none",
  background: colors.green,
  color: colors.white,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  fontWeight: 800,
  cursor: "pointer",
} as const;

const backLinkStyle = {
  color: colors.blue,
  fontWeight: 700,
  textDecoration: "none",
} as const;
