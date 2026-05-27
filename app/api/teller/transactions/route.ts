import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/server-auth";
import { fetchTellerTransactions } from "@/lib/teller/server";
import type { Category, MerchantCategoryRule } from "@/lib/types";

export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.user) return auth.response;

  try {
    return NextResponse.json({ transactions: await fetchTellerTransactions(auth.user) });
  } catch {
    return NextResponse.json({ message: "Transactions are unavailable right now." }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.user) return auth.response;

  const body = (await request.json().catch(() => ({}))) as {
    userCategories?: Category[];
    merchantRules?: MerchantCategoryRule[];
  };

  try {
    const transactions = await fetchTellerTransactions(auth.user, {
      userCategories: body.userCategories ?? [],
      merchantRules: body.merchantRules ?? []
    });

    return NextResponse.json({
      transactions,
      message: transactions.length
        ? "Teller transactions were added to the review queue."
        : "No new Teller transactions were found."
    });
  } catch {
    return NextResponse.json({ message: "Transactions are unavailable right now." }, { status: 502 });
  }
}
