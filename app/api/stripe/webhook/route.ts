import { NextResponse } from "next/server";

export async function POST() {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ message: "Stripe webhook placeholder. Configure STRIPE_WEBHOOK_SECRET before processing events." }, { status: 501 });
  }

  return NextResponse.json(
    {
      message: "Stripe webhook architecture placeholder. Verify signatures here, then update subscription state server-side."
    },
    { status: 501 }
  );
}
