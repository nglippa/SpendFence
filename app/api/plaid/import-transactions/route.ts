import { NextResponse } from "next/server";
import { categorizeTransaction } from "@/lib/categorization";
import type { Category, ImportedTransactionInput, MerchantCategoryRule } from "@/lib/types";

const sandboxTransactions: ImportedTransactionInput[] = [
  {
    merchantName: "Kroger",
    description: "KROGER MARKET 221",
    amount: 118.42,
    date: new Date().toISOString(),
    plaidCategory: "Shops, Supermarkets and Groceries"
  },
  {
    merchantName: "Chevron",
    description: "CHEVRON FUEL",
    amount: 54.1,
    date: new Date().toISOString(),
    plaidCategory: "Transportation, Gas Stations"
  },
  {
    merchantName: "Apple",
    description: "APPLE.COM/BILL",
    amount: 9.99,
    date: new Date().toISOString(),
    plaidCategory: "Service, Subscription"
  }
];

export async function POST(request: Request) {
  const plan = request.headers.get("x-spendfence-plan");
  if (plan !== "pro") {
    return NextResponse.json({ message: "Automatic transaction imports require Pro." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as { userCategories?: Category[]; merchantRules?: MerchantCategoryRule[] };
  const userCategories = body.userCategories ?? [];
  const merchantRules = body.merchantRules ?? [];

  return NextResponse.json({
    transactions: sandboxTransactions.map((transaction) => {
      const suggestion = categorizeTransaction(transaction, userCategories, merchantRules);
      return {
        ...transaction,
        suggestedCategoryId: suggestion.suggestedCategoryId,
        confidence: suggestion.confidence,
        suggestionReason: suggestion.reason,
        suggestionSource: suggestion.source
      };
    }),
    message: "Plaid Sandbox import placeholder returned review-ready transactions. No access tokens were exposed."
  });
}
