import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const plan = request.headers.get("x-spendfence-plan");
  if (plan !== "pro") {
    return NextResponse.json({ message: "Plaid bank sync is marked as a future Premium area. Subscriptions are not enabled yet." }, { status: 403 });
  }

  const plaidEnv = process.env.PLAID_ENV ?? "sandbox";
  if (plaidEnv !== "sandbox") {
    return NextResponse.json({ message: "Only Plaid Sandbox is enabled for now." }, { status: 403 });
  }

  const hasPlaidConfig = Boolean(process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET);
  if (!hasPlaidConfig) {
    return NextResponse.json(
      {
        message: "Plaid Sandbox placeholder is ready. Add PLAID_CLIENT_ID and PLAID_SECRET on the server to create link tokens."
      },
      { status: 501 }
    );
  }

  const response = await fetch("https://sandbox.plaid.com/link/token/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.PLAID_CLIENT_ID,
      secret: process.env.PLAID_SECRET,
      client_name: "SpendFence",
      language: "en",
      country_codes: ["US"],
      user: { client_user_id: "spendfence-sandbox-user" },
      products: ["transactions"]
    })
  });

  const data = (await response.json()) as { link_token?: string; error_message?: string };
  if (!response.ok || !data.link_token) {
    return NextResponse.json({ message: data.error_message ?? "Plaid Sandbox link token could not be created." }, { status: 502 });
  }

  return NextResponse.json({ linkToken: data.link_token });
}
