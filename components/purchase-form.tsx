"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import type { Ref } from "react";
import { Repeat2, Save, Upload } from "lucide-react";
import { StableCollapsible } from "@/components/stable-layout";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import type { Category, Purchase, PurchaseInput, RecurringFrequency, RecurringItem } from "@/lib/types";
import { fromDateInput, toDateInput } from "@/lib/utils";

export function PurchaseForm({
  categories,
  initial,
  onSubmit,
  submitLabel = "Save purchase",
  firstInputRef,
  showReceiptUpload = true,
  recurringItem
}: {
  categories: Category[];
  initial?: Purchase;
  onSubmit: (input: PurchaseInput) => void;
  submitLabel?: string;
  firstInputRef?: Ref<HTMLInputElement>;
  showReceiptUpload?: boolean;
  recurringItem?: RecurringItem;
}) {
  const hasCategories = categories.length > 0;
  const [form, setForm] = useState<Omit<PurchaseInput, "amount"> & { amount: string }>({
    amount: initial?.amount === undefined ? "" : String(initial.amount),
    categoryId: initial?.categoryId ?? categories[0]?.id ?? "",
    merchant: initial?.merchant ?? "",
    date: initial?.date ?? new Date().toISOString(),
    notes: initial?.notes ?? "",
    receiptImage: initial?.receiptImage
  });
  const [recurring, setRecurring] = useState<{
    enabled: boolean;
    frequency: RecurringFrequency;
    kind: "subscription" | "bill";
  }>({
    enabled: Boolean(recurringItem?.active),
    frequency: recurringItem?.frequency ?? ("monthly" as RecurringFrequency),
    kind: recurringItem?.kind === "subscription" ? "subscription" : "bill"
  });

  useEffect(() => {
    if (!form.categoryId && categories[0]?.id) {
      setForm((current) => ({ ...current, categoryId: categories[0].id }));
    }
  }, [categories, form.categoryId]);

  function submit(event: FormEvent) {
    event.preventDefault();
    onSubmit({
      ...form,
      amount: parseDecimal(form.amount),
      recurring: {
        enabled: recurring.enabled,
        frequency: recurring.frequency,
        kind: recurring.kind
      }
    });
    if (!initial) {
      setForm({
        amount: "",
        categoryId: categories[0]?.id ?? "",
        merchant: "",
        date: new Date().toISOString(),
        notes: "",
        receiptImage: undefined
      });
      setRecurring({ enabled: false, frequency: "monthly", kind: "bill" });
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
          <Select value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })} disabled={!hasCategories}>
            {!hasCategories ? <option value="">Add a category first</option> : null}
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
      <div className="rounded-[1.35rem] bg-[color:rgb(238_244_241_/_0.58)] p-3.5 dark:bg-white/[0.04]">
        <label className="flex min-h-11 items-center gap-3 text-sm font-black text-[#10201c]">
          <input
            type="checkbox"
            checked={recurring.enabled}
            onChange={(event) => setRecurring({ ...recurring, enabled: event.target.checked })}
            className="h-5 w-5 accent-[#183f36]"
          />
          <span className="inline-flex items-center gap-2">
            <Repeat2 size={17} /> Recurring purchase
          </span>
        </label>
        <StableCollapsible open={recurring.enabled}>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Recurring type">
              <Select value={recurring.kind} onChange={(event) => setRecurring({ ...recurring, kind: event.target.value as "subscription" | "bill" })}>
                <option value="bill">Recurring bill</option>
                <option value="subscription">Subscription</option>
              </Select>
            </Field>
            <Field label="Frequency">
              <Select value={recurring.frequency} onChange={(event) => setRecurring({ ...recurring, frequency: event.target.value as RecurringFrequency })}>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Biweekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </Select>
            </Field>
          </div>
        </StableCollapsible>
      </div>
      {showReceiptUpload ? (
        <>
          <Field label="Receipt image">
            <Input type="file" accept="image/*" onChange={upload} />
          </Field>
          {form.receiptImage ? <img src={form.receiptImage} alt="Receipt preview" className="max-h-56 w-full rounded-2xl object-cover" /> : null}
        </>
      ) : null}
      <Button type="submit" size="lg" disabled={!hasCategories}>
        {showReceiptUpload && form.receiptImage ? <Upload size={18} /> : <Save size={18} />}
        {hasCategories ? submitLabel : "Add a category first"}
      </Button>
    </form>
  );
}

function parseDecimal(value: string) {
  const parsed = Number(value.replace(/[$,%\s,]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}
