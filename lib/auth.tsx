"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { featureFlags } from "@/lib/feature-flags";
import { clearActiveAuthStorage, clearPersistentAuthStorage, getSupabaseClient, getSupabaseConfigErrorMessage, hasSupabaseConfig } from "@/lib/supabase";
import { getEffectiveTier, normalizeTier, tierLabel, type AppTier, type DeveloperTierPreviewMode } from "@/lib/tier";

const DEMO_SESSION_KEY = "spendfence-demo-session-v1";
const DEMO_LOCKED_SESSION_KEY = "spendfence-demo-locked-session-v1";
const DEVELOPER_TIER_PREVIEW_KEY = "spendfence-dev-tier-preview-v1";
const LEGACY_TRUSTED_DEVICE_KEY = "spendfence-trusted-device-v1";

export type MfaFactorType = "totp" | "phone";

export type MfaFactor = {
  id: string;
  type: MfaFactorType;
  label: string;
  phone?: string;
};

export type MfaChallenge = {
  factorId: string;
  challengeId: string;
  type: MfaFactorType;
  expiresAt: number;
};

export type SignInResult = {
  error?: string;
  mfaRequired?: boolean;
  mfa?: {
    factors: MfaFactor[];
    challenge: MfaChallenge;
  };
};

type AuthUser = {
  id: string;
  email: string;
  isDemo: boolean;
  demoLocked?: boolean;
  realTier: AppTier;
};

