"use client";

import { FormEvent, useMemo, useState } from "react";
import { CheckCircle2, ListChecks, Plus, Sparkles, Trash2 } from "lucide-react";
import { Button, Card, EmptyState, Field, Input, PageHeader, Pill, Select } from "@/components/ui";
import { formatMoney } from "@/lib/budget";
import { useSpendFence } from "@/lib/store";
import type { CategoryInput, CategorySuggestion, ImportedTransactionInput, ImportedTransaction } from "@/lib/types";
import { formatShortDate } from "@/lib/utils";

const demoImports: ImportedTransactionInput[] = [
  {
    merchantName: "Starbucks",
    description: "STARBUCKS STORE 1142",
    amount: 8.74,
    date: new Date().toISOString(),
    plaidCategory: "Food and Drink, Coffee Shop"
  },
  {
    merchantName: "Target",
    description: "TARGET T-2031 FAMILY ESSENTIALS",
    amount: 92.18,
    date: new Date().toISOString(),
    plaidCategory: "Shops, General Merchandise"
  },
  {
    merchantName: "Shell",
    description: "SHELL OIL 574894",
    amount: 47.55,
    date: new Date().toISOString(),
    plaidCategory: "Transportation, Gas Stations"
  },
  {
    merchantName: "Netflix",
    description: "NETFLIX.COM",
    amount: 17.99,
    date: new Date().toISOString(),
    plaidCategory: "Service, Subscription"
  }
];

type CategoryDraft = Omit<CategoryInput, "limit" | "warningThreshold" | "hardStopThreshold"> & {
  limit: string;
  warningThreshold: string;
  hardStopThreshold: string;
};

