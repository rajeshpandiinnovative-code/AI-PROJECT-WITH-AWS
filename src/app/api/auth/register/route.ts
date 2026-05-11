import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/src/lib/db";
import { platformUsers, schools } from "@/src/db/schema";
import { clientIp, recordAnalyticsEvent } from "@/src/lib/analytics";

/** Self-service roles only — `SUPER_ADMIN` is assigned via script / ops, not public API. */
const roleEnum = z.enum(["TEACHER", "PRINCIPAL", "SCHOOL_ADMIN", "MANAGEMENT"]);

const registerSchema = z.object({
  email: z.string().email().max(255).optional(),
  phoneNumber: z.string().min(10).max(20).optional(),
  password: z.string().min(8).max(128),
  displayName: z.string().min(1).max(255),
  role: roleEnum,
  schoolId: z.string().uuid().optional(),
  board: z.string().min(1).max(128).optional(),
});

const TRIAL_MS = 14 * 24 * 60 * 60 * 1000;

function summarizeRegistrationPayload(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object") {
    return { malformed: true };
  }
  const o = raw as Record<string, unknown>;
  return {
    email: typeof o.email === "string" ? o.email.trim().toLowerCase().slice(0, 255) : undefined,
    phoneNumber: typeof o.phoneNumber === "string" ? o.phoneNumber.slice(0, 20) : undefined,
    role: typeof o.role === "string" ? o.role : undefined,
    board: typeof o.board === "string" ? o.board.slice(0, 128) : undefined,
    schoolId: typeof o.schoolId === "string" ? o.schoolId : undefined,
    displayNameLen: typeof o.displayName === "string" ? o.displayName.length : undefined,
    passwordLen: typeof o.password === "string" ? o.password.length : undefined,
  };
}

export async function POST(request: Request) {
  const ua = request.headers.get("user-agent") ?? undefined;
  const ip = clientIp(request);

  try {
    let json: unknown;
    try {
      json = await request.json();
    } catch {
      await recordAnalyticsEvent({
        eventType: "registration_invalid_json",
        payload: {},
        ip,
        userAgent: ua,
      });
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    await recordAnalyticsEvent({
      eventType: "registration_attempt",
      payload: summarizeRegistrationPayload(json),
      ip,
      userAgent: ua,
    });

    const parsed = registerSchema.safeParse(json);
    if (!parsed.success) {
      await recordAnalyticsEvent({
        eventType: "registration_validation_failed",
        payload: {
          ...summarizeRegistrationPayload(json),
          issues: parsed.error.flatten(),
        },
        ip,
        userAgent: ua,
      });
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
    }

    const { email, phoneNumber, password, displayName, role, schoolId, board } = parsed.data;
    const normalizedPhoneNumber = phoneNumber ? phoneNumber.replace(/[^\d]/g, "").slice(-10) : undefined;
    const normalizedEmailFromInput = email?.trim().toLowerCase();

    if (!normalizedPhoneNumber) {
      return NextResponse.json({ error: "Phone number is required for paid user registration" }, { status: 400 });
    }
    if (normalizedPhoneNumber.length !== 10) {
      return NextResponse.json({ error: "Phone number must be 10 digits" }, { status: 400 });
    }
    const normalizedEmail = normalizedEmailFromInput ?? `user-${normalizedPhoneNumber}@phone.aap.local`;

    const [existing] = await db
      .select({ id: platformUsers.id })
      .from(platformUsers)
      .where(eq(platformUsers.email, normalizedEmail))
      .limit(1);

    if (existing) {
      await recordAnalyticsEvent({
        eventType: "registration_duplicate_email",
        payload: { email: normalizedEmail, role, board: board?.trim() },
        ip,
        userAgent: ua,
      });
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const [existingPhone] = await db
      .select({ id: platformUsers.id })
      .from(platformUsers)
      .where(eq(platformUsers.phoneNumber, normalizedPhoneNumber))
      .limit(1);
    if (existingPhone) {
      return NextResponse.json({ error: "Phone number already registered" }, { status: 409 });
    }

    if (schoolId) {
      const [school] = await db.select({ id: schools.id }).from(schools).where(eq(schools.id, schoolId)).limit(1);
      if (!school) {
        await recordAnalyticsEvent({
          eventType: "registration_invalid_school_link",
          payload: { email: normalizedEmail, schoolId, role, board: board?.trim() },
          ip,
          userAgent: ua,
        });
        return NextResponse.json({ error: "School not found for link" }, { status: 400 });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const trialEnd = new Date(Date.now() + TRIAL_MS);

    const [inserted] = await db
      .insert(platformUsers)
      .values({
        email: normalizedEmail,
        passwordHash,
        phoneNumber: normalizedPhoneNumber,
        role,
        otpSecret: null,
        otpExpires: null,
        isVerified: false,
        displayName: displayName.trim(),
        schoolId: schoolId ?? null,
        board: board?.trim() || null,
        subscriptionStatus: "trial",
        subscriptionTrialEndsAt: trialEnd,
      })
      .returning({ id: platformUsers.id, email: platformUsers.email, role: platformUsers.role });

    if (!inserted) {
      return NextResponse.json({ error: "Could not create account" }, { status: 500 });
    }

    await recordAnalyticsEvent({
      eventType: "registration_success",
      payload: {
        userId: inserted.id,
        email: inserted.email,
        role: inserted.role,
        board: board?.trim(),
        schoolId: schoolId ?? undefined,
      },
      ip,
      userAgent: ua,
    });

    return NextResponse.json(
      {
        ok: true,
        userId: inserted.id,
        email: inserted.email,
        role: inserted.role,
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed";
    await recordAnalyticsEvent({
      eventType: "registration_server_error",
      payload: { message },
      ip,
      userAgent: ua,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
