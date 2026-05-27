"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { featureFlags } from "@/lib/feature-flags";
import { clearActiveAuthStorage, clearPersistentAuthStorage, getSupabaseClient, getSupabaseConfigErrorMessage, hasSupabaseConfig } from "@/lib/supabase";

const DEMO_SESSION_KEY = "spendfence-demo-session-v1";
const DEMO_LOCKED_SESSION_KEY = "spendfence-demo-locked-session-v1";
const DEMO_PRO_KEY = "spendfence-demo-pro-v1";
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
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  authEnabled: boolean;
  isPro: boolean;
  planLabel: "Free" | "Pro";
  demoModeAvailable: boolean;
  demoProAvailable: boolean;
  demoProEnabled: boolean;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signUp: (email: string, password: string) => Promise<{ error?: string; message?: string }>;
  resetPassword: (email: string) => Promise<{ error?: string; message?: string }>;
  startMfaChallenge: (factor: MfaFactor) => Promise<{ error?: string; challenge?: MfaChallenge }>;
  verifyMfaChallenge: (challenge: MfaChallenge, code: string) => Promise<{ error?: string }>;
  enterDemoMode: (options?: { locked?: boolean }) => void;
  setDemoPro: (enabled: boolean) => void;
  startUpgrade: () => Promise<{ error?: string; message?: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [demoProEnabled, setDemoProEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseClient();
  const supabaseConfigError = getSupabaseConfigErrorMessage() ?? "Supabase auth is not configured for this environment.";
  const demoModeAvailable = true;
  const demoProAvailable = process.env.NODE_ENV === "development";
  const isPro = demoProEnabled;

  useEffect(() => {
    clearPersistentAuthStorage();
    window.localStorage.removeItem(LEGACY_TRUSTED_DEVICE_KEY);
    setDemoProEnabled(window.localStorage.getItem(DEMO_PRO_KEY) === "true");

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
      setUser(session?.user ? toAuthUser(session.user) : null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      authEnabled: hasSupabaseConfig,
      isPro,
      planLabel: isPro ? "Pro" : "Free",
      demoModeAvailable,
      demoProAvailable,
      demoProEnabled,
      signIn: async (email, password) => {
        if (!supabase) return { error: supabaseConfigError };
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { error: error.message };

        const aal = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aal.error) return { error: aal.error.message };

        if (aal.data.currentLevel !== aal.data.nextLevel && aal.data.nextLevel === "aal2") {
          const factorsResult = await supabase.auth.mfa.listFactors();
          if (factorsResult.error) return { error: factorsResult.error.message };

          const factors = normalizeMfaFactors(factorsResult.data);
          if (!factors.length) return { error: "MFA is required, but no verified factors are available for this account." };

          const primaryMethod = data.user?.user_metadata?.spendfence_mfa_primary_method;
          const preferredFactor = choosePreferredFactor(factors, primaryMethod);
          const challenge = await createMfaChallenge(supabase, preferredFactor);
          if (challenge.error || !challenge.challenge) return { error: challenge.error ?? "Could not start MFA verification." };

          return { mfaRequired: true, mfa: { factors, challenge: challenge.challenge } };
        }

        return {};
      },
      signUp: async (email, password) => {
        if (!supabase) return { error: supabaseConfigError };
        const { error } = await supabase.auth.signUp({ email, password });
        return error ? { error: error.message } : { message: "Check your email if confirmation is enabled." };
      },
      resetPassword: async (email) => {
        if (!supabase) return { error: supabaseConfigError };
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/login` });
        return error ? { error: error.message } : { message: "Password reset email sent." };
      },
      startMfaChallenge: async (factor) => {
        if (!supabase) return { error: supabaseConfigError };
        return createMfaChallenge(supabase, factor);
      },
      verifyMfaChallenge: async (challenge, code) => {
        if (!supabase) return { error: supabaseConfigError };
        const { data, error } = await supabase.auth.mfa.verify({
          factorId: challenge.factorId,
          challengeId: challenge.challengeId,
          code
        });
        if (error) return { error: error.message };

        setUser(toAuthUser(data.user));
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
      setDemoPro: (enabled) => {
        if (!demoProAvailable) return;
        window.localStorage.setItem(DEMO_PRO_KEY, String(enabled));
        setDemoProEnabled(enabled);
      },
      startUpgrade: async () => {
        const response = await fetch("/api/stripe/create-checkout-session", { method: "POST" });
        if (!response.ok) return { error: "Stripe checkout is not configured yet. Add Stripe keys to enable subscriptions." };
        const data = (await response.json()) as { url?: string; message?: string };
        if (data.url) window.location.href = data.url;
        return { message: data.message ?? "Upgrade flow prepared." };
      },
      signOut: async () => {
        const isDemoSession = (getSessionValue(DEMO_SESSION_KEY) ?? getCookieValue(DEMO_SESSION_KEY)) === "true";
        removeSessionValue(DEMO_SESSION_KEY);
        removeSessionValue(DEMO_LOCKED_SESSION_KEY);
        removeCookieValue(DEMO_SESSION_KEY);
        removeCookieValue(DEMO_LOCKED_SESSION_KEY);
        window.localStorage.removeItem(DEMO_PRO_KEY);
        window.localStorage.removeItem(LEGACY_TRUSTED_DEVICE_KEY);
        if (supabase && !isDemoSession) await supabase.auth.signOut();
        clearActiveAuthStorage();
        setUser(null);
        setDemoProEnabled(false);
      }
    }),
    [demoModeAvailable, demoProAvailable, demoProEnabled, isPro, loading, supabase, supabaseConfigError, user]
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

function toDemoUser(locked = false): AuthUser {
  return {
    id: locked ? "demo-preview-user" : "demo-user",
    email: "demo@spendfence.local",
    isDemo: true,
    demoLocked: locked
  };
}

function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email ?? "Signed-in user",
    isDemo: false
  };
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
