import { NextResponse } from "next/server";
import { tellerConfig } from "@/lib/teller/server";

export async function GET() {
  const config = tellerConfig();
  if (!config.configured && process.env.NODE_ENV === "development") {
    console.info("Teller Connect is disabled. Set TELLER_APPLICATION_ID or NEXT_PUBLIC_TELLER_APPLICATION_ID to test bank sync.");
  }
  if (!config.apiConfigured && process.env.NODE_ENV === "development") {
    console.info("Teller API is not fully configured. Set TELLER_CERT, TELLER_CERT_KEY, TELLER_AUTH, TELLER_DOMAIN, and TELLER_ENVIRONMENT on the server.");
  }

  return NextResponse.json(config);
}
