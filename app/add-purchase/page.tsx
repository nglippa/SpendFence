"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";
import { CheckCircle2, Edit3, FileText, Plus, ScanLine, Trash2, Upload } from "lucide-react";
import { PurchaseForm } from "@/components/purchase-form";
import { Button, Card, Field, Input, PageHeader, Pill, Select, Textarea } from "@/components/ui";
import { formatMoney } from "@/lib/budget";
import { useSpendFence } from "@/lib/store";
import type { Category, ReceiptCategoryAllocation, ReceiptLineItem, Purchase } from "@/lib/types";
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

export default function AddPurchasePage() {
  const state = useSpendFence();
  const [editing, setEditing] = useState<Purchase | null>(null);
  const [receiptImage, setReceiptImage] = useState<string | undefined>();
  const [receiptText, setReceiptText] = useState("");
  const [analysis, setAnalysis] = useState<ReceiptAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [receiptMessage, setReceiptMessage] = useState("");
  const formRef = useRef<HTMLElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  const allocationTotal = useMemo(() => analysis?.allocations.reduce((sum, allocation) => sum + parseDecimal(allocation.amount), 0) ?? 0, [analysis]);

  function liftToForm() {
    window.setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      amountInputRef.current?.focus();
    }, 0);
  }

  function editPurchase(purchase: Purchase) {
    setEditing(purchase);
    liftToForm();
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
      setReceiptMessage(analysisData.aiUsed ? "AI receipt suggestions are ready for review." : "Mock receipt suggestions are ready for review.");
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
    setReceiptMessage("Receipt purchases saved.");
  }

  return (
    <>
      <PageHeader kicker="Add purchase" title="Log spending in seconds" body="Manual entry is always available. Receipt suggestions can be reviewed and edited before saving." />

      <div className="grid gap-4 sm:gap-5">
        <Card className="scroll-mt-24">
          <section ref={formRef} className="scroll-mt-24">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 sm:mb-4">
              <div>
                <h2 className="text-lg font-black sm:text-xl">{editing ? `Editing ${editing.merchant}` : "Manual Purchase Entry"}</h2>
                <p className="mt-1 text-sm font-semibold text-slate-600">Add a purchase without uploading a receipt.</p>
              </div>
              {editing ? <Pill className="border-amber-100 bg-amber-50 text-amber-800">Editing...</Pill> : null}
            </div>
            <PurchaseForm
              key={editing?.id ?? "new-purchase"}
              categories={state.categories}
              initial={editing ?? undefined}
              firstInputRef={amountInputRef}
              showReceiptUpload={false}
              submitLabel={editing ? "Save changes" : "Save purchase"}
              onSubmit={(input) => {
                if (editing) state.updatePurchase(editing.id, input);
                else state.addPurchase(input);
                setEditing(null);
              }}
            />
            {editing ? (
              <Button variant="secondary" className="mt-3 w-full" onClick={() => setEditing(null)}>
                Cancel Edit
              </Button>
            ) : null}
          </section>
        </Card>

        <Card>
          <div className="mb-3 flex items-start gap-3 sm:mb-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e9f3ee] text-[#183f36] sm:h-12 sm:w-12 sm:rounded-2xl">
              <ScanLine size={21} />
            </div>
            <div>
              <h2 className="text-lg font-black sm:text-xl">Scan Receipt</h2>
              <p className="mt-1 text-sm font-semibold leading-5 text-slate-600">
                Upload or take a receipt photo, analyze it, then confirm categories before anything is saved.
              </p>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[0.82fr_1.18fr]">
            <div className="grid gap-3">
              <label className="grid min-h-36 cursor-pointer place-items-center rounded-xl border border-dashed border-slate-300 bg-white p-4 text-center text-sm font-bold text-slate-500 transition hover:border-[#58c6a8] hover:text-[#183f36] sm:rounded-2xl">
                <span>
                  <Upload size={22} className="mx-auto mb-2" />
                  Upload or take receipt photo
                </span>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={uploadReceipt} />
              </label>
              {receiptImage ? <img src={receiptImage} alt="Receipt preview" className="max-h-56 w-full rounded-xl object-cover sm:rounded-2xl" /> : null}
              <Field label="Optional OCR text">
                <Textarea value={receiptText} onChange={(event) => setReceiptText(event.target.value)} placeholder="Paste receipt text if available. Card digits are redacted server-side." />
              </Field>
              <Button type="button" onClick={analyzeReceipt} disabled={analyzing || (!receiptImage && !receiptText.trim())}>
                <FileText size={17} /> {analyzing ? "Analyzing..." : "Analyze receipt"}
              </Button>
              <p className="text-xs font-bold leading-5 text-slate-500">
                Receipt images stay in this review screen unless you confirm. Obvious card or account digits are redacted before AI analysis.
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
        </Card>

        <Card>
          <h2 className="mb-3 text-lg font-black sm:mb-4 sm:text-xl">Purchase history</h2>
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
                    <Button variant="danger" size="sm" onClick={() => state.deletePurchase(purchase.id)}>
                      <Trash2 size={16} /> Delete
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </>
  );
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
      <div className="rounded-xl bg-[#f7faf7] p-3.5 text-sm font-bold leading-5 text-slate-500 sm:rounded-3xl sm:p-5">
        {message || "Receipt suggestions can be reviewed and edited before saving."}
      </div>
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
