import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import { hasSupabaseConfig } from "@/lib/supabase";
import { normalizeTier, type AppTier, type DeveloperTierPreviewMode } from "@/lib/tier";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

export type ApiUser = {
  id: string;
  email?: string;
  mode: "supabase" | "development";
  realTier: AppTier;
  isDeveloper?: boolean;
  developerTierOverride?: DeveloperTierPreviewMode | null;
};

export async function requireApiUser(request: Request): Promise<{ user?: ApiUser; response?: Response }> {
  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.toLowerCase().startsWith("bearer ") ? authHeader.slice(7).trim() : "";

  if (hasSupabaseConfig && supabaseUrl && supabaseKey) {
    if (!bearer) return unauthorized("Sign in to use bank sync.");

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${bearer}`
        }
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    const { data, error } = await supabase.auth.getUser(bearer);
    if (error || !data.user) return unauthorized("Sign in again to use bank sync.");

    return { user: toApiUser(request, data.user, "supabase") };
  }

  if (process.env.NODE_ENV === "development") {
    const devUserId = request.headers.get("x-spendfence-dev-user")?.trim() || "local-dev-user";
    const email = request.headers.get("x-spendfence-dev-email")?.trim() || undefined;
    return {
      user: {
        id: devUserId,
        email,
        mode: "development",
        realTier: normalizeTier(request.headers.get("x-spendfence-real-tier")) ?? "free",
        isDeveloper: isApprovedDeveloper(devUserId, email),
        developerTierOverride: normalizeTier(request.headers.get("x-spendfence-dev-tier-preview"))
      }
    };
  }

  return unauthorized("Authentication is not configured for bank sync.");
}

export function isLockedDemoRequest(request: Request) {
  const cookies = request.headers.get("cookie") ?? "";
  return cookies
    .split(";")
    .map((item) => item.trim())
    .some((item) => item === "spendfence-demo-locked-session-v1=true");
}

function toApiUser(request: Request, user: User, mode: ApiUser["mode"]): ApiUser {
  const email = user.email ?? undefined;
  const isDeveloper = isApprovedDeveloper(user.id, email);
  return {
    id: user.id,
    email,
    mode,
    realTier: subscriptionTierForUser(user),
    isDeveloper,
    developerTierOverride: isDeveloper ? normalizeTier(request.headers.get("x-spendfence-dev-tier-preview")) : null
  };
}

function subscriptionTierForUser(user: User): AppTier {
  return (
    normalizeTier(user.app_metadata?.spendfence_tier) ??
    normalizeTier(user.app_metadata?.subscription_tier) ??
    normalizeTier(user.user_metadata?.spendfence_tier) ??
    "free"
  );
}

function isApprovedDeveloper(userId: string, email?: string) {
  const developerIds = (process.env.DEVELOPER_USER_IDS ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const developerEmail = process.env.NEXT_PUBLIC_DEVELOPER_EMAIL?.trim().toLowerCase();
  return developerIds.includes(userId) || Boolean(email && developerEmail && email.toLowerCase() === developerEmail);
}

function unauthorized(message: string) {
  return {
    response: Response.json({ message }, { status: 401 })
  };
}
