import { NextResponse } from "next/server";
import { premiumAiCapabilities } from "@/lib/ai/premium/capabilities";
import { requireApiUser } from "@/lib/server-auth";
import { getEffectiveTier } from "@/lib/tier";

export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.user) return auth.response;
  if (getEffectiveTier(auth.user) !== "premium") {
    return NextResponse.json({ message: "Premium is required for advanced AI capabilities." }, { status: 403 });
  }

  return NextResponse.json({
    status: "active",
    philosophy: "Premium AI unlocks deeper intelligence and automation while core budgeting stays available on Free.",
    capabilities: premiumAiCapabilities
  });
}
