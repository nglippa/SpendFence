import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/server-auth";
import { isPremiumSubscriptionStatus, subscriptionForUser } from "@/lib/stripe/server";
import { getEffectiveTier } from "@/lib/tier";

export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.user) return auth.response;

  try {
    const subscription = await subscriptionForUser(auth.user.id);
    return NextResponse.json({
      subscription,
      effectiveTier: getEffectiveTier(auth.user),
      isPremium: isPremiumSubscriptionStatus(subscription?.status)
    });
  } catch {
    return NextResponse.json({ message: "Subscription status could not be loaded." }, { status: 500 });
  }
}

