import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/server-auth";
import { fetchTellerAccounts } from "@/lib/teller/server";

export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.user) return auth.response;

  try {
    return NextResponse.json({ accounts: await fetchTellerAccounts(auth.user) });
  } catch {
    return NextResponse.json({ message: "Connected accounts are unavailable right now." }, { status: 502 });
  }
}
