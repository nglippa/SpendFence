import "server-only";

import { existsSync, readFileSync } from "node:fs";
import { request as httpsRequest } from "node:https";
import type { RequestOptions } from "node:https";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { canLinkMoreTellerAccounts, tellerAccountLimitForTier, TELLER_ACCOUNT_LIMIT_MESSAGE } from "@/lib/bank-sync-limits";
import { categorizeTransaction } from "@/lib/categorization";
import { hasSupabaseConfig } from "@/lib/supabase";
import type { ApiUser } from "@/lib/server-auth";
import { getEffectiveTier } from "@/lib/tier";
import type { Category, ImportedTransactionInput, MerchantCategoryRule } from "@/lib/types";

export type TellerConnection = {
  id: string;
  user_id: string;
  provider: "teller";
  access_token: string;
  institution_name: string;
  enrollment_id?: string;
  created_at: string;
  updated_at: string;
  status: "connected" | "disconnected" | "error";
};

type TellerEnrollmentPayload = {
  accessToken: string;
  enrollment?: {
    id?: string;
    institution?: {
      name?: string;
    };
  };
  enrollmentId?: string;
  institutionName?: string;
};

type TellerAccount = {
  id: string;
  name?: string;
  institution?: { name?: string };
  type?: string;
  subtype?: string;
  currency?: string;
  links?: { transactions?: string };
};

type TellerTransaction = {
  id: string;
  account_id?: string;
  account?: string;
  date?: string;
  description?: string;
  details?: {
    category?: string;
    counterparty?: { name?: string };
  };
  amount?: string | number;
  status?: string;
  running_balance?: string | number;
};

declare global {
  var __spendFenceTellerConnections: Map<string, TellerConnection[]> | undefined;
}

const memoryConnections = globalThis.__spendFenceTellerConnections ?? new Map<string, TellerConnection[]>();
globalThis.__spendFenceTellerConnections = memoryConnections;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

export function tellerConfig() {
  const applicationId = normalizeEnv(process.env.NEXT_PUBLIC_TELLER_APPLICATION_ID);
  const serverConfig = tellerServerConfig();
  return {
    applicationId,
    environment: serverConfig.environment,
    configured: Boolean(applicationId && applicationId !== "your_teller_app_id"),
    apiConfigured: serverConfig.apiConfigured
  };
}

export async function saveTellerEnrollment(user: ApiUser, payload: TellerEnrollmentPayload) {
  const limitStatus = await tellerAccountLimitStatus(user);
  if (!limitStatus.canLinkMore) throw new TellerAccountLimitError();

  const incomingAccountCount = await countAccountsForToken(payload.accessToken);
  if (!canLinkMoreTellerAccounts(limitStatus.tier, limitStatus.accountCount + Math.max(incomingAccountCount, 1) - 1)) {
    throw new TellerAccountLimitError();
  }

  const now = new Date().toISOString();
  const connection: TellerConnection = {
    id: crypto.randomUUID(),
    user_id: user.id,
    provider: "teller",
    access_token: payload.accessToken,
    institution_name: payload.institutionName ?? payload.enrollment?.institution?.name ?? "Teller institution",
    enrollment_id: payload.enrollmentId ?? payload.enrollment?.id,
    created_at: now,
    updated_at: now,
    status: "connected"
  };

  if (canUseSupabase()) {
    const supabase = serverSupabase();
    const { data, error } = await supabase
      .from("bank_connections")
      .insert({
        user_id: connection.user_id,
        provider: connection.provider,
        access_token: connection.access_token,
        institution_name: connection.institution_name,
        enrollment_id: connection.enrollment_id,
        status: connection.status
      })
      .select("id,user_id,provider,institution_name,enrollment_id,created_at,updated_at,status")
      .single();
    if (error) throw new Error("Bank connection could not be saved.");
    return data as Omit<TellerConnection, "access_token">;
  }

  assertMemoryStoreAvailable();
  const existing = memoryConnections.get(user.id) ?? [];
  memoryConnections.set(user.id, [connection, ...existing.filter((item) => item.enrollment_id !== connection.enrollment_id)]);
  return sanitizeConnection(connection);
}

export async function listTellerConnections(user: ApiUser) {
  const connections = await getStoredConnections(user);
  return connections.map(sanitizeConnection);
}

