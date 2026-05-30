import type { Category, MerchantCategoryRule } from "@/lib/types";

export type AiConfidence = "low" | "medium" | "high";

export type AiCategory = Pick<Category, "id" | "name" | "limit">;

export type ReceiptAnalysisInput = {
  receiptText?: string;
  merchantHint?: string;
  totalHint?: number;
  categories: AiCategory[];
};

export type ReceiptAnalysisResult = {
  merchant: string;
  date: string | null;
  total: number | null;
  lineItems: Array<{
    name: string;
    amount: number | null;
    suggestedCategoryId: string | null;
    confidence: AiConfidence;
  }>;
  categorySplits: Array<{
    categoryId: string;
    amount: number;
    reason: string;
  }>;
  summary: string;
};

export type PurchaseCategorizationInput = {
  merchant: string;
  amount: number;
  notes?: string;
  categories: AiCategory[];
  merchantRules?: MerchantCategoryRule[];
};

export type PurchaseCategorizationResult = {
  suggestedCategoryId: string | null;
  confidence: AiConfidence;
  reason: string;
};

export type GroqJsonResult<T> = {
  data: T;
  aiUsed: boolean;
};
