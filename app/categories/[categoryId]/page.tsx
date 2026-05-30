"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, PenLine, ReceiptText, Trash2 } from "lucide-react";
import { CategoryIcon } from "@/components/category-icons";
import { PurchaseForm } from "@/components/purchase-form";
import { StableCollapsible, scrollIntoViewIfNeeded, stableLayoutDelay, usePrefersReducedMotion } from "@/components/stable-layout";
import { Button, Card, EmptyState, PageHeader, Pill, ProgressBar, Select } from "@/components/ui";
import { ConfirmSheet, SettingsFeedback } from "@/components/settings-ui";
import { categoryProgress, currentCycleLabel, formatMoney, purchasesForCycle, statusClasses, statusColor, statusCopy, warningMessage } from "@/lib/budget";
import { selectCategoryInsight } from "@/lib/insights/behavioral-insights";
import { useSpendFence } from "@/lib/store";
import type { Purchase, PurchaseInput } from "@/lib/types";
import { formatShortDate } from "@/lib/utils";

export default function CategoryDetailPage() {
  const params = useParams<{ categoryId: string }>();
  const categoryId = Array.isArray(params.categoryId) ? params.categoryId[0] : params.categoryId;
  const state = useSpendFence();
  const prefersReducedMotion = usePrefersReducedMotion();
  const category = state.categories.find((item) => item.id === categoryId);
  const [editing, setEditing] = useState<Purchase | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState<Purchase | null>(null);
  const [feedback, setFeedback] = useState("");
  const editFormRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const categoryPurchases = useMemo(() => {
    if (!category) return [];
    return purchasesForCycle(state.purchases, state.budgetMonth)
      .filter((purchase) => purchase.categoryId === category.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [category, state.budgetMonth, state.purchases]);

  useEffect(() => {
    if (!editing || !editOpen) return;
    window.setTimeout(() => {
      scrollIntoViewIfNeeded(editFormRef.current);
      firstInputRef.current?.focus({ preventScroll: true });
    }, stableLayoutDelay(prefersReducedMotion));
  }, [editOpen, editing, prefersReducedMotion]);

  if (!category) {
    return (
      <>
        <PageHeader
          kicker="Category"
          title="Category not found"
          body="This category may have been deleted or reset."
          action={
            <Button asChild variant="secondary">
              <Link href="/dashboard">
                <ArrowLeft size={18} /> Back home
              </Link>
            </Button>
          }
        />
      </>
    );
  }

  const progress = categoryProgress(category, state.purchases, state.budgetMonth);
  const categoryInsight = selectCategoryInsight(state, category.id);

  function updatePurchase(input: PurchaseInput) {
    if (!editing) return;
    state.updatePurchase(editing.id, input);
    closeEditForm();
    showFeedback("Purchase saved.");
  }

  function startEditing(purchase: Purchase) {
    setEditing(purchase);
    setEditOpen(true);
  }

  function closeEditForm() {
    setEditOpen(false);
  }

  function showFeedback(message: string) {
    setFeedback(message);
    window.setTimeout(() => setFeedback(""), 1800);
  }

  function movePurchase(purchase: Purchase, nextCategoryId: string) {
    if (nextCategoryId === purchase.categoryId) return;
    state.updatePurchase(purchase.id, toPurchaseInput({ ...purchase, categoryId: nextCategoryId }));
    if (editing?.id === purchase.id) setEditing((current) => (current ? { ...current, categoryId: nextCategoryId } : current));
  }

  return (
    <>
      <PageHeader
        kicker="Category detail"
        title={category.name}
        body={`${currentCycleLabel(state.budgetMonth)}. Purchases and limits recalculate from saved purchases.`}
        action={
          <Button asChild variant="secondary">
            <Link href="/dashboard">
              <ArrowLeft size={18} /> Back home
            </Link>
          </Button>
        }
      />
      <SettingsFeedback message={feedback} />
      {categoryInsight ? (
        <div className="mb-4 border-l border-[rgb(139_151_220_/_0.35)] py-1 pl-3 sm:mb-5 sm:pl-4">
          <p className="text-[0.66rem] font-black uppercase tracking-[0.14em] text-[var(--app-intelligence)]">Observation</p>
          <p className="mt-1 text-sm font-black leading-5 text-[var(--app-text)] sm:text-base">{categoryInsight.title}</p>
          <p className="mt-1 max-w-3xl text-sm font-semibold leading-5 text-[var(--app-text-secondary)]">{categoryInsight.message}</p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-[0.88fr_1.12fr]">
        <section className="grid content-start gap-4 sm:gap-5">
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white shadow-soft" style={{ background: category.color }}>
                  <CategoryIcon icon={category.icon} size={22} />
                </span>
                <div className="min-w-0">
                  <h2 className="text-xl font-black leading-6 text-[#10201c] sm:text-2xl sm:leading-7">{category.name}</h2>
                  <p className="mt-1 text-xs font-bold text-slate-500 sm:text-sm">Monthly limit {formatMoney(category.limit)}</p>
                </div>
              </div>
              <Pill className={statusClasses(progress.status)}>{statusCopy(progress.status)}</Pill>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2.5 text-center sm:gap-3">
              <div className="rounded-xl bg-[#f7faf7] p-2.5 sm:rounded-2xl sm:p-3">
                <p className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-slate-500">Spent</p>
                <p className="mt-1 text-base font-black sm:text-lg">{formatMoney(progress.spent)}</p>
              </div>
              <div className="rounded-xl bg-[#f7faf7] p-2.5 sm:rounded-2xl sm:p-3">
                <p className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-slate-500">Left</p>
                <p className="mt-1 text-base font-black sm:text-lg">{formatMoney(progress.remaining)}</p>
              </div>
              <div className="rounded-xl bg-[#f7faf7] p-2.5 sm:rounded-2xl sm:p-3">
                <p className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-slate-500">Used</p>
                <p className="mt-1 text-base font-black sm:text-lg">{Math.round(progress.percent)}%</p>
              </div>
            </div>

            <div className="mt-4">
              <ProgressBar percent={progress.percent} color={statusColor(progress.status)} />
              <p className="mt-2.5 text-sm font-semibold leading-5 text-slate-600">{warningMessage(category, state.purchases, state.budgetMonth)}</p>
            </div>
          </Card>

          <StableCollapsible open={editOpen && Boolean(editing)}>
            {editing ? (
              <Card>
                <div ref={editFormRef} className="scroll-mt-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#327d6d]">Editing purchase</p>
                      <h2 className="text-lg font-black sm:text-xl">{editing.merchant}</h2>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={closeEditForm}>
                      Cancel
                    </Button>
                  </div>
                  <PurchaseForm
                    key={editing.id}
                    categories={state.categories}
                    initial={editing}
                    firstInputRef={firstInputRef}
                    showReceiptUpload={false}
                    submitLabel="Save changes"
                    onSubmit={updatePurchase}
                  />
                </div>
              </Card>
            ) : null}
          </StableCollapsible>
        </section>

        <Card>
          <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
            <div>
              <h2 className="text-lg font-black sm:text-xl">Purchases in this category</h2>
              <p className="mt-1 text-xs font-bold text-slate-500 sm:text-sm">{categoryPurchases.length} this cycle</p>
            </div>
          </div>

          {categoryPurchases.length ? (
            <div className="grid gap-2.5 sm:gap-3">
              {categoryPurchases.map((purchase) => (
                <article key={purchase.id} className="rounded-xl bg-[#f7faf7] p-3 sm:rounded-2xl sm:p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-black leading-5 text-[#10201c] sm:text-base sm:leading-6">{purchase.merchant}</h3>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        {formatShortDate(purchase.date)}
                        {purchase.notes ? ` - ${purchase.notes}` : ""}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-black sm:text-base">{formatMoney(purchase.amount)}</p>
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                    <label className="grid gap-1 text-xs font-black text-slate-600">
                      Move category
                      <Select value={purchase.categoryId} onChange={(event) => movePurchase(purchase, event.target.value)} className="min-h-10 text-xs sm:min-h-11">
                        {state.categories.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </Select>
                    </label>
                    <Button type="button" variant="secondary" size="sm" onClick={() => startEditing(purchase)}>
                      <PenLine size={15} /> Edit
                    </Button>
                    <Button type="button" variant="danger" size="sm" onClick={() => setDeleting(purchase)}>
                      <Trash2 size={15} /> Delete
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              compact
              icon={ReceiptText}
              title="This category is ready for purchases"
              body="When a purchase is assigned here, you will be able to edit it, delete it, or move it without creating duplicates."
            />
          )}
        </Card>
      </div>
      <ConfirmSheet
        open={Boolean(deleting)}
        danger
        title="Delete purchase?"
        body={`Delete ${deleting?.merchant ?? "this purchase"} for ${deleting ? formatMoney(deleting.amount) : ""}? This cannot be undone.`}
        confirmLabel="Delete"
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            state.deletePurchase(deleting.id);
            if (editing?.id === deleting.id) closeEditForm();
          }
          setDeleting(null);
          showFeedback("Purchase deleted.");
        }}
      />
    </>
  );
}

function toPurchaseInput(purchase: Purchase): PurchaseInput {
  return {
    amount: purchase.amount,
    categoryId: purchase.categoryId,
    merchant: purchase.merchant,
    date: purchase.date,
    notes: purchase.notes,
    receiptImage: purchase.receiptImage,
    source: purchase.source
  };
}
