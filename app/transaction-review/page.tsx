"use client";

import { FormEvent, useMemo, useState } from "react";
import { CheckCircle2, Plus, Sparkles, Trash2 } from "lucide-react";
import { Button, Field, Input, PageHeader, Pill, Select } from "@/components/ui";
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
        body="SpendFence suggests categories based on your past choices, merchant patterns, and optional assistance."
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
          <div className="flex flex-col gap-3 px-1.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-[0.68rem] font-black uppercase leading-4 tracking-[0.16em] text-[var(--app-text-muted)]">Pending review</h2>
              <p className="mt-1.5 text-sm font-semibold leading-5 text-[var(--app-text-secondary)]">
                Nothing posts to your budget until you accept, change, or create a category.
              </p>
            </div>
            <Button variant="secondary" disabled={!highConfidenceCount} onClick={() => state.bulkAcceptHighConfidenceImports()}>
              <CheckCircle2 size={17} /> Bulk accept high confidence
            </Button>
          </div>

          {pending.length ? (
            pending.map((transaction) => (
              <article key={transaction.id} className="flow-zone p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-black text-[var(--app-text)] sm:text-xl">{transaction.merchantName}</h2>
                      <ConfidencePill confidence={transaction.confidence} />
                    </div>
                    <p className="mt-1 text-xs font-bold text-[var(--app-text-muted)] sm:text-sm">{transaction.description}</p>
                    <p className="mt-1 text-xs font-bold text-[var(--app-text-muted)] sm:text-sm">{formatShortDate(transaction.date)} - {transaction.plaidCategory ?? "No bank category hint"}</p>
                    <p className="mt-2 text-xl font-black text-[var(--app-text)] sm:mt-3 sm:text-2xl">{formatMoney(transaction.amount)}</p>
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
                    <p className="flow-zone-muted p-2.5 text-sm font-bold leading-5 text-[var(--app-text-secondary)] sm:p-3 sm:leading-6">{transaction.suggestionReason}</p>
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
                  <form className="flow-zone-muted mt-3 grid gap-3 p-3 sm:mt-4 sm:p-4" onSubmit={createCategory}>
                    <h3 className="font-black text-[var(--app-text)]">Create category for {transaction.merchantName}</h3>
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
              </article>
            ))
          ) : (
            <p className="px-1.5 text-sm font-semibold leading-5 text-[var(--app-text-muted)]">
              Review queue is clear — imported transactions pause here first, so you can approve categories before they affect your budget.
            </p>
          )}
        </section>

        <aside className="grid content-start gap-4">
          <section className="grid gap-3">
            <h2 className="px-1.5 text-[0.68rem] font-black uppercase leading-4 tracking-[0.16em] text-[var(--app-text-muted)]">Learning memory</h2>
            <p className="px-1.5 text-sm font-semibold leading-5 text-[var(--app-text-secondary)]">
              Corrections are stored as merchant rules so future imports can match your habits.
            </p>
            <div className="grid gap-2 px-1.5">
              <Pill className="w-max border-[rgb(95_164_142_/_0.24)] bg-[color:rgb(95_164_142_/_0.12)] text-[var(--brand-secondary)]">{state.merchantCategoryRules.length} merchant rules</Pill>
              <Pill className="w-max border-[var(--glass-border)] [background:var(--glass-interactive-bg)] text-[var(--app-text-secondary)]">{state.categoryCorrections.length} corrections saved</Pill>
            </div>
          </section>

          <section className="grid gap-3">
            <h2 className="px-1.5 text-[0.68rem] font-black uppercase leading-4 tracking-[0.16em] text-[var(--app-text-muted)]">Recently reviewed</h2>
            {reviewed.length ? (
              reviewed.slice(0, 6).map((transaction) => (
                <div key={transaction.id} className="flow-zone-muted flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-[var(--app-text)] sm:text-base">{transaction.merchantName}</p>
                    <p className="text-xs font-bold capitalize text-[var(--app-text-muted)]">{transaction.reviewStatus}</p>
                  </div>
                  <Button variant="danger" size="sm" onClick={() => state.ignoreImportedTransaction(transaction.id)}>
                    <Trash2 size={15} />
                  </Button>
                </div>
              ))
            ) : (
              <p className="px-1.5 text-sm font-semibold leading-5 text-[var(--app-text-muted)]">
                Accepted, changed, or ignored imports will collect here as a quiet audit trail.
              </p>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}

function ConfidencePill({ confidence }: { confidence: number }) {
  if (confidence >= 0.82)
    return <Pill className="border-[rgb(95_164_142_/_0.24)] bg-[color:rgb(95_164_142_/_0.12)] text-[var(--brand-secondary)]">High confidence</Pill>;
  if (confidence >= 0.62)
    return <Pill className="border-[rgb(214_170_90_/_0.26)] bg-[color:rgb(214_170_90_/_0.14)] text-[#d8a85a]">Suggested</Pill>;
  return <Pill className="border-[var(--glass-border)] [background:var(--glass-interactive-bg)] text-[var(--app-text-muted)]">Needs review</Pill>;
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
      suggestionReason: data.reason ?? "Suggested this category for review.",
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
