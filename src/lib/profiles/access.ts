export type AppRole = "user" | "admin";
export type AppProfileType = "vendeur" | "prestataire";

export type AccessProfile = {
  role: AppRole | null;
  type: AppProfileType | null;
};

export function getDefaultUserPath(type: AppProfileType | null | undefined) {
  return type === "prestataire" ? "/prestataire" : "/vendeur";
}

export function getPathForProfile(profile: AccessProfile | null | undefined) {
  if (profile?.role === "admin") {
    return "/institutions/dashboard";
  }

  return getDefaultUserPath(profile?.type);
}