export async function tellerAccountLimitStatus(user: ApiUser) {
  const tier = getEffectiveTier(user);
  const connectedAccountCount = await connectedTellerAccountCount(user);
  const accountLimit = tellerAccountLimitForTier(tier);
  return {
    tier,
    accountCount: connectedAccountCount.count,
    accountCountSource: connectedAccountCount.source,
    accountLimit,
    canLinkMore: canLinkMoreTellerAccounts(tier, connectedAccountCount.count),
    message: canLinkMoreTellerAccounts(tier, connectedAccountCount.count) ? undefined : TELLER_ACCOUNT_LIMIT_MESSAGE
  };
}

export async function disconnectTeller(user: ApiUser, connectionId?: string) {
  if (canUseSupabase()) {
    const supabase = serverSupabase();
    let query = supabase.from("bank_connections").update({ status: "disconnected", updated_at: new Date().toISOString() }).eq("user_id", user.id).eq("provider", "teller");
    if (connectionId) query = query.eq("id", connectionId);
    const { error } = await query;
    if (error) throw new Error("Bank connection could not be disconnected.");
    return;
  }

  assertMemoryStoreAvailable();
  const current = memoryConnections.get(user.id) ?? [];
  memoryConnections.set(
    user.id,
    current.map((item) => (!connectionId || item.id === connectionId ? { ...item, status: "disconnected", updated_at: new Date().toISOString() } : item))
  );
}

export async function fetchTellerAccounts(user: ApiUser) {
  const connections = await activeConnections(user);
  if (!connections.length) return [];

  return fetchAccountsForConnections(connections);
}

export async function fetchTellerTransactions(user: ApiUser, input?: { userCategories?: Category[]; merchantRules?: MerchantCategoryRule[] }) {
  const connections = await activeConnections(user);
  if (!connections.length) return [];

  const accountTransactions = (
    await Promise.all(
      connections.map(async (connection) => {
        const accounts = await tellerFetch<TellerAccount[]>("/accounts", connection.access_token);
        return Promise.all(
          accounts.map(async (account) => ({
            account,
            transactions: await tellerFetch<TellerTransaction[]>(`/accounts/${encodeURIComponent(account.id)}/transactions`, connection.access_token)
          }))
        );
      })
    )
  ).flat();

  return accountTransactions.flatMap(({ account, transactions }) =>
    transactions.map((transaction) => {
      const normalized = normalizeTransaction(transaction, account);
      const suggestion = categorizeTransaction(
        {
          merchantName: normalized.merchantName,
          description: normalized.description,
          amount: normalized.amount,
          plaidCategory: normalized.plaidCategory
        },
        input?.userCategories ?? [],
        input?.merchantRules ?? []
      );

      return {
        ...normalized,
        suggestedCategoryId: suggestion.suggestedCategoryId,
        confidence: suggestion.confidence,
        suggestionReason: suggestion.reason,
        suggestionSource: suggestion.source
      } satisfies ImportedTransactionInput;
    })
  );
}

async function activeConnections(user: ApiUser) {
  return (await getStoredConnections(user)).filter((connection) => connection.status === "connected");
}

async function connectedTellerAccountCount(user: ApiUser): Promise<{ count: number; source: "accounts" | "connections" }> {
  const connections = await activeConnections(user);
  if (!connections.length) return { count: 0, source: "accounts" };

  try {
    const accounts = await fetchAccountsForConnections(connections);
    return { count: accounts.length, source: "accounts" };
  } catch {
    return { count: connections.length, source: "connections" };
  }
}

async function countAccountsForToken(accessToken: string) {
  try {
    const accounts = await tellerFetch<TellerAccount[]>("/accounts", accessToken);
    return accounts.length;
  } catch {
    return 1;
  }
}

async function fetchAccountsForConnections(connections: TellerConnection[]) {
  const accountGroups = await Promise.all(
    connections.map(async (connection) => {
      const accounts = await tellerFetch<TellerAccount[]>("/accounts", connection.access_token);
      return accounts.map((account) => ({
        id: account.id,
        name: account.name ?? "Account",
        institution: account.institution?.name ?? connection.institution_name,
        type: account.type ?? "unknown",
        subtype: account.subtype ?? undefined,
        currency: account.currency ?? "USD"
      }));
    })
  );
  return accountGroups.flat();
}

async function getStoredConnections(user: ApiUser): Promise<TellerConnection[]> {
  if (canUseSupabase()) {
    const supabase = serverSupabase();
    const { data, error } = await supabase
      .from("bank_connections")
      .select("id,user_id,provider,access_token,institution_name,enrollment_id,created_at,updated_at,status")
      .eq("user_id", user.id)
      .eq("provider", "teller")
      .order("created_at", { ascending: false });
    if (error) throw new Error("Bank connections could not be loaded.");
    return (data ?? []) as TellerConnection[];
  }

  assertMemoryStoreAvailable();
  return memoryConnections.get(user.id) ?? [];
}

