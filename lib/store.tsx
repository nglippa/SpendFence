"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { categoryProgress, formatMoney, warningMessage } from "@/lib/budget";
import { categorizeTransaction, normalizeMerchant } from "@/lib/categorization";
import { createDemoState, initialState } from "@/lib/mock-data";
import { nextRecurringDate } from "@/lib/recurring";
import type {
  BudgetMonth,
  AdaptiveFenceSettings,
  AdaptiveFenceSuggestion,
  CategoryInput,
  CategorySuggestion,
  FenceLearningEvent,
  ImportedTransaction,
  ImportedTransactionInput,
  InsightSettings,
  Notification,
  NotificationSettings,
  OnboardingCompleteInput,
  PurchaseInput,
  RecurringItemInput,
  Receipt,
  ReceiptDraftInput,
  SpendFenceState,
  StoredSpendFenceData
} from "@/lib/types";

const LEGACY_STORAGE_KEY = "spendfence-state-v1";
const STORAGE_KEY = "spendfence-state-v2";

type SpendFenceContextValue = SpendFenceState & {
  ready: boolean;
  updateBudgetMonth: (budgetMonth: BudgetMonth) => void;
  addCategory: (input: CategoryInput) => void;
  updateCategory: (id: string, input: CategoryInput) => void;
  deleteCategory: (id: string) => void;
  addPurchase: (input: PurchaseInput) => void;
  updatePurchase: (id: string, input: PurchaseInput) => void;
  deletePurchase: (id: string) => void;
  addRecurringItem: (input: RecurringItemInput) => void;
  updateRecurringItem: (id: string, input: RecurringItemInput) => void;
  deleteRecurringItem: (id: string) => void;
  createReceiptDraft: (input: ReceiptDraftInput) => Receipt;
  updateReceiptDraft: (id: string, input: ReceiptDraftInput) => void;
  confirmReceipt: (id: string) => void;
  updateNotificationSettings: (settings: NotificationSettings) => void;
  updateInsightSettings: (settings: InsightSettings) => void;
  updateAdaptiveFenceSettings: (settings: AdaptiveFenceSettings) => void;
  acceptAdaptiveFenceSuggestion: (suggestion: AdaptiveFenceSuggestion) => void;
  dismissAdaptiveFenceSuggestion: (suggestion: AdaptiveFenceSuggestion) => void;
  updateAiCategorization: (enabled: boolean) => void;
  addImportedTransactions: (transactions: ImportedTransactionInput[]) => void;
  applySuggestionToImportedTransaction: (id: string, suggestion: CategorySuggestion) => void;
  acceptImportedTransaction: (id: string, categoryId?: string) => void;
  changeImportedTransactionCategory: (id: string, categoryId: string) => void;
  ignoreImportedTransaction: (id: string) => void;
  bulkAcceptHighConfidenceImports: () => void;
  createCategoryForImportedTransaction: (id: string, input: CategoryInput) => void;
  markNotificationRead: (id: string) => void;
  addToast: (notification: Omit<Notification, "id" | "createdAt" | "read">) => void;
  dismissToast: (id: string) => void;
  completeOnboarding: (input: OnboardingCompleteInput) => void;
  skipOnboarding: () => void;
  demoDataEnabled: boolean;
  enableDemoData: () => void;
  disableDemoData: () => void;
  resetDemoData: () => void;
};

const SpendFenceContext = createContext<SpendFenceContextValue | null>(null);
const colors = ["#18B889", "#2ED3B7", "#4B8CFF", "#7EF2D4", "#F5B942", "#5EA1FF", "#8A98A5", "#1FD1A5"];

