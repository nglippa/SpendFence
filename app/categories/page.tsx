"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Edit3, MoreVertical, Plus, Trash2, WalletCards } from "lucide-react";
import { CategoryCard } from "@/components/category-card";
import { CategoryIcon, categoryIconOptions } from "@/components/category-icons";
import { StableCollapsible, scrollIntoViewIfNeeded, stableLayoutDelay, usePrefersReducedMotion } from "@/components/stable-layout";
import { Button, EmptyState, Field, Input, PageHeader, ProgressBar } from "@/components/ui";
import { ConfirmSheet, SettingsFeedback } from "@/components/settings-ui";
import { useAuth } from "@/lib/auth";
import { generateLocalFenceSuggestions } from "@/lib/ai/adaptive-fences";
import { useSpendFence } from "@/lib/store";
import type { AdaptiveFenceSuggestion, Category, CategoryInput } from "@/lib/types";

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
    color: "#5BA98C",
    icon: "tag"
  };
}

export default function CategoriesPage() {
  const state = useSpendFence();
  const auth = useAuth();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const formRef = useRef<HTMLElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<CategoryFormState>(() => emptyForm());
  const formVisible = formOpen || Boolean(editing);
  const localSuggestions = useMemo(
    () =>
      generateLocalFenceSuggestions({
        categories: state.categories,
        purchases: state.purchases,
        recurringItems: state.recurringItems,
        spendingRules: state.spendingRules,
        budgetMonth: state.budgetMonth,
        settings: state.adaptiveFenceSettings,
        learningEvents: state.fenceLearningEvents
      }),
    [state.adaptiveFenceSettings, state.budgetMonth, state.categories, state.fenceLearningEvents, state.purchases, state.recurringItems, state.spendingRules]
  );

  // Premium users get AI-refined fence guidance; the deterministic local
  // suggestions remain the instant baseline and the graceful fallback.
  const [aiSuggestions, setAiSuggestions] = useState<AdaptiveFenceSuggestion[]>([]);
  const authRef = useRef(auth);
  authRef.current = auth;
  const refineInput = useMemo(
    () => ({
      categories: state.categories,
      purchases: state.purchases,
      recurringItems: state.recurringItems,
      spendingRules: state.spendingRules,
      budgetMonth: state.budgetMonth,
      settings: state.adaptiveFenceSettings,
      learningEvents: state.fenceLearningEvents
    }),
    [state.adaptiveFenceSettings, state.budgetMonth, state.categories, state.fenceLearningEvents, state.purchases, state.recurringItems, state.spendingRules]
  );

  useEffect(() => {
    if (auth.effectiveTier !== "premium" || !localSuggestions.length) {
      setAiSuggestions([]);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      try {
        const authed = await authRef.current.authHeaders().catch(() => ({}));
        const response = await fetch("/api/ai/fence-suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authed },
          signal: controller.signal,
          body: JSON.stringify(refineInput)
        });
        if (!response.ok) return;
        const data = (await response.json()) as { suggestions?: AdaptiveFenceSuggestion[]; aiUsed?: boolean };
        if (!cancelled && data.aiUsed && Array.isArray(data.suggestions)) setAiSuggestions(data.suggestions);
      } catch {
        // Keep deterministic local suggestions on any failure.
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [auth.effectiveTier, localSuggestions.length, refineInput]);

  const suggestionsByCategory = useMemo(() => {
    const map = new Map(localSuggestions.map((suggestion) => [suggestion.categoryId, suggestion]));
    aiSuggestions.forEach((suggestion) => map.set(suggestion.categoryId, suggestion));
    return map;
  }, [aiSuggestions, localSuggestions]);

  function focusFenceForm() {
    window.setTimeout(() => {
      scrollIntoViewIfNeeded(formRef.current);
      nameInputRef.current?.focus({ preventScroll: true });
    }, stableLayoutDelay(prefersReducedMotion));
  }

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
    setOpenActionMenu(null);
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
    focusFenceForm();
  }

  function openNewFence() {
    setOpenActionMenu(null);
    setEditing(null);
    setForm(emptyForm());
    setFormOpen(true);
    focusFenceForm();
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
      <div className="flow-canvas">
        <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
        <section className="flow-zone px-0 py-0 sm:p-4">
          <section ref={formRef} className="scroll-mt-24">
            <StableCollapsible open={!formVisible}>
              <button
                type="button"
                onClick={openNewFence}
                aria-expanded={formVisible}
                className="native-row flex w-full items-center justify-between gap-3 px-1 py-3.5 text-left transition hover:bg-[rgb(95_164_142_/_0.075)] sm:px-2 sm:py-4"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand-gradient text-[#06110d] shadow-[0_10px_24px_rgb(0_0_0_/_0.18)] ">
                    <Plus size={18} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-base font-black text-[var(--app-text)]">Add a New Fence</span>
                    <span className="mt-0.5 block text-sm font-semibold leading-5 text-[var(--app-text-muted)]">Create a category, monthly limit, and warning thresholds.</span>
                  </span>
                </span>
                <span className="hidden rounded-full bg-[var(--app-card)] px-3 py-1 text-xs font-black text-[var(--brand-primary)] sm:inline-flex">Add</span>
              </button>
            </StableCollapsible>

            <StableCollapsible open={formVisible}>
              <div className="grid pt-3 transition-opacity duration-300 ease-out first:pt-0">
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
                              className={`flex min-h-11 items-center gap-2 rounded-2xl px-3 text-left text-xs font-black transition sm:text-sm ${
                                active
                                  ? "bg-[rgb(95_164_142_/_0.14)] text-[var(--app-text)] shadow-[inset_0_0_0_1px_rgb(95_164_142_/_0.24)]"
                                  : "bg-[color:rgb(255_255_255_/_0.050)] text-[var(--app-text-secondary)] hover:bg-[var(--app-secondary)]"
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
                    <div className="border-t border-[var(--glass-hairline)] pt-3.5 sm:rounded-[1rem] sm:border-0 sm:bg-[rgb(255_255_255_/_0.045)] sm:p-3.5">
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
            </StableCollapsible>
          </section>
        </section>

        <section className="flow-zone grid content-start gap-2.5 px-0 py-0 sm:p-4">
          <div className="px-1 pb-1">
            <h2 className="text-lg font-black text-[var(--app-text)] sm:text-xl">Fence list</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">Grouped budget rows with controls tucked into each fence.</p>
          </div>
          {state.categories.length ? (
            state.categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                purchases={state.purchases}
                budgetMonth={state.budgetMonth}
                guidance={suggestionsByCategory.get(category.id)}
                actions={
                  <CategoryActionMenu
                    categoryName={category.name}
                    open={openActionMenu === category.id}
                    onToggle={() => setOpenActionMenu((current) => (current === category.id ? null : category.id))}
                    onClose={() => setOpenActionMenu(null)}
                    onEdit={() => edit(category)}
                    onDelete={() => {
                      setOpenActionMenu(null);
                      setDeleting(category);
                    }}
                  />
                }
              />
            ))
          ) : (
            <EmptyState
              icon={WalletCards}
              title="Start with a few simple fences"
              body="Create a few simple fences for the spending areas you care about. You can adjust limits anytime."
            />
          )}
        </section>
        </div>
      </div>
      <ConfirmSheet
        open={Boolean(deleting)}
        danger
        title="Delete category?"
        body={`Delete ${deleting?.name ?? "this category"} and its assigned purchases? This cannot be undone.`}
        confirmLabel="Delete"
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            state.deleteCategory(deleting.id);
            if (editing?.id === deleting.id) closeForm();
          }
          setDeleting(null);
          showFeedback("Fence deleted.");
        }}
      />
    </>
  );
}

function CategoryActionMenu({
  categoryName,
  open,
  onToggle,
  onClose,
  onEdit,
  onDelete
}: {
  categoryName: string;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="relative"
      onBlur={(event) => {
        const nextFocus = event.relatedTarget;
        if (!(nextFocus instanceof Node) || !event.currentTarget.contains(nextFocus)) onClose();
      }}
    >
      <button
        type="button"
        aria-label={`Actions for ${categoryName}`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={onToggle}
        className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--app-border)] bg-[var(--app-card)] text-[var(--app-text-muted)] shadow-soft transition hover:text-[var(--brand-primary)] active:scale-[0.98]"
      >
        <MoreVertical size={17} />
      </button>
      {open ? (
        <div role="menu" className="absolute right-0 top-full z-30 mt-1.5 w-44 overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] p-1.5 shadow-float">
          <button
            type="button"
            role="menuitem"
            onClick={onEdit}
            className="flex min-h-10 w-full items-center gap-2 rounded-xl px-2.5 text-left text-sm font-black text-[var(--app-text)] transition hover:bg-[var(--app-secondary)]"
          >
            <Edit3 size={15} /> Edit fence
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={onDelete}
            className="flex min-h-10 w-full items-center gap-2 rounded-xl px-2.5 text-left text-sm font-black text-[var(--app-danger)] transition hover:bg-[rgb(255_107_107_/_0.1)]"
          >
            <Trash2 size={15} /> Delete fence
          </button>
        </div>
      ) : null}
    </div>
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
