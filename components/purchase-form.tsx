"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import type { Ref } from "react";
import { Save, Upload } from "lucide-react";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import type { Category, Purchase, PurchaseInput } from "@/lib/types";
import { fromDateInput, toDateInput } from "@/lib/utils";

export function PurchaseForm({
  categories,
  initial,
  onSubmit,
  submitLabel = "Save purchase",
  firstInputRef,
  showReceiptUpload = true
}: {
  categories: Category[];
  initial?: Purchase;
  onSubmit: (input: PurchaseInput) => void;
  submitLabel?: string;
  firstInputRef?: Ref<HTMLInputElement>;
  showReceiptUpload?: boolean;
}) {
  const [form, setForm] = useState<Omit<PurchaseInput, "amount"> & { amount: string }>({
    amount: initial?.amount === undefined ? "" : String(initial.amount),
    categoryId: initial?.categoryId ?? categories[0]?.id ?? "",
    merchant: initial?.merchant ?? "",
    date: initial?.date ?? new Date().toISOString(),
    notes: initial?.notes ?? "",
    receiptImage: initial?.receiptImage
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    onSubmit({ ...form, amount: parseDecimal(form.amount) });
    if (!initial) {
      setForm({
        amount: "",
        categoryId: categories[0]?.id ?? "",
        merchant: "",
        date: new Date().toISOString(),
        notes: "",
        receiptImage: undefined
      });
    }
  }

  function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((current) => ({ ...current, receiptImage: String(reader.result) }));
    reader.readAsDataURL(file);
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Amount">
          <Input ref={firstInputRef} inputMode="decimal" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="0.00" required />
        </Field>
        <Field label="Category">
          <Select value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Merchant">
          <Input value={form.merchant} onChange={(event) => setForm({ ...form, merchant: event.target.value })} placeholder="Local Market" required />
        </Field>
        <Field label="Date">
          <Input type="date" value={toDateInput(form.date)} onChange={(event) => setForm({ ...form, date: fromDateInput(event.target.value) })} required />
        </Field>
      </div>
      <Field label="Notes">
        <Textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Optional detail" />
      </Field>
      {showReceiptUpload ? (
        <>
          <Field label="Receipt image">
            <Input type="file" accept="image/*" onChange={upload} />
          </Field>
          {form.receiptImage ? <img src={form.receiptImage} alt="Receipt preview" className="max-h-56 w-full rounded-2xl object-cover" /> : null}
        </>
      ) : null}
      <Button type="submit" size="lg">
        {showReceiptUpload && form.receiptImage ? <Upload size={18} /> : <Save size={18} />}
        {submitLabel}
      </Button>
    </form>
  );
}

function parseDecimal(value: string) {
  const parsed = Number(value.replace(/[$,%\s,]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}
