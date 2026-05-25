"use client";

import Link from "next/link";
import { ListChecks, Plus, WalletCards } from "lucide-react";
import { SettingsDetailHeader, SettingsGroup, SettingsRow } from "@/components/settings-ui";
import { Button } from "@/components/ui";
import { formatMoney } from "@/lib/budget";
import { useSpendFence } from "@/lib/store";

export default function CategorySettingsPage() {
  const state = useSpendFence();
  const totalLimits = state.categories.reduce((sum, category) => sum + category.limit, 0);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <SettingsDetailHeader title="Categories" subtitle="Manage the budget fences that power dashboard cards and reports." />
      <div className="grid gap-4">
        <SettingsGroup title="Overview">
          <SettingsRow icon={WalletCards} title={`${state.categories.length} categories`} subtitle={`${formatMoney(totalLimits)} total planned category limits`} />
          <SettingsRow icon={ListChecks} title={`${state.purchases.length} purchases assigned`} subtitle="Category totals recalculate from purchases automatically." />
        </SettingsGroup>
        <SettingsGroup title="Manage">
          <div className="grid gap-2 p-3 sm:grid-cols-2">
            <Button asChild>
              <Link href="/categories">
                <WalletCards size={18} /> Manage categories
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/categories">
                <Plus size={18} /> Add category
              </Link>
            </Button>
          </div>
        </SettingsGroup>
      </div>
    </div>
  );
}
