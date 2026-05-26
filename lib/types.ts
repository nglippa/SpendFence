import type { SpendingRule } from "@/lib/rules/rule-types";

export type BudgetStatus = "safe" | "warning" | "locked";

export type BudgetMonth = {
  id: string;
  userId?: string;
  month: string;
  income: number;
  savingsTarget: number;
  budgetCycleStartDay: number;
  budgetCycleStartDate?: string;
};

export type Category = {
  id: string;
  userId?: string;
  name: string;
  limit: number;
  warningThreshold: number;
  hardStopThreshold: number;
  color: string;
  icon: string;
};

export type Purchase = {
  id: string;
  userId?: string;
  amount: number;
  categoryId: string;
  merchant: string;
  date: string;
  notes?: string;
  receiptImage?: string;
  recurringId?: string;
  source: "manual" | "receipt" | "future-bank-import";
};

export type ReceiptLineItem = {
  id: string;
  name: string;
  amount: number;
};

export type ReceiptCategoryAllocation = {
  id: string;
  categoryId: string;
  amount: number;
  confidence: number;
  reason: string;
};

export type Receipt = {
  id: string;
  userId?: string;
  image?: string;
  merchant: string;
  total: number;
  categoryId: string;
  date: string;
  lineItems: ReceiptLineItem[];
  allocations?: ReceiptCategoryAllocation[];
  confidence?: number;
  reason?: string;
  status: "draft" | "confirmed";
};

export type Prompt = {
  id: string;
  message: string;
  type: "setup" | "trend" | "saving" | "warning";
};

export type NotificationSettings = {
  fiftyPercent: boolean;
  eightyPercent: boolean;
  limitReached: boolean;
  dailySummary: boolean;
  weeklyCheckIn: boolean;
};

export type InsightSettings = {
  spendingInsights: boolean;
  encouragementTone: "minimal" | "balanced";
  showDashboardInsights: boolean;
  showReportInsights: boolean;
  recurringDetection: boolean;
  trendSummaries: boolean;
  detailLevel: "minimal" | "balanced" | "detailed";
};

export type Notification = {
  id: string;
  userId?: string;
  title: string;
  body: string;
  level: "info" | "warning" | "locked";
  createdAt: string;
  read: boolean;
};

export type SuggestionConfidence = "high" | "medium" | "low";

export type AdaptiveSuggestionFrequency = "minimal" | "balanced" | "active";

export type AdaptiveAutomationLevel = "suggestions-only" | "require-confirmation" | "auto-apply-low-risk";

export type AdaptiveLearningSensitivity = "conservative" | "moderate" | "adaptive";

export type AdaptiveFenceSettings = {
  enabled: boolean;
  frequency: AdaptiveSuggestionFrequency;
  automationLevel: AdaptiveAutomationLevel;
  learningSensitivity: AdaptiveLearningSensitivity;
};

export type AdaptiveFenceSuggestionEvidence = {
  categoryId: string;
  usagePercent: number;
  cycleProgressPercent: number;
  projectedEndSpend: number;
  limit: number;
  reasonCode: string;
};

export type AdaptiveFenceSuggestion = {
  id: string;
  categoryId: string;
  type: "overrun" | "underspend" | "pacing" | "volatility" | "recurring";
  title: string;
  explanation: string;
  suggestedAction: string;
  confidence: SuggestionConfidence;
  currentLimit: number;
  suggestedLimit?: number;
  estimatedMonthlyImpact?: number;
  metric?: string;
  evidence?: AdaptiveFenceSuggestionEvidence;
  source: "local_rules" | "groq";
};

export type AdaptiveSuggestionStatus = "active" | "accepted" | "dismissed";

export type PersistedAdaptiveFenceSuggestion = AdaptiveFenceSuggestion & {
  message: string;
  relatedCategoryId?: string;
  status: AdaptiveSuggestionStatus;
  fingerprint: string;
  createdAt: string;
  updatedAt?: string;
};

export type AdaptiveFenceSuggestionCache = {
  fingerprint: string;
  generatedAt: string;
  aiUsed: boolean;
  items: PersistedAdaptiveFenceSuggestion[];
  activeIndex: number;
  expandedId?: string | null;
};

export type FenceLearningEvent = {
  id: string;
  suggestionId: string;
  categoryId?: string;
  suggestionType: AdaptiveFenceSuggestion["type"];
  decision: "accepted" | "dismissed" | "marked-useful";
  previousLimit?: number;
  suggestedLimit?: number;
  createdAt: string;
};

