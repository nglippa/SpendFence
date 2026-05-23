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
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-[0.82fr_1.18fr]">
        <Card>
          <h2 className="mb-3 text-lg font-black sm:mb-4 sm:text-xl">{editing ? "Edit purchase" : "New purchase"}</h2>
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