export default function TransactionReviewPage() {
  const state = useSpendFence();
  const pending = state.importedTransactions.filter((transaction) => transaction.reviewStatus === "pending");
  const reviewed = state.importedTransactions.filter((transaction) => transaction.reviewStatus !== "pending");
  const [selectedCategories, setSelectedCategories] = useState<Record<string, string>>({});
  const [newCategoryFor, setNewCategoryFor] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState<CategoryDraft>({
    name: "",
    limit: "250",
    warningThreshold: "80",
    hardStopThreshold: "100",
    color: "#5BA98C",
    icon: "tag"
  });
  const highConfidenceCount = useMemo(
    () => pending.filter((transaction) => transaction.confidence >= 0.82 && transaction.suggestedCategoryId).length,
    [pending]
  );

  async function importDemoTransactions() {
    const categorized = await Promise.all(
      demoImports.map(async (transaction) => ({
        ...transaction,
        ...(await getServerSuggestion(transaction, state))
      }))
    );
    state.addImportedTransactions(categorized);
  }

  function selectedCategoryFor(transaction: ImportedTransaction) {
    return selectedCategories[transaction.id] ?? transaction.suggestedCategoryId ?? state.categories[0]?.id ?? "";
  }

  function accept(transaction: ImportedTransaction) {
    const categoryId = selectedCategoryFor(transaction);
    if (!categoryId) return;
    if (categoryId === transaction.suggestedCategoryId) state.acceptImportedTransaction(transaction.id, categoryId);
    else state.changeImportedTransactionCategory(transaction.id, categoryId);
  }

  function createCategory(event: FormEvent) {
    event.preventDefault();
    if (!newCategoryFor) return;
    state.createCategoryForImportedTransaction(newCategoryFor, {
      ...newCategory,
      limit: parseDecimal(newCategory.limit),
      warningThreshold: parseDecimal(newCategory.warningThreshold),
      hardStopThreshold: parseDecimal(newCategory.hardStopThreshold)
    });
    setNewCategoryFor(null);
    setNewCategory({ name: "", limit: "250", warningThreshold: "80", hardStopThreshold: "100", color: "#5BA98C", icon: "tag" });
  }

  return (
    <>
      <PageHeader
        kicker="Review Queue"
        title="Approve imported transactions"
        body="SpendFence suggests categories based on your past choices, merchant patterns, and optional AI assistance."
        action={
          state.demoDataEnabled ? (
            <Button onClick={importDemoTransactions}>
              <Sparkles size={18} /> Import demo transactions
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-[1fr_0.82fr]">
        <section className="grid content-start gap-4">
          <Card>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-black sm:text-xl">Pending review</h2>
                <p className="mt-1 text-sm font-semibold leading-5 text-slate-600">
                  Nothing posts to your budget until you accept, change, or create a category.
                </p>
              </div>
              <Button variant="secondary" disabled={!highConfidenceCount} onClick={() => state.bulkAcceptHighConfidenceImports()}>
                <CheckCircle2 size={17} /> Bulk accept high confidence
              </Button>
            </div>
          </Card>

          {pending.length ? (
            pending.map((transaction) => (
              <Card key={transaction.id}>
                <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-black sm:text-xl">{transaction.merchantName}</h2>
                      <ConfidencePill confidence={transaction.confidence} />
                    </div>
                    <p className="mt-1 text-xs font-bold text-slate-500 sm:text-sm">{transaction.description}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500 sm:text-sm">{formatShortDate(transaction.date)} - {transaction.plaidCategory ?? "No bank category hint"}</p>
                    <p className="mt-2 text-xl font-black text-[#10201c] sm:mt-3 sm:text-2xl">{formatMoney(transaction.amount)}</p>
                  </div>

                  <div className="grid w-full gap-3 md:max-w-sm">
                    <Field label="Suggested category">
                      <Select
                        value={selectedCategoryFor(transaction)}
                        onChange={(event) => setSelectedCategories({ ...selectedCategories, [transaction.id]: event.target.value })}
                      >
                        {state.categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <p className="rounded-xl bg-[#f7faf7] p-2.5 text-sm font-bold leading-5 text-slate-600 sm:rounded-2xl sm:p-3 sm:leading-6">{transaction.suggestionReason}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => accept(transaction)}>
                        <CheckCircle2 size={17} /> Accept
                      </Button>
                      <Button variant="secondary" onClick={() => setNewCategoryFor(transaction.id)}>
                        <Plus size={17} /> New category
                      </Button>
                      <Button variant="ghost" onClick={() => state.ignoreImportedTransaction(transaction.id)}>
                        Ignore
                      </Button>
                    </div>
                  </div>
                </div>

                {newCategoryFor === transaction.id ? (
                  <form className="mt-3 grid gap-3 rounded-xl bg-[#f7faf7] p-3 sm:mt-4 sm:rounded-3xl sm:p-4" onSubmit={createCategory}>
                    <h3 className="font-black text-[#10201c]">Create category for {transaction.merchantName}</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Name">
                        <Input value={newCategory.name} onChange={(event) => setNewCategory({ ...newCategory, name: event.target.value })} required />
                      </Field>
                      <Field label="Monthly limit">
                        <Input inputMode="decimal" value={newCategory.limit} onChange={(event) => setNewCategory({ ...newCategory, limit: event.target.value })} />
                      </Field>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit">
                        <Plus size={17} /> Create and accept
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => setNewCategoryFor(null)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : null}
              </Card>
            ))
          ) : (
            <Card>
              <EmptyState
                icon={ListChecks}
                title="Review queue is clear"
                body="Imported transactions will pause here first, so you can approve categories before they affect your budget."
              />
            </Card>
          )}
        </section>

        <aside className="grid content-start gap-4">
          <Card>
            <h2 className="text-lg font-black sm:text-xl">Learning memory</h2>
            <p className="mt-1.5 text-sm font-semibold leading-5 text-slate-600 sm:mt-2 sm:leading-6">
              Corrections are stored as merchant rules so future imports can match your habits.
            </p>
            <div className="mt-4 grid gap-2">
              <Pill className="w-max border-[#cfe8de] bg-[#f3fbf7] text-[#327d6d]">{state.merchantCategoryRules.length} merchant rules</Pill>
              <Pill className="w-max border-slate-200 bg-white text-slate-600">{state.categoryCorrections.length} corrections saved</Pill>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-black sm:text-xl">Recently reviewed</h2>
            <div className="mt-3 grid gap-2">
              {reviewed.slice(0, 6).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between gap-3 rounded-xl bg-[#f7faf7] p-2.5 sm:rounded-2xl sm:p-3">
                  <div>
                    <p className="text-sm font-black sm:text-base">{transaction.merchantName}</p>
                    <p className="text-xs font-bold text-slate-500">{transaction.reviewStatus}</p>
                  </div>
                  <Button variant="danger" size="sm" onClick={() => state.ignoreImportedTransaction(transaction.id)}>
                    <Trash2 size={15} />
                  </Button>
                </div>
              ))}
              {!reviewed.length ? (
                <EmptyState
                  compact
                  icon={CheckCircle2}
                  title="Reviewed imports will settle here"
                  body="Accepted, changed, or ignored imports will collect here as a quiet audit trail."
                />
              ) : null}
            </div>
          </Card>
        </aside>
      </div>
    </>
  );
}

function ConfidencePill({ confidence }: { confidence: number }) {
  if (confidence >= 0.82) return <Pill className="border-emerald-100 bg-emerald-50 text-emerald-700">High confidence</Pill>;
  if (confidence >= 0.62) return <Pill className="border-amber-100 bg-amber-50 text-amber-800">Suggested</Pill>;
  return <Pill className="border-slate-200 bg-white text-slate-600">Needs review</Pill>;
}

function parseDecimal(value: string) {
  const parsed = Number(value.replace(/[$,%\s,]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

async function getServerSuggestion(transaction: ImportedTransactionInput, state: ReturnType<typeof useSpendFence>) {
  if (!state.aiCategorizationEnabled) return {};

  try {
    const response = await fetch("/api/ai/categorize-purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant: transaction.merchantName,
        amount: transaction.amount,
        notes: transaction.description,
        categories: state.categories,
        merchantRules: state.merchantCategoryRules
      })
    });
    if (!response.ok) return {};
    const data = (await response.json()) as { suggestedCategoryId?: string | null; confidence?: "low" | "medium" | "high"; reason?: string };
    if (!data.suggestedCategoryId) return {};
    return {
      suggestedCategoryId: data.suggestedCategoryId,
      confidence: confidenceScore(data.confidence),
      suggestionReason: data.reason ?? "AI suggested this category for review.",
      suggestionSource: "ai" as const
    };
  } catch {
    return {};
  }
}

function confidenceScore(confidence?: "low" | "medium" | "high") {
  if (confidence === "high") return 0.86;
  if (confidence === "medium") return 0.68;
  return 0.48;
}
