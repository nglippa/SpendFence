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
const memoryStorage = new Map<string, string>();

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
      // Persist only inside the active browser/PWA session. A closed app or
      // browser tab should require a fresh login next time.
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: getSessionOnlyStorage()
    }
  });
  return client;
}

export function clearPersistentAuthStorage() {
  if (typeof window === "undefined") return;
  const storage = getBrowserStorage("localStorage");
  if (storage) clearSupabaseAuthKeys(storage);
}

export function clearActiveAuthStorage() {
  if (typeof window === "undefined") return;
  const localStorage = getBrowserStorage("localStorage");
  const sessionStorage = getBrowserStorage("sessionStorage");
  if (localStorage) clearSupabaseAuthKeys(localStorage);
  if (sessionStorage) clearSupabaseAuthKeys(sessionStorage);
}

function getSessionOnlyStorage() {
  if (typeof window === "undefined") {
    return getMemoryStorage();
  }

  return getBrowserStorage("sessionStorage") ?? getMemoryStorage();
}

function getBrowserStorage(name: "localStorage" | "sessionStorage") {
  try {
    return window[name] ?? null;
  } catch {
    return null;
  }
}

function getMemoryStorage() {
  return {
    getItem: (key: string) => memoryStorage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memoryStorage.set(key, value);
    },
    removeItem: (key: string) => {
      memoryStorage.delete(key);
    }
  };
}

function clearSupabaseAuthKeys(storage: Storage) {
  for (let index = storage.length - 1; index >= 0; index -= 1) {
    const key = storage.key(index);
    if (key && /^sb-.+-auth-token(?:-.+)?$/.test(key)) {
      storage.removeItem(key);
    }
  }
}
