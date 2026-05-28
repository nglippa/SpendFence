import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { hasSupabaseConfig } from "@/lib/supabase";
import type { ApiUser } from "@/lib/server-auth";
import { isActiveStripeSubscriptionStatus, normalizeTier, type AppTier } from "@/lib/tier";

const stripeApiBase = "https://api.stripe.com/v1";
const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "canceled"
  | "unpaid"
  | "incomplete"
  | "incomplete_expired"
  | "past_due"
  | "paused";

export type StoredSubscription = {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  status: SubscriptionStatus | string;
  price_id: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
};

type StripeCheckoutSession = {
  id: string;
  object: "checkout.session";
  customer?: string;
  subscription?: string;
  client_reference_id?: string;
  metadata?: Record<string, string>;
};

type StripeSubscription = {
  id: string;
  object: "subscription";
  customer: string;
  status: SubscriptionStatus | string;
  current_period_end?: number;
  metadata?: Record<string, string>;
  items?: {
    data?: Array<{
      price?: {
        id?: string;
      };
    }>;
  };
};

type StripeEvent = {
  id: string;
  type: string;
  data: {
    object: unknown;
  };
};

export function stripeConfigured() {
  return Boolean(stripeSecretKey);
}

export function stripeWebhookConfigured() {
  return Boolean(stripeWebhookSecret);
}

export function premiumPriceIdForPlan(plan: unknown) {
  const normalized = plan === "yearly" ? "yearly" : "monthly";
  const priceId =
    normalized === "yearly"
      ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PREMIUM_YEARLY?.trim()
      : process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PREMIUM_MONTHLY?.trim();
  return { plan: normalized, priceId };
}

export async function createCheckoutSession(user: ApiUser, input: { plan?: unknown; origin: string }) {
  if (!stripeSecretKey) throw new Error("Stripe is not configured.");
  const { plan, priceId } = premiumPriceIdForPlan(input.plan);
  if (!priceId) throw new Error("Stripe Premium price is not configured.");

  const customerId = await getOrCreateStripeCustomer(user);
  const params = new URLSearchParams({
    mode: "subscription",
    customer: customerId,
    client_reference_id: user.id,
    success_url: `${input.origin}/settings/premium?success=true`,
    cancel_url: `${input.origin}/pricing?canceled=true`,
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    "metadata[user_id]": user.id,
    "metadata[plan]": plan,
    "subscription_data[metadata][user_id]": user.id,
    "subscription_data[metadata][plan]": plan,
    allow_promotion_codes: "true"
  });

  const session = await stripeRequest<{ id: string; url?: string }>("/checkout/sessions", {
    method: "POST",
    body: params
  });
  return session;
}

export async function createPortalSession(user: ApiUser, origin: string) {
  if (!stripeSecretKey) throw new Error("Stripe is not configured.");
  const customerId = await stripeCustomerIdForUser(user.id);
  if (!customerId) throw new Error("No Stripe customer is linked to this account.");

  return stripeRequest<{ id: string; url?: string }>("/billing_portal/sessions", {
    method: "POST",
    body: new URLSearchParams({
      customer: customerId,
      return_url: `${origin}/settings/premium`
    })
  });
}

export async function verifyStripeWebhook(rawBody: string, signatureHeader: string | null) {
  if (!stripeWebhookSecret) throw new Error("Stripe webhook secret is not configured.");
  if (!signatureHeader) throw new Error("Missing Stripe signature.");

  const parts = signatureHeader.split(",").reduce<Record<string, string[]>>((acc, item) => {
    const [key, value] = item.split("=");
    if (!key || !value) return acc;
    acc[key] = [...(acc[key] ?? []), value];
    return acc;
  }, {});

  const timestamp = parts.t?.[0];
  const signatures = parts.v1 ?? [];
  if (!timestamp || !signatures.length) throw new Error("Invalid Stripe signature.");

  const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(ageSeconds) || ageSeconds > 300) throw new Error("Stale Stripe signature.");

  const expected = createHmac("sha256", stripeWebhookSecret).update(`${timestamp}.${rawBody}`, "utf8").digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const verified = signatures.some((signature) => {
    const actualBuffer = Buffer.from(signature, "hex");
    return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
  });

  if (!verified) throw new Error("Invalid Stripe signature.");
  return JSON.parse(rawBody) as StripeEvent;
}

