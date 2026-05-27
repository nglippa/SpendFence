import { NextResponse } from "next/server";
import { isLockedDemoRequest, requireApiUser } from "@/lib/server-auth";
import { fetchTellerAccounts } from "@/lib/teller/server";

export async function GET(request: Request) {
  if (isLockedDemoRequest(request)) return NextResponse.json({ message: "Bank sync is disabled in locked demo mode." }, { status: 403 });

  const auth = await requireApiUser(request);
  if (!auth.user) return auth.response;

  try {
    return NextResponse.json({ accounts: await fetchTellerAccounts(auth.user) });
  } catch {
    return NextResponse.json({ message: "Connected accounts are unavailable right now." }, { status: 502 });
  }
}
