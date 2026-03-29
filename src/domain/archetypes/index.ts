export const ARCHETYPES = [
  "vendeur",
  "artisan",
  "transformateur",
  "prestataire",
] as const;

export type Archetype = (typeof ARCHETYPES)[number];
