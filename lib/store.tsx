"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { categoryProgress, formatMoney, warningMessage } from "@/lib/budget";
import { initialState } from "@/lib/mock-data";
import type {
  BudgetMonth,
  CategoryInput,
  Notification,
  NotificationSettings,
  PurchaseInput,
  Receipt,
  ReceiptDraftInput,
  SpendFenceState
} from "@/lib/types";

const STORAGE_KEY = "spendfence-state-v1";

type SpendFenceContextValue = SpendFenceState & {
  ready: boolean;
  updateBudgetMonth: (budgetMonth: BudgetMonth) => void;
  addCategory: (input: CategoryInput) => void;
  updateCategory: (id: string, input: CategoryInput) => void;
  deleteCategory: (id: string) => void;
  addPurchase: (input: PurchaseInput) => void;
  updatePurchase: (id: string, input: PurchaseInput) => void;
  deletePurchase: (id: string) => void;
  createReceiptDraft: (input: ReceiptDraftInput) => Receipt;
  updateReceiptDraft: (id: string, input: ReceiptDraftInput) => void;
  confirmReceipt: (id: string) => void;
  updateNotificationSettings: (settings: NotificationSettings) => void;
  markNotificationRead: (id: string) => void;
  addToast: (notification: Omit<Notification, "id" | "createdAt" | "read">) => void;
  dismissToast: (id: string) => void;
  resetDemoData: () => void;
};

const SpendFenceContext = createContext<SpendFenceContextValue | null>(null);
const colors = ["#58c6a8", "#5b8def", "#f59e6b", "#a78bfa", "#38bdf8", "#f472b6", "#64748b", "#22c55e"];

export function SpendFenceProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SpendFenceState>(initialState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setState(JSON.parse(saved) as SpendFenceState);
      } catch {
        setState(initialState);
      }
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [ready, state]);

  const value = useMemo<SpendFenceContextValue>(
    () => ({
      ...state,
      ready,
      updateBudgetMonth: (budgetMonth) => setState((current) => ({ ...current, budgetMonth })),
      addCategory: (input) =>
        setState((current) => ({
          ...current,
          categories: [{ ...input, id: makeId("category"), color: input.color || colors[current.categories.length % colors.length] }, ...current.categories]
        })),
      updateCategory: (id, input) =>
        setState((current) => ({
          ...current,
          categories: current.categories.map((category) => (category.id === id ? { ...input, id } : category))
        })),
      deleteCategory: (id) =>
        setState((current) => ({
          ...current,
          categories: current.categories.filter((category) => category.id !== id),
          purchases: current.purchases.filter((purchase) => purchase.categoryId !== id)
        })),
      addPurchase: (input) =>
        setState((current) => {
          const purchase = { ...input, id: makeId("purchase"), source: input.source ?? "manual" };
          const nextPurchases = [purchase, ...current.purchases];
          const category = current.categories.find((item) => item.id === input.categoryId);
          const notifications = category ? nextNotifications(current, category, nextPurchases) : current.notifications;
          return { ...current, purchases: nextPurchases, notifications };
        }),
      updatePurchase: (id, input) =>
        setState((current) => ({
          ...current,
          purchases: current.purchases.map((purchase) => (purchase.id === id ? { ...input, id, source: input.source ?? purchase.source } : purchase))
        })),
      deletePurchase: (id) => setState((current) => ({ ...current, purchases: current.purchases.filter((purchase) => purchase.id !== id) })),
      createReceiptDraft: (input) => {
        const receipt = { ...input, id: makeId("receipt"), status: "draft" as const };
        setState((current) => ({ ...current, receipts: [receipt, ...current.receipts] }));
        return receipt;
      },
      updateReceiptDraft: (id, input) =>
        setState((current) => ({
          ...current,
          receipts: current.receipts.map((receipt) => (receipt.id === id ? { ...input, id, status: receipt.status } : receipt))
        })),
      confirmReceipt: (id) =>
        setState((current) => {
          const receipt = current.receipts.find((item) => item.id === id);
          if (!receipt) return current;
          const purchase = {
            id: makeId("purchase"),
            amount: receipt.total,
            categoryId: receipt.categoryId,
            merchant: receipt.merchant,
            date: receipt.date,
            notes: `Receipt import: ${receipt.lineItems.map((item) => item.name).join(", ")}`,
            receiptImage: receipt.image,
            source: "receipt" as const
          };
          const nextPurchases = [purchase, ...current.purchases];
          const category = current.categories.find((item) => item.id === receipt.categoryId);
          return {
            ...current,
            purchases: nextPurchases,
            receipts: current.receipts.map((item) => (item.id === id ? { ...item, status: "confirmed" } : item)),
            notifications: category ? nextNotifications(current, category, nextPurchases) : current.notifications
          };
        }),
      updateNotificationSettings: (settings) => setState((current) => ({ ...current, notificationSettings: settings })),
      markNotificationRead: (id) =>
        setState((current) => ({ ...current, notifications: current.notifications.map((item) => (item.id === id ? { ...item, read: true } : item)) })),
      addToast: (notification) =>
        setState((current) => ({
          ...current,
          notifications: [{ ...notification, id: makeId("notification"), createdAt: new Date().toISOString(), read: false }, ...current.notifications]
        })),
      dismissToast: (id) => setState((current) => ({ ...current, notifications: current.notifications.filter((item) => item.id !== id) })),
      resetDemoData: () => setState(initialState)
    }),
    [ready, state]
  );

  return <SpendFenceContext.Provider value={value}>{children}</SpendFenceContext.Provider>;
}

export function useSpendFence() {
  const context = useContext(SpendFenceContext);
  if (!context) throw new Error("useSpendFence must be used inside SpendFenceProvider");
  return context;
}

function nextNotifications(current: SpendFenceState, category: SpendFenceState["categories"][number], purchases: SpendFenceState["purchases"]) {
  const progress = categoryProgress(category, purchases);
  const notifications = [...current.notifications];
  if (progress.status === "locked" && current.notificationSettings.limitReached) {
    notifications.unshift({
      id: makeId("notification"),
      title: "Limit reached",
      body: warningMessage(category, purchases),
      level: "locked",
      createdAt: new Date().toISOString(),
      read: false
    });
  } else if (progress.status === "warning" && current.notificationSettings.eightyPercent) {
    notifications.unshift({
      id: makeId("notification"),
      title: "Spending warning",
      body: warningMessage(category, purchases),
      level: "warning",
      createdAt: new Date().toISOString(),
      read: false
    });
  } else if (progress.percent >= 50 && current.notificationSettings.fiftyPercent) {
    notifications.unshift({
      id: makeId("notification"),
      title: "Halfway there",
      body: `${category.name} is at ${Math.round(progress.percent)}% of its ${formatMoney(category.limit)} monthly fence.`,
      level: "info",
      createdAt: new Date().toISOString(),
      read: false
    });
  }
  return notifications.slice(0, 20);
}

function makeId(prefix: string) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
}
