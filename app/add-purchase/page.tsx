"use client";

import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import type { ReactNode, Ref } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { CalendarClock, CheckCircle2, ChevronRight, Edit3, FileText, Plus, ReceiptText, Repeat2, ScanLine, Trash2, Upload, X } from "lucide-react";
import { PurchaseForm } from "@/components/purchase-form";
import { Button, Card, EmptyState, Field, Input, PageHeader, Pill, Select, Textarea } from "@/components/ui";
import { ConfirmSheet, SettingsFeedback } from "@/components/settings-ui";
import { formatMoney } from "@/lib/budget";
import { detectRecurringCandidates, monthlyRecurringAmount, nextRecurringDate, recurringFrequencyLabel, recurringKindLabel, recurringMonthlyTotals } from "@/lib/recurring";
import { useSpendFence } from "@/lib/store";
import type { Category, ReceiptCategoryAllocation, ReceiptLineItem, Purchase, RecurringFrequency, RecurringItem, RecurringItemInput, RecurringKind } from "@/lib/types";
import { formatShortDate, fromDateInput, toDateInput } from "@/lib/utils";

type ReceiptAnalysis = {
  merchant: string;
  date: string;
  total: string;
  lineItems: ReceiptLineItem[];
  allocations: ReceiptAllocationDraft[];
  confidence: number;
  reason: string;
  aiUsed: boolean;
};

type ReceiptAllocationDraft = Omit<ReceiptCategoryAllocation, "amount"> & { amount: string };

type ReceiptAnalysisResponse = Omit<ReceiptAnalysis, "total" | "allocations"> & {
  total: number;
  allocations: ReceiptCategoryAllocation[];
};

type AddFlow = "manual" | "receipt" | "recurring";

