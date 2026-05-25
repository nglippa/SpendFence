"use client";

import { FormEvent, useRef, useState } from "react";
import { Edit3, Plus, Trash2, WalletCards } from "lucide-react";
import { AdaptiveFenceSuggestions } from "@/components/adaptive-fence-suggestions";
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

function emptyForm(): CategoryFormState {
  return {
    name: "",
    limit: "300",
    warningThreshold: "80",
    hardStopThreshold: "100",
    color: "#18B889",
    icon: "tag"
  };
}

export default function CategoriesPage() {
  const state = useSpendFence();
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [feedback, setFeedback] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const formRef = useRef<HTMLElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<CategoryFormState>(() => emptyForm());
  const formVisible = formOpen || Boolean(editing);

  function submit(event: FormEvent) {
    event.preventDefault();
    const input = toCategoryInput(form);
    if (editing) state.updateCategory(editing.id, input);
    else state.addCategory(input);
    showFeedback(editing ? "Fence saved." : "Fence added.");
    closeForm();
  }

  function showFeedback(message: string) {
    setFeedback(message);
    window.setTimeout(() => setFeedback(""), 1800);
  }

  function edit(category: Category) {
    setEditing(category);
    setFormOpen(true);
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

  function openNewFence() {
    setEditing(null);
    setForm(emptyForm());
    setFormOpen(true);
    window.setTimeout(() => nameInputRef.current?.focus(), 0);
  }

  function closeForm() {
    setEditing(null);
    setForm(emptyForm());
    setFormOpen(false);
  }

  return (
    <>
      <PageHeader kicker="Categories" title="Build your monthly fences" body="Create custom categories, set spending limits, and choose warning thresholds." />
      <SettingsFeedback message={feedback} />
      <div className="mb-4 sm:mb-5">
        <AdaptiveFenceSuggestions onFeedback={showFeedback} />
      </div>
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-[0.82fr_1.18fr]">
        <Card>
          <section ref={formRef} className="scroll-mt-24">
            {!formVisible ? (
              <button
                type="button"
                onClick={openNewFence}
                aria-expanded={formVisible}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-dashed border-[var(--app-border)] bg-[var(--app-secondary)] p-3 text-left transition hover:border-[var(--brand-primary)] hover:bg-[rgb(46_211_183_/_0.08)] sm:p-4"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-gradient text-white dark:text-[#0B1114]">
                    <Plus size={18} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-base font-black text-[var(--app-text)]">Add a New Fence</span>
                    <span className="mt-0.5 block text-sm font-semibold leading-5 text-[var(--app-text-muted)]">Create a category, monthly limit, and warning thresholds.</span>
                  </span>
                </span>
                <span className="hidden rounded-full bg-[var(--app-card)] px-3 py-1 text-xs font-black text-[var(--brand-primary)] sm:inline-flex">Add</span>
              </button>
            ) : null}

            {formVisible ? (
              <div className="grid transition-opacity duration-300 ease-out">
                <div>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 sm:mb-4">
                    <h2 className="text-lg font-black text-[var(--app-text)] sm:text-xl">{editing ? `Editing Fence: ${editing.name}` : "New Fence"}</h2>
                    {editing ? <span className="rounded-full border border-amber-100 bg-amber-50 px-2 py-0.5 text-[0.68rem] font-black leading-5 text-amber-800 sm:px-2.5 sm:py-1 sm:text-xs">Editing Fence</span> : null}
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
                      <p className="mb-2 text-xs font-black text-[var(--app-text-secondary)] sm:text-sm">Icon</p>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {categoryIconOptions.map(({ key, label }) => {
                          const active = form.icon === key;
                          return (
                            <button
                              type="button"
                              key={key}
                              onClick={() => setForm({ ...form, icon: key })}
                              className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 text-left text-xs font-black transition sm:text-sm ${
                                active
                                  ? "border-[var(--brand-primary)] bg-[rgb(46_211_183_/_0.12)] text-[var(--app-text)] shadow-soft"
                                  : "border-[var(--app-border)] bg-[var(--app-card)] text-[var(--app-text-secondary)] hover:bg-[var(--app-secondary)]"
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
                    <div className="rounded-xl bg-[var(--app-secondary)] p-3 sm:rounded-2xl">
                      <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-[var(--app-text-muted)]">Live preview</p>
                      <div className="flex items-center gap-2">
                        <span className="grid h-9 w-9 place-items-center rounded-xl text-white shadow-soft" style={{ background: form.color }}>
                          <CategoryIcon icon={form.icon} size={18} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-black text-[var(--app-text)]">{form.name || "Category name"}</p>
                          <p className="text-xs font-bold text-[var(--app-text-muted)]">{formatPreviewLimit(form.limit)} monthly fence</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <ProgressBar percent={35} color={form.color} />
                      </div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Button type="submit" size="lg">
                        <Plus size={18} /> {editing ? "Save Fence" : "Add Fence"}
                      </Button>
                      <Button type="button" variant="secondary" size="lg" onClick={closeForm}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            ) : null}
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
                title="Start with a few simple fences"
                body="Create a few simple fences for the spending areas you care about. You can adjust limits anytime."
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
