import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/server-auth";
import { createPortalSession } from "@/lib/stripe/server";

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.user) return auth.response;

  try {
    const session = await createPortalSession(auth.user, new URL(request.url).origin);
    return NextResponse.json({ id: session.id, url: session.url });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Billing portal could not be opened." }, { status: 500 });
  }
}

