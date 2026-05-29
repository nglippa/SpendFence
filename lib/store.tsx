"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { categoryProgress, formatMoney, warningMessage } from "@/lib/budget";
import { categorizeTransaction, normalizeMerchant } from "@/lib/categorization";
import { createDemoState, initialState } from "@/lib/mock-data";
import { nextRecurringDate } from "@/lib/recurring";
import type { SpendingRuleInput } from "@/lib/rules/rule-types";
import type {
  BudgetMonth,
  AdaptiveFenceSuggestionCache,
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
  PersistedAdaptiveFenceSuggestion,
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
  addSpendingRule: (input: SpendingRuleInput) => void;
  updateSpendingRule: (id: string, input: SpendingRuleInput) => void;
  toggleSpendingRule: (id: string, enabled: boolean) => void;
  deleteSpendingRule: (id: string) => void;
  setAdaptiveFenceSuggestions: (input: { fingerprint: string; suggestions: AdaptiveFenceSuggestion[]; aiUsed: boolean; generatedAt?: string }) => void;
  rememberAdaptiveFenceSuggestionsView: (input: { activeIndex?: number; expandedId?: string | null }) => void;
  acceptAdaptiveFenceSuggestion: (suggestion: AdaptiveFenceSuggestion, options?: { applyLimit?: boolean; nextFingerprint?: string }) => void;
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
  demoModeLocked: boolean;
  enableDemoData: () => void;
  disableDemoData: () => void;
  resetDemoData: () => void;
};

const SpendFenceContext = createContext<SpendFenceContextValue | null>(null);
const colors = ["#5BA98C", "#6FB7A5", "#7894B6", "#87C7BB", "#C89B53", "#7B84BD", "#7C8991", "#5FA48E"];

