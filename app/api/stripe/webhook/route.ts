import { NextResponse } from "next/server";
import { handleStripeEvent, verifyStripeWebhook } from "@/lib/stripe/server";

export async function POST(request: Request) {
  const rawBody = await request.text();

  try {
    const event = await verifyStripeWebhook(rawBody, request.headers.get("stripe-signature"));
    await handleStripeEvent(event);
    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Stripe webhook could not be processed." },
      { status: 400 }
    );
  }
}
