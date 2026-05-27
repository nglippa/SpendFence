import "server-only";

import { request as httpsRequest } from "node:https";
import type { RequestOptions } from "node:https";
import { createClient } from "@supabase/supabase-js";
import { categorizeTransaction } from "@/lib/categorization";
import { hasSupabaseConfig } from "@/lib/supabase";
import type { ApiUser } from "@/lib/server-auth";
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
const supabasePublicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
const supabaseKey = supabaseServiceRoleKey ?? supabasePublicKey;

export function tellerConfig() {
  const applicationId = process.env.NEXT_PUBLIC_TELLER_APPLICATION_ID?.trim() ?? process.env.TELLER_APPLICATION_ID?.trim() ?? "";
  const serverConfig = tellerServerConfig();
  return {
    applicationId,
    environment: serverConfig.environment,
    configured: Boolean(applicationId && applicationId !== "your_teller_app_id"),
    apiConfigured: serverConfig.apiConfigured
  };
}

export async function saveTellerEnrollment(user: ApiUser, payload: TellerEnrollmentPayload) {
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
    const supabase = serverSupabase(user);
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

  const existing = memoryConnections.get(user.id) ?? [];
  memoryConnections.set(user.id, [connection, ...existing.filter((item) => item.enrollment_id !== connection.enrollment_id)]);
  return sanitizeConnection(connection);
}

export async function listTellerConnections(user: ApiUser) {
  const connections = await getStoredConnections(user);
  return connections.map(sanitizeConnection);
}

export async function disconnectTeller(user: ApiUser, connectionId?: string) {
  if (canUseSupabase()) {
    const supabase = serverSupabase(user);
    let query = supabase.from("bank_connections").update({ status: "disconnected", updated_at: new Date().toISOString() }).eq("user_id", user.id).eq("provider", "teller");
    if (connectionId) query = query.eq("id", connectionId);
    const { error } = await query;
    if (error) throw new Error("Bank connection could not be disconnected.");
    return;
  }

  const current = memoryConnections.get(user.id) ?? [];
  memoryConnections.set(
    user.id,
    current.map((item) => (!connectionId || item.id === connectionId ? { ...item, status: "disconnected", updated_at: new Date().toISOString() } : item))
  );
}

export async function fetchTellerAccounts(user: ApiUser) {
  const connection = await activeConnection(user);
  if (!connection) return [];

  const accounts = await tellerFetch<TellerAccount[]>("/accounts", connection.access_token);
  return accounts.map((account) => ({
    id: account.id,
    name: account.name ?? "Account",
    institution: account.institution?.name ?? connection.institution_name,
    type: account.type ?? "unknown",
    subtype: account.subtype ?? undefined,
    currency: account.currency ?? "USD"
  }));
}

export async function fetchTellerTransactions(user: ApiUser, input?: { userCategories?: Category[]; merchantRules?: MerchantCategoryRule[] }) {
  const connection = await activeConnection(user);
  if (!connection) return [];

  const accounts = await tellerFetch<TellerAccount[]>("/accounts", connection.access_token);
  const accountTransactions = await Promise.all(
    accounts.map(async (account) => ({
      account,
      transactions: await tellerFetch<TellerTransaction[]>(`/accounts/${encodeURIComponent(account.id)}/transactions`, connection.access_token)
    }))
  );

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

async function activeConnection(user: ApiUser) {
  return (await getStoredConnections(user)).find((connection) => connection.status === "connected") ?? null;
}

async function getStoredConnections(user: ApiUser): Promise<TellerConnection[]> {
  if (canUseSupabase()) {
    const supabase = serverSupabase(user);
    const { data, error } = await supabase
      .from("bank_connections")
      .select("id,user_id,provider,access_token,institution_name,enrollment_id,created_at,updated_at,status")
      .eq("user_id", user.id)
      .eq("provider", "teller")
      .order("created_at", { ascending: false });
    if (error) throw new Error("Bank connections could not be loaded.");
    return (data ?? []) as TellerConnection[];
  }

  return memoryConnections.get(user.id) ?? [];
}

async function tellerFetch<T>(path: string, accessToken: string): Promise<T> {
  const config = tellerServerConfig();
  if (config.mtlsRequired && !config.hasMtls) throw new Error("Teller mTLS credentials are not configured.");

  return tellerRequestJson<T>(new URL(path, config.domain), {
    cert: config.cert,
    key: config.certKey,
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

function canUseSupabase() {
  return Boolean(hasSupabaseConfig && supabaseUrl && supabaseKey);
}

function serverSupabase(user: ApiUser) {
  if (!supabaseUrl || !supabaseKey) throw new Error("Supabase is not configured.");
  return createClient(supabaseUrl, supabaseKey, {
    global: supabaseServiceRoleKey || !user.accessToken ? undefined : {
      headers: {
        Authorization: `Bearer ${user.accessToken}`
      }
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

function tellerServerConfig() {
  const cert = normalizePemEnv(process.env.TELLER_CERT);
  const certKey = normalizePemEnv(process.env.TELLER_CERT_KEY);
  const auth = normalizeEnv(process.env.TELLER_AUTH);
  const environment = normalizeEnv(process.env.TELLER_ENVIRONMENT) || "sandbox";
  const domain = normalizeTellerDomain(process.env.TELLER_DOMAIN);
  const hasMtls = Boolean(cert && certKey);
  return {
    cert,
    certKey,
    auth,
    domain,
    environment,
    hasMtls,
    mtlsRequired: environment !== "sandbox",
    apiConfigured: Boolean(domain && auth && (environment === "sandbox" || hasMtls))
  };
}

function normalizeEnv(value?: string) {
  const normalized = value?.trim() ?? "";
  if (!normalized || normalized.startsWith("paste ") || normalized === "optional_later") return "";
  return normalized;
}

function normalizePemEnv(value?: string) {
  return normalizeEnv(value).replace(/\\n/g, "\n");
}

function normalizeTellerDomain(value?: string) {
  const domain = normalizeEnv(value) || "api.teller.io";
  const withProtocol = /^https?:\/\//i.test(domain) ? domain : `https://${domain}`;
  return withProtocol.replace(/\/+$/, "");
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
