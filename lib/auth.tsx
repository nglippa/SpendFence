"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";

const DEMO_SESSION_KEY = "spendfence-demo-session-v1";
const DEMO_PRO_KEY = "spendfence-demo-pro-v1";

type AuthUser = {
  id: string;
  email: string;
  isDemo: boolean;
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
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string; message?: string }>;
  resetPassword: (email: string) => Promise<{ error?: string; message?: string }>;
  enterDemoMode: () => void;
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
  const demoModeAvailable = process.env.NODE_ENV === "development" && !hasSupabaseConfig;
  const demoProAvailable = process.env.NODE_ENV === "development";
  const isPro = demoProEnabled;

  useEffect(() => {
    setDemoProEnabled(window.localStorage.getItem(DEMO_PRO_KEY) === "true");
    if (!supabase) {
      const demoSession = window.localStorage.getItem(DEMO_SESSION_KEY);
      setUser(demoSession ? { id: "demo-user", email: "demo@spendfence.local", isDemo: true } : null);
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
        if (!supabase) return { error: "Supabase is not configured for this environment." };
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return error ? { error: error.message } : {};
      },
      signUp: async (email, password) => {
        if (!supabase) return { error: "Supabase is not configured for this environment." };
        const { error } = await supabase.auth.signUp({ email, password });
        return error ? { error: error.message } : { message: "Check your email if confirmation is enabled." };
      },
      resetPassword: async (email) => {
        if (!supabase) return { error: "Supabase is not configured for this environment." };
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/login` });
        return error ? { error: error.message } : { message: "Password reset email sent." };
      },
      enterDemoMode: () => {
        if (!demoModeAvailable) return;
        window.localStorage.setItem(DEMO_SESSION_KEY, "true");
        setUser({ id: "demo-user", email: "demo@spendfence.local", isDemo: true });
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
        window.localStorage.removeItem(DEMO_SESSION_KEY);
        window.localStorage.removeItem(DEMO_PRO_KEY);
        if (supabase) await supabase.auth.signOut();
        setUser(null);
        setDemoProEnabled(false);
      }
    }),
    [demoModeAvailable, demoProAvailable, demoProEnabled, isPro, loading, supabase, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email ?? "Signed-in user",
    isDemo: false
  };
}
