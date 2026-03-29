"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/src/lib/supabase/browser";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Briefcase,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  Lock,
  LogOut,
  Mail,
  MapPin,
  RefreshCcw,
  Store,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  MATCHING_ARCHETYPES,
  MATCHING_SECTORS,
  BENIN_DEPARTMENTS,
  MATCHING_FUNDING_NEEDS,
  MATCHING_DOCUMENTS,
} from "@/src/lib/profiles/matching-options";

const colors = {
  white: "#ffffff",
  ink: "#163f2e",
  deepBlue: "#1a3c6b",
  deepBlueDark: "#102748",
  beninGreen: "#008751",
  beninYellow: "#fcd116",
  beninRed: "#e8112d",
  softGreen: "#ecf7f1",
  softBlue: "#eef4ff",
  softYellow: "#fff9df",
  softRed: "#fff0f2",
  gray50: "#f8faf8",
  gray100: "#edf3ef",
  gray200: "#d7e4da",
  gray300: "#bdd0c1",
  gray500: "#5d7667",
  gray700: "#355344",
};

type ProfileLang = "fr" | "fon" | "yor";
type ProfileType = "vendeur" | "prestataire";
type Step = "connexion" | "langue" | "identite" | "activite" | "besoins" | "resume";

type FormState = {
  langue: ProfileLang;
  phone: string;
  type: ProfileType | null;
  archetype: string;
  secteur: string;
  sousSecteur: string;
  departement: string;
  commune: string;
  revenu: number | null;
  besoin: string;
  documents: Record<string, boolean>;
};

const LANGUAGES: Array<{
  code: ProfileLang;
  label: string;
  color: string;
  textColor: string;
  helper: string;
}> = [
  {
    code: "fr",
    label: "Francais",
    color: colors.beninGreen,
    textColor: colors.white,
    helper: "Carte verte",
  },
  {
    code: "fon",
    label: "Fon",
    color: colors.beninYellow,
    textColor: colors.deepBlueDark,
    helper: "Carte jaune",
  },
  {
    code: "yor",
    label: "Yoruba",
    color: colors.beninRed,
    textColor: colors.white,
    helper: "Carte rouge",
  },
];

const PROFILE_TYPES: Array<{
  id: ProfileType;
  title: string;
  description: string;
  color: string;
  icon: typeof Store;
}> = [
  {
    id: "vendeur",
    title: "Vendeur",
    description: "Je vends des produits, du stock ou des marchandises.",
    color: colors.beninGreen,
    icon: Store,
  },
  {
    id: "prestataire",
    title: "Prestataire de services",
    description: "Je rends surtout un service a mes clients.",
    color: colors.deepBlue,
    icon: Briefcase,
  },
];

const ARCHETYPES: Record<ProfileType, Array<{ id: string; label: string; color: string }>> =
  Object.fromEntries(
    (Object.keys(MATCHING_ARCHETYPES) as ProfileType[]).map((k) => {
      const palette = [colors.beninGreen, colors.beninYellow, colors.beninRed, colors.deepBlue];
      const items = MATCHING_ARCHETYPES[k].map((it, i) => ({ id: it.id, label: it.label, color: palette[i % palette.length] }));
      return [k, items];
    })
  ) as Record<ProfileType, Array<{ id: string; label: string; color: string }>>;

const SECTORS = MATCHING_SECTORS.map((s, idx) => ({
  ...s,
  color: [colors.beninGreen, colors.deepBlue, colors.beninYellow, colors.beninRed][idx % 4],
}));

const DEPARTMENTS = BENIN_DEPARTMENTS;

const REVENUE_OPTIONS = [
  { value: 75000, label: "Moins de 100 000 FCFA", color: colors.beninGreen },
  { value: 200000, label: "Entre 100 000 et 300 000 FCFA", color: colors.beninYellow },
  { value: 500000, label: "Entre 300 000 et 700 000 FCFA", color: colors.beninRed },
  { value: 900000, label: "Plus de 700 000 FCFA", color: colors.deepBlue },
];

const FUNDING_NEEDS = MATCHING_FUNDING_NEEDS.map((n, i) => ({ ...n, color: [colors.beninGreen, colors.deepBlue, colors.beninYellow, colors.beninRed][i % 4] }));
const DOCUMENTS = MATCHING_DOCUMENTS.map((d, i) => ({ ...d, color: [colors.beninGreen, colors.beninYellow, colors.beninRed, colors.deepBlue, "#6a8f6f", "#9c5b7a", "#6d52a8", "#b76a22"][i % 8] }));

