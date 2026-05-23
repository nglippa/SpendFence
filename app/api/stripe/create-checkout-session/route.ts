import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      message: "Premium subscription checkout is intentionally disabled for now."
    },
    { status: 501 }
  );
}