export function SpendFenceProvider({ children, userId }: { children: React.ReactNode; userId: string }) {
  const storageKey = `${STORAGE_KEY}:${userId}`;
  const legacyStorageKey = `${LEGACY_STORAGE_KEY}:${userId}`;
  const [realState, setRealState] = useState<SpendFenceState>(() => withUserId(initialState, userId));
  const [demoState, setDemoState] = useState<SpendFenceState>(() => withUserId(createDemoState(), userId));
  const [demoDataEnabled, setDemoDataEnabled] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved =
      window.localStorage.getItem(storageKey) ??
      window.localStorage.getItem(legacyStorageKey) ??
      window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (saved) {
      try {
        const next = loadStoredData(JSON.parse(saved), userId);
        setRealState(next.realState);
        setDemoState(next.demoState);
        setDemoDataEnabled(next.demoDataEnabled);
      } catch {
        setRealState(withUserId(initialState, userId));
        setDemoState(withUserId(createDemoState(), userId));
        setDemoDataEnabled(false);
      }
    }
    setReady(true);
  }, [legacyStorageKey, storageKey, userId]);

  useEffect(() => {
    if (!ready) return;
    const stored: StoredSpendFenceData = {
      version: 2,
      demoDataEnabled,
      realState,
      demoState
    };
    window.localStorage.setItem(storageKey, JSON.stringify(stored));
  }, [demoDataEnabled, demoState, ready, realState, storageKey]);

  const state = demoDataEnabled ? demoState : realState;
  const setActiveState = demoDataEnabled ? setDemoState : setRealState;

  const value = useMemo<SpendFenceContextValue>(
    () => ({
      ...state,
      ready,
      demoDataEnabled,
      updateBudgetMonth: (budgetMonth) => setActiveState((current) => ({ ...current, budgetMonth: { ...budgetMonth, userId } })),
      addCategory: (input) =>
        setActiveState((current) => ({
          ...current,
          categories: [
            { ...input, id: makeId("category"), userId, color: input.color || colors[current.categories.length % colors.length] },
            ...current.categories
          ]
        })),
      updateCategory: (id, input) =>
        setActiveState((current) => ({
          ...current,
          categories: current.categories.map((category) => (category.id === id ? { ...input, id, userId } : category))
        })),
      deleteCategory: (id) =>
        setActiveState((current) => ({
          ...current,
          categories: current.categories.filter((category) => category.id !== id),
          purchases: current.purchases.filter((purchase) => purchase.categoryId !== id)
        })),
      addPurchase: (input) =>
        setActiveState((current) => {
          const recurringId = input.recurring?.enabled ? makeId("recurring") : undefined;
          const purchase = buildPurchase(input, makeId("purchase"), userId, recurringId);
          const nextPurchases = [purchase, ...current.purchases];
          const category = current.categories.find((item) => item.id === input.categoryId);
          const notifications = category ? nextNotifications(current, category, nextPurchases) : current.notifications;
          const recurringItems = input.recurring?.enabled
            ? [
                buildRecurringItem(
                  {
                    name: input.merchant,
                    amount: input.amount,
                    kind: input.recurring.kind,
                    frequency: input.recurring.frequency,
                    nextDate: nextRecurringDate(input.date, input.recurring.frequency),
                    categoryId: input.categoryId,
                    notes: input.notes,
                    sourcePurchaseId: purchase.id,
                    detected: false
                  },
                  recurringId!,
                  userId
                ),
                ...current.recurringItems
              ]
            : current.recurringItems;
          return { ...current, purchases: nextPurchases, recurringItems, notifications };
        }),
      updatePurchase: (id, input) =>
        setActiveState((current) => {
          const existing = current.purchases.find((purchase) => purchase.id === id);
          const recurringId = input.recurring?.enabled ? existing?.recurringId ?? makeId("recurring") : undefined;
          const purchases = current.purchases.map((purchase) =>
            purchase.id === id ? buildPurchase(input, id, userId, recurringId, purchase.source) : purchase
          );
          const recurringItems = syncRecurringFromPurchase(current.recurringItems, input, id, recurringId, userId, existing?.recurringId);
          return { ...current, purchases, recurringItems };
        }),
      deletePurchase: (id) =>
        setActiveState((current) => {
          const purchase = current.purchases.find((item) => item.id === id);
          return {
            ...current,
            purchases: current.purchases.filter((item) => item.id !== id),
            recurringItems: purchase?.recurringId
              ? current.recurringItems.map((item) => (item.id === purchase.recurringId ? { ...item, active: false, updatedAt: new Date().toISOString() } : item))
              : current.recurringItems
          };
        }),
      addRecurringItem: (input) =>
        setActiveState((current) => ({
          ...current,
          recurringItems: [buildRecurringItem(input, makeId("recurring"), userId), ...current.recurringItems]
        })),
      updateRecurringItem: (id, input) =>
        setActiveState((current) => ({
          ...current,
          recurringItems: current.recurringItems.map((item) => (item.id === id ? buildRecurringItem(input, id, userId, item.createdAt) : item))
        })),
      deleteRecurringItem: (id) =>
        setActiveState((current) => ({
          ...current,
          recurringItems: current.recurringItems.filter((item) => item.id !== id),
          purchases: current.purchases.map((purchase) => (purchase.recurringId === id ? { ...purchase, recurringId: undefined } : purchase))
        })),
      createReceiptDraft: (input) => {
        const receipt = { ...input, id: makeId("receipt"), userId, status: "draft" as const };
        setActiveState((current) => ({ ...current, receipts: [receipt, ...current.receipts] }));
        return receipt;
      },
      updateReceiptDraft: (id, input) =>
        setActiveState((current) => ({
          ...current,
          receipts: current.receipts.map((receipt) => (receipt.id === id ? { ...input, id, userId, status: receipt.status } : receipt))
        })),
      confirmReceipt: (id) =>
        setActiveState((current) => {
          const receipt = current.receipts.find((item) => item.id === id);
          if (!receipt) return current;
          const allocations = receipt.allocations?.length ? receipt.allocations : [{ id: "allocation-default", categoryId: receipt.categoryId, amount: receipt.total, confidence: receipt.confidence ?? 0.5, reason: receipt.reason ?? "Receipt matched to selected category." }];
          const purchases = allocations
            .filter((allocation) => allocation.categoryId && allocation.amount > 0)
            .map((allocation) => ({
              id: makeId("purchase"),
              userId,
              amount: allocation.amount,
              categoryId: allocation.categoryId,
              merchant: receipt.merchant,
              date: receipt.date,
              notes: `Receipt import: ${receipt.lineItems.map((item) => item.name).join(", ")}. ${allocation.reason}`,
              receiptImage: receipt.image,
              source: "receipt" as const
            }));
          const nextPurchases = [...purchases, ...current.purchases];
          const category = current.categories.find((item) => item.id === allocations[0]?.categoryId);
          return {
            ...current,
            purchases: nextPurchases,
            receipts: current.receipts.map((item) => (item.id === id ? { ...item, status: "confirmed" } : item)),
            notifications: category ? nextNotifications(current, category, nextPurchases) : current.notifications
          };
        }),
      updateNotificationSettings: (settings) => setActiveState((current) => ({ ...current, notificationSettings: settings })),
      updateInsightSettings: (settings) => setActiveState((current) => ({ ...current, insightSettings: settings })),
      updateAdaptiveFenceSettings: (settings) => setActiveState((current) => ({ ...current, adaptiveFenceSettings: settings })),
      acceptAdaptiveFenceSuggestion: (suggestion) =>
        setActiveState((current) => {
          const category = current.categories.find((item) => item.id === suggestion.categoryId);
          if (!category) return current;
          const nextCategories =
            suggestion.suggestedLimit && suggestion.suggestedLimit > 0
              ? current.categories.map((item) => (item.id === category.id ? { ...item, limit: suggestion.suggestedLimit ?? item.limit } : item))
              : current.categories;
          return {
            ...current,
            categories: nextCategories,
            fenceLearningEvents: [buildFenceLearningEvent(suggestion, "accepted"), ...current.fenceLearningEvents].slice(0, 300)
          };
        }),
      dismissAdaptiveFenceSuggestion: (suggestion) =>
        setActiveState((current) => ({
          ...current,
          fenceLearningEvents: [buildFenceLearningEvent(suggestion, "dismissed"), ...current.fenceLearningEvents].slice(0, 300)
        })),
      updateAiCategorization: (enabled) => setActiveState((current) => ({ ...current, aiCategorizationEnabled: enabled })),
      addImportedTransactions: (transactions) =>
        setActiveState((current) => ({
          ...current,
          importedTransactions: [
            ...transactions.map((transaction) => buildImportedTransaction(transaction, current, userId)),
            ...current.importedTransactions
          ]
        })),
      applySuggestionToImportedTransaction: (id, suggestion) =>
        setActiveState((current) => ({
          ...current,
          importedTransactions: current.importedTransactions.map((transaction) =>
            transaction.id === id
              ? {
                  ...transaction,
                  suggestedCategoryId: suggestion.suggestedCategoryId,
                  confidence: suggestion.confidence,
                  suggestionReason: suggestion.reason,
                  suggestionSource: suggestion.source
                }
              : transaction
          )
        })),
      acceptImportedTransaction: (id, categoryId) =>
        setActiveState((current) => acceptImported(current, id, categoryId, userId, false)),
      changeImportedTransactionCategory: (id, categoryId) =>
        setActiveState((current) => acceptImported(current, id, categoryId, userId, true)),
      ignoreImportedTransaction: (id) =>
        setActiveState((current) => ({
          ...current,
          importedTransactions: current.importedTransactions.map((transaction) =>
            transaction.id === id ? { ...transaction, reviewStatus: "ignored" } : transaction
          )
        })),
      bulkAcceptHighConfidenceImports: () =>
        setActiveState((current) =>
          current.importedTransactions
            .filter((transaction) => transaction.reviewStatus === "pending" && transaction.confidence >= 0.82 && transaction.suggestedCategoryId)
            .reduce((next, transaction) => acceptImported(next, transaction.id, transaction.suggestedCategoryId, userId, false), current)
        ),
      createCategoryForImportedTransaction: (id, input) =>
        setActiveState((current) => {
          const category = {
            ...input,
            id: makeId("category"),
            userId,
            color: input.color || colors[current.categories.length % colors.length]
          };
          return acceptImported({ ...current, categories: [category, ...current.categories] }, id, category.id, userId, true);
        }),
      markNotificationRead: (id) =>
        setActiveState((current) => ({ ...current, notifications: current.notifications.map((item) => (item.id === id ? { ...item, read: true } : item)) })),
      addToast: (notification) =>
        setActiveState((current) => ({
          ...current,
          notifications: [
            { ...notification, id: makeId("notification"), userId, createdAt: new Date().toISOString(), read: false },
            ...current.notifications
          ]
        })),
      dismissToast: (id) => setActiveState((current) => ({ ...current, notifications: current.notifications.filter((item) => item.id !== id) })),
      completeOnboarding: (input) =>
        setActiveState((current) => ({
          ...current,
          budgetMonth: {
            ...current.budgetMonth,
            userId,
            income: input.income,
            budgetCycleStartDay: input.budgetCycleStartDay
          },
          categories: input.categories.map((category, index) => ({
            ...category,
            id: current.categories[index]?.id ?? makeId("category"),
            userId,
            color: category.color || colors[index % colors.length]
          })),
          insightSettings: input.insightSettings,
          onboardingProfile: {
            ...current.onboardingProfile,
            completed: true,
            skipped: false,
            completedAt: new Date().toISOString(),
            rhythm: input.rhythm,
            incomeFrequency: input.incomeFrequency,
            guardrailMode: input.guardrailMode,
            selectedCategoryIds: input.selectedCategoryIds,
            customCategoryNames: input.customCategoryNames
          }
        })),
      skipOnboarding: () =>
        setActiveState((current) => ({
          ...current,
          onboardingProfile: {
            ...current.onboardingProfile,
            completed: true,
            skipped: true,
            completedAt: new Date().toISOString()
          }
        })),
      enableDemoData: () => setDemoDataEnabled(true),
      disableDemoData: () => setDemoDataEnabled(false),
      resetDemoData: () => setDemoState(withUserId(createDemoState(), userId))
    }),
    [demoDataEnabled, ready, setActiveState, state, userId]
  );

  return <SpendFenceContext.Provider value={value}>{children}</SpendFenceContext.Provider>;
}

