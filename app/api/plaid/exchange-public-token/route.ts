import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const plan = request.headers.get("x-spendfence-plan");
  if (plan !== "pro") {
    return NextResponse.json({ message: "Plaid token exchange requires Pro." }, { status: 403 });
  }

  const plaidEnv = process.env.PLAID_ENV ?? "sandbox";
  if (plaidEnv !== "sandbox") {
    return NextResponse.json({ message: "Only Plaid Sandbox is enabled for now." }, { status: 403 });
  }

  const { publicToken } = (await request.json()) as { publicToken?: string };
  if (!publicToken) return NextResponse.json({ message: "Missing Plaid public token." }, { status: 400 });

  if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
    return NextResponse.json({ message: "Plaid token exchange placeholder. Add Sandbox keys to exchange public tokens server-side." }, { status: 501 });
  }

  const response = await fetch("https://sandbox.plaid.com/item/public_token/exchange", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.PLAID_CLIENT_ID,
      secret: process.env.PLAID_SECRET,
      public_token: publicToken
    })
  });

  const data = (await response.json()) as { item_id?: string; error_message?: string };
  if (!response.ok) {
    return NextResponse.json({ message: data.error_message ?? "Plaid public token exchange failed." }, { status: 502 });
  }

  return NextResponse.json({
    itemId: data.item_id,
    message: "Sandbox account connected. Access token exchanged server-side and intentionally not returned to the frontend."
  });
}
