import type { LucideIcon } from "lucide-react";
import { BarChart3, Brain, Building2, ScanLine } from "lucide-react";

export type PremiumFeatureId = "bank-sync" | "ai-categorization" | "ai-receipt-understanding" | "advanced-analytics";

export type PremiumFeature = {
  id: PremiumFeatureId;
  title: string;
  description: string;
  icon: LucideIcon;
  status: "planned";
};

export const premiumFeatures = {
  "bank-sync": {
    id: "bank-sync",
    title: "Bank sync",
    description: "Secure bank connections, transaction imports, and connected account management.",
    icon: Building2,
    status: "planned"
  },
  "ai-categorization": {
    id: "ai-categorization",
    title: "AI categorization",
    description: "Server-side assistance for transaction category suggestions after local rules run.",
    icon: Brain,
    status: "planned"
  },
  "ai-receipt-understanding": {
    id: "ai-receipt-understanding",
    title: "AI receipt understanding",
    description: "Receipt text understanding, line-item extraction, and editable category allocation suggestions.",
    icon: ScanLine,
    status: "planned"
  },
  "advanced-analytics": {
    id: "advanced-analytics",
    title: "Advanced analytics",
    description: "Deeper trends, behavioral insights, projections, and recurring spending analysis.",
    icon: BarChart3,
    status: "planned"
  }
} satisfies Record<PremiumFeatureId, PremiumFeature>;

export function isPremiumFeatureEnabled(_featureId: PremiumFeatureId) {
  return false;
}
