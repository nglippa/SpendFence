export type BudgetStatus = "safe" | "warning" | "locked";

export type BudgetMonth = {
  id: string;
  userId?: string;
  month: string;
  income: number;
  savingsTarget: number;
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

export type Receipt = {
  id: string;
  userId?: string;
  image?: string;
  merchant: string;
  total: number;
  categoryId: string;
  date: string;
  lineItems: ReceiptLineItem[];
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

export type SpendFenceState = {
  userId?: string;
  budgetMonth: BudgetMonth;
  categories: Category[];
  purchases: Purchase[];
  receipts: Receipt[];
  prompts: Prompt[];
  notificationSettings: NotificationSettings;
  notifications: Notification[];
};

export type CategoryInput = Omit<Category, "id">;
export type PurchaseInput = Omit<Purchase, "id" | "source"> & { source?: Purchase["source"] };
export type ReceiptDraftInput = Omit<Receipt, "id" | "status">;
