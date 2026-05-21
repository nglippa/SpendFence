import { NextResponse } from "next/server";

export async function POST() {
  const hasStripeConfig = Boolean(process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO);

  if (!hasStripeConfig) {
    return NextResponse.json(
      {
        message: "Stripe subscription checkout placeholder is ready. Add STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PRICE_ID_PRO to enable it."
      },
      { status: 501 }
    );
  }

  return NextResponse.json(
    {
      message: "Stripe Checkout architecture placeholder. Create the subscription session server-side here and return its URL."
    },
    { status: 501 }
  );
}
