import type { LucideIcon } from "lucide-react";
import { BarChart3, Bot, Building2, Repeat2 } from "lucide-react";

export type PremiumFeatureId = "bank-sync" | "advanced-ai-intelligence" | "advanced-analytics" | "automation";

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
  "advanced-ai-intelligence": {
    id: "advanced-ai-intelligence",
    title: "Advanced AI intelligence",
    description: "Deeper behavioral insights, predictive trends, anomaly detection, and proactive recommendations.",
    icon: Bot,
    status: "planned"
  },
  "advanced-analytics": {
    id: "advanced-analytics",
    title: "Advanced analytics",
    description: "Multi-cycle comparisons, long-term pattern recognition, and AI-generated monthly reports.",
    icon: BarChart3,
    status: "planned"
  },
  automation: {
    id: "automation",
    title: "Automation features",
    description: "Advanced recurring detection and future automation that reduces repeated review work.",
    icon: Repeat2,
    status: "planned"
  }
} satisfies Record<PremiumFeatureId, PremiumFeature>;

export function isPremiumFeatureEnabled(_featureId: PremiumFeatureId) {
  return true;
}
