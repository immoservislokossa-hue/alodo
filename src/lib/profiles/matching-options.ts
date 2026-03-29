export type MatchingProfileType = "vendeur" | "prestataire";

export const MATCHING_PROFILE_TYPES = ["vendeur", "prestataire"] as const;

export const MATCHING_ARCHETYPES: Record<
  MatchingProfileType,
  ReadonlyArray<{ id: string; label: string }>
> = {
  vendeur: [
    { id: "boutique", label: "Boutique" },
    { id: "marche", label: "Marche" },
    { id: "ambulant", label: "Vente ambulante" },
    { id: "grossiste", label: "Grossiste" },
  ],
  prestataire: [
    { id: "couture", label: "Couture" },
    { id: "coiffure", label: "Coiffure / beaute" },
    { id: "reparation", label: "Reparation" },
    { id: "services_numeriques", label: "Services numeriques" },
  ],
};

export const MATCHING_SECTORS = [
  {
    id: "commerce",
    label: "Commerce",
    subSectors: ["Alimentaire", "Habillement", "Cosmetiques", "Pieces detachees", "Divers"],
  },
  {
    id: "services",
    label: "Services",
    subSectors: ["Couture", "Coiffure", "Reparation", "Transport", "Numerique"],
  },
  {
    id: "agriculture",
    label: "Agriculture",
    subSectors: ["Production vegetale", "Elevage", "Transformation locale", "Distribution"],
  },
  {
    id: "restauration",
    label: "Restauration",
    subSectors: ["Cuisine de rue", "Restaurant", "Boissons", "Traiteur"],
  },
] as const;

export const BENIN_DEPARTMENTS = [
  { id: "alibori", label: "Alibori", communes: ["Banikoara", "Gogounou", "Kandi", "Karimama", "Malanville", "Segbana"] },
  {
    id: "atacora",
    label: "Atacora",
    communes: ["Boukoumbe", "Cobly", "Kerou", "Kouande", "Materi", "Natitingou", "Pehunco", "Tanguiata", "Toucountouna"],
  },
  {
    id: "atlantique",
    label: "Atlantique",
    communes: ["Abomey-Calavi", "Allada", "Kpomasse", "Ouidah", "So-Ava", "Toffo", "Tori-Bossito", "Ze"],
  },
  {
    id: "borgou",
    label: "Borgou",
    communes: ["Bembereke", "Kalale", "N'Dali", "Nikki", "Parakou", "Perere", "Sinende", "Tchaourou"],
  },
  {
    id: "collines",
    label: "Collines",
    communes: ["Bante", "Dassa-Zoume", "Glazoue", "Ouessè", "Savalou", "Save"],
  },
  {
    id: "couffo",
    label: "Couffo",
    communes: ["Aplahoue", "Djakotomey", "Dogbo", "Klouekanme", "Lalo", "Toviklin"],
  },
  {
    id: "donga",
    label: "Donga",
    communes: ["Bassila", "Copargo", "Djougou", "Ouake"],
  },
  { id: "littoral", label: "Littoral", communes: ["Cotonou"] },
  {
    id: "mono",
    label: "Mono",
    communes: ["Athieme", "Bopa", "Come", "Grand-Popo", "Houeyogbe", "Lokossa"],
  },
  {
    id: "oueme",
    label: "Oueme",
    communes: ["Adjarra", "Adjohoun", "Aguegues", "Akpro-Misserete", "Avrankou", "Bonou", "Dangbo", "Porto-Novo", "Seme-Podji"],
  },
  {
    id: "plateau",
    label: "Plateau",
    communes: ["Adja-Ouere", "Ifangni", "Ketou", "Pobe", "Sakete"],
  },
  {
    id: "zou",
    label: "Zou",
    communes: ["Abomey", "Agbangnizoun", "Bohicon", "Cove", "Djidja", "Ouinhi", "Za-Kpota", "Zagnanado", "Zogbodomey"],
  },
] as const;

export const MATCHING_FUNDING_NEEDS = [
  { id: "stock", label: "Acheter du stock" },
  { id: "equipement", label: "Acheter du materiel" },
  { id: "tresorerie", label: "Renforcer la tresorerie" },
  { id: "formalisation", label: "Formaliser mon activite" },
] as const;

export const MATCHING_DOCUMENTS = [
  { id: "piece_identite", label: "Piece d'identite" },
  { id: "ifu", label: "IFU" },
  { id: "rccm", label: "RCCM" },
  { id: "cip", label: "CIP" },
  { id: "preuve_adresse", label: "Preuve d'adresse" },
  { id: "justificatif_activite", label: "Preuve d'activite" },
  { id: "releve_mobile_money", label: "Releves Mobile Money" },
  { id: "releve_bancaire", label: "Releves bancaires" },
] as const;

export const MATCHING_SUB_SECTORS = MATCHING_SECTORS.flatMap((sector) => sector.subSectors);
export const BENIN_COMMUNES = BENIN_DEPARTMENTS.flatMap((department) => department.communes);