export type CategorySuggestion = {
  suggestedCategoryId: string;
  confidence: number;
  confidenceLabel: SuggestionConfidence;
  reason: string;
  source: "merchant_rule" | "keyword" | "plaid_mapping" | "ai" | "fallback";
};

export type ImportedTransaction = {
  id: string;
  userId?: string;
  merchantName: string;
  description: string;
  amount: number;
  date: string;
  plaidCategory?: string;
  suggestedCategoryId?: string;
  confidence: number;
  suggestionReason: string;
  suggestionSource: CategorySuggestion["source"];
  reviewStatus: "pending" | "accepted" | "changed" | "ignored";
};

export type MerchantCategoryRule = {
  id: string;
  userId?: string;
  merchantNameNormalized: string;
  categoryId: string;
  source: "user_correction" | "system_rule" | "plaid_mapping";
  confidence: number;
  lastUsedAt: string;
};

export type UserCategoryCorrection = {
  id: string;
  userId?: string;
  merchantNameNormalized: string;
  originalSuggestedCategoryId?: string;
  correctedCategoryId: string;
  createdAt: string;
};

export type RecurringFrequency = "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly";

export type RecurringKind = "subscription" | "bill" | "income";

export type RecurringItem = {
  id: string;
  userId?: string;
  name: string;
  amount: number;
  kind: RecurringKind;
  frequency: RecurringFrequency;
  nextDate: string;
  categoryId?: string;
  notes?: string;
  active: boolean;
  sourcePurchaseId?: string;
  detected: boolean;
  createdAt: string;
  updatedAt: string;
};

export type OnboardingProfile = {
  completed: boolean;
  skipped: boolean;
  completedAt?: string;
  rhythm: "month-start" | "paycheck" | "custom";
  incomeFrequency: "monthly" | "biweekly" | "weekly";
  guardrailMode: "gentle" | "balanced" | "strict";
  selectedCategoryIds: string[];
  customCategoryNames: string[];
  futureReady: {
    plaidSync: boolean;
    aiInsights: boolean;
    recurringTransactions: boolean;
    sharedBudgeting: boolean;
    savingsGoals: boolean;
  };
};

export type SpendFenceState = {
  userId?: string;
  budgetMonth: BudgetMonth;
  categories: Category[];
  purchases: Purchase[];
  recurringItems: RecurringItem[];
  receipts: Receipt[];
  importedTransactions: ImportedTransaction[];
  merchantCategoryRules: MerchantCategoryRule[];
  categoryCorrections: UserCategoryCorrection[];
  prompts: Prompt[];
  notificationSettings: NotificationSettings;
  insightSettings: InsightSettings;
  adaptiveFenceSettings: AdaptiveFenceSettings;
  adaptiveSuggestions: AdaptiveFenceSuggestionCache;
  fenceLearningEvents: FenceLearningEvent[];
  spendingRules: SpendingRule[];
  onboardingProfile: OnboardingProfile;
  notifications: Notification[];
  aiCategorizationEnabled: boolean;
};

export type StoredSpendFenceData = {
  version: 2;
  demoDataEnabled: boolean;
  realState: SpendFenceState;
  demoState: SpendFenceState;
};

export type CategoryInput = Omit<Category, "id">;
export type PurchaseInput = Omit<Purchase, "id" | "source" | "recurringId"> & {
  source?: Purchase["source"];
  recurring?: {
    enabled: boolean;
    frequency: RecurringFrequency;
    kind: Exclude<RecurringKind, "income">;
  };
};
export type RecurringItemInput = Omit<RecurringItem, "id" | "active" | "detected" | "createdAt" | "updatedAt"> &
  Partial<Pick<RecurringItem, "active" | "detected">>;
export type OnboardingCompleteInput = {
  budgetCycleStartDay: number;
  rhythm: OnboardingProfile["rhythm"];
  income: number;
  incomeFrequency: OnboardingProfile["incomeFrequency"];
  guardrailMode: OnboardingProfile["guardrailMode"];
  categories: CategoryInput[];
  insightSettings: InsightSettings;
  selectedCategoryIds: string[];
  customCategoryNames: string[];
};
export type ReceiptDraftInput = Omit<Receipt, "id" | "status">;
export type ImportedTransactionInput = Omit<
  ImportedTransaction,
  "id" | "reviewStatus" | "confidence" | "suggestionReason" | "suggestionSource"
> &
  Partial<Pick<ImportedTransaction, "confidence" | "suggestionReason" | "suggestionSource" | "reviewStatus">>;
