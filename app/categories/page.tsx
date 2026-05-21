"use client";

import { FormEvent, useState } from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";
import { CategoryCard } from "@/components/category-card";
import { Button, Card, Field, Input, PageHeader, Select } from "@/components/ui";
import { useSpendFence } from "@/lib/store";
import type { Category, CategoryInput } from "@/lib/types";

const iconOptions = ["basket", "fuel", "utensils", "heart", "repeat", "sparkles", "receipt", "tag"];

export default function CategoriesPage() {
  const state = useSpendFence();
  const [editing, setEditing] = useState<Category | null>(null);
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
  }

  return (
    <>
      <PageHeader kicker="Categories" title="Build your monthly fences" body="Create custom categories, set spending limits, and choose warning thresholds." />
      <div className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
        <Card>
          <h2 className="mb-4 text-xl font-black">{editing ? "Edit category" : "New category"}</h2>
          <form className="grid gap-4" onSubmit={submit}>
            <Field label="Name">
              <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Groceries" required />
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
              <Input type="color" value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} className="h-14 p-2" />
            </Field>
            <Button type="submit" size="lg">
              <Plus size={18} /> {editing ? "Save category" : "Add category"}
            </Button>
            {editing ? (
              <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                Cancel edit
              </Button>
            ) : null}
          </form>
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
