export type SpendingRuleType = "amount" | "frequency" | "time_context" | "category_pacing";

export type SpendingRuleCondition =
  | "exceeds_amount"
  | "happens_too_often"
  | "spikes_unexpectedly"
  | "occurs_at_times"
  | "pace_accelerating"
  | "burns_too_quickly";

export type SpendingRuleResponse = "subtle_insight" | "warning" | "pacing_alert";

export type SpendingRuleTimeWindow = "week" | "cycle";

export type SpendingRuleTimeContext = "late_night" | "weekend";

export type SpendingRuleSource = "manual" | "future_ai";

export type SpendingRule = {
  id: string;
  userId?: string;
  title: string;
  description: string;
  categoryId?: string;
  merchantPattern?: string;
  type: SpendingRuleType;
  condition: SpendingRuleCondition;
  thresholdAmount?: number;
  thresholdCount?: number;
  thresholdPercent?: number;
  timeWindow?: SpendingRuleTimeWindow;
  timeContext?: SpendingRuleTimeContext;
  response: SpendingRuleResponse;
  enabled: boolean;
  source: SpendingRuleSource;
  premium?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SpendingRuleInput = Omit<SpendingRule, "id" | "createdAt" | "updatedAt" | "source"> & {
  source?: SpendingRuleSource;
};

export type SpendingRuleMatch = {
  rule: SpendingRule;
  categoryId?: string;
  purchaseId?: string;
  title: string;
  message: string;
  supportingMetric?: string;
  severity: "calm" | "watch" | "limit";
  freshnessKey: string;
};

export const spendingRuleConditionLabels: Record<SpendingRuleCondition, string> = {
  exceeds_amount: "exceeds amount",
  happens_too_often: "happens too often",
  spikes_unexpectedly: "spikes unexpectedly",
  occurs_at_times: "occurs at certain times",
  pace_accelerating: "pace is accelerating",
  burns_too_quickly: "burns too quickly"
};

export const spendingRuleResponseLabels: Record<SpendingRuleResponse, string> = {
  subtle_insight: "subtle insight",
  warning: "warning",
  pacing_alert: "pacing alert"
};
