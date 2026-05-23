import type { SpendFenceState } from "@/lib/types";

export type BehavioralInsightType =
  | "positive_control"
  | "recovery"
  | "stabilization"
  | "gentle_caution"
  | "trend"
  | "empty";

export type BehavioralInsightConfidence = "low" | "medium" | "high";
export type BehavioralInsightPlacement = "dashboard" | "category" | "reports";
export type BehavioralInsightSeverity = "calm" | "positive" | "watch" | "limit";
export type BehavioralInsightSource = "local_rules" | "future_ai";

export type BehavioralInsight = {
  id: string;
  type: BehavioralInsightType;
  title: string;
  message: string;
  supportingMetric?: string;
  categoryLabel?: string;
  confidence: BehavioralInsightConfidence;
  recommendedPlacement: BehavioralInsightPlacement;
  categoryId?: string;
  severity: BehavioralInsightSeverity;
  priorityScore?: number;
  freshnessKey?: string;
  source?: BehavioralInsightSource;
};

export type InsightGenerationOptions = {
  now?: Date;
  placement?: BehavioralInsightPlacement;
  categoryId?: string;
  tone?: SpendFenceState["insightSettings"]["encouragementTone"];
};