function withUserId(state: SpendFenceState, userId: string): SpendFenceState {
  const normalized = {
    ...initialState,
    ...state,
    budgetMonth: { ...initialState.budgetMonth, ...(state.budgetMonth ?? {}) },
    categories: state.categories ?? [],
    purchases: state.purchases ?? [],
    recurringItems: state.recurringItems ?? [],
    receipts: state.receipts ?? [],
    importedTransactions: state.importedTransactions ?? [],
    merchantCategoryRules: state.merchantCategoryRules ?? [],
    categoryCorrections: state.categoryCorrections ?? [],
    prompts: state.prompts ?? [],
    notificationSettings: { ...initialState.notificationSettings, ...state.notificationSettings },
    insightSettings: { ...initialState.insightSettings, ...state.insightSettings },
    adaptiveFenceSettings: { ...initialState.adaptiveFenceSettings, ...state.adaptiveFenceSettings },
    fenceLearningEvents: state.fenceLearningEvents ?? [],
    onboardingProfile: {
      ...initialState.onboardingProfile,
      ...state.onboardingProfile,
      completed: state.onboardingProfile?.completed ?? Boolean(state.categories?.length || state.purchases?.length || state.recurringItems?.length),
      futureReady: {
        ...initialState.onboardingProfile.futureReady,
        ...state.onboardingProfile?.futureReady
      }
    },
    notifications: state.notifications ?? [],
    aiCategorizationEnabled: state.aiCategorizationEnabled ?? true
  };

  return {
    ...normalized,
    userId,
    budgetMonth: { ...normalized.budgetMonth, userId },
    categories: normalized.categories.map((category) => ({ ...category, userId })),
    purchases: normalized.purchases.map((purchase) => ({ ...purchase, userId })),
    recurringItems: normalized.recurringItems.map((item) => ({ ...item, userId })),
    receipts: normalized.receipts.map((receipt) => ({ ...receipt, userId })),
    importedTransactions: normalized.importedTransactions.map((transaction) => ({ ...transaction, userId })),
    merchantCategoryRules: normalized.merchantCategoryRules.map((rule) => ({ ...rule, userId })),
    categoryCorrections: normalized.categoryCorrections.map((correction) => ({ ...correction, userId })),
    notifications: normalized.notifications.map((notification) => ({ ...notification, userId }))
  };
}

