import type { SupabaseClient } from "@supabase/supabase-js";
import { initialState } from "@/lib/mock-data";
import type {
  Category,
  FenceLearningEvent,
  ImportedTransaction,
  Purchase,
  RecurringItem,
  SpendFenceState
} from "@/lib/types";
import type { SpendingRule } from "@/lib/rules/rule-types";

// Slices that live in their own normalized tables.
const ENTITY_TABLES = {
  categories: "categories",
  purchases: "purchases",
  recurringItems: "recurring_purchases",
  spendingRules: "spending_rules",
  importedTransactions: "imported_transactions",
  fenceLearningEvents: "fence_learning_events"
} as const;

// Everything else is a per-user singleton/settings blob stored in app_settings.data.
const SETTINGS_KEYS = [
  "budgetMonth",
  "receipts",
  "merchantCategoryRules",
  "categoryCorrections",
  "prompts",
  "notificationSettings",
  "insightSettings",
  "adaptiveFenceSettings",
  "adaptiveSuggestions",
  "onboardingProfile",
  "notifications",
  "aiCategorizationEnabled"
] as const;

type SettingsKey = (typeof SETTINGS_KEYS)[number];
type AppSettingsData = Pick<SpendFenceState, SettingsKey>;

export type SupabaseLoadResult = {
  state: SpendFenceState;
  hasData: boolean;
};

function undef<T>(value: T | null | undefined): T | undefined {
  return value === null || value === undefined ? undefined : value;
}

// ---------------------------------------------------------------------------
// Row mappers (TS camelCase <-> DB snake_case). userId is intentionally
// dropped from the row body; the user_id column is always set explicitly.
// ---------------------------------------------------------------------------

function categoryToRow(item: Category, userId: string) {
  return {
    id: item.id,
    user_id: userId,
    name: item.name,
    monthly_limit: item.limit,
    warning_threshold: item.warningThreshold,
    hard_stop_threshold: item.hardStopThreshold,
    color: item.color,
    icon: item.icon
  };
}

function categoryFromRow(row: Record<string, unknown>): Category {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    limit: Number(row.monthly_limit ?? 0),
    warningThreshold: Number(row.warning_threshold ?? 80),
    hardStopThreshold: Number(row.hard_stop_threshold ?? 100),
    color: String(row.color ?? ""),
    icon: String(row.icon ?? "")
  };
}

function purchaseToRow(item: Purchase, userId: string) {
  return {
    id: item.id,
    user_id: userId,
    amount: item.amount,
    category_id: item.categoryId,
    merchant: item.merchant,
    date: item.date,
    notes: item.notes ?? null,
    receipt_image: item.receiptImage ?? null,
    recurring_id: item.recurringId ?? null,
    source: item.source
  };
}

function purchaseFromRow(row: Record<string, unknown>): Purchase {
  return {
    id: String(row.id),
    amount: Number(row.amount ?? 0),
    categoryId: String(row.category_id ?? ""),
    merchant: String(row.merchant ?? ""),
    date: String(row.date ?? ""),
    notes: undef(row.notes as string | null),
    receiptImage: undef(row.receipt_image as string | null),
    recurringId: undef(row.recurring_id as string | null),
    source: (row.source as Purchase["source"]) ?? "manual"
  };
}

function recurringToRow(item: RecurringItem, userId: string) {
  return {
    id: item.id,
    user_id: userId,
    name: item.name,
    amount: item.amount,
    kind: item.kind,
    frequency: item.frequency,
    next_date: item.nextDate,
    category_id: item.categoryId ?? null,
    notes: item.notes ?? null,
    active: item.active,
    source_purchase_id: item.sourcePurchaseId ?? null,
    detected: item.detected,
    created_at: item.createdAt,
    updated_at: item.updatedAt
  };
}

function recurringFromRow(row: Record<string, unknown>): RecurringItem {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    amount: Number(row.amount ?? 0),
    kind: (row.kind as RecurringItem["kind"]) ?? "bill",
    frequency: (row.frequency as RecurringItem["frequency"]) ?? "monthly",
    nextDate: String(row.next_date ?? ""),
    categoryId: undef(row.category_id as string | null),
    notes: undef(row.notes as string | null),
    active: Boolean(row.active),
    sourcePurchaseId: undef(row.source_purchase_id as string | null),
    detected: Boolean(row.detected),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString())
  };
}

function ruleToRow(item: SpendingRule, userId: string) {
  return {
    id: item.id,
    user_id: userId,
    title: item.title,
    description: item.description,
    category_id: item.categoryId ?? null,
    merchant_pattern: item.merchantPattern ?? null,
    type: item.type,
    condition: item.condition,
    threshold_amount: item.thresholdAmount ?? null,
    threshold_count: item.thresholdCount ?? null,
    threshold_percent: item.thresholdPercent ?? null,
    time_window: item.timeWindow ?? null,
    time_context: item.timeContext ?? null,
    response: item.response,
    enabled: item.enabled,
    source: item.source,
    premium: item.premium ?? null,
    created_at: item.createdAt,
    updated_at: item.updatedAt
  };
}