export default function AddPurchasePage() {
  const state = useSpendFence();
  const [expanded, setExpanded] = useState<AddFlow | null>(null);
  const [lastCompleted, setLastCompleted] = useState<AddFlow | null>(null);
  const [editing, setEditing] = useState<Purchase | null>(null);
  const [manualFormKey, setManualFormKey] = useState(0);
  const [receiptImage, setReceiptImage] = useState<string | undefined>();
  const [receiptText, setReceiptText] = useState("");
  const [analysis, setAnalysis] = useState<ReceiptAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [receiptMessage, setReceiptMessage] = useState("");
  const [feedback, setFeedback] = useState("");
  const [deleting, setDeleting] = useState<Purchase | null>(null);
  const manualSectionRef = useRef<HTMLDivElement>(null);
  const receiptSectionRef = useRef<HTMLDivElement>(null);
  const recurringSectionRef = useRef<HTMLDivElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const receiptTextRef = useRef<HTMLTextAreaElement>(null);
  const recurringNameRef = useRef<HTMLInputElement>(null);

  const allocationTotal = useMemo(() => analysis?.allocations.reduce((sum, allocation) => sum + parseDecimal(allocation.amount), 0) ?? 0, [analysis]);

  function openFlow(flow: AddFlow) {
    setExpanded(flow);
    window.setTimeout(() => {
      const section = flow === "manual" ? manualSectionRef.current : flow === "receipt" ? receiptSectionRef.current : recurringSectionRef.current;
      section?.scrollIntoView({ behavior: "smooth", block: "start" });
      if (flow === "manual") amountInputRef.current?.focus();
      if (flow === "receipt") receiptTextRef.current?.focus();
      if (flow === "recurring") recurringNameRef.current?.focus();
    }, 180);
  }

  function editPurchase(purchase: Purchase) {
    setEditing(purchase);
    openFlow("manual");
  }

  function showFeedback(message: string) {
    setFeedback(message);
    window.setTimeout(() => setFeedback(""), 1800);
  }

  function completeFlow(flow: AddFlow, message: string) {
    setLastCompleted(flow);
    setExpanded(null);
    showFeedback(message);
    window.setTimeout(() => setLastCompleted((current) => (current === flow ? null : current)), 2400);
  }

  function resetManualFlow() {
    setEditing(null);
    setManualFormKey((current) => current + 1);
    setExpanded(null);
  }

  function resetReceiptFlow() {
    setReceiptImage(undefined);
    setReceiptText("");
    setAnalysis(null);
    setReceiptMessage("");
    setExpanded(null);
  }

  function uploadReceipt(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setReceiptImage(String(reader.result));
      setReceiptMessage("Receipt photo loaded. Analyze it when you are ready.");
      setAnalysis(null);
    };
    reader.readAsDataURL(file);
  }

  async function analyzeReceipt() {
    setAnalyzing(true);
    setReceiptMessage("");
    try {
      const response = await fetch("/api/ai/analyze-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiptText,
          userCategories: state.categories,
          merchantRules: state.merchantCategoryRules
        })
      });
      const data = (await response.json()) as ReceiptAnalysisResponse | { message?: string };
      if (!response.ok || "message" in data) {
        setReceiptMessage(("message" in data ? data.message : undefined) ?? "Receipt analysis could not run.");
        return;
      }
      const analysisData = data as ReceiptAnalysisResponse;
      setAnalysis(toReceiptAnalysisDraft(analysisData));
      setReceiptMessage(analysisData.aiUsed ? "AI receipt suggestions are ready for review." : "Receipt suggestions are ready for review.");
    } finally {
      setAnalyzing(false);
    }
  }

  function patchAllocation(id: string, patch: Partial<ReceiptAllocationDraft>) {
    setAnalysis((current) =>
      current
        ? {
            ...current,
            allocations: current.allocations.map((allocation) => (allocation.id === id ? { ...allocation, ...patch } : allocation))
          }
        : current
    );
  }

  function addAllocation() {
    setAnalysis((current) =>
      current
        ? {
            ...current,
            allocations: [
              ...current.allocations,
              {
                id: `allocation-${Date.now()}`,
                categoryId: state.categories[0]?.id ?? "",
                amount: "",
                confidence: 0.5,
                reason: "Manual split added for review."
              }
            ]
          }
        : current
    );
  }

  function removeAllocation(id: string) {
    setAnalysis((current) => (current ? { ...current, allocations: current.allocations.filter((allocation) => allocation.id !== id) } : current));
  }

  function confirmReceipt() {
    if (!analysis?.allocations.length) return;
    analysis.allocations
      .filter((allocation) => allocation.categoryId && parseDecimal(allocation.amount) > 0)
      .forEach((allocation) => {
        const category = state.categories.find((item) => item.id === allocation.categoryId);
        state.addPurchase({
          amount: parseDecimal(allocation.amount),
          categoryId: allocation.categoryId,
          merchant: analysis.merchant,
          date: analysis.date,
          notes: [
            `Receipt import${category ? ` - ${category.name}` : ""}.`,
            `Suggestion confidence: ${Math.round(allocation.confidence * 100)}%.`,
            allocation.reason,
            `Line items: ${analysis.lineItems.map((item) => `${item.name} ${formatMoney(item.amount)}`).join(", ")}`
          ].join(" "),
          source: "receipt"
        });
      });
    setReceiptImage(undefined);
    setReceiptText("");
    setAnalysis(null);
    setReceiptMessage("");
    completeFlow("receipt", "Receipt saved.");
  }

  return (
    <>
      <PageHeader kicker="Add purchase" title="Log spending in seconds" body="Manual entry is always available. Receipt suggestions can be reviewed and edited before saving." />
      <SettingsFeedback message={feedback} />

      <div className="grid gap-4 sm:gap-5">
        <div className="grid gap-3">
          <AddActionCard
            id="manual"
            title={editing ? `Editing ${editing.merchant}` : "Manual Purchase"}
            description="Quickly log a purchase manually."
            icon={ReceiptText}
            expanded={expanded === "manual"}
            successLabel={lastCompleted === "manual" ? "Purchase added" : undefined}
            sectionRef={manualSectionRef}
            onToggle={() => (expanded === "manual" ? setExpanded(null) : openFlow("manual"))}
          >
            {editing ? <Pill className="w-fit border-amber-100 bg-amber-50 text-amber-800">Editing purchase</Pill> : null}
            <PurchaseForm
              key={editing?.id ?? `new-purchase-${manualFormKey}`}
              categories={state.categories}
              initial={editing ?? undefined}
              recurringItem={editing?.recurringId ? state.recurringItems.find((item) => item.id === editing.recurringId) : undefined}
              firstInputRef={amountInputRef}
              showReceiptUpload={false}
              submitLabel={editing ? "Save changes" : "Save purchase"}
              onSubmit={(input) => {
                if (editing) state.updatePurchase(editing.id, input);
                else state.addPurchase(input);
                completeFlow("manual", input.recurring?.enabled ? "Purchase and recurring rule saved." : editing ? "Purchase saved." : "Purchase added.");
                setEditing(null);
              }}
            />
            <Button type="button" variant="secondary" className="w-full" onClick={resetManualFlow}>
              <X size={17} /> {editing ? "Cancel edit" : "Cancel"}
            </Button>
          </AddActionCard>

          <AddActionCard
            id="receipt"
            title="Scan Receipt"
            description="Analyze a receipt and review suggestions before saving."
            icon={ScanLine}
            expanded={expanded === "receipt"}
            successLabel={lastCompleted === "receipt" ? "Receipt saved" : undefined}
            sectionRef={receiptSectionRef}
            onToggle={() => (expanded === "receipt" ? setExpanded(null) : openFlow("receipt"))}
          >
            <div className="grid gap-3 lg:grid-cols-[0.82fr_1.18fr]">
              <div className="grid gap-3">
                <label className="grid min-h-28 cursor-pointer place-items-center rounded-xl border border-dashed border-slate-300 bg-white p-4 text-center text-sm font-bold text-slate-500 transition hover:border-[#58c6a8] hover:text-[#183f36] sm:rounded-2xl">
                  <span>
                    <Upload size={22} className="mx-auto mb-2" />
                    Upload or take receipt photo
                  </span>
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={uploadReceipt} />
                </label>
                {receiptImage ? <img src={receiptImage} alt="Receipt preview" className="max-h-56 w-full rounded-xl object-cover sm:rounded-2xl" /> : null}
                <Field label="Optional OCR text">
                  <Textarea ref={receiptTextRef} value={receiptText} onChange={(event) => setReceiptText(event.target.value)} placeholder="Paste receipt text if available. Card digits are redacted server-side." />
                </Field>
                <Button type="button" onClick={analyzeReceipt} disabled={analyzing || (!receiptImage && !receiptText.trim())}>
                  <FileText size={17} /> {analyzing ? "Analyzing..." : "Analyze receipt"}
                </Button>
                <p className="text-xs font-bold leading-5 text-slate-500">
                  Receipt images stay in this review screen unless you confirm. Obvious card or account digits are redacted before analysis.
                </p>
              </div>

              <ReceiptReviewCard
                analysis={analysis}
                categories={state.categories}
                allocationTotal={allocationTotal}
                message={receiptMessage}
                onAnalysisChange={setAnalysis}
                onPatchAllocation={patchAllocation}
                onAddAllocation={addAllocation}
                onRemoveAllocation={removeAllocation}
                onConfirm={confirmReceipt}
              />
            </div>
            <Button type="button" variant="secondary" className="w-full" onClick={resetReceiptFlow}>
              <X size={17} /> Cancel
            </Button>
          </AddActionCard>

          <AddActionCard
            id="recurring"
            title="Recurring Purchase"
            description="Track repeating bills and subscriptions."
            icon={Repeat2}
            expanded={expanded === "recurring"}
            successLabel={lastCompleted === "recurring" ? "Recurring purchase created" : undefined}
            sectionRef={recurringSectionRef}
            onToggle={() => (expanded === "recurring" ? setExpanded(null) : openFlow("recurring"))}
          >
            <RecurringManagementCard
              categories={state.categories}
              purchases={state.purchases}
              recurringItems={state.recurringItems}
              firstInputRef={recurringNameRef}
              onCancel={() => setExpanded(null)}
              onAddRecurring={(input) => {
                state.addRecurringItem(input);
                completeFlow("recurring", "Recurring purchase created.");
              }}
              onUpdateRecurring={(id, input) => {
                state.updateRecurringItem(id, input);
                showFeedback("Recurring item updated.");
              }}
              onDeleteRecurring={(id) => {
                state.deleteRecurringItem(id);
                showFeedback("Recurring item deleted.");
              }}
            />
          </AddActionCard>
        </div>

        <Card>
          <h2 className="mb-3 text-lg font-black sm:mb-4 sm:text-xl">Purchase history</h2>
          {state.purchases.length ? (
            <div className="grid gap-2.5 sm:gap-3">
              {state.purchases.map((purchase) => {
                const category = state.categories.find((item) => item.id === purchase.categoryId);
                return (
                  <div key={purchase.id} className="rounded-xl bg-[#f7faf7] p-3 sm:rounded-3xl sm:p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-black sm:text-lg">{purchase.merchant}</h3>
                          {category ? <Pill className="border-slate-200 bg-white text-slate-600">{category.name}</Pill> : null}
                          {purchase.source === "receipt" ? <Pill className="border-emerald-100 bg-emerald-50 text-emerald-700">receipt</Pill> : null}
                        </div>
                        <p className="mt-1 text-xs font-bold text-slate-500 sm:text-sm">{formatShortDate(purchase.date)}</p>
                      </div>
                      <p className="text-lg font-black sm:text-xl">{formatMoney(purchase.amount)}</p>
                    </div>
                    <div className="mt-2.5 flex justify-end gap-2 sm:mt-3">
                      <Button variant="secondary" size="sm" onClick={() => editPurchase(purchase)}>
                        <Edit3 size={16} /> Edit
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => setDeleting(purchase)}>
                        <Trash2 size={16} /> Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={ReceiptText}
              title="Purchase history starts here"
              body="Start with a quick manual entry, or scan a receipt when you want SpendFence to suggest the split."
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
          if (deleting) state.deletePurchase(deleting.id);
          setDeleting(null);
          showFeedback("Purchase deleted.");
        }}
      />
    </>
  );
}

type RecurringFormState = {
  name: string;
  amount: string;
  kind: RecurringKind;
  frequency: RecurringFrequency;
  nextDate: string;
  categoryId: string;
  notes: string;
};

function AddActionCard({
  title,
  description,
  icon: Icon,
  expanded,
  successLabel,
  titleAdornment,
  sectionRef,
  onToggle,
  children
}: {
  id: AddFlow;
  title: string;
  description: string;
  icon: LucideIcon;
  expanded: boolean;
  successLabel?: string;
  titleAdornment?: ReactNode;
  sectionRef: Ref<HTMLDivElement>;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div ref={sectionRef} className="scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_14px_36px_rgba(16,32,28,0.07)]">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        className="grid cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-3 p-3.5 text-left transition hover:bg-[#f7faf7] sm:p-4"
        onClick={onToggle}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onToggle();
          }
        }}
      >
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e9f3ee] text-[#183f36]">
          <Icon size={20} />
        </div>
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2 className="truncate text-base font-black text-[#10201c] sm:text-lg">{title}</h2>
            {titleAdornment}
            {successLabel ? (
              <Pill className="border-emerald-100 bg-emerald-50 text-emerald-700">
                <CheckCircle2 size={13} /> {successLabel}
              </Pill>
            ) : null}
          </div>
          <p className="mt-0.5 truncate text-sm font-semibold text-slate-600">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={expanded ? "secondary" : "primary"}
            onClick={(event) => {
              event.stopPropagation();
              onToggle();
            }}
          >
            {expanded ? <X size={15} /> : <Plus size={15} />}
            {expanded ? "Close" : "Add"}
          </Button>
          <ChevronRight size={18} className={`hidden text-slate-400 transition-transform sm:block ${expanded ? "rotate-90" : ""}`} />
        </div>
      </div>

      <motion.div
        initial={false}
        animate={{ height: expanded ? "auto" : 0, opacity: expanded ? 1 : 0 }}
        transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden"
        style={{ visibility: expanded ? "visible" : "hidden" }}
        aria-hidden={!expanded}
      >
        <div className="grid gap-3 border-t border-slate-100 bg-[#fbfdfb] p-3.5 sm:p-4">{children}</div>
      </motion.div>
    </div>
  );
}

