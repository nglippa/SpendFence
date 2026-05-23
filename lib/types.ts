export type BudgetStatus = "safe" | "warning" | "locked";

export type BudgetMonth = {
  id: string;
  userId?: string;
  month: string;
  income: number;
  savingsTarget: number;
  budgetCycleStartDay: number;
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

export type SpendFenceState = {
  userId?: string;
  budgetMonth: BudgetMonth;
  categories: Category[];
  purchases: Purchase[];
  receipts: Receipt[];
  importedTransactions: ImportedTransaction[];
  merchantCategoryRules: MerchantCategoryRule[];
  categoryCorrections: UserCategoryCorrection[];
  prompts: Prompt[];
  notificationSettings: NotificationSettings;
  notifications: Notification[];
  aiCategorizationEnabled: boolean;
};

export type CategoryInput = Omit<Category, "id">;
export type PurchaseInput = Omit<Purchase, "id" | "source"> & { source?: Purchase["source"] };
export type ReceiptDraftInput = Omit<Receipt, "id" | "status">;
export type ImportedTransactionInput = Omit<
  ImportedTransaction,
  "id" | "reviewStatus" | "confidence" | "suggestionReason" | "suggestionSource"
> &
  Partial<Pick<ImportedTransaction, "confidence" | "suggestionReason" | "suggestionSource" | "reviewStatus">>;