function ruleFromRow(row: Record<string, unknown>): SpendingRule {
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    categoryId: undef(row.category_id as string | null),
    merchantPattern: undef(row.merchant_pattern as string | null),
    type: row.type as SpendingRule["type"],
    condition: row.condition as SpendingRule["condition"],
    thresholdAmount: undef(row.threshold_amount as number | null),
    thresholdCount: undef(row.threshold_count as number | null),
    thresholdPercent: undef(row.threshold_percent as number | null),
    timeWindow: undef(row.time_window as SpendingRule["timeWindow"] | null),
    timeContext: undef(row.time_context as SpendingRule["timeContext"] | null),
    response: row.response as SpendingRule["response"],
    enabled: Boolean(row.enabled),
    source: (row.source as SpendingRule["source"]) ?? "manual",
    premium: undef(row.premium as boolean | null),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString())
  };
}

function importedToRow(item: ImportedTransaction, userId: string) {
  return {
    id: item.id,
    user_id: userId,
    external_transaction_id: item.externalTransactionId ?? null,
    import_source: item.importSource ?? null,
    teller_account_id: item.tellerAccountId ?? null,
    teller_account_name: item.tellerAccountName ?? null,
    merchant_name: item.merchantName,
    description: item.description,
    amount: item.amount,
    date: item.date,
    plaid_category: item.plaidCategory ?? null,
    suggested_category_id: item.suggestedCategoryId ?? null,
    confidence: item.confidence,
    suggestion_reason: item.suggestionReason ?? null,
    suggestion_source: item.suggestionSource ?? null,
    review_status: item.reviewStatus
  };
}

function importedFromRow(row: Record<string, unknown>): ImportedTransaction {
  return {
    id: String(row.id),
    externalTransactionId: undef(row.external_transaction_id as string | null),
    importSource: undef(row.import_source as ImportedTransaction["importSource"] | null),
    tellerAccountId: undef(row.teller_account_id as string | null),
    tellerAccountName: undef(row.teller_account_name as string | null),
    merchantName: String(row.merchant_name ?? ""),
    description: String(row.description ?? ""),
    amount: Number(row.amount ?? 0),
    date: String(row.date ?? ""),
    plaidCategory: undef(row.plaid_category as string | null),
    suggestedCategoryId: undef(row.suggested_category_id as string | null),
    confidence: Number(row.confidence ?? 0),
    suggestionReason: String(row.suggestion_reason ?? ""),
    suggestionSource: (row.suggestion_source as ImportedTransaction["suggestionSource"]) ?? "fallback",
    reviewStatus: (row.review_status as ImportedTransaction["reviewStatus"]) ?? "pending"
  };
}

function learningToRow(item: FenceLearningEvent, userId: string) {
  return {
    id: item.id,
    user_id: userId,
    suggestion_id: item.suggestionId,
    category_id: item.categoryId ?? null,
    suggestion_type: item.suggestionType,
    decision: item.decision,
    previous_limit: item.previousLimit ?? null,
    suggested_limit: item.suggestedLimit ?? null,
    created_at: item.createdAt
  };
}

function learningFromRow(row: Record<string, unknown>): FenceLearningEvent {
  return {
    id: String(row.id),
    suggestionId: String(row.suggestion_id ?? ""),
    categoryId: undef(row.category_id as string | null),
    suggestionType: row.suggestion_type as FenceLearningEvent["suggestionType"],
    decision: row.decision as FenceLearningEvent["decision"],
    previousLimit: undef(row.previous_limit as number | null),
    suggestedLimit: undef(row.suggested_limit as number | null),
    createdAt: String(row.created_at ?? new Date().toISOString())
  };
}

const ENTITY_CONFIG = {
  categories: { table: ENTITY_TABLES.categories, toRow: categoryToRow },
  purchases: { table: ENTITY_TABLES.purchases, toRow: purchaseToRow },
  recurringItems: { table: ENTITY_TABLES.recurringItems, toRow: recurringToRow },
  spendingRules: { table: ENTITY_TABLES.spendingRules, toRow: ruleToRow },
  importedTransactions: { table: ENTITY_TABLES.importedTransactions, toRow: importedToRow },
  fenceLearningEvents: { table: ENTITY_TABLES.fenceLearningEvents, toRow: learningToRow }
} as const;

type EntityKey = keyof typeof ENTITY_CONFIG;

function extractSettings(state: SpendFenceState): AppSettingsData {
  const data = {} as AppSettingsData;
  for (const key of SETTINGS_KEYS) {
    // @ts-expect-error -- index assignment across a heterogeneous Pick is safe here.
    data[key] = state[key];
  }
  return data;
}

// ---------------------------------------------------------------------------
// Load
// ---------------------------------------------------------------------------

