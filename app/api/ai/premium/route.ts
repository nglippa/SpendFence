import { NextResponse } from "next/server";
import { premiumAiCapabilities } from "@/lib/ai/premium/capabilities";

export async function GET() {
  return NextResponse.json({
    status: "planned",
    philosophy: "Premium AI is reserved for deeper intelligence and automation, not core budgeting access.",
    capabilities: premiumAiCapabilities
  });
}