function buildFenceLearningEvent(suggestion: AdaptiveFenceSuggestion, decision: FenceLearningEvent["decision"]): FenceLearningEvent {
  return {
    id: makeId("fence-learning"),
    suggestionId: suggestion.id,
    categoryId: suggestion.categoryId,
    suggestionType: suggestion.type,
    decision,
    previousLimit: suggestion.currentLimit,
    suggestedLimit: suggestion.suggestedLimit,
    createdAt: new Date().toISOString()
  };
}

function loadStoredData(raw: unknown, userId: string): StoredSpendFenceData {
  if (isStoredSpendFenceData(raw)) {
    return {
      version: 2,
      demoDataEnabled: raw.demoDataEnabled,
      realState: withUserId(raw.realState, userId),
      demoState: withUserId(raw.demoState, userId)
    };
  }

  const legacyState = raw && typeof raw === "object" ? (raw as SpendFenceState) : initialState;
  return {
    version: 2,
    demoDataEnabled: false,
    realState: withUserId(isLegacyDefaultDemoState(legacyState) ? initialState : legacyState, userId),
    demoState: withUserId(createDemoState(), userId)
  };
}

function isStoredSpendFenceData(raw: unknown): raw is StoredSpendFenceData {
  if (!raw || typeof raw !== "object") return false;
  const candidate = raw as Partial<StoredSpendFenceData>;
  return candidate.version === 2 && Boolean(candidate.realState) && Boolean(candidate.demoState);
}

