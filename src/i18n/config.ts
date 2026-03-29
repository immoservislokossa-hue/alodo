export const supportedLocales = ["fr", "fon", "yoruba"] as const;

export type SupportedLocale = (typeof supportedLocales)[number];