export async function handleStripeEvent(event: StripeEvent) {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as StripeCheckoutSession;
    const subscriptionId = typeof session.subscription === "string" ? session.subscription : "";
    if (subscriptionId) {
      const subscription = await retrieveStripeSubscription(subscriptionId);
      await upsertStripeSubscription(subscription, session.client_reference_id ?? session.metadata?.user_id);
    }
    return;
  }

  if (event.type.startsWith("customer.subscription.")) {
    await upsertStripeSubscription(event.data.object as StripeSubscription);
  }
}

export async function subscriptionForUser(userId: string) {
  if (!canUseSupabase()) return null;
  const supabase = serverSupabase();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("id,user_id,stripe_customer_id,stripe_subscription_id,status,price_id,current_period_end,created_at,updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error("Subscription status could not be loaded.");
  return data as StoredSubscription | null;
}

export async function activeSubscriptionTierForUser(userId: string): Promise<AppTier | null> {
  const subscription = await subscriptionForUser(userId);
  if (!subscription) return null;
  return isPremiumSubscriptionStatus(subscription.status) ? "premium" : "free";
}

export function isPremiumSubscriptionStatus(status?: string | null) {
  return isActiveStripeSubscriptionStatus(status);
}

async function getOrCreateStripeCustomer(user: ApiUser) {
  const existing = await stripeCustomerIdForUser(user.id);
  if (existing) return existing;

  const params = new URLSearchParams({
    "metadata[user_id]": user.id
  });
  if (user.email) params.set("email", user.email);

  const customer = await stripeRequest<{ id: string }>("/customers", {
    method: "POST",
    body: params
  });
  return customer.id;
}

async function stripeCustomerIdForUser(userId: string) {
  const subscription = await subscriptionForUser(userId);
  return subscription?.stripe_customer_id ?? "";
}

async function retrieveStripeSubscription(subscriptionId: string) {
  return stripeRequest<StripeSubscription>(`/subscriptions/${encodeURIComponent(subscriptionId)}`, {
    method: "GET"
  });
}

async function upsertStripeSubscription(subscription: StripeSubscription, fallbackUserId?: string) {
  if (!canUseSupabase()) throw new Error("Supabase service-role access is required for subscriptions.");

  const userId = subscription.metadata?.user_id ?? fallbackUserId ?? (await userIdForStripeCustomer(subscription.customer));
  if (!userId) throw new Error("Stripe subscription is missing a SpendFence user.");

  const supabase = serverSupabase();
  const priceId = subscription.items?.data?.[0]?.price?.id ?? null;
  const currentPeriodEnd = subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null;
  const { error } = await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: subscription.customer,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      price_id: priceId,
      current_period_end: currentPeriodEnd,
      updated_at: new Date().toISOString()
    },
    { onConflict: "stripe_subscription_id" }
  );
  if (error) throw new Error("Subscription status could not be saved.");
}

async function userIdForStripeCustomer(customerId: string) {
  if (!canUseSupabase()) return "";
  const supabase = serverSupabase();
  const { data } = await supabase.from("subscriptions").select("user_id").eq("stripe_customer_id", customerId).order("updated_at", { ascending: false }).limit(1).maybeSingle();
  return data?.user_id ?? "";
}

async function stripeRequest<T>(path: string, init: { method: "GET" | "POST"; body?: URLSearchParams }) {
  if (!stripeSecretKey) throw new Error("Stripe is not configured.");
  const response = await fetch(`${stripeApiBase}${path}`, {
    method: init.method,
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      ...(init.body ? { "Content-Type": "application/x-www-form-urlencoded" } : {})
    },
    body: init.body
  });

  const data = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
  if (!response.ok) throw new Error(data.error?.message ?? "Stripe request failed.");
  return data as T;
}

function canUseSupabase() {
  return Boolean(hasSupabaseConfig && supabaseUrl && supabaseServiceRoleKey);
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

export function subscriptionTierFromStatus(status?: string | null) {
  return normalizeTier(isPremiumSubscriptionStatus(status) ? "premium" : "free") ?? "free";
}