function isLegacyDefaultDemoState(state: SpendFenceState) {
  const categoryIds = state.categories?.map((category) => category.id).sort().join(",");
  const purchaseIds = state.purchases?.map((purchase) => purchase.id).sort().join(",");
  const demoCategoryIds = ["cat-bills", "cat-eating", "cat-fun", "cat-gas", "cat-groceries", "cat-kids", "cat-subs"].join(",");
  const demoPurchaseIds = ["p-1", "p-2", "p-3", "p-4", "p-5", "p-6", "p-7"].join(",");
  const hasUserCreatedData = Boolean(state.receipts?.length || state.importedTransactions?.length || state.categoryCorrections?.length);

  return categoryIds === demoCategoryIds && purchaseIds === demoPurchaseIds && !hasUserCreatedData;
}

export function useSpendFence() {
  const context = useContext(SpendFenceContext);
  if (!context) throw new Error("useSpendFence must be used inside SpendFenceProvider");
  return context;
}

function buildPurchase(input: PurchaseInput, id: string, userId: string, recurringId?: string, fallbackSource?: SpendFenceState["purchases"][number]["source"]) {
  const { recurring, ...purchaseInput } = input;
  return {
    ...purchaseInput,
    id,
    userId,
    recurringId,
    source: input.source ?? fallbackSource ?? "manual"
  };
}