function RecurringManagementCard({
  categories,
  purchases,
  recurringItems,
  firstInputRef,
  onCancel,
  onAddRecurring,
  onUpdateRecurring,
  onDeleteRecurring
}: {
  categories: Category[];
  purchases: Purchase[];
  recurringItems: RecurringItem[];
  firstInputRef?: Ref<HTMLInputElement>;
  onCancel?: () => void;
  onAddRecurring: (input: RecurringItemInput) => void;
  onUpdateRecurring: (id: string, input: RecurringItemInput) => void;
  onDeleteRecurring: (id: string) => void;
}) {
  const [form, setForm] = useState<RecurringFormState>({
    name: "",
    amount: "",
    kind: "subscription",
    frequency: "monthly",
    nextDate: toDateInput(new Date().toISOString()),
    categoryId: categories[0]?.id ?? "",
    notes: ""
  });
  const totals = recurringMonthlyTotals(recurringItems);
  const candidates = detectRecurringCandidates(purchases, recurringItems);

  function resetForm() {
    setForm({
      name: "",
      amount: "",
      kind: "subscription",
      frequency: "monthly",
      nextDate: toDateInput(new Date().toISOString()),
      categoryId: categories[0]?.id ?? "",
      notes: ""
    });
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    onAddRecurring(toRecurringInput(form, categories));
    resetForm();
  }

  function addCandidate(candidate: ReturnType<typeof detectRecurringCandidates>[number]) {
    onAddRecurring({
      name: candidate.merchant,
      amount: candidate.amount,
      kind: candidate.kind,
      frequency: candidate.frequency,
      nextDate: nextRecurringDate(candidate.lastDate, candidate.frequency),
      categoryId: candidate.categoryId,
      notes: `Detected from ${candidate.purchaseCount} matching purchases.`,
      detected: true
    });
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-2.5 sm:grid-cols-3">
        <div className="rounded-xl bg-[#f7faf7] p-3 sm:rounded-2xl">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Monthly charges</p>
          <p className="mt-1 text-xl font-black text-[#10201c]">{formatMoney(totals.charges)}</p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-3 sm:rounded-2xl">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700/70">Monthly income</p>
          <p className="mt-1 text-xl font-black text-emerald-800">{formatMoney(totals.income)}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 sm:rounded-2xl">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Net impact</p>
          <p className={`mt-1 text-xl font-black ${totals.net >= 0 ? "text-emerald-800" : "text-rose-700"}`}>{formatMoney(totals.net)}</p>
        </div>
      </div>

      <form className="grid gap-3 rounded-xl bg-[#f7faf7] p-3 sm:rounded-3xl sm:p-4" onSubmit={submit}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Name">
            <Input ref={firstInputRef} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Netflix, rent, paycheck" required />
          </Field>
          <Field label="Amount">
            <Input inputMode="decimal" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="0.00" required />
          </Field>
          <Field label="Type">
            <Select
              value={form.kind}
              onChange={(event) => {
                const kind = event.target.value as RecurringKind;
                setForm({ ...form, kind, categoryId: kind === "income" ? "" : form.categoryId || (categories[0]?.id ?? "") });
              }}
            >
              <option value="subscription">Subscription</option>
              <option value="bill">Recurring bill</option>
              <option value="income">Paycheck income</option>
            </Select>
          </Field>
          <Field label="Frequency">
            <Select value={form.frequency} onChange={(event) => setForm({ ...form, frequency: event.target.value as RecurringFrequency })}>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Biweekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </Select>
          </Field>
          <Field label="Next date">
            <Input type="date" value={form.nextDate} onChange={(event) => setForm({ ...form, nextDate: event.target.value })} required />
          </Field>
          <Field label="Category">
            <Select value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })} disabled={form.kind === "income" || !categories.length}>
              {form.kind === "income" ? <option value="">Income</option> : null}
              {!categories.length && form.kind !== "income" ? <option value="">Add a category first</option> : null}
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notes">
              <Input value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Optional detail" />
            </Field>
          </div>
        </div>
        <Button type="submit" disabled={form.kind !== "income" && !categories.length}>
          <Plus size={17} /> Add recurring item
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            resetForm();
            onCancel?.();
          }}
        >
          <X size={17} /> Cancel
        </Button>
      </form>

      {candidates.length ? (
        <div className="mt-4">
          <h3 className="mb-2 text-sm font-black text-[#10201c]">Detected recurring purchases</h3>
          <div className="grid gap-2">
            {candidates.map((candidate) => (
              <div key={`${candidate.merchant}-${candidate.categoryId}`} className="flex flex-col gap-2 rounded-xl bg-white p-3 sm:flex-row sm:items-center sm:justify-between sm:rounded-2xl">
                <div>
                  <p className="font-black text-[#10201c]">{candidate.merchant}</p>
                  <p className="text-xs font-bold text-slate-500">
                    {recurringKindLabel(candidate.kind)} - {recurringFrequencyLabel(candidate.frequency)} - about {formatMoney(monthlyRecurringAmount(candidate))}/mo
                  </p>
                </div>
                <Button type="button" size="sm" variant="secondary" onClick={() => addCandidate(candidate)}>
                  <Plus size={15} /> Add
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid gap-2.5 sm:gap-3">
        {recurringItems.length ? (
          recurringItems.map((item) => {
            const category = categories.find((categoryItem) => categoryItem.id === item.categoryId);
            return (
              <div key={item.id} className="rounded-xl bg-white p-3 sm:rounded-2xl">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-[#10201c]">{item.name}</h3>
                      <Pill className={item.active ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"}>
                        {item.active ? "active" : "paused"}
                      </Pill>
                      {item.detected ? <Pill className="border-amber-100 bg-amber-50 text-amber-800">detected</Pill> : null}
                    </div>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      {recurringKindLabel(item.kind)} - {recurringFrequencyLabel(item.frequency)} - {category?.name ?? "No category"}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-slate-500">
                      <CalendarClock size={14} /> Next: {formatShortDate(item.nextDate)}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-lg font-black text-[#10201c]">{formatMoney(item.amount)}</p>
                    <p className="text-xs font-bold text-slate-500">{formatMoney(monthlyRecurringAmount(item))}/mo projected</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => onUpdateRecurring(item.id, { ...item, active: !item.active })}
                  >
                    {item.active ? "Pause" : "Resume"}
                  </Button>
                  <Button type="button" size="sm" variant="danger" onClick={() => onDeleteRecurring(item.id)}>
                    <Trash2 size={15} /> Delete
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          <EmptyState compact icon={Repeat2} title="Recurring items will collect here" body="Use the toggle on a purchase, add one manually, or accept a detected recurring pattern." />
        )}
      </div>
    </div>
  );
}

function toRecurringInput(form: RecurringFormState, categories: Category[]): RecurringItemInput {
  const categoryId = form.kind === "income" ? undefined : form.categoryId || categories[0]?.id;
  return {
    name: form.name,
    amount: parseDecimal(form.amount),
    kind: form.kind,
    frequency: form.frequency,
    nextDate: fromDateInput(form.nextDate),
    categoryId,
    notes: form.notes
  };
}

function ReceiptReviewCard({
  analysis,
  categories,
  allocationTotal,
  message,
  onAnalysisChange,
  onPatchAllocation,
  onAddAllocation,
  onRemoveAllocation,
  onConfirm
}: {
  analysis: ReceiptAnalysis | null;
  categories: Category[];
  allocationTotal: number;
  message: string;
  onAnalysisChange: (analysis: ReceiptAnalysis | null) => void;
  onPatchAllocation: (id: string, patch: Partial<ReceiptAllocationDraft>) => void;
  onAddAllocation: () => void;
  onRemoveAllocation: (id: string) => void;
  onConfirm: () => void;
}) {
  if (!analysis) {
    return (
      <EmptyState
        compact
        icon={ScanLine}
        title={message ? "Receipt ready when you are" : "Ready for a receipt when you are"}
        body={message || "Upload a photo or paste receipt text to get editable merchant, total, line item, and category suggestions."}
      />
    );
  }

  const analysisTotal = parseDecimal(analysis.total);
  const totalMatches = Math.abs(allocationTotal - analysisTotal) < 0.02;

  return (
    <div className="rounded-xl bg-[#f7faf7] p-3 sm:rounded-3xl sm:p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-black sm:text-lg">Review receipt</h3>
        <Pill className="border-slate-200 bg-white text-slate-600">{Math.round(analysis.confidence * 100)}% confidence</Pill>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Merchant">
          <Input value={analysis.merchant} onChange={(event) => onAnalysisChange({ ...analysis, merchant: event.target.value })} />
        </Field>
        <Field label="Date">
          <Input type="date" value={toDateInput(analysis.date)} onChange={(event) => onAnalysisChange({ ...analysis, date: fromDateInput(event.target.value) })} />
        </Field>
        <Field label="Total">
          <Input inputMode="decimal" value={analysis.total} onChange={(event) => onAnalysisChange({ ...analysis, total: event.target.value })} />
        </Field>
      </div>

      <div className="mt-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-sm font-black text-slate-600">Suggested category allocation</p>
          <Pill className={totalMatches ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-amber-100 bg-amber-50 text-amber-800"}>
            {formatMoney(allocationTotal)} / {formatMoney(analysisTotal)}
          </Pill>
        </div>
        <div className="grid gap-2">
          {analysis.allocations.map((allocation) => (
            <div key={allocation.id} className="grid gap-2 rounded-xl bg-white p-2.5 sm:grid-cols-[1fr_0.55fr_auto] sm:items-end sm:rounded-2xl sm:p-3">
              <Field label="Category">
                <Select value={allocation.categoryId} onChange={(event) => onPatchAllocation(allocation.id, { categoryId: event.target.value })}>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Amount">
                <Input inputMode="decimal" value={allocation.amount} onChange={(event) => onPatchAllocation(allocation.id, { amount: event.target.value })} />
              </Field>
              <Button type="button" variant="ghost" size="sm" onClick={() => onRemoveAllocation(allocation.id)}>
                Remove
              </Button>
              <p className="text-xs font-semibold leading-5 text-slate-500 sm:col-span-3">{allocation.reason}</p>
            </div>
          ))}
        </div>
        <Button type="button" variant="secondary" size="sm" className="mt-2" onClick={onAddAllocation}>
          <Plus size={15} /> Add split
        </Button>
      </div>

      <div className="mt-3 rounded-xl bg-white p-3 sm:rounded-2xl">
        <p className="mb-2 text-sm font-black text-slate-600">Line items</p>
        <div className="grid gap-2">
          {analysis.lineItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 text-sm font-bold">
              <span>{item.name}</span>
              <span>{formatMoney(item.amount)}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-3 text-sm font-semibold leading-5 text-slate-600">{analysis.reason}</p>
      {message ? <p className="mt-2 text-sm font-bold text-[#327d6d]">{message}</p> : null}
      <Button type="button" size="lg" className="mt-3 w-full" onClick={onConfirm} disabled={!analysis.allocations.length || !totalMatches}>
        <CheckCircle2 size={18} /> Confirm and save
      </Button>
    </div>
  );
}

function toReceiptAnalysisDraft(analysis: ReceiptAnalysisResponse): ReceiptAnalysis {
  return {
    ...analysis,
    total: String(analysis.total),
    allocations: analysis.allocations.map((allocation) => ({ ...allocation, amount: String(allocation.amount) }))
  };
}

function parseDecimal(value: string) {
  const parsed = Number(value.replace(/[$,%\s,]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}
