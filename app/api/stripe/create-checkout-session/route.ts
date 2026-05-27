import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/server-auth";
import { createCheckoutSession } from "@/lib/stripe/server";

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.user) return auth.response;

  const body = (await request.json().catch(() => ({}))) as { plan?: "monthly" | "yearly" };

  try {
    const session = await createCheckoutSession(auth.user, {
      plan: body.plan,
      origin: new URL(request.url).origin
    });
    return NextResponse.json({ id: session.id, url: session.url });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Stripe checkout could not be created." }, { status: 500 });
  }
}
