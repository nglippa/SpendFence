"use client";

import { ChangeEvent, useState } from "react";
import { CheckCircle2, ScanLine, Upload } from "lucide-react";
import { Button, Card, Field, Input, PageHeader, Select } from "@/components/ui";
import { formatMoney } from "@/lib/budget";
import { useSpendFence } from "@/lib/store";
import type { Receipt } from "@/lib/types";
import { fromDateInput, toDateInput } from "@/lib/utils";

export default function ReceiptScannerPage() {
  const state = useSpendFence();
  const [draft, setDraft] = useState<Receipt | null>(state.receipts.find((receipt) => receipt.status === "draft") ?? null);

  function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const receipt = state.createReceiptDraft({
        image: String(reader.result),
        merchant: "Fresh Basket Market",
        total: 83.42,
        categoryId: state.categories.find((category) => category.name === "Groceries")?.id ?? state.categories[0]?.id ?? "",
        date: new Date().toISOString(),
        lineItems: [
          { id: "line-1", name: "Produce", amount: 24.18 },
          { id: "line-2", name: "Pantry", amount: 31.05 },
          { id: "line-3", name: "Household", amount: 28.19 }
        ]
      });
      setDraft(receipt);
    };
    reader.readAsDataURL(file);
  }

  function patchDraft(next: Receipt) {
    setDraft(next);
    state.updateReceiptDraft(next.id, {
      image: next.image,
      merchant: next.merchant,
      total: next.total,
      categoryId: next.categoryId,
      date: next.date,
      lineItems: next.lineItems
    });
  }

  return (
    <>
      <PageHeader kicker="Receipt scanner" title="Upload now, OCR later" body="For MVP, SpendFence mocks extracted receipt data and lets you confirm or edit before saving." />
      <div className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
        <Card>
          <div className="grid min-h-64 place-items-center rounded-[1.25rem] border border-dashed border-slate-300 bg-white p-6 text-center">
            <div>
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#e9f3ee] text-[#183f36]">
                <ScanLine size={25} />
              </div>
              <h2 className="mt-4 text-xl font-black">Scan or upload a receipt</h2>
              <p className="mt-2 text-sm font-semibold text-slate-500">Real OCR is intentionally not included yet.</p>
              <label className="mt-5 inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#183f36] px-5 font-black text-white shadow-float">
                <Upload size={18} /> Upload receipt
                <input type="file" accept="image/*" className="hidden" onChange={upload} />
              </label>
            </div>
          </div>
          {draft?.image ? <img src={draft.image} alt="Uploaded receipt" className="mt-4 max-h-72 w-full rounded-3xl object-cover" /> : null}
        </Card>

        <Card>
          <h2 className="mb-4 text-xl font-black">Extracted draft</h2>
          {!draft ? (
            <div className="rounded-3xl bg-[#f7faf7] p-5 text-sm font-bold text-slate-500">Upload a receipt to generate mocked merchant, total, and line items.</div>
          ) : (
            <div className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Merchant">
                  <Input value={draft.merchant} onChange={(event) => patchDraft({ ...draft, merchant: event.target.value })} />
                </Field>
                <Field label="Total">
                  <Input inputMode="decimal" value={draft.total} onChange={(event) => patchDraft({ ...draft, total: Number(event.target.value) })} />
                </Field>
                <Field label="Category">
                  <Select value={draft.categoryId} onChange={(event) => patchDraft({ ...draft, categoryId: event.target.value })}>
                    {state.categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Date">
                  <Input type="date" value={toDateInput(draft.date)} onChange={(event) => patchDraft({ ...draft, date: fromDateInput(event.target.value) })} />
                </Field>
              </div>
              <div className="rounded-3xl bg-[#f7faf7] p-4">
                <p className="mb-3 text-sm font-black text-slate-600">Line items</p>
                <div className="grid gap-2">
                  {draft.lineItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-2xl bg-white p-3 text-sm font-bold">
                      <span>{item.name}</span>
                      <span>{formatMoney(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Button
                size="lg"
                onClick={() => {
                  state.confirmReceipt(draft.id);
                  setDraft(null);
                }}
              >
                <CheckCircle2 size={18} /> Confirm and save purchase
              </Button>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
