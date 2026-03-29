"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/src/lib/supabase/browser";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { getDefaultUserPath } from "@/src/lib/profiles/access";
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
  blue: "#1a3c6b",
  green: "#008751",
  yellow: "#fcd116",
  red: "#e8112d",
  soft: "#f6faf7",
  line: "#d7e4da",
  muted: "#5d7667",
};

const typeOptions = ["vendeur", "prestataire"] as const;
const sectorOptions = MATCHING_SECTORS.map((s) => s.id);
const subSectorOptions = MATCHING_SECTORS.flatMap((s) => s.subSectors);
const archetypeOptions = Object.values(MATCHING_ARCHETYPES).flat().map((a) => ({ value: a.id, label: a.label }));
const needOptions = MATCHING_FUNDING_NEEDS.map((n) => n.id);
const documentOptions = MATCHING_DOCUMENTS.map((d) => d.id);
const communeOptions = BENIN_DEPARTMENTS.flatMap((d) => d.communes);

type FormState = {
  titre: string;
  description: string;
  types_concernes: string[];
  secteurs_concernes: string[];
  sous_secteurs_concernes: string[];
  communes_concernees: string[];
  archetypes_concernes: string[];
  besoins_financement_concernes: string[];
  documents_requis: string[];
  revenu_min_estime_fcfa: string;
  revenu_max_estime_fcfa: string;
  montant_min_fcfa: string;
  montant_max_fcfa: string;
  type_traitement: "auto" | "manuel";
  score_minimum_auto: string;
  date_limite: string;
  lien_externe: string;
  contact_nom: string;
  contact_telephone: string;
  contact_email: string;
  statut: string;
};

type ChoiceOption = string | { value: string; label: string };

const defaultForm: FormState = {
  titre: "",
  description: "",
  types_concernes: [],
  secteurs_concernes: [],
  sous_secteurs_concernes: [],
  communes_concernees: [],
  archetypes_concernes: [],
  besoins_financement_concernes: [],
  documents_requis: [],
  revenu_min_estime_fcfa: "",
  revenu_max_estime_fcfa: "",
  montant_min_fcfa: "",
  montant_max_fcfa: "",
  type_traitement: "manuel",
  score_minimum_auto: "",
  date_limite: "",
  lien_externe: "",
  contact_nom: "",
  contact_telephone: "",
  contact_email: "",
  statut: "publie",
};

