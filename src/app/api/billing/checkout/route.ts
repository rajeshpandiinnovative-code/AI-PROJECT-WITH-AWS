import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";

import { auth } from "@/auth";
import { schools, platformUsers } from "@/src/db/schema";
import { db } from "@/src/lib/db";
import { priceIdForRole, priceIdForSchool } from "@/src/lib/billing-prices";
import { cleanEnv } from "@/src/lib/env";
import type { PlatformRole } from "@/src/lib/platform-roles";

const checkoutScopeSchema = z.enum([
  "school",
  "student",
  "parent",
  "TEACHER",
  "SCHOOL_ADMIN",
  "MANAGEMENT",
  "PRINCIPAL",
]);

const checkoutSchema = z.object({
  scope: checkoutScopeSchema.optional(),
  /** Required for individual plans unless the account already has `board` set. School plans use the tenant's board. */
  board: z.string().min(1).max(128).optional(),
});

export async function POST(request: Request) {
  const secret = cleanEnv(process.env.STRIPE_SECRET_KEY);
  if (!secret) {
    return NextResponse.json({ error: "BILLING_NOT_CONFIGURED", code: "BILLING_NOT_CONFIGURED" }, { status: 503 });
  }

  let body: z.infer<typeof checkoutSchema> = {};
  try {
    const raw = await request.json();
    const parsed = checkoutSchema.safeParse(raw);
    if (parsed.success) {
      body = parsed.data;
    }
  } catch {
    body = {};
  }

  const scope = body.scope ?? "school";
  const session = await auth();

  let priceId = "";
  const metadata: Record<string, string> = {};
  let clientReferenceId = "";

  if (scope === "school") {
    const schoolId = session?.user?.schoolId?.trim();
    if (!schoolId || session?.user?.platformUserId) {
      return NextResponse.json(
        { error: "School billing requires signing in with your School ID (not an email account)." },
        { status: 401 },
      );
    }

    const [schoolRow] = await db
      .select({ board: schools.board })
      .from(schools)
      .where(eq(schools.id, schoolId))
      .limit(1);

    if (!schoolRow) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const board = schoolRow.board.trim() || "MATRIC";
    priceId = priceIdForSchool(board);
    metadata.schoolId = schoolId;
    metadata.board = board;
    clientReferenceId = schoolId;
  } else {
    const userId = session?.user?.platformUserId?.trim();
    if (!userId) {
      return NextResponse.json(
        { error: "Individual plans require signing in with email/password (register first)." },
        { status: 401 },
      );
    }

    let board = body.board?.trim();
    if (!board) {
      const row = await db.query.platformUsers.findFirst({
        where: eq(platformUsers.id, userId),
        columns: { board: true },
      });
      board = row?.board?.trim() ?? "";
    }

    if (!board) {
      return NextResponse.json(
        {
          error:
            "Choose a curriculum board on the pricing page (or add board at registration). Subscription prices are per board and role.",
        },
        { status: 400 },
      );
    }

    await db
      .update(platformUsers)
      .set({ board, updatedAt: new Date() })
      .where(eq(platformUsers.id, userId));

    priceId = priceIdForRole(scope as PlatformRole, board);
    metadata.userId = userId;
    metadata.role = scope;
    metadata.board = board;
    clientReferenceId = userId;
  }

  if (!priceId) {
    return NextResponse.json({ error: "BILLING_PRICE_NOT_CONFIGURED", code: "BILLING_PRICE_NOT_CONFIGURED" }, { status: 503 });
  }

  const base =
    cleanEnv(process.env.NEXT_PUBLIC_APP_URL)?.replace(/\/$/, "") ||
    cleanEnv(process.env.AUTH_URL)?.replace(/\/$/, "") ||
    "http://localhost:3000";

  const stripe = new Stripe(secret);

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${base}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/pricing`,
    client_reference_id: clientReferenceId,
    metadata,
    customer_email: session?.user?.email ?? undefined,
    subscription_data: {
      metadata,
    },
  });

  if (!checkoutSession.url) {
    return NextResponse.json({ error: "CHECKOUT_URL_MISSING" }, { status: 500 });
  }

  return NextResponse.json({ url: checkoutSession.url });
}