export async function loadStateFromSupabase(client: SupabaseClient, userId: string): Promise<SupabaseLoadResult> {
  const [
    categoriesRes,
    purchasesRes,
    recurringRes,
    rulesRes,
    importedRes,
    learningRes,
    settingsRes
  ] = await Promise.all([
    client.from(ENTITY_TABLES.categories).select("*").eq("user_id", userId),
    client.from(ENTITY_TABLES.purchases).select("*").eq("user_id", userId),
    client.from(ENTITY_TABLES.recurringItems).select("*").eq("user_id", userId),
    client.from(ENTITY_TABLES.spendingRules).select("*").eq("user_id", userId),
    client.from(ENTITY_TABLES.importedTransactions).select("*").eq("user_id", userId),
    client.from(ENTITY_TABLES.fenceLearningEvents).select("*").eq("user_id", userId),
    client.from("app_settings").select("data").eq("user_id", userId).maybeSingle()
  ]);

  const firstError =
    categoriesRes.error ||
    purchasesRes.error ||
    recurringRes.error ||
    rulesRes.error ||
    importedRes.error ||
    learningRes.error ||
    settingsRes.error;
  if (firstError) throw new Error(firstError.message);

  const categories = (categoriesRes.data ?? []).map(categoryFromRow);
  const purchases = (purchasesRes.data ?? []).map(purchaseFromRow);
  const recurringItems = (recurringRes.data ?? []).map(recurringFromRow);
  const spendingRules = (rulesRes.data ?? []).map(ruleFromRow);
  const importedTransactions = (importedRes.data ?? []).map(importedFromRow);
  const fenceLearningEvents = (learningRes.data ?? []).map(learningFromRow);
  const settings = (settingsRes.data?.data ?? {}) as Partial<AppSettingsData>;

  const hasData =
    Boolean(settingsRes.data) ||
    categories.length > 0 ||
    purchases.length > 0 ||
    recurringItems.length > 0 ||
    spendingRules.length > 0 ||
    importedTransactions.length > 0 ||
    fenceLearningEvents.length > 0;

  const state: SpendFenceState = {
    ...initialState,
    ...settings,
    categories,
    purchases,
    recurringItems,
    spendingRules,
    importedTransactions,
    fenceLearningEvents
  };

  return { state, hasData };
}

// ---------------------------------------------------------------------------
// Migration: push a full local state up (used once when the server is empty).
// ---------------------------------------------------------------------------

export async function pushFullStateToSupabase(client: SupabaseClient, userId: string, state: SpendFenceState): Promise<void> {
  const ops: Promise<unknown>[] = [];

  for (const key of Object.keys(ENTITY_CONFIG) as EntityKey[]) {
    const config = ENTITY_CONFIG[key];
    const items = state[key] as unknown[];
    if (!items?.length) continue;
    const rows = items.map((item) => config.toRow(item as never, userId));
    ops.push(throwOnError(client.from(config.table).upsert(rows, { onConflict: "id" })));
  }

  ops.push(
    throwOnError(client.from("app_settings").upsert({ user_id: userId, data: extractSettings(state), updated_at: new Date().toISOString() }, { onConflict: "user_id" }))
  );

  await Promise.all(ops);
}

// ---------------------------------------------------------------------------
// Incremental diff sync for ongoing mutations.
// ---------------------------------------------------------------------------

export async function syncStateDiff(
  client: SupabaseClient,
  userId: string,
  prev: SpendFenceState,
  next: SpendFenceState
): Promise<void> {
  const ops: Promise<unknown>[] = [];

  for (const key of Object.keys(ENTITY_CONFIG) as EntityKey[]) {
    const config = ENTITY_CONFIG[key];
    const prevItems = (prev[key] ?? []) as { id: string }[];
    const nextItems = (next[key] ?? []) as { id: string }[];

    const prevById = new Map(prevItems.map((item) => [item.id, item]));
    const nextIds = new Set(nextItems.map((item) => item.id));

    const upserts = nextItems
      .filter((item) => {
        const before = prevById.get(item.id);
        return !before || JSON.stringify(before) !== JSON.stringify(item);
      })
      .map((item) => config.toRow(item as never, userId));
    if (upserts.length) {
      ops.push(throwOnError(client.from(config.table).upsert(upserts, { onConflict: "id" })));
    }

    const removedIds = prevItems.filter((item) => !nextIds.has(item.id)).map((item) => item.id);
    if (removedIds.length) {
      ops.push(throwOnError(client.from(config.table).delete().eq("user_id", userId).in("id", removedIds)));
    }
  }

  const prevSettings = extractSettings(prev);
  const nextSettings = extractSettings(next);
  if (JSON.stringify(prevSettings) !== JSON.stringify(nextSettings)) {
    ops.push(
      throwOnError(client.from("app_settings").upsert({ user_id: userId, data: nextSettings, updated_at: new Date().toISOString() }, { onConflict: "user_id" }))
    );
  }

  await Promise.all(ops);
}

async function throwOnError(builder: PromiseLike<{ error: { message: string } | null }>): Promise<void> {
  const { error } = await builder;
  if (error) throw new Error(error.message);
}