const DEFAULT_FORM: FormState = {
  langue: "fr",
  phone: "",
  type: null,
  archetype: "",
  secteur: "",
  sousSecteur: "",
  departement: "",
  commune: "",
  revenu: null,
  besoin: "",
  documents: {},
};

function normalizePhone(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10);
}

function formatPhone(value: string): string {
  const digits = normalizePhone(value);

  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
  if (digits.length <= 6) return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6)}`;
  return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
}

function isValidBeninPhone(value: string): boolean {
  const digits = normalizePhone(value);
  return digits.length === 10 && digits.startsWith("01");
}

function buildDocumentsPayload(documents: Record<string, boolean>): Record<string, boolean> {
  return Object.fromEntries(Object.entries(documents).filter(([, value]) => value));
}

function firstIncompleteStep(form: FormState): Step {
  if (!form.langue) return "langue";
  if (!form.type || !form.archetype || !isValidBeninPhone(form.phone)) return "identite";
  if (!form.secteur || !form.sousSecteur || !form.commune) return "activite";
  if (!form.revenu || !form.besoin) return "besoins";
  return "resume";
}

function getStepAudio(step: Step, form: FormState): string {
  switch (step) {
    case "connexion":
      return "Commencez par vous connecter avec votre email et votre mot de passe pour demarrer le parcours.";
    case "langue":
      return "Bienvenue sur Alodo. Pour continuer, choisissez votre langue. Carte verte pour francais, carte jaune pour fon, carte rouge pour yoruba.";
    case "identite":
      return "Entrez votre numero du Benin, puis choisissez votre type d'activite. Si vous vendez, prenez la carte verte. Si vous rendez un service, prenez la carte bleue. Ensuite choisissez la carte qui ressemble le plus a votre travail.";
    case "activite":
      return "Choisissez votre secteur, puis votre sous secteur. Choisissez ensuite votre departement et votre commune au Benin.";
    case "besoins":
      return "Choisissez votre besoin principal, puis votre niveau de revenu mensuel. Ensuite, touchez les documents que vous avez deja. Quand une carte devient coloree, le document est selectionne.";
    case "resume":
      return "Verifiez votre resume. Si tout est bon, appuyez sur le bouton vert pour enregistrer votre profil.";
    default:
      return "";
  }
}

export default function OnboardingLanguePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("connexion");
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const currentTypeOptions = form.type ? ARCHETYPES[form.type] : [];
  const selectedDepartment = DEPARTMENTS.find((item) => item.id === form.departement);
  const currentCommunes = selectedDepartment?.communes ?? [];

  const resumeItems = useMemo(
    () => [
      ["Langue", LANGUAGES.find((item) => item.code === form.langue)?.label ?? "-"],
      ["Telephone", form.phone || "-"],
      ["Type", PROFILE_TYPES.find((item) => item.id === form.type)?.title ?? "-"],
      ["Archetype", form.archetype || "-"],
      ["Secteur", SECTORS.find((item) => item.id === form.secteur)?.label ?? "-"],
      ["Sous-secteur", form.sousSecteur || "-"],
      ["Commune", form.commune || "-"],
      [
        "Revenu estime",
        form.revenu ? `${form.revenu.toLocaleString("fr-FR")} FCFA` : "-",
      ],
      ["Besoin principal", FUNDING_NEEDS.find((item) => item.id === form.besoin)?.label ?? "-"],
      [
        "Documents",
        DOCUMENTS.filter((item) => form.documents[item.id])
          .map((item) => item.label)
          .join(", ") || "Aucun document signale",
      ],
    ],
    [form]
  );

  const progressIndex = ["connexion", "langue", "identite", "activite", "besoins", "resume"].indexOf(step);

  const speakCurrentStep = () => {
    if (typeof window === "undefined" || muted || !audioReady) return;

    window.speechSynthesis.cancel();

    const text = getStepAudio(step, form);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.lang =
      form.langue === "yor" ? "yo-NG" : form.langue === "fon" ? "fr-BJ" : "fr-FR";
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeech = () => {
    if (typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  const handleLogout = async () => {
    setError("");
    setSuccess("");
    stopSpeech();

    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        throw signOutError;
      }

      setUserId(null);
      setEmail("");
      setPassword("");
      setShowPassword(false);
      setForm(DEFAULT_FORM);
      setStep("connexion");
      router.replace("/langue");
    } catch (logoutError) {
      setError(
        logoutError instanceof Error ? logoutError.message : "Deconnexion impossible."
      );
    }
  };

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        if (!active) return;
        setUserId(user.id);

        const { data, error: profileError } = await supabase
          .from("profiles")
          .select(
            "role, langue, phone, type, secteur, sous_secteur, commune, archetype, revenu_mensuel_estime_fcfa, besoin_financement, documents_disponibles"
          )
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        if (data && active) {
          if (data.role === "admin") {
            router.replace("/institutions/dashboard");
            return;
          }

          const nextForm: FormState = {
            langue: (data.langue as ProfileLang | null) ?? "fr",
            phone: formatPhone(data.phone ?? ""),
            type: (data.type as ProfileType | null) ?? null,
            archetype: data.archetype ?? "",
            secteur: data.secteur ?? "",
            sousSecteur: data.sous_secteur ?? "",
            departement:
              DEPARTMENTS.find((department: any) =>
                (department.communes as string[]).includes(data.commune ?? "")
              )?.id ?? "",
            commune: data.commune ?? "",
            revenu: data.revenu_mensuel_estime_fcfa ?? null,
            besoin: data.besoin_financement ?? "",
            documents:
              data.documents_disponibles && typeof data.documents_disponibles === "object"
                ? (data.documents_disponibles as Record<string, boolean>)
                : {},
          };

          setForm(nextForm);
          setStep(firstIncompleteStep(nextForm));
        } else if (active) {
          setStep("langue");
        }
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Impossible de charger votre profil."
        );
      } finally {
        if (active) {
          setLoadingProfile(false);
        }
      }
    };

    void loadProfile();

    return () => {
      active = false;
      stopSpeech();
    };
  }, [router]);

  useEffect(() => {
    if (!audioReady || muted || loadingProfile) return;
    speakCurrentStep();
  }, [step, form.langue, audioReady, muted, loadingProfile, speakCurrentStep]);

  const updateForm = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
    setSuccess("");
  };

  const nextStep = () => {
    if (step === "connexion") {
      setStep("langue");
      return;
    }

    if (step === "langue") {
      setStep("identite");
      return;
    }

    if (step === "identite") {
      if (!isValidBeninPhone(form.phone)) {
        setError("Entrez un numero du Benin au format 01 XX XX XX XX.");
        return;
      }
      if (!form.type || !form.archetype) {
        setError("Choisissez votre type et votre activite principale.");
        return;
      }
      setStep("activite");
      return;
    }

    if (step === "activite") {
      if (!form.secteur || !form.sousSecteur || !form.departement || !form.commune) {
        setError("Choisissez votre secteur, votre sous-secteur et votre commune.");
        return;
      }
      setStep("besoins");
      return;
    }

    if (step === "besoins") {
      if (!form.besoin || !form.revenu) {
        setError("Choisissez votre besoin principal et votre revenu estime.");
        return;
      }
      setStep("resume");
    }
  };

  const previousStep = () => {
    if (step === "langue") setStep("connexion");
    if (step === "identite") setStep("langue");
    if (step === "activite") setStep("identite");
    if (step === "besoins") setStep("activite");
    if (step === "resume") setStep("besoins");
  };

  const saveProfile = async () => {
    if (!userId) {
      setError("Connectez-vous d'abord pour continuer.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        user_id: userId,
        role: "user",
        type: form.type,
        langue: form.langue,
        phone: normalizePhone(form.phone),
        secteur: form.secteur,
        sous_secteur: form.sousSecteur,
        commune: form.commune,
        archetype: form.archetype,
        revenu_mensuel_estime_fcfa: form.revenu,
        besoin_financement: form.besoin,
        documents_disponibles: buildDocumentsPayload(form.documents),
      };

      const { error: upsertError } = await supabase
        .from("profiles")
        .upsert(payload, { onConflict: "user_id" });

      if (upsertError) {
        throw upsertError;
      }

      setSuccess("Profil enregistre avec succes.");
      router.push(form.type === "prestataire" ? "/prestataire" : "/vendeur");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Impossible d'enregistrer votre profil."
      );
    } finally {
      setSaving(false);
    }
  };

  const loginAndSaveProfile = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Entrez votre email et votre mot de passe.");
      return;
    }

    setLoggingIn(true);
    setError("");

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      const nextUserId = data.user?.id ?? data.session?.user?.id ?? null;
      if (!nextUserId) {
        throw new Error("Connexion reussie, mais utilisateur introuvable.");
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, type")
        .eq("user_id", nextUserId)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      if (profile?.role === "admin") {
        router.replace("/institutions/dashboard");
        return;
      }

      setUserId(nextUserId);
      setStep(profile ? firstIncompleteStep(form) : "langue");
    } catch (loginError) {
      setError(
        loginError instanceof Error ? loginError.message : "Connexion impossible."
      );
    } finally {
      setLoggingIn(false);
    }
  };

  if (loadingProfile) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: colors.white,
          color: colors.ink,
          padding: 24,
        }}
        aria-live="polite"
      >
        <div style={{ display: "grid", gap: 12, alignItems: "center", textAlign: "center" }}>
          <div style={{ width: 48, height: 48, border: `4px solid ${colors.gray200}`, borderTop: `4px solid ${colors.beninGreen}`, borderRadius: "50%", margin: "0 auto", animation: "spin 1s linear infinite" }} />
          <div style={{ fontWeight: 800, fontSize: 18 }}>Chargement...</div>
          {error ? <div style={{ color: colors.beninRed }}>{error}</div> : null}
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(180deg, ${colors.gray50} 0%, ${colors.white} 100%)`,
        color: colors.ink,
        padding: "24px 18px 72px",
      }}
    >
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{ maxWidth: 1080, margin: "0 auto", display: "grid", gap: 22 }}>
        <header
          style={{
            display: "grid",
            gap: 14,
            background: colors.white,
            border: `1px solid ${colors.gray200}`,
            borderRadius: 24,
            padding: 24,
            boxShadow: "0 18px 40px rgba(19, 49, 33, 0.08)",
            animation: "fadeUp .35s ease",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "grid", gap: 8 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  color: colors.beninGreen,
                }}
              >
                ONBOARDING BENIN
              </div>
              <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.1 }}>
                Un profil simple, guide par couleurs et par audio
              </h1>
              <div style={{ color: colors.gray500, maxWidth: 760, lineHeight: 1.7 }}>
                Nous allons enregistrer votre langue, votre activite, votre commune au Benin,
                vos revenus estimes, votre besoin principal et les documents que vous avez deja.
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              {userId ? (
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  style={iconButtonStyle(colors.gray700)}
                  aria-label="Se deconnecter"
                  title="Se deconnecter"
                >
                  <LogOut size={18} />
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setMuted((current) => !current)}
                style={iconButtonStyle(muted ? colors.beninRed : colors.deepBlue)}
                aria-label={muted ? "Activer l'audio" : "Couper l'audio"}
              >
                {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAudioReady(true);
                  speakCurrentStep();
                }}
                style={iconButtonStyle(colors.beninGreen)}
                aria-label="Reécouter les instructions"
              >
                <RefreshCcw size={18} />
              </button>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 0.6fr",
              gap: 18,
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }} role="progressbar" aria-label="Progression des étapes">
            {["connexion", "langue", "identite", "activite", "besoins", "resume"].map((item, index) => (
                <div
                  key={item}
                  style={{
                    flex: 1,
                    minWidth: 120,
                    padding: "12px 14px",
                    borderRadius: 16,
                    border: `1px solid ${
                      index <= progressIndex ? colors.beninGreen : colors.gray200
                    }`,
                    background:
                      index === progressIndex
                        ? colors.softGreen
                        : index < progressIndex
                          ? "#f4fbf7"
                          : colors.white,
                    fontWeight: index === progressIndex ? 800 : 600,
                    color: index <= progressIndex ? colors.ink : colors.gray500,
                  }}
                >
                  {index + 1}. {stepLabel(item as Step)}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setAudioReady(true);
                speakCurrentStep();
              }}
              style={{
                border: "none",
                borderRadius: 16,
                padding: "16px 18px",
                background: speaking ? colors.beninYellow : colors.deepBlue,
                color: speaking ? colors.deepBlueDark : colors.white,
                fontWeight: 800,
                cursor: "pointer",
              }}
              aria-label={speaking ? "Audio en cours de lecture" : "Écouter les consignes"}
            >
              {speaking ? "Audio en cours" : "Ecouter les consignes"}
            </button>
          </div>
        </header>

        {error ? (
          <div
            style={{
              background: colors.softRed,
              color: colors.beninRed,
              border: `1px solid #f6c5cc`,
              borderRadius: 18,
              padding: "14px 16px",
              fontWeight: 700,
            }}
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {success ? (
          <div
            style={{
              background: colors.softGreen,
              color: colors.beninGreen,
              border: `1px solid #bfe4cf`,
              borderRadius: 18,
              padding: "14px 16px",
              fontWeight: 700,
            }}
            role="status"
          >
            {success}
          </div>
        ) : null}

        <section
          style={{
            background: colors.white,
            border: `1px solid ${colors.gray200}`,
            borderRadius: 24,
            padding: 24,
            boxShadow: "0 18px 40px rgba(19, 49, 33, 0.06)",
            animation: "fadeUp .4s ease",
          }}
        >
          {step === "langue" ? (
            <div style={{ display: "grid", gap: 18 }}>
              <StepIntro
                eyebrow="Etape 1"
                title="Choisissez votre langue"
                description="Pour les personnes qui lisent peu, l'audio explique aussi quelle couleur choisir."
              />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
                {LANGUAGES.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      updateForm("langue", item.code);
                      setAudioReady(true);
                    }}
                    style={{
                      border: `3px solid ${form.langue === item.code ? colors.ink : item.color}`,
                      borderRadius: 22,
                      background: item.color,
                      color: item.textColor,
                      padding: "24px 22px",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                    aria-label={`Sélectionner la langue ${item.label} (${item.helper})`}
                  >
                    <div style={{ fontSize: 24, fontWeight: 800 }}>{item.label}</div>
                    <div style={{ marginTop: 8, fontWeight: 600 }}>{item.helper}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {step === "identite" ? (
            <div style={{ display: "grid", gap: 22 }}>
              <StepIntro
                eyebrow="Etape 2"
                title="Votre telephone et votre profil"
                description="Nous utilisons le numero du Benin, votre type d'activite et votre archetype principal."
              />

              <div style={{ display: "grid", gap: 10 }}>
                <label htmlFor="phone-input" style={labelStyle}>Numero du Benin</label>
                <input
                  id="phone-input"
                  value={form.phone}
                  onChange={(event) => updateForm("phone", formatPhone(event.target.value))}
                  placeholder="01 90 12 34 56"
                  style={inputStyle}
                  aria-label="Numéro de téléphone du Bénin"
                />
                <div style={helperStyle}>
                  Format recommande au Benin: 01 XX XX XX XX.
                </div>
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                <label style={labelStyle}>Type de profil</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 14 }}>
                  {PROFILE_TYPES.map((item) => {
                    const Icon = item.icon;
                    const selected = form.type === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          updateForm("type", item.id);
                          updateForm("archetype", "");
                        }}
                        style={choiceCardStyle(selected, item.color)}
                        aria-label={`Sélectionner le profil ${item.title} : ${item.description}`}
                        aria-pressed={selected}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={choiceIconStyle(item.color)}>
                            <Icon size={20} color={item.color} />
                          </div>
                          <div style={{ textAlign: "left" }}>
                            <div style={{ fontWeight: 800 }}>{item.title}</div>
                            <div style={{ marginTop: 4, color: colors.gray500 }}>{item.description}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {form.type ? (
                <div style={{ display: "grid", gap: 12 }}>
                  <label style={labelStyle}>Activite principale dans votre categorie</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
                    {currentTypeOptions.map((item) => {
                      const selected = form.archetype === item.label;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => updateForm("archetype", item.label)}
                          style={smallChoiceStyle(selected, item.color)}
                          aria-label={`Sélectionner l'activité ${item.label}`}
                          aria-pressed={selected}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {step === "activite" ? (
            <div style={{ display: "grid", gap: 22 }}>
              <StepIntro
                eyebrow="Etape 3"
                title="Votre activite au Benin"
                description="Choisissez votre secteur, votre sous-secteur, puis votre localisation."
              />

              <div style={{ display: "grid", gap: 12 }}>
                <label style={labelStyle}>Secteur</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                  {SECTORS.map((item) => {
                    const selected = form.secteur === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          updateForm("secteur", item.id);
                          updateForm("sousSecteur", "");
                        }}
                        style={smallChoiceStyle(selected, item.color)}
                        aria-label={`Sélectionner le secteur ${item.label}`}
                        aria-pressed={selected}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {form.secteur ? (
                <div style={{ display: "grid", gap: 12 }}>
                  <label style={labelStyle}>Sous-secteur</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
                    {SECTORS.find((item) => item.id === form.secteur)?.subSectors.map((item) => {
                      const selected = form.sousSecteur === item;
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => updateForm("sousSecteur", item)}
                          style={smallChoiceStyle(selected, colors.deepBlue)}
                          aria-label={`Sélectionner le sous-secteur ${item}`}
                          aria-pressed={selected}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div style={{ display: "grid", gap: 10 }}>
                  <label htmlFor="departement-select" style={labelStyle}>Departement</label>
                  <select
                    id="departement-select"
                    value={form.departement}
                    onChange={(event) => {
                      updateForm("departement", event.target.value);
                      updateForm("commune", "");
                    }}
                    style={inputStyle}
                    aria-label="Sélectionner un département"
                  >
                    <option value="">Choisir un departement</option>
                    {DEPARTMENTS.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  <label htmlFor="commune-select" style={labelStyle}>Commune</label>
                  <select
                    id="commune-select"
                    value={form.commune}
                    onChange={(event) => updateForm("commune", event.target.value)}
                    style={inputStyle}
                    disabled={!form.departement}
                    aria-label="Sélectionner une commune"
                  >
                    <option value="">Choisir une commune</option>
                    {currentCommunes.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : null}

          {step === "besoins" ? (
            <div style={{ display: "grid", gap: 22 }}>
              <StepIntro
                eyebrow="Etape 4"
                title="Vos besoins et vos documents"
                description="Ces informations servent a recommander les bonnes offres de financement."
              />

              <div style={{ display: "grid", gap: 12 }}>
                <label style={labelStyle}>Besoin principal</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                  {FUNDING_NEEDS.map((item) => {
                    const selected = form.besoin === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => updateForm("besoin", item.id)}
                        style={smallChoiceStyle(selected, item.color)}
                        aria-label={`Sélectionner le besoin: ${item.label}`}
                        aria-pressed={selected}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                <label style={labelStyle}>Revenu mensuel estime</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                  {REVENUE_OPTIONS.map((item) => {
                    const selected = form.revenu === item.value;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => updateForm("revenu", item.value)}
                        style={smallChoiceStyle(selected, item.color)}
                        aria-label={`Sélectionner la tranche de revenu: ${item.label}`}
                        aria-pressed={selected}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                <label style={labelStyle}>Documents deja disponibles</label>
                <div style={{ color: colors.gray500, lineHeight: 1.6 }}>
                  Touchez chaque document que vous avez deja. Si vous n'avez rien, laissez les cartes grises.
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
                  {DOCUMENTS.map((item) => {
                    const selected = Boolean(form.documents[item.id]);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          updateForm("documents", {
                            ...form.documents,
                            [item.id]: !selected,
                          })
                        }
                        style={smallChoiceStyle(selected, item.color)}
                        aria-label={`${selected ? "Désélectionner" : "Sélectionner"} le document: ${item.label}`}
                        aria-pressed={selected}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}

          {step === "resume" ? (
            <div style={{ display: "grid", gap: 22 }}>
              <StepIntro
                eyebrow="Etape 5"
                title="Resume de votre profil"
                description="Ce profil servira a vous recommander des institutions et des offres adaptees."
              />

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                {resumeItems.map(([label, value]) => (
                  <div
                    key={label}
                    style={{
                      borderRadius: 18,
                      border: `1px solid ${colors.gray200}`,
                      background: colors.gray50,
                      padding: 16,
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", color: colors.gray500 }}>
                      {label}
                    </div>
                    <div style={{ marginTop: 8, fontWeight: 700, lineHeight: 1.5 }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {step === "connexion" ? (
            <div style={{ display: "grid", gap: 22 }}>
              <StepIntro
                eyebrow="Etape 1"
                title="Connectez-vous pour commencer"
                description="La connexion vient maintenant au debut, puis on complete votre profil en quelques etapes."
              />

              <div style={{ display: "grid", gap: 10 }}>
                <label htmlFor="onboarding-email" style={labelStyle}>Adresse email</label>
                <div style={{ position: "relative" }}>
                  <Mail size={18} color={colors.gray500} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    id="onboarding-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="exemple@alodo.com"
                    style={{ ...inputStyle, paddingLeft: 46 }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                <label htmlFor="onboarding-password" style={labelStyle}>Mot de passe</label>
                <div style={{ position: "relative" }}>
                  <Lock size={18} color={colors.gray500} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    id="onboarding-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Votre mot de passe"
                    style={{ ...inputStyle, paddingLeft: 46, paddingRight: 46 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    style={{
                      position: "absolute",
                      right: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      border: "none",
                      background: "transparent",
                      color: colors.gray500,
                      cursor: "pointer",
                    }}
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div
                style={{
                  borderRadius: 18,
                  background: colors.softBlue,
                  border: "1px solid #d7e4ff",
                  padding: 16,
                  color: colors.gray700,
                  lineHeight: 1.6,
                }}
              >
                Une fois connecte, vous completez le profil et nous enregistrons directement vos choix pour les recommandations.
              </div>
            </div>
          ) : null}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              marginTop: 28,
            }}
          >
            <button
              type="button"
              onClick={previousStep}
              disabled={step === "connexion"}
              style={{
                ...navButtonStyle(colors.white, colors.deepBlue, colors.deepBlue),
                opacity: step === "connexion" ? 0.45 : 1,
                cursor: step === "connexion" ? "not-allowed" : "pointer",
              }}
              aria-label="Retour à l'étape précédente"
              aria-disabled={step === "connexion"}
            >
              <ArrowLeft size={18} />
              Retour
            </button>

            {step === "connexion" ? (
              <button
                type="button"
                onClick={() => void loginAndSaveProfile()}
                disabled={loggingIn}
                style={{
                  ...navButtonStyle(colors.beninGreen, colors.white, colors.beninGreen),
                  opacity: loggingIn ? 0.6 : 1,
                  cursor: loggingIn ? "not-allowed" : "pointer",
                }}
                aria-label="Se connecter"
                aria-disabled={loggingIn}
              >
                <CheckCircle2 size={18} />
                {loggingIn ? "Connexion..." : "Se connecter"}
              </button>
            ) : step !== "resume" ? (
              <button
                type="button"
                onClick={nextStep}
                style={navButtonStyle(colors.deepBlue, colors.white, colors.deepBlue)}
                aria-label="Continuer à l'étape suivante"
              >
                Continuer
                <ArrowRight size={18} />
              </button>
            ) : step === "resume" ? (
              <button
                type="button"
                onClick={() => void saveProfile()}
                disabled={saving}
                style={{
                  ...navButtonStyle(colors.beninGreen, colors.white, colors.beninGreen),
                  opacity: saving ? 0.6 : 1,
                  cursor: saving ? "not-allowed" : "pointer",
                }}
                aria-label="Enregistrer mon profil"
                aria-disabled={saving}
              >
                <CheckCircle2 size={18} />
                {saving ? "Enregistrement..." : "Enregistrer mon profil"}
              </button>
            ) : null}
          </div>
        </section>

        <aside
          style={{
            background: colors.white,
            border: `1px solid ${colors.gray200}`,
            borderRadius: 24,
            padding: 22,
            boxShadow: "0 18px 40px rgba(19, 49, 33, 0.05)",
            display: "grid",
            gap: 18,
          }}
        >
          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", color: colors.gray500 }}>
              GUIDAGE VOCAL
            </div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>Repere par couleurs</div>
            <div style={{ color: colors.gray500, lineHeight: 1.6 }}>
              L'audio annonce toujours une couleur pour aider les personnes qui lisent peu.
            </div>
          </div>

          <ColorHint color={colors.beninGreen} title="Vert" text="choix principal, vendeur, langue francais, bouton final" />
          <ColorHint color={colors.beninYellow} title="Jaune" text="langue fon, options intermediaires, revenus moyens" />
          <ColorHint color={colors.beninRed} title="Rouge" text="langue yoruba, options secondaires, alertes" />
          <ColorHint color={colors.deepBlue} title="Bleu" text="prestataire de services et navigation" />

          <div
            style={{
              borderRadius: 18,
              background: colors.softBlue,
              border: `1px solid #d8e5ff`,
              padding: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 800 }}>
              <MapPin size={18} color={colors.deepBlue} />
              Donnees Benin
            </div>
            <div style={{ marginTop: 10, color: colors.gray700, lineHeight: 1.6 }}>
              L'onboarding propose les departements et communes du Benin, avec un numero local en format 01 XX XX XX XX.
            </div>
          </div>

          <div
            style={{
              borderRadius: 18,
              background: colors.softGreen,
              border: `1px solid #c9e7d3`,
              padding: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 800 }}>
              <Banknote size={18} color={colors.beninGreen} />
              Pour le matching
            </div>
            <div style={{ marginTop: 10, color: colors.gray700, lineHeight: 1.6 }}>
              Nous collectons secteur, sous-secteur, commune, revenus, besoin principal et documents disponibles pour pousser les bonnes offres.
            </div>
          </div>

          <div
            style={{
              borderRadius: 18,
              background: colors.softYellow,
              border: `1px solid #f0e1a0`,
              padding: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 800 }}>
              <FileText size={18} color={colors.deepBlueDark} />
              Conseil
            </div>
            <div style={{ marginTop: 10, color: colors.gray700, lineHeight: 1.6 }}>
              Si l'utilisateur ne sait pas lire, l'audio peut dire par exemple: choisissez la carte verte si vous vendez des produits.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// Composants auxiliaires
function StepIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", color: colors.beninGreen }}>
        {eyebrow}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800 }}>{title}</div>
      <div style={{ color: colors.gray500, lineHeight: 1.6 }}>{description}</div>
    </div>
  );
}

function ColorHint({
  color,
  title,
  text,
}: {
  color: string;
  title: string;
  text: string;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "56px 1fr",
        gap: 12,
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 18,
          background: color,
        }}
        aria-label={`Couleur ${title}`}
      />
      <div>
        <div style={{ fontWeight: 800 }}>{title}</div>
        <div style={{ marginTop: 4, color: colors.gray500, lineHeight: 1.5 }}>{text}</div>
      </div>
    </div>
  );
}

function stepLabel(step: Step): string {
  switch (step) {
    case "langue":
      return "Langue";
    case "identite":
      return "Profil";
    case "activite":
      return "Activite";
    case "besoins":
      return "Besoins";
    case "resume":
      return "Resume";
    case "connexion":
      return "Connexion";
    default:
      return step;
  }
}

function iconButtonStyle(background: string): React.CSSProperties {
  return {
    width: 46,
    height: 46,
    borderRadius: 14,
    border: "none",
    background,
    color: colors.white,
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
  };
}

function choiceCardStyle(selected: boolean, accent: string): React.CSSProperties {
  return {
    border: `2px solid ${selected ? accent : colors.gray200}`,
    borderRadius: 20,
    background: selected ? `${accent}14` : colors.white,
    padding: 18,
    cursor: "pointer",
  };
}

function choiceIconStyle(accent: string): React.CSSProperties {
  return {
    width: 44,
    height: 44,
    borderRadius: 14,
    background: `${accent}16`,
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
  };
}

function smallChoiceStyle(selected: boolean, accent: string): React.CSSProperties {
  return {
    border: `2px solid ${selected ? accent : colors.gray200}`,
    background: selected ? `${accent}18` : colors.white,
    color: colors.ink,
    borderRadius: 18,
    padding: "16px 14px",
    fontWeight: 700,
    cursor: "pointer",
    minHeight: 58,
  };
}

function navButtonStyle(background: string, color: string, borderColor: string): React.CSSProperties {
  return {
    minHeight: 54,
    padding: "0 24px",
    borderRadius: 16,
    border: `2px solid ${borderColor}`,
    background,
    color,
    fontWeight: 800,
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    cursor: "pointer",
  };
}

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  letterSpacing: "0.04em",
  color: colors.gray700,
};

const helperStyle: React.CSSProperties = {
  fontSize: 13,
  color: colors.gray500,
};

const inputStyle: React.CSSProperties = {
  minHeight: 54,
  borderRadius: 16,
  border: `1px solid ${colors.gray200}`,
  padding: "0 16px",
  fontSize: 15,
  color: colors.ink,
  background: colors.white,
};
