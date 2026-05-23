"use client";

import type { LucideIcon } from "lucide-react";
import { Car, Coffee, HeartPulse, Home, ReceiptText, Repeat, ShoppingCart, Sparkles, Tag, Utensils } from "lucide-react";

export type CategoryIconKey = "basket" | "fuel" | "utensils" | "coffee" | "heart" | "repeat" | "sparkles" | "receipt" | "home" | "tag";

export const categoryIconOptions: Array<{ key: CategoryIconKey; label: string; icon: LucideIcon }> = [
  { key: "basket", label: "Groceries", icon: ShoppingCart },
  { key: "fuel", label: "Gas", icon: Car },
  { key: "utensils", label: "Dining", icon: Utensils },
  { key: "coffee", label: "Coffee", icon: Coffee },
  { key: "heart", label: "Health", icon: HeartPulse },
  { key: "repeat", label: "Recurring", icon: Repeat },
  { key: "sparkles", label: "Fun", icon: Sparkles },
  { key: "receipt", label: "Bills", icon: ReceiptText },
  { key: "home", label: "Home", icon: Home },
  { key: "tag", label: "Other", icon: Tag }
];

export function CategoryIcon({ icon, size = 18, className }: { icon: string; size?: number; className?: string }) {
  const match = categoryIconOptions.find((option) => option.key === icon) ?? categoryIconOptions[categoryIconOptions.length - 1];
  const Icon = match.icon;
  return <Icon size={size} className={className} />;
}

export function getCategoryIconLabel(icon: string) {
  return categoryIconOptions.find((option) => option.key === icon)?.label ?? "Other";
}
