"use client";

import { useState } from "react";
import { Edit3, Trash2 } from "lucide-react";
import { PurchaseForm } from "@/components/purchase-form";
import { Button, Card, PageHeader, Pill } from "@/components/ui";
import { formatMoney } from "@/lib/budget";
import { useSpendFence } from "@/lib/store";
import type { Purchase } from "@/lib/types";
import { formatShortDate } from "@/lib/utils";

export default function AddPurchasePage() {
  const state = useSpendFence();
  const [editing, setEditing] = useState<Purchase | null>(null);

  return (
    <>
      <PageHeader kicker="Add purchase" title="Log spending in seconds" body="Every purchase updates category totals and warning states immediately." />
      <div className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
        <Card>
          <h2 className="mb-4 text-xl font-black">{editing ? "Edit purchase" : "New purchase"}</h2>
          <PurchaseForm
            categories={state.categories}
            initial={editing ?? undefined}
            submitLabel={editing ? "Save changes" : "Save purchase"}
            onSubmit={(input) => {
              if (editing) state.updatePurchase(editing.id, input);
              else state.addPurchase(input);
              setEditing(null);
            }}
          />
        </Card>

        <Card>
          <h2 className="mb-4 text-xl font-black">Purchase history</h2>
          <div className="grid gap-3">
            {state.purchases.map((purchase) => {
              const category = state.categories.find((item) => item.id === purchase.categoryId);
              return (
                <div key={purchase.id} className="rounded-3xl bg-[#f7faf7] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-black">{purchase.merchant}</h3>
                        {category ? <Pill className="border-slate-200 bg-white text-slate-600">{category.name}</Pill> : null}
                        {purchase.source === "receipt" ? <Pill className="border-emerald-100 bg-emerald-50 text-emerald-700">receipt</Pill> : null}
                      </div>
                      <p className="mt-1 text-sm font-bold text-slate-500">{formatShortDate(purchase.date)}</p>
                    </div>
                    <p className="text-xl font-black">{formatMoney(purchase.amount)}</p>
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setEditing(purchase)}>
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
