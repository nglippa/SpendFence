import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

export const requiredSupabaseEnvVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY"
] as const;

type SupabaseEnvVar = (typeof requiredSupabaseEnvVars)[number];

const missingSupabaseEnvVars: SupabaseEnvVar[] = [
  ...(supabaseUrl ? [] : ["NEXT_PUBLIC_SUPABASE_URL" as const]),
  ...(supabaseKey ? [] : ["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY" as const])
];

export const hasSupabaseConfig = missingSupabaseEnvVars.length === 0;

let client: SupabaseClient | null = null;

export function getMissingSupabaseEnvVars() {
  return [...missingSupabaseEnvVars];
}

export function getSupabaseConfigErrorMessage() {
  if (hasSupabaseConfig) return null;

  if (process.env.NODE_ENV === "development") {
    const missing = missingSupabaseEnvVars.join(", ");
    const suffix = missingSupabaseEnvVars.length === 1 ? "variable is" : "variables are";

    return `Supabase auth is not configured. Missing environment ${suffix}: ${missing}. Add the missing value to .env.local and restart the Next.js dev server.`;
  }

  return "Supabase auth is not configured for this deployment.";
}

export function getSupabaseClient() {
  if (!hasSupabaseConfig) return null;
  client ??= createClient(supabaseUrl!, supabaseKey!, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
  return client;
}
