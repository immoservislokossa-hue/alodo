import {
  MatchingProfileType,
  MATCHING_ARCHETYPES,
  MATCHING_SECTORS,
  MATCHING_SUB_SECTORS,
  BENIN_DEPARTMENTS,
  BENIN_COMMUNES,
  MATCHING_FUNDING_NEEDS,
  MATCHING_DOCUMENTS,
} from "./matching-options";

export type ProfileForm = {
  profileType: MatchingProfileType;
  archetypeId?: string;
  sectorId?: string;
  subSector?: string;
  departmentId?: string;
  commune?: string;
  fundingNeeds?: string[];
  documents?: string[];
};

export const SHARED_PROFILE_FIELDS = [
  "profileType",
  "archetypeId",
  "sectorId",
  "subSector",
  "departmentId",
  "commune",
  "fundingNeeds",
  "documents",
] as const;

export function getArchetypes(type: MatchingProfileType) {
  return MATCHING_ARCHETYPES[type] ?? [];
}

export function getSubSectors(sectorId?: string) {
  if (!sectorId) return [] as string[];
  const s = MATCHING_SECTORS.find((x) => x.id === sectorId);
  return s ? [...s.subSectors] : [];
}

export function getCommunes(departmentId?: string) {
  if (!departmentId) return [] as string[];
  const d = BENIN_DEPARTMENTS.find((x) => x.id === departmentId);
  return d ? [...d.communes] : [];
}

function existsInArray<T extends { id?: string }>(arr: readonly T[] | string[] | undefined, value?: string) {
  if (!value || !arr) return false;
  if (typeof arr[0] === "string") return (arr as string[]).includes(value);
  return (arr as any[]).some((i) => i.id === value);
}

export function validateProfile(input: Partial<ProfileForm>) {
  const errors: Record<string, string> = {};

  if (!input.profileType) {
    errors.profileType = "Type de profil requis";
  } else {
    // archetype must belong to the profile type
    if (input.archetypeId) {
      const archetypes = getArchetypes(input.profileType as MatchingProfileType);
      if (!existsInArray(archetypes, input.archetypeId)) {
        errors.archetypeId = "Archetype invalide pour ce type de profil";
      }
    }
  }

  if (input.sectorId) {
    if (!MATCHING_SECTORS.some((s) => s.id === input.sectorId)) {
      errors.sectorId = "Secteur invalide";
    } else if (input.subSector) {
      const subs = getSubSectors(input.sectorId);
      if (!subs.includes(input.subSector)) errors.subSector = "Sous-secteur invalide pour ce secteur";
    }
  }

  if (input.departmentId) {
    if (!BENIN_DEPARTMENTS.some((d) => d.id === input.departmentId)) {
      errors.departmentId = "Departement invalide";
    } else if (input.commune) {
      const communes = getCommunes(input.departmentId);
      if (!communes.includes(input.commune)) errors.commune = "Commune invalide pour ce departement";
    }
  }

  if (input.fundingNeeds) {
    const validIds = MATCHING_FUNDING_NEEDS.map((n) => n.id) as string[];
    const bad = (input.fundingNeeds || []).filter((v) => !validIds.includes(v));
    if (bad.length) errors.fundingNeeds = `Elements invalides: ${bad.join(", ")}`;
  }

  if (input.documents) {
    const validDocs = MATCHING_DOCUMENTS.map((d) => d.id) as string[];
    const bad = (input.documents || []).filter((v) => !validDocs.includes(v));
    if (bad.length) errors.documents = `Elements invalides: ${bad.join(", ")}`;
  }

  return { valid: Object.keys(errors).length === 0, errors } as const;
}

export function normalizeProfile(input: Partial<ProfileForm>): ProfileForm {
  return {
    profileType: input.profileType ?? ("vendeur" as MatchingProfileType),
    archetypeId: input.archetypeId,
    sectorId: input.sectorId,
    subSector: input.subSector,
    departmentId: input.departmentId,
    commune: input.commune,
    fundingNeeds: input.fundingNeeds ?? [],
    documents: input.documents ?? [],
  };
}

export default {
  SHARED_PROFILE_FIELDS,
  getArchetypes,
  getSubSectors,
  getCommunes,
  validateProfile,
  normalizeProfile,
};
