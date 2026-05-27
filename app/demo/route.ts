import { NextResponse } from "next/server";

const DEMO_SESSION_KEY = "spendfence-demo-session-v1";
const DEMO_LOCKED_SESSION_KEY = "spendfence-demo-locked-session-v1";
const DEMO_COOKIE_MAX_AGE = 60 * 60 * 8;

export function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/dashboard", request.url));
  const cookieOptions = {
    httpOnly: false,
    maxAge: DEMO_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production"
  };

  response.cookies.set(DEMO_SESSION_KEY, "true", cookieOptions);
  response.cookies.set(DEMO_LOCKED_SESSION_KEY, "true", cookieOptions);

  return response;
}