function buildRecurringItem(input: RecurringItemInput, id: string, userId: string, createdAt = new Date().toISOString()) {
  const now = new Date().toISOString();
  return {
    ...input,
    id,
    userId,
    active: input.active ?? true,
    detected: input.detected ?? false,
    createdAt,
    updatedAt: now
  };
}

function syncRecurringFromPurchase(
  recurringItems: SpendFenceState["recurringItems"],
  input: PurchaseInput,
  purchaseId: string,
  recurringId: string | undefined,
  userId: string,
  previousRecurringId?: string
) {
  if (!input.recurring?.enabled || !recurringId) {
    if (!previousRecurringId) return recurringItems;
    return recurringItems.map((item) => (item.id === previousRecurringId ? { ...item, active: false, updatedAt: new Date().toISOString() } : item));
  }

  const nextInput: RecurringItemInput = {
    name: input.merchant,
    amount: input.amount,
    kind: input.recurring.kind,
    frequency: input.recurring.frequency,
    nextDate: nextRecurringDate(input.date, input.recurring.frequency),
    categoryId: input.categoryId,
    notes: input.notes,
    sourcePurchaseId: purchaseId,
    active: true,
    detected: false
  };
  const existing = recurringItems.find((item) => item.id === recurringId);
  if (existing) {
    return recurringItems.map((item) => (item.id === recurringId ? buildRecurringItem(nextInput, recurringId, userId, item.createdAt) : item));
  }
  return [buildRecurringItem(nextInput, recurringId, userId), ...recurringItems];
}

