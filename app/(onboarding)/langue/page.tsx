"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/src/lib/supabase/browser";
import {
  Phone,
  RefreshCcw,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Store,
  Briefcase,
  CheckCircle2,
} from "lucide-react";
import {
  MATCHING_ARCHETYPES,
  MATCHING_SECTORS,
  BENIN_DEPARTMENTS,
  MATCHING_FUNDING_NEEDS,
  MATCHING_DOCUMENTS,
} from "@/src/lib/profiles/matching-options";
import { getPathForProfile } from "@/src/lib/profiles/access";

const colors = {
  white: "#ffffff",
  ink: "#1e2a3a",
  deepBlue: "#1e3a5f",
  deepBlueDark: "#0a2a44",
  beninGreen: "#2e7d32",
  beninYellow: "#f9a825",
  beninRed: "#c62828",
  softGreen: "#e8f5e9",
  softBlue: "#e3f2fd",
  softYellow: "#fff8e1",
  softRed: "#ffebee",
  gray50: "#fafafa",
  gray100: "#f5f5f5",
  gray200: "#eeeeee",
  gray300: "#e0e0e0",
  gray500: "#9e9e9e",
  gray700: "#616161",
};

type ProfileLang = "fr" | "fon" | "yor";
type ProfileType = "vendeur" | "prestataire";
type Step =
  | "langue"
  | "connexion"
  | "telephone"
  | "type-profil"
  | "archetype"
  | "secteur"
  | "sous-secteur"
  | "localisation"
  | "besoin"
  | "revenu"
  | "documents"
  | "resume";

type FormState = {
  langue: ProfileLang;
  phone: string;
  type: ProfileType | null;
  archetype: string;
  secteur: string;
  sousSecteur: string;
  departement: string;
  commune: string;
  besoin: string;
  revenu: number | null;
  documents: Record<string, boolean>;
};

const LANGUAGES = [
  { code: "fr", label: "Français", color: colors.beninGreen, textColor: colors.white, guide: "Carte verte" },
  { code: "fon", label: "Fon", color: colors.beninYellow, textColor: colors.ink, guide: "Carte jaune" },
  { code: "yor", label: "Yoruba", color: colors.beninRed, textColor: colors.white, guide: "Carte rouge" },
];

const PROFILE_TYPES = [
  { id: "vendeur", title: "Vendeur", color: colors.beninGreen, icon: Store, guide: "Carte verte" },
  { id: "prestataire", title: "Prestataire", color: colors.deepBlue, icon: Briefcase, guide: "Carte bleue" },
];

const ARCHETYPES = {
  vendeur: MATCHING_ARCHETYPES.vendeur.map((a) => ({ id: a.id, label: a.label })),
  prestataire: MATCHING_ARCHETYPES.prestataire.map((a) => ({ id: a.id, label: a.label })),
};

const SECTORS = MATCHING_SECTORS.map((s, idx) => ({
  id: s.id,
  label: s.label,
  color: [colors.beninGreen, colors.beninYellow, colors.deepBlue][idx % 3],
  subSectors: s.subSectors,
}));

const DEPARTMENTS = BENIN_DEPARTMENTS;
const FUNDING_NEEDS = MATCHING_FUNDING_NEEDS.map((n, idx) => ({
  id: n.id,
  label: n.label,
  color: [colors.beninGreen, colors.beninYellow, colors.beninRed, colors.deepBlue][idx % 4],
}));
const DOCUMENTS = MATCHING_DOCUMENTS;
const REVENUE_OPTIONS = [
  { value: 75000, label: "Moins de 100 000 FCFA", color: colors.beninGreen, guide: "Carte verte" },
  { value: 200000, label: "100 000 - 300 000 FCFA", color: colors.beninYellow, guide: "Carte jaune" },
  { value: 500000, label: "300 000 - 700 000 FCFA", color: colors.beninRed, guide: "Carte rouge" },
  { value: 900000, label: "Plus de 700 000 FCFA", color: colors.deepBlue, guide: "Carte bleue" },
];

