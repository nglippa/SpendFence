export type AppTier = "free" | "premium";
export type DeveloperTierPreviewMode = AppTier;

export type TierUser = {
  isDeveloper?: boolean;
  developerTierOverride?: DeveloperTierPreviewMode | null;
  stripeSubscriptionStatus?: string | null;
  hasActiveStripeSubscription?: boolean;
  realTier?: AppTier | null;
  subscriptionTier?: AppTier | null;
};

export function getEffectiveTier(user?: TierUser | null): AppTier {
  if (user?.isDeveloper && user.developerTierOverride) return user.developerTierOverride;
  if (user?.hasActiveStripeSubscription) return "premium";
  if (user?.stripeSubscriptionStatus) return isActiveStripeSubscriptionStatus(user.stripeSubscriptionStatus) ? "premium" : "free";
  return "free";
}

export function tierLabel(tier: AppTier) {
  return tier === "premium" ? "Premium" : "Free";
}

export function normalizeTier(value: unknown): AppTier | null {
  return value === "premium" || value === "pro" ? "premium" : value === "free" ? "free" : null;
}

export function isActiveStripeSubscriptionStatus(status?: string | null) {
  return status === "active" || status === "trialing";
}