function nextNotifications(current: SpendFenceState, category: SpendFenceState["categories"][number], purchases: SpendFenceState["purchases"]) {
  const progress = categoryProgress(category, purchases, current.budgetMonth);
  const notifications = [...current.notifications];
  if (progress.status === "locked" && current.notificationSettings.limitReached) {
    notifications.unshift({
      id: makeId("notification"),
      userId: current.userId,
      title: "Limit reached",
      body: warningMessage(category, purchases, current.budgetMonth),
      level: "locked",
      createdAt: new Date().toISOString(),
      read: false
    });
  } else if (progress.status === "warning" && current.notificationSettings.eightyPercent) {
    notifications.unshift({
      id: makeId("notification"),
      userId: current.userId,
      title: "Spending warning",
      body: warningMessage(category, purchases, current.budgetMonth),
      level: "warning",
      createdAt: new Date().toISOString(),
      read: false
    });
  } else if (progress.percent >= 50 && current.notificationSettings.fiftyPercent) {
    notifications.unshift({
      id: makeId("notification"),
      userId: current.userId,
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

function buildImportedTransaction(input: ImportedTransactionInput, current: SpendFenceState, userId: string): ImportedTransaction {
  const localSuggestion = categorizeTransaction(input, current.categories, current.merchantCategoryRules);
  return {
    ...input,
    id: makeId("import"),
    userId,
    suggestedCategoryId: input.suggestedCategoryId || localSuggestion.suggestedCategoryId,
    confidence: input.confidence ?? localSuggestion.confidence,
    suggestionReason: input.suggestionReason ?? localSuggestion.reason,
    suggestionSource: input.suggestionSource ?? localSuggestion.source,
    reviewStatus: input.reviewStatus ?? "pending"
  };
}

function acceptImported(current: SpendFenceState, id: string, categoryId: string | undefined, userId: string, changed: boolean): SpendFenceState {
  const transaction = current.importedTransactions.find((item) => item.id === id);
  const selectedCategoryId = categoryId ?? transaction?.suggestedCategoryId;
  if (!transaction || !selectedCategoryId) return current;

  const purchase = {
    id: makeId("purchase"),
    userId,
    amount: Math.abs(transaction.amount),
    categoryId: selectedCategoryId,
    merchant: transaction.merchantName,
    date: transaction.date,
    notes: `Imported transaction: ${transaction.description}`,
    source: "future-bank-import" as const
  };
  const nextPurchases = [purchase, ...current.purchases];
  const category = current.categories.find((item) => item.id === selectedCategoryId);
  const merchantNameNormalized = normalizeMerchant(transaction.merchantName);
  const correction =
    changed || selectedCategoryId !== transaction.suggestedCategoryId
      ? [
          {
            id: makeId("correction"),
            userId,
            merchantNameNormalized,
            originalSuggestedCategoryId: transaction.suggestedCategoryId,
            correctedCategoryId: selectedCategoryId,
            createdAt: new Date().toISOString()
          }
        ]
      : [];

  return {
    ...current,
    purchases: nextPurchases,
    importedTransactions: current.importedTransactions.map((item) =>
      item.id === id ? { ...item, suggestedCategoryId: selectedCategoryId, reviewStatus: changed ? "changed" : "accepted" } : item
    ),
    merchantCategoryRules: upsertMerchantRule(current.merchantCategoryRules, {
      id: makeId("rule"),
      userId,
      merchantNameNormalized,
      categoryId: selectedCategoryId,
      source: changed ? "user_correction" : "system_rule",
      confidence: changed ? 0.96 : Math.max(transaction.confidence, 0.86),
      lastUsedAt: new Date().toISOString()
    }),
    categoryCorrections: [...correction, ...current.categoryCorrections],
    notifications: category ? nextNotifications(current, category, nextPurchases) : current.notifications
  };
}

function upsertMerchantRule(rules: SpendFenceState["merchantCategoryRules"], nextRule: SpendFenceState["merchantCategoryRules"][number]) {
  const withoutExisting = rules.filter((rule) => rule.merchantNameNormalized !== nextRule.merchantNameNormalized);
  return [nextRule, ...withoutExisting].slice(0, 200);
}