const normalizePhone = (value: string) => value.replace(/\D/g, "").slice(0, 10);
const formatPhone = (value: string) => {
  const digits = normalizePhone(value);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
  if (digits.length <= 6) return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6)}`;
  return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)} ${digits.slice(8)}`;
};
const isValidBeninPhone = (value: string) => {
  const digits = normalizePhone(value);
  return digits.length === 10 && digits.startsWith("01");
};
const phoneToEmail = (phone: string) => `${normalizePhone(phone)}@alodo.app`;

const DEFAULT_FORM: FormState = {
  langue: "fr",
  phone: "",
  type: null,
  archetype: "",
  secteur: "",
  sousSecteur: "",
  departement: "",
  commune: "",
  besoin: "",
  revenu: null,
  documents: {},
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("langue");
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [muted, setMuted] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stepsList: Step[] = [
    "langue", "connexion", "telephone", "type-profil", "archetype",
    "secteur", "sous-secteur", "localisation", "besoin", "revenu", "documents", "resume"
  ];
  const currentIndex = stepsList.indexOf(step);
  const progress = ((currentIndex + 1) / stepsList.length) * 100;

  const playAudio = useCallback((stepName: Step) => {
    if (muted) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    const newAudio = new Audio(`/audio/${form.langue}/${stepName}.mp3`);
    newAudio.onplay = () => setAudioPlaying(true);
    newAudio.onended = () => setAudioPlaying(false);
    newAudio.onerror = () => setAudioPlaying(false);
    newAudio.play().catch(() => {});
    audioRef.current = newAudio;
  }, [muted, form.langue]);

  useEffect(() => {
    if (!loading) playAudio(step);
  }, [step, form.langue, loading, playAudio]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }
        setUserId(user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();
        if (profile) {
          // If the profile already has a type or admin role, redirect to the correct area
          try {
            const dest = getPathForProfile({ type: profile.type, role: profile.role });
            if (dest) {
              router.replace(dest);
              setLoading(false);
              return;
            }
          } catch (redirectErr) {
            // ignore and continue onboarding flow
            console.error('Redirect error:', redirectErr);
          }
          setForm({
            langue: profile.langue || "fr",
            phone: formatPhone(profile.phone || ""),
            type: profile.type,
            archetype: profile.archetype || "",
            secteur: profile.secteur || "",
            sousSecteur: profile.sous_secteur || "",
            departement: profile.departement || "",
            commune: profile.commune || "",
            besoin: profile.besoin_financement || "",
            revenu: profile.revenu_mensuel_estime_fcfa || null,
            documents: profile.documents_disponibles || {},
          });
          if (!profile.phone) setStep("telephone");
          else if (!profile.type) setStep("type-profil");
          else if (!profile.archetype) setStep("archetype");
          else if (!profile.secteur) setStep("secteur");
          else if (!profile.sous_secteur) setStep("sous-secteur");
          else if (!profile.commune) setStep("localisation");
          else if (!profile.besoin_financement) setStep("besoin");
          else if (!profile.revenu_mensuel_estime_fcfa) setStep("revenu");
          else setStep("resume");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const updateForm = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");
  };

  const nextStep = () => {
    const next = stepsList[currentIndex + 1];
    if (next) setStep(next);
  };

  const prevStep = () => {
    const prev = stepsList[currentIndex - 1];
    if (prev) setStep(prev);
  };

  const login = async () => {
    if (!form.phone.trim() || !password.trim()) {
      setError("Entrez votre numéro et votre mot de passe");
      return;
    }
    if (!isValidBeninPhone(form.phone)) {
      setError("Numéro invalide. Format: 01 XX XX XX XX");
      return;
    }
    setError("");
    const email = phoneToEmail(form.phone);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError("Numéro ou mot de passe incorrect");
        return;
      }
      setUserId(data.user.id);
      nextStep();
    } catch (err) {
      setError("Erreur de connexion. Vérifiez votre connexion internet.");
    }
  };

  const signup = async () => {
    if (!form.phone.trim() || !password.trim()) {
      setError("Entrez votre numéro et votre mot de passe");
      return;
    }
    if (!isValidBeninPhone(form.phone)) {
      setError("Numéro invalide. Format: 01 XX XX XX XX");
      return;
    }
    setError("");
    const email = phoneToEmail(form.phone);
    try {
      // Vérifier si l'utilisateur existe déjà
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("phone")
        .eq("phone", normalizePhone(form.phone))
        .single();

      if (existingUser) {
        setError("Ce numéro est déjà utilisé. Connectez-vous plutôt.");
        return;
      }

      // Créer l'utilisateur avec Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            phone: normalizePhone(form.phone),
            langue: form.langue,
          },
        },
      });

      if (signUpError) {
        console.error("Signup error:", signUpError);
        if (signUpError.message.includes("User already registered")) {
          setError("Ce numéro est déjà utilisé. Connectez-vous.");
        } else {
          setError("Erreur d'inscription: " + signUpError.message);
        }
        return;
      }

      if (data.user) {
        setUserId(data.user.id);
        
        // Créer le profil dans la table profiles
        const { error: profileError } = await supabase.from("profiles").insert({
          user_id: data.user.id,
          langue: form.langue,
          phone: normalizePhone(form.phone),
          type: null,
          role: "user",
          reputation_score: 3.5,
        });

        if (profileError) {
          console.error("Profile creation error:", profileError);
          setError("Compte créé mais erreur lors de la configuration du profil.");
          return;
        }

        nextStep();
      }
    } catch (err) {
      console.error("Signup exception:", err);
      setError("Erreur de connexion. Vérifiez votre connexion internet.");
    }
  };

  const saveProfile = async () => {
    if (!userId) {
      setError("Connectez-vous d'abord");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        user_id: userId,
        langue: form.langue,
        phone: normalizePhone(form.phone),
        type: form.type,
        archetype: form.archetype,
        secteur: form.secteur,
        sous_secteur: form.sousSecteur,
        commune: form.commune,
        besoin_financement: form.besoin,
        revenu_mensuel_estime_fcfa: form.revenu,
        documents_disponibles: form.documents,
      };
      const { error } = await supabase
        .from("profiles")
        .upsert(payload, { onConflict: "user_id" });
      if (error) {
        setError("Erreur lors de l'enregistrement");
        setSaving(false);
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      const profile = { type: form.type, role: user?.user_metadata?.role };
      router.push(getPathForProfile(profile));
    } catch (err) {
      setError("Erreur réseau. Réessayez.");
      setSaving(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case "langue":
        return (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🇧🇯</div>
            <h2 style={{ fontSize: 28, marginBottom: 8, color: colors.ink }}>Bienvenue sur Alodo</h2>
            <p style={{ color: colors.gray700, marginBottom: 32 }}>Choisis ta langue pour commencer</p>
            <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    updateForm("langue", lang.code as ProfileLang);
                    nextStep();
                  }}
                  style={{
                    background: lang.color,
                    color: lang.textColor,
                    border: "none",
                    borderRadius: 24,
                    padding: "32px 24px",
                    width: 140,
                    fontSize: 20,
                    fontWeight: "bold",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    transition: "transform 0.2s",
                  }}
                >
                  {lang.label}
                  <div style={{ fontSize: 12, marginTop: 8, opacity: 0.9 }}>{lang.guide}</div>
                </button>
              ))}
            </div>
          </div>
        );

      case "connexion":
        return (
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: 28, marginBottom: 8, color: colors.ink }}>Connecte-toi</h2>
            <p style={{ color: colors.gray700, marginBottom: 32 }}>Utilise ton numéro Bénin</p>
            <div style={{ marginBottom: 24 }}>
              <div style={{ position: "relative", marginBottom: 16 }}>
                <Phone size={20} color={colors.gray500} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateForm("phone", formatPhone(e.target.value))}
                  placeholder="01 90 12 34 56"
                  style={{
                    width: "100%",
                    padding: "16px 16px 16px 48px",
                    fontSize: 18,
                    border: `2px solid ${colors.gray200}`,
                    borderRadius: 48,
                    outline: "none",
                    background: colors.white,
                  }}
                />
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mot de passe"
                  style={{
                    width: "100%",
                    padding: "16px 48px 16px 20px",
                    fontSize: 18,
                    border: `2px solid ${colors.gray200}`,
                    borderRadius: 48,
                    outline: "none",
                    background: colors.white,
                  }}
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: 16,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            {error && <div style={{ background: colors.softRed, color: colors.beninRed, padding: 12, borderRadius: 48, marginBottom: 20 }}>{error}</div>}
            <div style={{ display: "flex", gap: 12, flexDirection: "column" }}>
              <button onClick={login} style={{ background: colors.beninGreen, color: colors.white, border: "none", borderRadius: 48, padding: "14px 24px", fontSize: 16, fontWeight: "bold", cursor: "pointer" }}>Se connecter</button>
              <button onClick={signup} style={{ background: colors.deepBlue, color: colors.white, border: "none", borderRadius: 48, padding: "14px 24px", fontSize: 16, fontWeight: "bold", cursor: "pointer" }}>Créer un compte</button>
            </div>
            <div style={{ marginTop: 24 }}>
              <button onClick={prevStep} style={{ background: "none", border: "none", color: colors.gray500, cursor: "pointer" }}>← Retour</button>
            </div>
          </div>
        );

      case "telephone":
        return (
          <div style={{ textAlign: "center" }}>
            <Phone size={48} color={colors.beninGreen} style={{ marginBottom: 24 }} />
            <h2 style={{ fontSize: 28, marginBottom: 8, color: colors.ink }}>Ton numéro</h2>
            <p style={{ color: colors.gray700, marginBottom: 24 }}>Format: 01 XX XX XX XX</p>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => updateForm("phone", formatPhone(e.target.value))}
              placeholder="01 90 12 34 56"
              style={{ fontSize: 24, padding: "16px 24px", textAlign: "center", border: `2px solid ${colors.gray200}`, borderRadius: 48, width: "100%", maxWidth: 300, marginBottom: 32 }}
            />
            <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
              <button onClick={prevStep} style={{ background: colors.white, color: colors.deepBlue, border: `2px solid ${colors.deepBlue}`, borderRadius: 48, padding: "12px 28px", fontSize: 16, fontWeight: "bold", cursor: "pointer" }}>Retour</button>
              <button onClick={nextStep} style={{ background: colors.beninGreen, color: colors.white, border: "none", borderRadius: 48, padding: "12px 32px", fontSize: 16, fontWeight: "bold", cursor: "pointer" }}>Continuer</button>
            </div>
          </div>
        );

      case "type-profil":
        return (
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: 28, marginBottom: 8, color: colors.ink }}>Quel est ton profil ?</h2>
            <p style={{ color: colors.gray700, marginBottom: 32 }}>Choisis la carte qui te correspond</p>
            <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
              {PROFILE_TYPES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    updateForm("type", p.id as ProfileType);
                    updateForm("archetype", "");
                    nextStep();
                  }}
                  style={{
                    background: form.type === p.id ? p.color : colors.white,
                    border: `3px solid ${form.type === p.id ? p.color : colors.gray300}`,
                    borderRadius: 24,
                    padding: "32px 24px",
                    width: 200,
                    cursor: "pointer",
                    textAlign: "center",
                    boxShadow: form.type === p.id ? "0 8px 20px rgba(0,0,0,0.15)" : "none",
                  }}
                >
                  <div style={{ fontSize: 48, marginBottom: 12 }}>{p.id === "vendeur" ? "🛒" : "🔧"}</div>
                  <div style={{ fontSize: 24, fontWeight: "bold", color: form.type === p.id ? colors.white : p.color }}>{p.title}</div>
                  <div style={{ fontSize: 14, marginTop: 8, color: form.type === p.id ? colors.white : colors.gray500 }}>{p.guide}</div>
                </button>
              ))}
            </div>
            <div style={{ marginTop: 32 }}>
              <button onClick={prevStep} style={{ background: "none", border: "none", color: colors.gray500, cursor: "pointer" }}>← Retour</button>
            </div>
          </div>
        );

      case "archetype":
        const archetypesList = form.type ? ARCHETYPES[form.type] : [];
        return (
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: 28, marginBottom: 8, color: colors.ink }}>Ton activité principale</h2>
            <p style={{ color: colors.gray700, marginBottom: 32 }}>Choisis ce qui te ressemble</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              {archetypesList.map((a) => (
                <button
                  key={a.id}
                  onClick={() => {
                    updateForm("archetype", a.label);
                    nextStep();
                  }}
                  style={{
                    background: form.archetype === a.label ? colors.beninGreen : colors.white,
                    color: form.archetype === a.label ? colors.white : colors.ink,
                    border: `2px solid ${colors.beninGreen}`,
                    borderRadius: 48,
                    padding: "14px 28px",
                    fontSize: 16,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {a.label}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 32 }}>
              <button onClick={prevStep} style={{ background: "none", border: "none", color: colors.gray500, cursor: "pointer" }}>← Retour</button>
            </div>
          </div>
        );

      case "secteur":
        return (
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: 28, marginBottom: 8, color: colors.ink }}>Ton secteur</h2>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 24 }}>
              {SECTORS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    updateForm("secteur", s.id);
                    updateForm("sousSecteur", "");
                    nextStep();
                  }}
                  style={{
                    background: s.color,
                    color: colors.white,
                    border: "none",
                    borderRadius: 24,
                    padding: "20px 28px",
                    fontSize: 18,
                    fontWeight: "bold",
                    cursor: "pointer",
                    minWidth: 140,
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 32 }}>
              <button onClick={prevStep} style={{ background: "none", border: "none", color: colors.gray500, cursor: "pointer" }}>← Retour</button>
            </div>
          </div>
        );

      case "sous-secteur":
        const currentSector = SECTORS.find((s) => s.id === form.secteur);
        return (
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: 28, marginBottom: 8, color: colors.ink }}>Ton sous-secteur</h2>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 24 }}>
              {currentSector?.subSectors.map((ss) => (
                <button
                  key={ss}
                  onClick={() => {
                    updateForm("sousSecteur", ss);
                    nextStep();
                  }}
                  style={{
                    background: form.sousSecteur === ss ? colors.deepBlue : colors.white,
                    color: form.sousSecteur === ss ? colors.white : colors.ink,
                    border: `2px solid ${colors.deepBlue}`,
                    borderRadius: 48,
                    padding: "12px 24px",
                    fontSize: 16,
                    cursor: "pointer",
                  }}
                >
                  {ss}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 32 }}>
              <button onClick={prevStep} style={{ background: "none", border: "none", color: colors.gray500, cursor: "pointer" }}>← Retour</button>
            </div>
          </div>
        );

      case "localisation":
        return (
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: 28, marginBottom: 8, color: colors.ink }}>Où te trouves-tu ?</h2>
            <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap", marginTop: 24 }}>
              <select
                value={form.departement}
                onChange={(e) => {
                  updateForm("departement", e.target.value);
                  updateForm("commune", "");
                }}
                style={{ padding: "14px 24px", fontSize: 16, border: `2px solid ${colors.gray200}`, borderRadius: 48, background: colors.white, cursor: "pointer", minWidth: 180 }}
                title="Département"
                aria-label="Sélectionner un département"
              >
                <option value="">Département</option>
                {DEPARTMENTS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
              <select
                value={form.commune}
                onChange={(e) => updateForm("commune", e.target.value)}
                style={{ padding: "14px 24px", fontSize: 16, border: `2px solid ${colors.gray200}`, borderRadius: 48, background: colors.white, cursor: "pointer", minWidth: 180 }}
                disabled={!form.departement}
                title="Commune"
                aria-label="Sélectionner une commune"
              >
                <option value="">Commune</option>
                {DEPARTMENTS.find((d) => d.id === form.departement)?.communes.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ marginTop: 32, display: "flex", gap: 16, justifyContent: "center" }}>
              <button onClick={prevStep} style={{ background: colors.white, color: colors.deepBlue, border: `2px solid ${colors.deepBlue}`, borderRadius: 48, padding: "12px 28px", fontSize: 16, fontWeight: "bold", cursor: "pointer" }}>Retour</button>
              <button onClick={nextStep} disabled={!form.commune} style={{ background: colors.beninGreen, color: colors.white, border: "none", borderRadius: 48, padding: "12px 32px", fontSize: 16, fontWeight: "bold", cursor: "pointer", opacity: !form.commune ? 0.5 : 1 }}>Continuer</button>
            </div>
          </div>
        );

      case "besoin":
        return (
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: 28, marginBottom: 8, color: colors.ink }}>Ton besoin principal</h2>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 24 }}>
              {FUNDING_NEEDS.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    updateForm("besoin", n.id);
                    nextStep();
                  }}
                  style={{
                    background: form.besoin === n.id ? n.color : colors.white,
                    color: form.besoin === n.id ? colors.white : colors.ink,
                    border: `2px solid ${n.color}`,
                    borderRadius: 48,
                    padding: "12px 24px",
                    fontSize: 16,
                    cursor: "pointer",
                  }}
                >
                  {n.label}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 32 }}>
              <button onClick={prevStep} style={{ background: "none", border: "none", color: colors.gray500, cursor: "pointer" }}>← Retour</button>
            </div>
          </div>
        );

      case "revenu":
        return (
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: 28, marginBottom: 8, color: colors.ink }}>Revenu mensuel estimé</h2>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 24 }}>
              {REVENUE_OPTIONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => {
                    updateForm("revenu", r.value);
                    nextStep();
                  }}
                  style={{
                    background: form.revenu === r.value ? r.color : colors.white,
                    color: form.revenu === r.value ? colors.white : colors.ink,
                    border: `2px solid ${r.color}`,
                    borderRadius: 48,
                    padding: "12px 24px",
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  {r.label}
                  <div style={{ fontSize: 11, marginTop: 4, opacity: 0.8 }}>{r.guide}</div>
                </button>
              ))}
            </div>
            <div style={{ marginTop: 32 }}>
              <button onClick={prevStep} style={{ background: "none", border: "none", color: colors.gray500, cursor: "pointer" }}>← Retour</button>
            </div>
          </div>
        );

      case "documents":
        return (
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: 28, marginBottom: 8, color: colors.ink }}>Documents que tu as déjà</h2>
            <p style={{ color: colors.gray700, marginBottom: 24 }}>Touche ceux que tu possèdes</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              {DOCUMENTS.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => updateForm("documents", { ...form.documents, [doc.id]: !form.documents[doc.id] })}
                  style={{
                    background: form.documents[doc.id] ? colors.beninGreen : colors.white,
                    color: form.documents[doc.id] ? colors.white : colors.ink,
                    border: `2px solid ${colors.beninGreen}`,
                    borderRadius: 48,
                    padding: "12px 24px",
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  {doc.label}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 32, display: "flex", gap: 16, justifyContent: "center" }}>
              <button onClick={prevStep} style={{ background: colors.white, color: colors.deepBlue, border: `2px solid ${colors.deepBlue}`, borderRadius: 48, padding: "12px 28px", fontSize: 16, fontWeight: "bold", cursor: "pointer" }}>Retour</button>
              <button onClick={nextStep} style={{ background: colors.beninGreen, color: colors.white, border: "none", borderRadius: 48, padding: "12px 32px", fontSize: 16, fontWeight: "bold", cursor: "pointer" }}>Continuer</button>
            </div>
          </div>
        );

      case "resume":
        return (
          <div style={{ textAlign: "center" }}>
            <CheckCircle2 size={64} color={colors.beninGreen} style={{ marginBottom: 24 }} />
            <h2 style={{ fontSize: 28, marginBottom: 16, color: colors.ink }}>Ton profil est prêt !</h2>
            <div style={{ background: colors.gray100, borderRadius: 24, padding: 24, textAlign: "left", marginBottom: 32 }}>
              <p><strong>📞 Téléphone:</strong> {form.phone}</p>
              <p><strong>🎯 Profil:</strong> {form.type === "vendeur" ? "Vendeur" : "Prestataire"}</p>
              <p><strong>⚙️ Activité:</strong> {form.archetype}</p>
              <p><strong>🏢 Secteur:</strong> {SECTORS.find((s) => s.id === form.secteur)?.label}</p>
              <p><strong>📌 Sous-secteur:</strong> {form.sousSecteur}</p>
              <p><strong>📍 Localisation:</strong> {form.commune}</p>
              <p><strong>🎯 Besoin:</strong> {FUNDING_NEEDS.find((n) => n.id === form.besoin)?.label}</p>
              <p><strong>💰 Revenu:</strong> {REVENUE_OPTIONS.find((r) => r.value === form.revenu)?.label}</p>
            </div>
            <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
              <button onClick={prevStep} style={{ background: colors.white, color: colors.deepBlue, border: `2px solid ${colors.deepBlue}`, borderRadius: 48, padding: "12px 28px", fontSize: 16, fontWeight: "bold", cursor: "pointer" }}>Retour</button>
              <button onClick={saveProfile} disabled={saving} style={{ background: colors.beninGreen, color: colors.white, border: "none", borderRadius: 48, padding: "12px 32px", fontSize: 16, fontWeight: "bold", cursor: "pointer" }}>{saving ? "Enregistrement..." : "Valider mon profil"}</button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: colors.white }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 48, height: 48, border: `4px solid ${colors.gray200}`, borderTop: `4px solid ${colors.beninGreen}`, borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: 16 }} />
          <p style={{ color: colors.gray700 }}>Chargement...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, ${colors.gray50} 0%, ${colors.white} 100%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      {step !== "langue" && (
        <div style={{ width: "100%", maxWidth: 500, marginBottom: 24 }}>
          <div style={{ height: 8, background: colors.gray200, borderRadius: 4, overflow: "hidden" }}>
            <div style={{ width: `${progress}%`, height: "100%", background: colors.beninGreen, transition: "width 0.3s ease" }} />
          </div>
          <div style={{ textAlign: "center", marginTop: 8, fontSize: 12, color: colors.gray500 }}>
            Étape {currentIndex + 1} sur {stepsList.length}
          </div>
        </div>
      )}
      <div style={{ background: colors.white, borderRadius: 32, padding: 40, maxWidth: 600, width: "100%", boxShadow: "0 20px 40px rgba(0,0,0,0.08)" }}>
        {renderStep()}
      </div>
      <div style={{ position: "fixed", bottom: 20, right: 20, display: "flex", gap: 12, alignItems: "center", background: colors.white, padding: "8px 16px", borderRadius: 40, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
        <button onClick={() => setMuted(!muted)} style={{ width: 40, height: 40, borderRadius: 20, border: "none", background: muted ? colors.beninRed : colors.deepBlue, color: colors.white, display: "grid", placeItems: "center", cursor: "pointer" }} aria-label={muted ? "Activer le son" : "Couper le son"}>
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        <button onClick={() => playAudio(step)} style={{ width: 40, height: 40, borderRadius: 20, border: "none", background: colors.beninGreen, color: colors.white, display: "grid", placeItems: "center", cursor: "pointer" }} aria-label="Répéter l'audio">
          <RefreshCcw size={18} />
        </button>
        {audioPlaying && <span style={{ fontSize: 12, color: colors.gray500 }}>🔊 Audio</span>}
      </div>
    </div>
  );
}