function toggleArrayValue(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function readChoiceOption(option: ChoiceOption) {
  if (typeof option === "string") {
    return { value: option, label: option };
  }

  return option;
}

function toNullableNumber(value: string) {
  const clean = value.trim();
  if (!clean) return null;
  const digits = Number(clean);
  return Number.isFinite(digits) ? digits : null;
}

export default function InstitutionNewPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [checkingAccess, setCheckingAccess] = useState(true);

  const selectionSummary = useMemo(
    () => [
      ["Types", form.types_concernes.join(", ") || "Aucun"],
      ["Secteurs", form.secteurs_concernes.join(", ") || "Aucun"],
      ["Communes", form.communes_concernees.join(", ") || "Aucune"],
      ["Documents", form.documents_requis.join(", ") || "Aucun"],
    ],
    [form]
  );

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
    setSuccess("");
  }

  useEffect(() => {
    let active = true;

    async function verifyAccess() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace("/institutions/login");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role, type")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!active) {
          return;
        }

        if (profile?.role !== "admin") {
          router.replace(getDefaultUserPath((profile?.type as "vendeur" | "prestataire" | null | undefined) ?? null));
          return;
        }
      } finally {
        if (active) {
          setCheckingAccess(false);
        }
      }
    }

    void verifyAccess();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleSubmit() {
    if (!form.titre.trim() || !form.description.trim()) {
      setError("Ajoute un titre et une description.");
      return;
    }

    if (!form.types_concernes.length || !form.secteurs_concernes.length) {
      setError("Choisis au moins un type concerne et un secteur concerne.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) {
        router.push("/institutions/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, role, type")
        .eq("user_id", user.id)
        .single();

      if (profileError) throw profileError;
      if (!profile?.id) throw new Error("Profil introuvable.");
      if (profile.role !== "admin") {
        router.replace(getDefaultUserPath(profile.type));
        return;
      }

      const payload = {
        institution_profile_id: profile.id,
        titre: form.titre.trim(),
        description: form.description.trim(),
        types_concernes: form.types_concernes,
        secteurs_concernes: form.secteurs_concernes,
        sous_secteurs_concernes: form.sous_secteurs_concernes,
        communes_concernees: form.communes_concernees,
        archetypes_concernes: form.archetypes_concernes,
        besoins_financement_concernes: form.besoins_financement_concernes,
        documents_requis: form.documents_requis,
        revenu_min_estime_fcfa: toNullableNumber(form.revenu_min_estime_fcfa),
        revenu_max_estime_fcfa: toNullableNumber(form.revenu_max_estime_fcfa),
        montant_min_fcfa: toNullableNumber(form.montant_min_fcfa),
        montant_max_fcfa: toNullableNumber(form.montant_max_fcfa),
        type_traitement: form.type_traitement,
        score_minimum_auto: form.type_traitement === "auto" ? toNullableNumber(form.score_minimum_auto) : null,
        date_limite: form.date_limite || null,
        lien_externe: form.lien_externe.trim() || null,
        contact_nom: form.contact_nom.trim() || null,
        contact_telephone: form.contact_telephone.trim() || null,
        contact_email: form.contact_email.trim() || null,
        statut: form.statut,
      };

      const { error: insertError } = await supabase.from("post_institutions").insert(payload);
      if (insertError) throw insertError;

      setSuccess("Post cree avec succes.");
      setForm(defaultForm);
      setTimeout(() => router.push("/institutions/dashboard"), 700);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Creation impossible."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    checkingAccess ? (
      <div style={{ minHeight: "100vh", background: "#f8faf8" }} aria-hidden="true" />
    ) : (
    <div style={{ minHeight: "100vh", background: "#f8faf8", padding: "24px 18px 64px", color: colors.ink }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gap: 20 }}>
        <section style={panelStyle}>
          <button
            type="button"
            onClick={() => router.push("/institutions/dashboard")}
            style={backButtonStyle}
          >
            <ArrowLeft size={18} />
            Retour au dashboard
          </button>

          <div style={{ display: "grid", gap: 8 }}>
            <div style={eyebrowStyle}>NOUVELLE OFFRE INSTITUTION</div>
            <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.1 }}>
              Publier un post cible pour les MPME
            </h1>
            <div style={{ color: colors.muted, maxWidth: 760, lineHeight: 1.7 }}>
              Cette fiche servira au matching automatique avec les profils de vendeurs
              et prestataires de services de la plateforme.
            </div>
          </div>
        </section>

        {error ? <div style={{ ...alertStyle, background: "#fff1f3", color: colors.red }}>{error}</div> : null}
        {success ? <div style={{ ...alertStyle, background: "#eef8f2", color: colors.green }}>{success}</div> : null}

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 20 }}>
          <section style={panelStyle}>
            <div style={{ display: "grid", gap: 18 }}>
              <div style={sectionStyle}>
                <label style={labelStyle}>Titre</label>
                <input
                  value={form.titre}
                  onChange={(event) => update("titre", event.target.value)}
                  placeholder="Ex: Financement stock pour petits commercants"
                  style={inputStyle}
                />
              </div>

              <div style={sectionStyle}>
                <label style={labelStyle}>Description</label>
                <textarea
                  value={form.description}
                  onChange={(event) => update("description", event.target.value)}
                  placeholder="Explique l'offre, les conditions et le type d'accompagnement."
                  style={{ ...inputStyle, minHeight: 140, paddingTop: 14 }}
                />
              </div>

              <ChoiceSection
                label="Types concernes"
                options={typeOptions}
                values={form.types_concernes}
                color={colors.green}
                onToggle={(value) => update("types_concernes", toggleArrayValue(form.types_concernes, value))}
              />

              <ChoiceSection
                label="Secteurs concernes"
                options={sectorOptions}
                values={form.secteurs_concernes}
                color={colors.blue}
                onToggle={(value) => update("secteurs_concernes", toggleArrayValue(form.secteurs_concernes, value))}
              />

              <ChoiceSection
                label="Sous-secteurs concernes"
                options={subSectorOptions}
                values={form.sous_secteurs_concernes}
                color={colors.yellow}
                onToggle={(value) =>
                  update("sous_secteurs_concernes", toggleArrayValue(form.sous_secteurs_concernes, value))
                }
              />

              <ChoiceSection
                label="Archetypes concernes"
                options={archetypeOptions}
                values={form.archetypes_concernes}
                color={colors.red}
                onToggle={(value) =>
                  update("archetypes_concernes", toggleArrayValue(form.archetypes_concernes, value))
                }
              />

              <ChoiceSection
                label="Communes ciblees"
                options={communeOptions}
                values={form.communes_concernees}
                color="#6d8192"
                onToggle={(value) =>
                  update("communes_concernees", toggleArrayValue(form.communes_concernees, value))
                }
              />

              <ChoiceSection
                label="Besoins finances cibles"
                options={needOptions}
                values={form.besoins_financement_concernes}
                color="#5b8d63"
                onToggle={(value) =>
                  update(
                    "besoins_financement_concernes",
                    toggleArrayValue(form.besoins_financement_concernes, value)
                  )
                }
              />

              <ChoiceSection
                label="Documents requis"
                options={documentOptions}
                values={form.documents_requis}
                color="#8a5f74"
                onToggle={(value) => update("documents_requis", toggleArrayValue(form.documents_requis, value))}
              />

              <div style={doubleGridStyle}>
                <Field
                  label="Revenu min estime (FCFA)"
                  value={form.revenu_min_estime_fcfa}
                  onChange={(value) => update("revenu_min_estime_fcfa", value)}
                  placeholder="50000"
                />
                <Field
                  label="Revenu max estime (FCFA)"
                  value={form.revenu_max_estime_fcfa}
                  onChange={(value) => update("revenu_max_estime_fcfa", value)}
                  placeholder="500000"
                />
              </div>

              <div style={doubleGridStyle}>
                <Field
                  label="Montant min donne (FCFA)"
                  value={form.montant_min_fcfa}
                  onChange={(value) => update("montant_min_fcfa", value)}
                  placeholder="100000"
                />
                <Field
                  label="Montant max donne (FCFA)"
                  value={form.montant_max_fcfa}
                  onChange={(value) => update("montant_max_fcfa", value)}
                  placeholder="2000000"
                />
              </div>

              {/* ⚡ Type de traitement du financement */}
              <div style={doubleGridStyle}>
                <div style={sectionStyle}>
                  <label style={labelStyle}>Type de traitement</label>
                  <select
                    value={form.type_traitement}
                    onChange={(event) => update("type_traitement", event.target.value as "auto" | "manuel")}
                    style={inputStyle}
                  >
                    <option value="manuel">👤 Manuel (révision par institution)</option>
                    <option value="auto">⚡ Automatique (score-based)</option>
                  </select>
                  <p style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                    {form.type_traitement === "auto"
                      ? "Les demandes seront approuvées automatiquement si le score atteint le minimum"
                      : "Les demandes seront examinées manuellement par votre équipe"}
                  </p>
                </div>

                {/* Score minimum (visible seulement si auto) */}
                {form.type_traitement === "auto" && (
                  <div style={sectionStyle}>
                    <label style={labelStyle}>Score minimum requis (0-10)</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.5"
                      value={form.score_minimum_auto}
                      onChange={(event) => update("score_minimum_auto", event.target.value)}
                      placeholder="4.0"
                      style={inputStyle}
                    />
                    <p style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                      Les profils avec un score de réputation ≥ {form.score_minimum_auto || "?"} seront approuvés automatiquement
                    </p>
                  </div>
                )}
              </div>

              <div style={doubleGridStyle}>
                <Field
                  label="Date limite"
                  type="date"
                  value={form.date_limite}
                  onChange={(value) => update("date_limite", value)}
                />
                <div style={sectionStyle}>
                  <label style={labelStyle}>Statut</label>
                  <select
                    value={form.statut}
                    onChange={(event) => update("statut", event.target.value)}
                    style={inputStyle}
                  >
                    <option value="publie">Publie</option>
                    <option value="brouillon">Brouillon</option>
                    <option value="archive">Archive</option>
                  </select>
                </div>
              </div>

              <Field
                label="Lien externe"
                value={form.lien_externe}
                onChange={(value) => update("lien_externe", value)}
                placeholder="https://..."
              />

              <div style={doubleGridStyle}>
                <Field
                  label="Contact nom"
                  value={form.contact_nom}
                  onChange={(value) => update("contact_nom", value)}
                  placeholder="Nom du responsable"
                />
                <Field
                  label="Contact telephone"
                  value={form.contact_telephone}
                  onChange={(value) => update("contact_telephone", value)}
                  placeholder="01 90 00 00 00"
                />
              </div>

              <Field
                label="Contact email"
                value={form.contact_email}
                onChange={(value) => update("contact_email", value)}
                placeholder="contact@institution.bj"
              />

              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={saving}
                style={submitButtonStyle}
              >
                {saving ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> : <CheckCircle2 size={18} />}
                {saving ? "Publication..." : "Creer le post"}
              </button>
            </div>
          </section>

          <aside style={panelStyle}>
            <div style={{ display: "grid", gap: 14 }}>
              <div style={eyebrowStyle}>RESUME DU CIBLAGE</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>Ce que verra le moteur de matching</div>
              <div style={{ color: colors.muted, lineHeight: 1.7 }}>
                Plus les criteres sont clairs, plus la plateforme pourra recommander l'offre
                aux bons vendeurs et prestataires.
              </div>
            </div>

            <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
              {selectionSummary.map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    borderRadius: 18,
                    border: `1px solid ${colors.line}`,
                    background: colors.soft,
                    padding: 16,
                  }}
                >
                  <div style={miniLabelStyle}>{label}</div>
                  <div style={{ marginTop: 8, fontWeight: 700, lineHeight: 1.5 }}>{value}</div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
    )
  );
}

