import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  board: z.string().min(1).max(128),
  role: z.string().min(1).max(32),
  state: z.string().min(1).max(128),
  district: z.string().min(1).max(128),
  city: z.string().min(1).max(128),
});

/** Persists demo login context (board, role, geography) for dashboard preview — cookie `aap_demo`. */
export async function POST(request: Request) {
  try {
    const json: unknown = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const res = NextResponse.json({ ok: true }, { status: 200 });
    res.cookies.set("aap_demo", JSON.stringify(parsed.data), {
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Unable to save demo context" }, { status: 500 });
  }
}
