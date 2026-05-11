import bcrypt from "bcryptjs";
import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/src/lib/db";
import { platformUsers } from "@/src/db/schema";

const requestSchema = z.object({
  phoneNumber: z.string().min(10).max(20),
});

function normalizePhoneNumber(raw: string): string {
  return raw.replace(/[^\d]/g, "").slice(-10);
}

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** Request OTP for principal/teacher mobile-first login. */
export async function POST(request: Request) {
  try {
    const payload = requestSchema.parse(await request.json());
    const phoneNumber = normalizePhoneNumber(payload.phoneNumber);
    if (phoneNumber.length !== 10) {
      return NextResponse.json({ error: "Enter a valid 10-digit mobile number." }, { status: 400 });
    }

    const [user] = await db
      .select({ id: platformUsers.id })
      .from(platformUsers)
      .where(
        and(
          eq(platformUsers.phoneNumber, phoneNumber),
          inArray(platformUsers.role, ["TEACHER", "SCHOOL_ADMIN", "MANAGEMENT", "PRINCIPAL"]),
        ),
      )
      .limit(1);

    // Keep response generic to avoid phone number enumeration.
    if (!user) {
      return NextResponse.json({ ok: true, sent: true }, { status: 200 });
    }

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await db
      .update(platformUsers)
      .set({
        otpSecret: otpHash,
        otpExpires: otpExpiresAt,
        isVerified: false,
        updatedAt: new Date(),
      })
      .where(eq(platformUsers.id, user.id));

    return NextResponse.json(
      {
        ok: true,
        sent: true,
        ...(process.env.NODE_ENV === "production" ? {} : { debugOtp: otp }),
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not request OTP";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