export function SpendFenceProvider({ children, userId, demoLocked = false }: { children: React.ReactNode; userId: string; demoLocked?: boolean }) {
  const storageKey = `${STORAGE_KEY}:${userId}`;
  const legacyStorageKey = `${LEGACY_STORAGE_KEY}:${userId}`;
  const [realState, setRealState] = useState<SpendFenceState>(() => withUserId(initialState, userId));
  const [demoState, setDemoState] = useState<SpendFenceState>(() => withUserId(createDemoState(), userId));
  const [demoDataEnabled, setDemoDataEnabled] = useState(demoLocked);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (demoLocked) {
      setRealState(withUserId(initialState, userId));
      setDemoState(withUserId(createDemoState(), userId));
      setDemoDataEnabled(true);
      setReady(true);
      return;
    }

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
  }, [demoLocked, legacyStorageKey, storageKey, userId]);

  useEffect(() => {
    if (!ready) return;
    if (demoLocked) return;
    const stored: StoredSpendFenceData = {
      version: 2,
      demoDataEnabled,
      realState,
      demoState
    };
    window.localStorage.setItem(storageKey, JSON.stringify(stored));
  }, [demoDataEnabled, demoLocked, demoState, ready, realState, storageKey]);

  const demoActive = demoLocked || demoDataEnabled;
  const state = demoActive ? demoState : realState;
  const setActiveState = demoActive ? setDemoState : setRealState;

  const value = useMemo<SpendFenceContextValue>(
    () => ({
      ...state,
      ready,
      demoDataEnabled: demoActive,
      demoModeLocked: demoLocked,
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
          purchases: current.purchases.filter((purchase) => purchase.categoryId !== id),
          spendingRules: current.spendingRules.filter((rule) => rule.categoryId !== id)
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
      addSpendingRule: (input) =>
        setActiveState((current) => ({
          ...current,
          spendingRules: [buildSpendingRule(input, makeId("spending-rule"), userId), ...current.spendingRules].slice(0, 50)
        })),
      updateSpendingRule: (id, input) =>
        setActiveState((current) => ({
          ...current,
          spendingRules: current.spendingRules.map((rule) =>
            rule.id === id ? buildSpendingRule(input, id, userId, rule.createdAt) : rule
          )
        })),
      toggleSpendingRule: (id, enabled) =>
        setActiveState((current) => ({
          ...current,
          spendingRules: current.spendingRules.map((rule) => (rule.id === id ? { ...rule, enabled, updatedAt: new Date().toISOString() } : rule))
        })),
      deleteSpendingRule: (id) =>
        setActiveState((current) => ({
          ...current,
          spendingRules: current.spendingRules.filter((rule) => rule.id !== id)
        })),
      setAdaptiveFenceSuggestions: ({ fingerprint, suggestions, aiUsed, generatedAt }) =>
        setActiveState((current) => ({
          ...current,
          adaptiveSuggestions: buildAdaptiveSuggestionCache(fingerprint, suggestions, aiUsed, generatedAt)
        })),
      rememberAdaptiveFenceSuggestionsView: ({ activeIndex, expandedId }) =>
        setActiveState((current) => ({
          ...current,
          adaptiveSuggestions: {
            ...current.adaptiveSuggestions,
            activeIndex: typeof activeIndex === "number" ? activeIndex : current.adaptiveSuggestions.activeIndex,
            expandedId: expandedId !== undefined ? expandedId : current.adaptiveSuggestions.expandedId
          }
        })),
      acceptAdaptiveFenceSuggestion: (suggestion, options) =>
        setActiveState((current) => {
          const category = current.categories.find((item) => item.id === suggestion.categoryId);
          if (!category) {
            return {
              ...current,
              adaptiveSuggestions: markAdaptiveSuggestion(current.adaptiveSuggestions, suggestion.id, "accepted", options?.nextFingerprint),
              fenceLearningEvents: [buildFenceLearningEvent(suggestion, "accepted"), ...current.fenceLearningEvents].slice(0, 300)
            };
          }
          const nextCategories =
            options?.applyLimit && suggestion.suggestedLimit && suggestion.suggestedLimit > 0
              ? current.categories.map((item) => (item.id === category.id ? { ...item, limit: suggestion.suggestedLimit ?? item.limit } : item))
              : current.categories;
          return {
            ...current,
            categories: nextCategories,
            adaptiveSuggestions: markAdaptiveSuggestion(current.adaptiveSuggestions, suggestion.id, "accepted", options?.nextFingerprint),
            fenceLearningEvents: [buildFenceLearningEvent(suggestion, "accepted"), ...current.fenceLearningEvents].slice(0, 300)
          };
        }),
      dismissAdaptiveFenceSuggestion: (suggestion) =>
        setActiveState((current) => ({
          ...current,
          adaptiveSuggestions: markAdaptiveSuggestion(current.adaptiveSuggestions, suggestion.id, "dismissed"),
          fenceLearningEvents: [buildFenceLearningEvent(suggestion, "dismissed"), ...current.fenceLearningEvents].slice(0, 300)
        })),
      updateAiCategorization: (enabled) => setActiveState((current) => ({ ...current, aiCategorizationEnabled: enabled })),
      addImportedTransactions: (transactions) =>
        setActiveState((current) => ({
          ...current,
          importedTransactions: [
            ...transactions
              .filter((transaction) => !isDuplicateImport(transaction, current.importedTransactions))
              .map((transaction) => buildImportedTransaction(transaction, current, userId)),
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
      disableDemoData: () => {
        if (!demoLocked) setDemoDataEnabled(false);
      },
      resetDemoData: () => setDemoState(withUserId(createDemoState(), userId))
    }),
    [demoActive, demoLocked, ready, setActiveState, state, userId]
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
    adaptiveSuggestions: normalizeAdaptiveSuggestionCache(state.adaptiveSuggestions),
    fenceLearningEvents: state.fenceLearningEvents ?? [],
    spendingRules: state.spendingRules ?? [],
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
    notifications: normalized.notifications.map((notification) => ({ ...notification, userId })),
    spendingRules: normalized.spendingRules.map((rule) => ({ ...rule, userId }))
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

function buildAdaptiveSuggestionCache(
  fingerprint: string,
  suggestions: AdaptiveFenceSuggestion[],
  aiUsed: boolean,
  generatedAt = new Date().toISOString()
): AdaptiveFenceSuggestionCache {
  return {
    fingerprint,
    generatedAt,
    aiUsed,
    activeIndex: 0,
    expandedId: null,
    items: suggestions.map((suggestion) => ({
      ...suggestion,
      message: suggestion.explanation,
      relatedCategoryId: suggestion.categoryId,
      status: "active",
      fingerprint,
      createdAt: generatedAt
    }))
  };
}

function markAdaptiveSuggestion(
  cache: AdaptiveFenceSuggestionCache,
  suggestionId: string,
  status: PersistedAdaptiveFenceSuggestion["status"],
  nextFingerprint?: string
): AdaptiveFenceSuggestionCache {
  const updatedAt = new Date().toISOString();
  const nextItems = cache.items.map((item) => (item.id === suggestionId ? { ...item, status, updatedAt } : item));
  const activeCount = nextItems.filter((item) => item.status === "active").length;
  return {
    ...cache,
    fingerprint: nextFingerprint ?? cache.fingerprint,
    items: nextItems,
    activeIndex: Math.min(cache.activeIndex, Math.max(0, activeCount - 1)),
    expandedId: cache.expandedId === suggestionId ? null : cache.expandedId
  };
}

function normalizeAdaptiveSuggestionCache(cache: unknown): AdaptiveFenceSuggestionCache {
  if (!cache || typeof cache !== "object") return initialState.adaptiveSuggestions;

  const candidate = cache as Partial<AdaptiveFenceSuggestionCache>;
  const fingerprint = typeof candidate.fingerprint === "string" ? candidate.fingerprint : "";
  const generatedAt = typeof candidate.generatedAt === "string" ? candidate.generatedAt : "";
  const items = Array.isArray(candidate.items)
    ? (candidate.items.map((item) => normalizePersistedAdaptiveSuggestion(item, fingerprint)).filter(Boolean) as PersistedAdaptiveFenceSuggestion[])
    : [];
  const activeCount = items.filter((item) => item.status === "active").length;

  return {
    fingerprint,
    generatedAt,
    aiUsed: Boolean(candidate.aiUsed),
    items,
    activeIndex: typeof candidate.activeIndex === "number" ? Math.min(Math.max(0, Math.round(candidate.activeIndex)), Math.max(0, activeCount - 1)) : 0,
    expandedId: typeof candidate.expandedId === "string" ? candidate.expandedId : null
  };
}

function normalizePersistedAdaptiveSuggestion(item: unknown, fallbackFingerprint: string): PersistedAdaptiveFenceSuggestion | null {
  if (!item || typeof item !== "object") return null;
  const raw = item as Partial<PersistedAdaptiveFenceSuggestion>;
  if (!raw.id || !raw.categoryId || !raw.type || !raw.title || !raw.explanation || !raw.suggestedAction || !raw.confidence || !raw.source) return null;
  const status = raw.status === "accepted" || raw.status === "dismissed" ? raw.status : "active";
  return {
    ...(raw as AdaptiveFenceSuggestion),
    message: raw.message ?? raw.explanation,
    relatedCategoryId: raw.relatedCategoryId ?? raw.categoryId,
    status,
    fingerprint: raw.fingerprint ?? fallbackFingerprint,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt
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

function buildSpendingRule(input: SpendingRuleInput, id: string, userId: string, createdAt = new Date().toISOString()) {
  const now = new Date().toISOString();
  return {
    ...input,
    id,
    userId,
    source: input.source ?? "manual",
    enabled: input.enabled ?? true,
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

function isDuplicateImport(input: ImportedTransactionInput, existing: ImportedTransaction[]) {
  if (input.externalTransactionId) {
    return existing.some((transaction) => transaction.externalTransactionId === input.externalTransactionId);
  }

  const inputKey = importFallbackKey(input);
  return existing.some((transaction) => importFallbackKey(transaction) === inputKey);
}

function importFallbackKey(transaction: Pick<ImportedTransaction, "merchantName" | "description" | "amount" | "date">) {
  return [
    normalizeMerchant(transaction.merchantName),
    normalizeMerchant(transaction.description),
    Math.abs(transaction.amount).toFixed(2),
    new Date(transaction.date).toISOString().slice(0, 10)
  ].join("|");
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