async function tellerFetch<T>(path: string, accessToken: string): Promise<T> {
  const config = tellerServerConfig();
  if (!config.hasMtls) throw new Error("Teller mTLS credentials are not configured.");

  return tellerRequestJson<T>(new URL(path, config.domain), {
    cert: config.cert,
    key: config.key,
    headers: {
      Authorization: `Basic ${Buffer.from(`${accessToken}:`).toString("base64")}`,
      "Teller-Version": "2019-07-01",
      Accept: "application/json"
    }
  });
}

function normalizeTransaction(transaction: TellerTransaction, account: TellerAccount) {
  const amount = Number(transaction.amount ?? 0);
  const merchantName = transaction.details?.counterparty?.name ?? cleanMerchant(transaction.description) ?? "Bank transaction";
  return {
    externalTransactionId: transaction.id,
    importSource: "teller" as const,
    merchantName,
    description: transaction.description ?? merchantName,
    amount: Math.abs(amount),
    date: transaction.date ? new Date(transaction.date).toISOString() : new Date().toISOString(),
    plaidCategory: transaction.details?.category,
    tellerAccountId: account.id,
    tellerAccountName: account.name,
    reviewStatus: "pending" as const
  };
}

function cleanMerchant(value?: string) {
  return value?.replace(/\s+/g, " ").trim();
}

function sanitizeConnection(connection: TellerConnection) {
  const { access_token: _accessToken, ...safe } = connection;
  return safe;
}

export class TellerAccountLimitError extends Error {
  constructor() {
    super(TELLER_ACCOUNT_LIMIT_MESSAGE);
    this.name = "TellerAccountLimitError";
  }
}

function canUseSupabase() {
  return Boolean(hasSupabaseConfig && supabaseUrl && supabaseServiceRoleKey);
}

function assertMemoryStoreAvailable() {
  if (process.env.NODE_ENV === "development") return;
  if (!hasSupabaseConfig) return;
  throw new Error("Server-side Teller token storage is not configured.");
}

function serverSupabase() {
  if (!supabaseUrl || !supabaseServiceRoleKey) throw new Error("Supabase is not configured.");
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

function tellerServerConfig() {
  const certPath = normalizeEnv(process.env.TELLER_CERT_PATH);
  const keyPath = normalizeEnv(process.env.TELLER_KEY_PATH);
  const cert = readTextFile(certPath);
  const key = readTextFile(keyPath);
  const environment = normalizeEnv(process.env.TELLER_ENVIRONMENT) || "development";
  const domain = normalizeTellerDomain(process.env.TELLER_DOMAIN);
  const hasMtls = Boolean(cert && key);
  return {
    cert,
    key,
    certPath,
    keyPath,
    domain,
    environment,
    hasMtls,
    apiConfigured: Boolean(domain && hasMtls)
  };
}

function normalizeEnv(value?: string) {
  const normalized = value?.trim() ?? "";
  if (!normalized || normalized.startsWith("paste ") || normalized === "optional_later") return "";
  return normalized;
}

function normalizeTellerDomain(value?: string) {
  const domain = normalizeEnv(value) || "api.teller.io";
  const withProtocol = /^https?:\/\//i.test(domain) ? domain : `https://${domain}`;
  return withProtocol.replace(/\/+$/, "");
}

function readTextFile(filePath: string) {
  if (!filePath) return "";
  try {
    const absolutePath = resolve(/* turbopackIgnore: true */ process.cwd(), filePath);
    if (!existsSync(absolutePath)) return "";
    return readFileSync(absolutePath, "utf8");
  } catch {
    return "";
  }
}

function tellerRequestJson<T>(url: URL, input: { cert?: string; key?: string; headers: Record<string, string> }) {
  return new Promise<T>((resolve, reject) => {
    const options: RequestOptions = {
      method: "GET",
      headers: input.headers,
      cert: input.cert || undefined,
      key: input.key || undefined
    };

    const request = httpsRequest(url, options, (response) => {
      const chunks: Buffer[] = [];
      response.on("data", (chunk: Buffer) => chunks.push(chunk));
      response.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf8");
        if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error("Teller data is unavailable right now."));
          return;
        }

        try {
          resolve(JSON.parse(body) as T);
        } catch {
          reject(new Error("Teller returned an unreadable response."));
        }
      });
    });

    request.on("error", () => reject(new Error("Teller data is unavailable right now.")));
    request.end();
  });
}