type BillingSubscription = {
  status: string;
  price_id: string | null;
  current_period_end: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  authEnabled: boolean;
  isPro: boolean;
  planLabel: "Free" | "Premium";
  realTier: AppTier;
  effectiveTier: AppTier;
  subscription: BillingSubscription | null;
  subscriptionLoaded: boolean;
  isDeveloper: boolean;
  tierPreviewMode: DeveloperTierPreviewMode;
  demoModeAvailable: boolean;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signUp: (email: string, password: string) => Promise<{ error?: string; message?: string; signedIn?: boolean }>;
  resetPassword: (email: string) => Promise<{ error?: string; message?: string }>;
  startMfaChallenge: (factor: MfaFactor) => Promise<{ error?: string; challenge?: MfaChallenge }>;
  verifyMfaChallenge: (challenge: MfaChallenge, code: string) => Promise<{ error?: string }>;
  enterDemoMode: (options?: { locked?: boolean }) => void;
  getAccessToken: () => Promise<string | null>;
  authHeaders: () => Promise<HeadersInit>;
  setTierPreviewMode: (mode: DeveloperTierPreviewMode) => void;
  startUpgrade: (plan: "monthly" | "yearly") => Promise<{ error?: string; message?: string }>;
  manageBilling: () => Promise<{ error?: string; message?: string }>;
  refreshSubscription: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [serverDeveloperAllowed, setServerDeveloperAllowed] = useState(false);
  const [developerStatusLoaded, setDeveloperStatusLoaded] = useState(false);
  const [subscription, setSubscription] = useState<BillingSubscription | null>(null);
  const [subscriptionLoaded, setSubscriptionLoaded] = useState(false);
  const [tierPreviewMode, setTierPreviewModeState] = useState<DeveloperTierPreviewMode>("free");
  const [loading, setLoading] = useState(true);
  const suppressAuthEventsRef = useRef(false);
  const supabase = getSupabaseClient();
  const supabaseConfigError = getSupabaseConfigErrorMessage() ?? "Supabase auth is not configured for this environment.";
  const demoModeAvailable = true;
  const publicDeveloperEmail = process.env.NEXT_PUBLIC_DEVELOPER_EMAIL?.trim().toLowerCase() ?? "";
  const publicDeveloperAllowed = Boolean(user?.email && publicDeveloperEmail && user.email.toLowerCase() === publicDeveloperEmail);
  const isDeveloper = Boolean(user && (publicDeveloperAllowed || serverDeveloperAllowed));
  const stripeTier = subscription ? (subscription.status === "active" || subscription.status === "trialing" ? "premium" : "free") : null;
  const realTier = stripeTier ?? "free";
  const effectiveTier = getEffectiveTier({ isDeveloper, developerTierOverride: tierPreviewMode, stripeSubscriptionStatus: subscription?.status, realTier });
  const isPro = effectiveTier === "premium";

  useEffect(() => {
    clearPersistentAuthStorage();
    removeLocalStorageValue(LEGACY_TRUSTED_DEVICE_KEY);

    const demoSession = getSessionValue(DEMO_SESSION_KEY) ?? getCookieValue(DEMO_SESSION_KEY);
    if (demoSession) {
      const locked = (getSessionValue(DEMO_LOCKED_SESSION_KEY) ?? getCookieValue(DEMO_LOCKED_SESSION_KEY)) === "true";
      setUser(toDemoUser(locked));
      setLoading(false);
      return;
    }

    if (!supabase) {
      setUser(null);
      setLoading(false);
      return;
    }

    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setUser(data.session?.user ? toAuthUser(data.session.user) : null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (suppressAuthEventsRef.current) return;
      setUser(session?.user ? toAuthUser(session.user) : null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;
    setServerDeveloperAllowed(false);
    setDeveloperStatusLoaded(false);

    if (!user) {
      setDeveloperStatusLoaded(true);
      return;
    }

    developerStatusHeaders(supabase, user).then((headers) =>
      fetch("/api/developer/status", {
        headers,
        cache: "no-store"
      })
        .then((response) => response.json())
        .then((data: { isDeveloper?: boolean }) => {
          if (!cancelled) setServerDeveloperAllowed(Boolean(data.isDeveloper));
        })
        .catch(() => {
          if (!cancelled) setServerDeveloperAllowed(false);
        })
        .finally(() => {
          if (!cancelled) setDeveloperStatusLoaded(true);
        })
    );

    return () => {
      cancelled = true;
    };
  }, [supabase, user]);

  useEffect(() => {
    if (isDeveloper) {
      setTierPreviewModeState(readStoredTierPreviewMode());
      return;
    }

    if (developerStatusLoaded && user) {
      removeLocalStorageValue(DEVELOPER_TIER_PREVIEW_KEY);
    }
    setTierPreviewModeState("free");
  }, [developerStatusLoaded, isDeveloper, user]);

  useEffect(() => {
    let cancelled = false;
    setSubscription(null);
    setSubscriptionLoaded(false);

    if (!user || user.isDemo) {
      setSubscriptionLoaded(true);
      return;
    }

    subscriptionHeaders(supabase, user, { isDeveloper, tierPreviewMode, realTier: user.realTier })
      .then((headers) =>
        fetch("/api/stripe/subscription", {
          headers,
          cache: "no-store"
        })
      )
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { subscription?: BillingSubscription | null } | null) => {
        if (!cancelled) setSubscription(data?.subscription ?? null);
      })
      .catch(() => {
        if (!cancelled) setSubscription(null);
      })
      .finally(() => {
        if (!cancelled) setSubscriptionLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [isDeveloper, supabase, tierPreviewMode, user]);

  async function refreshSubscription() {
    if (!user || user.isDemo) {
      setSubscription(null);
      setSubscriptionLoaded(true);
      return;
    }

    const headers = await subscriptionHeaders(supabase, user, { isDeveloper, tierPreviewMode, realTier: user.realTier });
    const response = await fetch("/api/stripe/subscription", { headers, cache: "no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as { subscription?: BillingSubscription | null };
    setSubscription(data.subscription ?? null);
    setSubscriptionLoaded(true);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      authEnabled: hasSupabaseConfig,
      isPro,
      planLabel: tierLabel(effectiveTier),
      realTier,
      effectiveTier,
      subscription,
      subscriptionLoaded,
      isDeveloper,
      tierPreviewMode,
      demoModeAvailable,
      signIn: async (email, password) => {
        if (!supabase) return { error: supabaseConfigError };
        suppressAuthEventsRef.current = true;
        setLoading(true);
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          suppressAuthEventsRef.current = false;
          setLoading(false);
          return { error: error.message };
        }

        const aal = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aal.error) {
          suppressAuthEventsRef.current = false;
          setLoading(false);
          return { error: aal.error.message };
        }

        if (aal.data.currentLevel !== aal.data.nextLevel && aal.data.nextLevel === "aal2") {
          const factorsResult = await supabase.auth.mfa.listFactors();
          if (factorsResult.error) {
            suppressAuthEventsRef.current = false;
            setLoading(false);
            return { error: factorsResult.error.message };
          }

          const factors = normalizeMfaFactors(factorsResult.data);
          if (!factors.length) {
            suppressAuthEventsRef.current = false;
            setLoading(false);
            return { error: "MFA is required, but no verified factors are available for this account." };
          }

          const primaryMethod = data.user?.user_metadata?.spendfence_mfa_primary_method;
          const preferredFactor = choosePreferredFactor(factors, primaryMethod);
          const challenge = await createMfaChallenge(supabase, preferredFactor);
          if (challenge.error || !challenge.challenge) {
            suppressAuthEventsRef.current = false;
            setLoading(false);
            return { error: challenge.error ?? "Could not start MFA verification." };
          }

          setLoading(false);
          return { mfaRequired: true, mfa: { factors, challenge: challenge.challenge } };
        }

        const confirmedUser = await waitForSessionUser(supabase);
        if (!confirmedUser) {
          suppressAuthEventsRef.current = false;
          setLoading(false);
          return { error: "Signed in, but the session was not ready. Please try again." };
        }
        clearDemoSession();
        suppressAuthEventsRef.current = false;
        setUser(toAuthUser(confirmedUser));
        setLoading(false);
        return {};
      },
      signUp: async (email, password) => {
        if (!supabase) return { error: supabaseConfigError };
        suppressAuthEventsRef.current = true;
        setLoading(true);
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: authRedirectUrl("/login") }
        });
        if (error) {
          suppressAuthEventsRef.current = false;
          setLoading(false);
          return { error: error.message };
        }
        if (data.session?.user) {
          const confirmedUser = await waitForSessionUser(supabase);
          if (confirmedUser) {
            clearDemoSession();
            suppressAuthEventsRef.current = false;
            setUser(toAuthUser(confirmedUser));
            setLoading(false);
            return { message: "Account created.", signedIn: true };
          }

          suppressAuthEventsRef.current = false;
          setLoading(false);
          return { error: "Account created, but the session was not ready. Please log in to continue." };
        }
        suppressAuthEventsRef.current = false;
        setLoading(false);
        return { message: "Check your email if confirmation is enabled.", signedIn: Boolean(data.session) };
      },
      resetPassword: async (email) => {
        if (!supabase) return { error: supabaseConfigError };
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: authRedirectUrl("/login") });
        return error ? { error: error.message } : { message: "Password reset email sent." };
      },
      startMfaChallenge: async (factor) => {
        if (!supabase) return { error: supabaseConfigError };
        return createMfaChallenge(supabase, factor);
      },
      verifyMfaChallenge: async (challenge, code) => {
        if (!supabase) return { error: supabaseConfigError };
        suppressAuthEventsRef.current = true;
        setLoading(true);
        const { error } = await supabase.auth.mfa.verify({
          factorId: challenge.factorId,
          challengeId: challenge.challengeId,
          code
        });
        if (error) {
          suppressAuthEventsRef.current = false;
          setLoading(false);
          return { error: error.message };
        }

        const confirmedUser = await waitForSessionUser(supabase);
        if (!confirmedUser) {
          suppressAuthEventsRef.current = false;
          setLoading(false);
          return { error: "Verified MFA, but the session was not ready. Please try again." };
        }
        clearDemoSession();
        suppressAuthEventsRef.current = false;
        setUser(toAuthUser(confirmedUser));
        setLoading(false);
        return {};
      },
      enterDemoMode: (options) => {
        const locked = Boolean(options?.locked);
        setSessionValue(DEMO_SESSION_KEY, "true");
        setCookieValue(DEMO_SESSION_KEY, "true");
        if (locked) setSessionValue(DEMO_LOCKED_SESSION_KEY, "true");
        if (locked) setCookieValue(DEMO_LOCKED_SESSION_KEY, "true");
        else {
          removeSessionValue(DEMO_LOCKED_SESSION_KEY);
          removeCookieValue(DEMO_LOCKED_SESSION_KEY);
        }
        setUser(toDemoUser(locked));
      },
      getAccessToken: async () => {
        if (!supabase || user?.isDemo) return null;
        const { data } = await supabase.auth.getSession();
        return data.session?.access_token ?? null;
      },
      authHeaders: () => subscriptionHeaders(supabase, user, { isDeveloper, tierPreviewMode, realTier }),
      setTierPreviewMode: (mode) => {
        if (!isDeveloper) return;
        setLocalStorageValue(DEVELOPER_TIER_PREVIEW_KEY, mode);
        setTierPreviewModeState(mode);
      },
      startUpgrade: async (plan) => {
        const response = await fetch("/api/stripe/create-checkout-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(await subscriptionHeaders(supabase, user, { isDeveloper, tierPreviewMode, realTier }))
          },
          body: JSON.stringify({ plan })
        });
        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as { message?: string };
          return { error: data.message ?? "Stripe checkout is not configured yet. Add Stripe keys to enable subscriptions." };
        }
        const data = (await response.json()) as { url?: string; message?: string };
        if (data.url) window.location.href = data.url;
        return { message: data.message ?? "Upgrade flow prepared." };
      },
      manageBilling: async () => {
        const response = await fetch("/api/stripe/create-portal-session", {
          method: "POST",
          headers: await subscriptionHeaders(supabase, user, { isDeveloper, tierPreviewMode, realTier })
        });
        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as { message?: string };
          return { error: data.message ?? "Billing portal is not configured yet." };
        }
        const data = (await response.json()) as { url?: string; message?: string };
        if (data.url) window.location.href = data.url;
        return { message: data.message ?? "Billing portal prepared." };
      },
      refreshSubscription,
      signOut: async () => {
        suppressAuthEventsRef.current = false;
        const isDemoSession = (getSessionValue(DEMO_SESSION_KEY) ?? getCookieValue(DEMO_SESSION_KEY)) === "true";
        clearDemoSession();
        removeLocalStorageValue(LEGACY_TRUSTED_DEVICE_KEY);
        if (supabase && !isDemoSession) await supabase.auth.signOut();
        clearActiveAuthStorage();
        setUser(null);
        setServerDeveloperAllowed(false);
        setDeveloperStatusLoaded(false);
        setSubscription(null);
        setSubscriptionLoaded(false);
        setTierPreviewModeState("free");
      }
    }),
    [demoModeAvailable, effectiveTier, isDeveloper, isPro, loading, realTier, subscription, subscriptionLoaded, supabase, supabaseConfigError, tierPreviewMode, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

function getSessionValue(key: string) {
  try {
    return window.sessionStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function setSessionValue(key: string, value: string) {
  try {
    window.sessionStorage?.setItem(key, value);
  } catch {
    // Demo mode still works in-memory if sessionStorage is unavailable.
  }
}

function removeSessionValue(key: string) {
  try {
    window.sessionStorage?.removeItem(key);
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}

function getLocalStorageValue(key: string) {
  try {
    return window.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function setLocalStorageValue(key: string, value: string) {
  try {
    window.localStorage?.setItem(key, value);
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
}

function removeLocalStorageValue(key: string) {
  try {
    window.localStorage?.removeItem(key);
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}

function getCookieValue(key: string) {
  try {
    const match = document.cookie
      .split("; ")
      .find((item) => item.startsWith(`${encodeURIComponent(key)}=`));
    return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
  } catch {
    return null;
  }
}

function setCookieValue(key: string, value: string) {
  try {
    document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}; path=/; max-age=28800; samesite=lax`;
  } catch {
    // Demo mode still works in-memory if cookies are unavailable.
  }
}

function removeCookieValue(key: string) {
  try {
    document.cookie = `${encodeURIComponent(key)}=; path=/; max-age=0; samesite=lax`;
  } catch {
    // Nothing to clear when cookies are unavailable.
  }
}

function clearDemoSession() {
  removeSessionValue(DEMO_SESSION_KEY);
  removeSessionValue(DEMO_LOCKED_SESSION_KEY);
  removeCookieValue(DEMO_SESSION_KEY);
  removeCookieValue(DEMO_LOCKED_SESSION_KEY);
}

async function waitForSessionUser(supabase: SupabaseClient) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) return data.session.user;
    await wait(100);
  }

  return null;
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function authRedirectUrl(path: string) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return origin ? `${origin}${path}` : path;
}

function toDemoUser(locked = false): AuthUser {
  return {
    id: locked ? "demo-preview-user" : "demo-user",
    email: "demo@spendfence.local",
    isDemo: true,
    demoLocked: locked,
    realTier: "free"
  };
}

function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email ?? "Signed-in user",
    isDemo: false,
    realTier: "free"
  };
}

function readStoredTierPreviewMode(): DeveloperTierPreviewMode {
  return normalizeTier(getLocalStorageValue(DEVELOPER_TIER_PREVIEW_KEY)) ?? "free";
}

async function developerStatusHeaders(supabase: SupabaseClient | null, user: AuthUser): Promise<HeadersInit> {
  if (supabase && !user.isDemo) {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) return { Authorization: `Bearer ${data.session.access_token}` };
  }

  if (process.env.NODE_ENV === "development") return { "x-spendfence-dev-user": user.id };
  return {};
}

async function subscriptionHeaders(
  supabase: SupabaseClient | null,
  user: AuthUser | null,
  options: { isDeveloper: boolean; tierPreviewMode: DeveloperTierPreviewMode; realTier: AppTier }
): Promise<HeadersInit> {
  const headers: Record<string, string> = {};
  if (supabase && user && !user.isDemo) {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) headers.Authorization = `Bearer ${data.session.access_token}`;
  }

  if (options.isDeveloper) headers["x-spendfence-dev-tier-preview"] = options.tierPreviewMode;
  if (user?.email) headers["x-spendfence-dev-email"] = user.email;
  headers["x-spendfence-real-tier"] = options.realTier;
  if (process.env.NODE_ENV === "development" && user?.id) headers["x-spendfence-dev-user"] = user.id;
  return headers;
}

function normalizeMfaFactors(data: { totp: unknown[]; phone: unknown[] }): MfaFactor[] {
  const totp = data.totp.map((factor) => toMfaFactor(factor, "totp"));
  // TODO(sms-mfa): Phone factors are intentionally kept in the model but hidden
  // from active login while ENABLE_SMS_MFA is false.
  const phone = featureFlags.ENABLE_SMS_MFA ? data.phone.map((factor) => toMfaFactor(factor, "phone")) : [];
  return [...totp, ...phone].filter(Boolean) as MfaFactor[];
}

function toMfaFactor(factor: unknown, type: MfaFactorType): MfaFactor | null {
  if (!factor || typeof factor !== "object") return null;
  const raw = factor as { id?: unknown; friendly_name?: unknown; phone?: unknown };
  if (typeof raw.id !== "string") return null;

  const fallbackLabel = type === "totp" ? "Authenticator app" : "SMS phone";
  return {
    id: raw.id,
    type,
    label: typeof raw.friendly_name === "string" && raw.friendly_name ? raw.friendly_name : fallbackLabel,
    phone: typeof raw.phone === "string" ? raw.phone : undefined
  };
}

function choosePreferredFactor(factors: MfaFactor[], primaryMethod: unknown) {
  if (primaryMethod === "totp" || (featureFlags.ENABLE_SMS_MFA && primaryMethod === "phone")) {
    return factors.find((factor) => factor.type === primaryMethod) ?? factors[0];
  }

  return factors.find((factor) => factor.type === "totp") ?? factors[0];
}

async function createMfaChallenge(supabase: SupabaseClient, factor: MfaFactor): Promise<{ error?: string; challenge?: MfaChallenge }> {
  if (factor.type === "phone" && !featureFlags.ENABLE_SMS_MFA) {
    return { error: "SMS MFA is planned for a future update. Use your authenticator app to continue." };
  }

  const result =
    factor.type === "phone"
      ? await supabase.auth.mfa.challenge({ factorId: factor.id, channel: "sms" })
      : await supabase.auth.mfa.challenge({ factorId: factor.id });

  if (result.error) return { error: result.error.message };

  return {
    challenge: {
      factorId: factor.id,
      challengeId: result.data.id,
      type: factor.type,
      expiresAt: result.data.expires_at
    }
  };
}
