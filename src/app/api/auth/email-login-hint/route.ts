import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { platformUsers } from "@/src/db/schema";
import { db } from "@/src/lib/db";
import { passwordHashSupportsBcryptVerify } from "@/src/lib/password-hash-utils";

const bodySchema = z.object({
  email: z.string().trim().min(3).max(255),
});

/**
 * Post-login UX only: after a failed credentials attempt, the client may call this to show
 * a precise message (unknown email vs wrong password vs “use Google”) without sending the password.
 */
export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const email = parsed.data.email.trim().toLowerCase();
  const [row] = await db
    .select({ passwordHash: platformUsers.passwordHash })
    .from(platformUsers)
    .where(sql`lower(trim(${platformUsers.email})) = ${email}`)
    .limit(1);

  if (!row) {
    return NextResponse.json({ exists: false, passwordLoginAllowed: false });
  }
  return NextResponse.json({
    exists: true,
    passwordLoginAllowed: passwordHashSupportsBcryptVerify(row.passwordHash),
  });
}
