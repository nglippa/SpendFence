import { NextResponse } from "next/server";
import { disconnectTeller, listTellerConnections, saveTellerEnrollment, tellerAccountLimitStatus, tellerConfig, TellerAccountLimitError } from "@/lib/teller/server";
import { isLockedDemoRequest, requireApiUser } from "@/lib/server-auth";

export async function GET(request: Request) {
  if (isLockedDemoRequest(request)) return lockedDemoResponse();

  const auth = await requireApiUser(request);
  if (!auth.user) return auth.response;

  try {
    return NextResponse.json({
      configured: tellerConfig().configured,
      connections: await listTellerConnections(auth.user),
      accountLimit: await tellerAccountLimitStatus(auth.user)
    });
  } catch {
    return NextResponse.json({ message: "Bank connections are unavailable right now." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (isLockedDemoRequest(request)) return lockedDemoResponse();

  const auth = await requireApiUser(request);
  if (!auth.user) return auth.response;

  const body = (await request.json().catch(() => ({}))) as {
    accessToken?: string;
    enrollment?: { id?: string; institution?: { name?: string } };
    enrollmentId?: string;
    institutionName?: string;
  };
  if (!body.accessToken) return NextResponse.json({ message: "Missing Teller access token." }, { status: 400 });

  try {
    const connection = await saveTellerEnrollment(auth.user, {
      accessToken: body.accessToken,
      enrollment: body.enrollment,
      enrollmentId: body.enrollmentId,
      institutionName: body.institutionName
    });

    return NextResponse.json({
      connection,
      message: "Bank account connected. Teller access token was stored server-side only."
    });
  } catch (error) {
    if (error instanceof TellerAccountLimitError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    return NextResponse.json({ message: "Bank connection could not be saved." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (isLockedDemoRequest(request)) return lockedDemoResponse();

  const auth = await requireApiUser(request);
  if (!auth.user) return auth.response;

  const { searchParams } = new URL(request.url);
  try {
    await disconnectTeller(auth.user, searchParams.get("id") ?? undefined);
    return NextResponse.json({ message: "Bank connection disconnected." });
  } catch {
    return NextResponse.json({ message: "Bank connection could not be disconnected." }, { status: 500 });
  }
}

function lockedDemoResponse() {
  return NextResponse.json({ message: "Bank sync is disabled in locked demo mode." }, { status: 403 });
}
