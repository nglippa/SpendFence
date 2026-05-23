"use client";

import { FormEvent, useRef, useState } from "react";
import { Edit3, Plus, Trash2, WalletCards } from "lucide-react";
import { CategoryCard } from "@/components/category-card";
import { CategoryIcon, categoryIconOptions } from "@/components/category-icons";
import { Button, Card, EmptyState, Field, Input, PageHeader, ProgressBar } from "@/components/ui";
import { ConfirmSheet, SettingsFeedback } from "@/components/settings-ui";
import { useSpendFence } from "@/lib/store";
import type { Category, CategoryInput } from "@/lib/types";

type CategoryFormState = Omit<CategoryInput, "limit" | "warningThreshold" | "hardStopThreshold"> & {
  limit: string;
  warningThreshold: string;
  hardStopThreshold: string;
};

export default function CategoriesPage() {
  const state = useSpendFence();
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [feedback, setFeedback] = useState("");
  const formRef = useRef<HTMLElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<CategoryFormState>({
    name: "",
    limit: "300",
    warningThreshold: "80",
    hardStopThreshold: "100",
    color: "#58c6a8",
    icon: "tag"
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    const input = toCategoryInput(form);
    if (editing) state.updateCategory(editing.id, input);
    else state.addCategory(input);
    showFeedback(editing ? "Category saved." : "Category added.");
    setEditing(null);
    setForm({ name: "", limit: "300", warningThreshold: "80", hardStopThreshold: "100", color: "#58c6a8", icon: "tag" });
  }

  function showFeedback(message: string) {
    setFeedback(message);
    window.setTimeout(() => setFeedback(""), 1800);
  }

  function edit(category: Category) {
    setEditing(category);
    setForm({
      name: category.name,
      limit: String(category.limit),
      warningThreshold: String(category.warningThreshold),
      hardStopThreshold: String(category.hardStopThreshold),
      color: category.color,
      icon: category.icon
    });
    window.setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      nameInputRef.current?.focus();
    }, 0);
  }

  return (
    <>
      <PageHeader kicker="Categories" title="Build your monthly fences" body="Create custom categories, set spending limits, and choose warning thresholds." />
      <SettingsFeedback message={feedback} />
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-[0.82fr_1.18fr]">
        <Card>
          <section ref={formRef} className="scroll-mt-24">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 sm:mb-4">
              <h2 className="text-lg font-black sm:text-xl">{editing ? `Editing ${editing.name}` : "New category"}</h2>
              {editing ? <span className="rounded-full border border-amber-100 bg-amber-50 px-2 py-0.5 text-[0.68rem] font-black leading-5 text-amber-800 sm:px-2.5 sm:py-1 sm:text-xs">Editing...</span> : null}
            </div>
          <form className="grid gap-4" onSubmit={submit}>
            <Field label="Name">
              <Input ref={nameInputRef} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Groceries" required />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Monthly limit">
                <Input inputMode="decimal" value={form.limit} onChange={(event) => setForm({ ...form, limit: event.target.value })} />
              </Field>
              <Field label="Warning threshold %">
                <Input inputMode="decimal" value={form.warningThreshold} onChange={(event) => setForm({ ...form, warningThreshold: event.target.value })} />
              </Field>
              <Field label="Hard stop %">
                <Input inputMode="decimal" value={form.hardStopThreshold} onChange={(event) => setForm({ ...form, hardStopThreshold: event.target.value })} />
              </Field>
            </div>
            <div>
              <p className="mb-2 text-xs font-black text-slate-700 sm:text-sm">Icon</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {categoryIconOptions.map(({ key, label }) => {
                  const active = form.icon === key;
                  return (
                    <button
                      type="button"
                      key={key}
                      onClick={() => setForm({ ...form, icon: key })}
                      className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 text-left text-xs font-black transition sm:text-sm ${
                        active ? "border-[#58c6a8] bg-[#e9f3ee] text-[#183f36] shadow-soft" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-white" style={{ background: form.color }}>
                        <CategoryIcon icon={key} size={15} />
                      </span>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            <Field label="Color">
              <Input type="color" value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} className="h-12 p-2 sm:h-14" />
            </Field>
            <div className="rounded-xl bg-[#f7faf7] p-3 sm:rounded-2xl">
              <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">Live preview</p>
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl text-white shadow-soft" style={{ background: form.color }}>
                  <CategoryIcon icon={form.icon} size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-black text-[#10201c]">{form.name || "Category name"}</p>
                  <p className="text-xs font-bold text-slate-500">{formatPreviewLimit(form.limit)} monthly fence</p>
                </div>
              </div>
              <div className="mt-3">
                <ProgressBar percent={35} color={form.color} />
              </div>
            </div>
            <Button type="submit" size="lg">
              <Plus size={18} /> {editing ? "Save category" : "Add category"}
            </Button>
            {editing ? (
              <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                Cancel Edit
              </Button>
            ) : null}
          </form>
          </section>
        </Card>

        <section className="grid gap-4 content-start">
          {state.categories.length ? (
            state.categories.map((category) => (
              <div key={category.id} className="grid gap-2">
                <CategoryCard category={category} purchases={state.purchases} budgetMonth={state.budgetMonth} />
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" size="sm" onClick={() => edit(category)}>
                    <Edit3 size={16} /> Edit
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => setDeleting(category)}>
                    <Trash2 size={16} /> Delete
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <Card>
              <EmptyState
                icon={WalletCards}
                title="Start with a few calm guardrails"
                body="Create a few calm guardrails for the spending areas you care about. You can adjust limits anytime."
              />
            </Card>
          )}
        </section>
      </div>
      <ConfirmSheet
        open={Boolean(deleting)}
        danger
        title="Delete category?"
        body={`Delete ${deleting?.name ?? "this category"} and its assigned purchases? This cannot be undone.`}
        confirmLabel="Delete"
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) state.deleteCategory(deleting.id);
          setDeleting(null);
          showFeedback("Category deleted.");
        }}
      />
    </>
  );
}

function toCategoryInput(form: CategoryFormState): CategoryInput {
  return {
    ...form,
    limit: parseDecimal(form.limit),
    warningThreshold: parseDecimal(form.warningThreshold),
    hardStopThreshold: parseDecimal(form.hardStopThreshold)
  };
}

function parseDecimal(value: string) {
  const parsed = Number(value.replace(/[$,%\s,]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatPreviewLimit(value: string) {
  const parsed = parseDecimal(value);
  return parsed ? `$${parsed.toLocaleString()}` : "$0";
}
