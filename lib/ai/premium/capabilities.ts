export type PremiumAiCapability = {
  id: string;
  title: string;
  description: string;
  status: "planned";
};

export const premiumAiCapabilities: PremiumAiCapability[] = [
  {
    id: "cross-cycle-patterns",
    title: "Deeper cross-cycle pattern analysis",
    description: "Compare category behavior across multiple budget cycles.",
    status: "planned"
  },
  {
    id: "behavioral-recommendations",
    title: "Personalized behavioral recommendations",
    description: "Surface proactive suggestions based on longer-term spending patterns.",
    status: "planned"
  },
  {
    id: "predictive-trends",
    title: "Predictive spending trends",
    description: "Forecast pacing, potential overspending, and category volatility before they become urgent.",
    status: "planned"
  },
  {
    id: "predictive-fence-sizing",
    title: "Predictive fence sizing",
    description: "Suggest future fence sizes using multi-cycle forecasting and category volatility.",
    status: "planned"
  },
  {
    id: "advanced-pacing-intelligence",
    title: "Advanced pacing intelligence",
    description: "Surface proactive risk alerts and timing patterns before a fence feels tight.",
    status: "planned"
  },
  {
    id: "advanced-recurring-detection",
    title: "Advanced recurring detection",
    description: "Find subscriptions, bills, anomalies, and outliers with deeper automation.",
    status: "planned"
  },
  {
    id: "ai-monthly-reports",
    title: "AI-generated monthly reports",
    description: "Create richer summaries for multi-cycle comparison and advanced reports.",
    status: "planned"
  }
];
