import { NextRequest, NextResponse } from "next/server";
import { recordAnalyticsEvent } from "../../../../lib/analytics";
import { auth } from "../../../../lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();
    
    const { eventType, payload } = body;

    if (!eventType) {
      return NextResponse.json({ error: "Missing eventType" }, { status: 400 });
    }

    await recordAnalyticsEvent({
      eventType,
      payload,
      userId: session?.user?.id,
      ip: req.ip || req.headers.get("x-forwarded-for") || "unknown",
      userAgent: req.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Analytics API] Route Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}