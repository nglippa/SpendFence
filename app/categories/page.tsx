"use client";

import { FormEvent, useRef, useState } from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";
import { CategoryCard } from "@/components/category-card";
import { Button, Card, Field, Input, PageHeader, Select } from "@/components/ui";
import { useSpendFence } from "@/lib/store";
import type { Category, CategoryInput } from "@/lib/types";

const iconOptions = ["basket", "fuel", "utensils", "heart", "repeat", "sparkles", "receipt", "tag"];

export default function CategoriesPage() {
  const state = useSpendFence();
  const [editing, setEditing] = useState<Category | null>(null);
  const formRef = useRef<HTMLElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<CategoryInput>({
    name: "",
    limit: 300,
    warningThreshold: 80,
    hardStopThreshold: 100,
    color: "#58c6a8",
    icon: "tag"
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (editing) state.updateCategory(editing.id, form);
    else state.addCategory(form);
    setEditing(null);
    setForm({ name: "", limit: 300, warningThreshold: 80, hardStopThreshold: 100, color: "#58c6a8", icon: "tag" });
  }

  function edit(category: Category) {
    setEditing(category);
    setForm({
      name: category.name,
      limit: category.limit,
      warningThreshold: category.warningThreshold,
      hardStopThreshold: category.hardStopThreshold,
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
                <Input inputMode="decimal" value={form.limit} onChange={(event) => setForm({ ...form, limit: Number(event.target.value) })} />
              </Field>
              <Field label="Warning threshold %">
                <Input inputMode="numeric" value={form.warningThreshold} onChange={(event) => setForm({ ...form, warningThreshold: Number(event.target.value) })} />
              </Field>
              <Field label="Hard stop %">
                <Input inputMode="numeric" value={form.hardStopThreshold} onChange={(event) => setForm({ ...form, hardStopThreshold: Number(event.target.value) })} />
              </Field>
              <Field label="Icon label">
                <Select value={form.icon} onChange={(event) => setForm({ ...form, icon: event.target.value })}>
                  {iconOptions.map((icon) => (
                    <option key={icon}>{icon}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Color">
              <Input type="color" value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} className="h-12 p-2 sm:h-14" />
            </Field>
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
          {state.categories.map((category) => (
            <div key={category.id} className="grid gap-2">
              <CategoryCard category={category} purchases={state.purchases} />
              <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => edit(category)}>
                  <Edit3 size={16} /> Edit
                </Button>
                <Button variant="danger" size="sm" onClick={() => state.deleteCategory(category.id)}>
                  <Trash2 size={16} /> Delete
                </Button>
              </div>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
