import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const plan = request.headers.get("x-spendfence-plan");
  if (plan !== "pro") {
    return NextResponse.json({ message: "Automatic transaction imports require Pro." }, { status: 403 });
  }

  return NextResponse.json(
    {
      transactions: [],
      message: "Transaction import placeholder. Pull Sandbox transactions server-side and send only reviewable transaction data to the client."
    },
    { status: 501 }
  );
}
