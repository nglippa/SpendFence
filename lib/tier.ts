export type AppTier = "free" | "premium";
export type DeveloperTierPreviewMode = AppTier;

export type TierUser = {
  isDeveloper?: boolean;
  developerTierOverride?: DeveloperTierPreviewMode | null;
  realTier?: AppTier | null;
  subscriptionTier?: AppTier | null;
};

export function getEffectiveTier(user?: TierUser | null): AppTier {
  if (user?.isDeveloper && user.developerTierOverride) return user.developerTierOverride;
  return user?.subscriptionTier ?? user?.realTier ?? "free";
}

export function tierLabel(tier: AppTier) {
  return tier === "premium" ? "Premium" : "Free";
}

export function normalizeTier(value: unknown): AppTier | null {
  return value === "premium" || value === "pro" ? "premium" : value === "free" ? "free" : null;
}
