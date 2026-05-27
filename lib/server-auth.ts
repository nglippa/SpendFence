import "server-only";

import { createClient } from "@supabase/supabase-js";
import { hasSupabaseConfig } from "@/lib/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

export type ApiUser = {
  id: string;
  mode: "supabase" | "development";
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

    return { user: { id: data.user.id, mode: "supabase" } };
  }

  if (process.env.NODE_ENV === "development") {
    const devUserId = request.headers.get("x-spendfence-dev-user")?.trim() || "local-dev-user";
    return { user: { id: devUserId, mode: "development" } };
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

function unauthorized(message: string) {
  return {
    response: Response.json({ message }, { status: 401 })
  };
}
