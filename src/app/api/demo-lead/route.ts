import { NextResponse } from "next/server";
import { z } from "zod";

import { clientIp, recordDemoLead } from "@/src/lib/analytics";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  name: z.string().min(1).max(255),
  mobile: z.string().min(8).max(32),
  path: z.string().max(512).optional(),
  referrer: z.string().max(2048).optional(),
  regionUt: z.string().max(120).optional(),
});

export async function POST(request: Request) {
  try {
    const json: unknown = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Name and valid mobile are required." }, { status: 400 });
    }

    const { name, mobile, path, referrer, regionUt } = parsed.data;

    await recordDemoLead({
      name,
      mobile,
      path,
      referrer,
      regionUt,
      ip: clientIp(request),
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    console.error("demo-lead:error", e);
    return NextResponse.json({ error: "Unable to save demo request." }, { status: 500 });
  }
}
