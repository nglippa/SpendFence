const BLOCKED_AUTH_REDIRECT_PATHS = ["/login", "/signup", "/auth/callback", "/forgot-password", "/demo"];
const REDIRECT_BASE_URL = "https://spendfence.local";

export type AuthRedirectParams = {
  nextPath: string;
  plan: string;
  intent: string;
};

export function sanitizeAuthNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "";

  try {
    const url = new URL(value, REDIRECT_BASE_URL);
    if (url.origin !== REDIRECT_BASE_URL) return "";
    if (isBlockedAuthRedirectPath(url.pathname)) return "";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "";
  }
}

export function sanitizeAuthPlan(value: string | null) {
  return value === "monthly" || value === "yearly" ? value : "";
}

export function sanitizeAuthIntent(value: string | null) {
  return value === "free" ? value : "";
}

export function buildAuthQuery({ nextPath, plan, intent }: AuthRedirectParams) {
  const params = new URLSearchParams();
  if (nextPath) params.set("next", nextPath);
  if (plan) params.set("plan", plan);
  if (intent) params.set("intent", intent);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function postAuthDestination({ nextPath, plan, intent }: AuthRedirectParams, fallback = "/dashboard") {
  const safeNextPath = sanitizeAuthNextPath(nextPath);
  if (!safeNextPath) return fallback;

  const url = new URL(safeNextPath, REDIRECT_BASE_URL);
  if (plan) url.searchParams.set("plan", plan);
  if (intent) url.searchParams.set("intent", intent);
  return `${url.pathname}${url.search}${url.hash}`;
}

function isBlockedAuthRedirectPath(pathname: string) {
  return BLOCKED_AUTH_REDIRECT_PATHS.some((blockedPath) => pathname === blockedPath || pathname.startsWith(`${blockedPath}/`));
}
