import type { AppTier } from "@/lib/tier";

export const FREE_TELLER_ACCOUNT_LIMIT = 2;
export const TELLER_ACCOUNT_LIMIT_MESSAGE = "Free users can connect up to 2 accounts. Upgrade to Premium for unlimited account syncing.";

export function tellerAccountLimitForTier(tier: AppTier) {
  return tier === "premium" ? null : FREE_TELLER_ACCOUNT_LIMIT;
}

export function canLinkMoreTellerAccounts(tier: AppTier, connectedAccountCount: number) {
  const limit = tellerAccountLimitForTier(tier);
  return limit === null || connectedAccountCount < limit;
}