function ChoiceSection({
  label,
  options,
  values,
  color,
  onToggle,
}: {
  label: string;
  options: readonly ChoiceOption[] | ChoiceOption[];
  values: string[];
  color: string;
  onToggle: (value: string) => void;
}) {
  return (
    <div style={sectionStyle}>
      <label style={labelStyle}>{label}</label>
      <div style={chipsGridStyle}>
        {options.map((option) => {
          const normalized = readChoiceOption(option);
          const selected = values.includes(normalized.value);
          return (
            <button
              key={normalized.value}
              type="button"
              onClick={() => onToggle(normalized.value)}
              style={chipStyle(selected, color)}
            >
              {normalized.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div style={sectionStyle}>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  );
}

const panelStyle = {
  background: colors.white,
  border: `1px solid ${colors.line}`,
  borderRadius: 24,
  padding: 24,
  boxShadow: "0 18px 40px rgba(19, 49, 33, 0.05)",
} as const;

const sectionStyle = {
  display: "grid",
  gap: 10,
} as const;

const doubleGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 14,
} as const;

const chipsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
  gap: 10,
} as const;

const eyebrowStyle = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.08em",
  color: colors.green,
} as const;

const miniLabelStyle = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.08em",
  color: colors.muted,
} as const;

const labelStyle = {
  fontSize: 13,
  fontWeight: 800,
  letterSpacing: "0.04em",
  color: colors.ink,
} as const;

const inputStyle = {
  minHeight: 52,
  borderRadius: 16,
  border: `1px solid ${colors.line}`,
  padding: "0 16px",
  fontSize: 15,
  color: colors.ink,
  background: colors.white,
} as const;

const backButtonStyle = {
  border: "none",
  background: "transparent",
  color: colors.blue,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  fontWeight: 700,
  cursor: "pointer",
  padding: 0,
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

const alertStyle = {
  borderRadius: 18,
  border: `1px solid ${colors.line}`,
  padding: "14px 16px",
  fontWeight: 700,
} as const;

function chipStyle(selected: boolean, color: string) {
  return {
    minHeight: 48,
    borderRadius: 16,
    border: `2px solid ${selected ? color : colors.line}`,
    background: selected ? `${color}18` : colors.white,
    color: colors.ink,
    fontWeight: 700,
    cursor: "pointer",
    padding: "0 14px",
  } as const;
}
