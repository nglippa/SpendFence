import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/server-auth";

export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.user) return NextResponse.json({ isDeveloper: false });

  return NextResponse.json({ isDeveloper: developerUserIds().has(auth.user.id) });
}

function developerUserIds() {
  return new Set(
    (process.env.DEVELOPER_USER_IDS ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
  );
}
