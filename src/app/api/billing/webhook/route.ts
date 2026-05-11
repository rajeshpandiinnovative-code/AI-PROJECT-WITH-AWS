import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { db } from "@/src/lib/db";
import { platformUsers, revenueEvents, schools } from "@/src/db/schema";
import { cleanEnv } from "@/src/lib/env";

export const dynamic = "force-dynamic";

function mapStripeSubscriptionStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
      return status;
    default:
      return "none";
  }
}

export async function POST(request: Request) {
  const secret = cleanEnv(process.env.STRIPE_SECRET_KEY);
  const webhookSecret = cleanEnv(process.env.STRIPE_WEBHOOK_SECRET);
  if (!secret || !webhookSecret) {
    return NextResponse.json({ error: "BILLING_NOT_CONFIGURED" }, { status: 503 });
  }

  const stripe = new Stripe(secret);
  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    if (!signature) {
      return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
    }
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const sess = event.data.object as Stripe.Checkout.Session;
      const schoolId = sess.metadata?.schoolId ?? undefined;
      const userId = sess.metadata?.userId ?? undefined;
      const subRef = sess.subscription;
      const subId = typeof subRef === "string" ? subRef : subRef?.id;
      const custRef = sess.customer;
      const customerId = typeof custRef === "string" ? custRef : custRef?.id;

      if (!subId) {
        // incomplete checkout — ignore
      } else if (userId) {
        const sub = await stripe.subscriptions.retrieve(subId);
        const mapped = mapStripeSubscriptionStatus(sub.status);
        const boardMeta = sess.metadata?.board?.trim();
        await db
          .update(platformUsers)
          .set({
            stripeCustomerId: customerId ?? null,
            stripeSubscriptionId: sub.id,
            subscriptionStatus: mapped === "none" ? "trialing" : mapped,
            subscriptionCurrentPeriodEnd: new Date(sub.current_period_end * 1000),
            ...(boardMeta ? { board: boardMeta } : {}),
            updatedAt: new Date(),
          })
          .where(eq(platformUsers.id, userId));
      } else if (schoolId) {
        const sub = await stripe.subscriptions.retrieve(subId);
        const mapped = mapStripeSubscriptionStatus(sub.status);
        await db
          .update(schools)
          .set({
            stripeCustomerId: customerId ?? null,
            stripeSubscriptionId: sub.id,
            subscriptionStatus: mapped === "none" ? "trialing" : mapped,
            subscriptionCurrentPeriodEnd: new Date(sub.current_period_end * 1000),
            updatedAt: new Date(),
          })
          .where(eq(schools.id, schoolId));
      }
    }

    if (event.type === "invoice.paid") {
      const inv = event.data.object as Stripe.Invoice;
      const paid = inv.amount_paid ?? 0;
      if (paid > 0 && inv.id) {
        let schoolIdMeta: string | undefined;
        let userIdMeta: string | undefined;
        const subRef = inv.subscription;
        const subId = typeof subRef === "string" ? subRef : subRef?.id;
        if (subId) {
          try {
            const sub = await stripe.subscriptions.retrieve(subId);
            schoolIdMeta = sub.metadata?.schoolId?.trim() || undefined;
            userIdMeta = sub.metadata?.userId?.trim() || undefined;
          } catch {
            /* ignore */
          }
        }
        const paidAtSec = inv.status_transitions?.paid_at;
        const occurredAt =
          typeof paidAtSec === "number" && paidAtSec > 0 ? new Date(paidAtSec * 1000) : new Date();
        try {
          await db
            .insert(revenueEvents)
            .values({
              stripeInvoiceId: inv.id,
              amountMinor: paid,
              currency: (inv.currency ?? "inr").toUpperCase(),
              schoolId: schoolIdMeta ?? null,
              platformUserId: userIdMeta ?? null,
              occurredAt,
              metadata: { stripeCustomerId: typeof inv.customer === "string" ? inv.customer : inv.customer?.id },
            })
            .onConflictDoNothing({ target: revenueEvents.stripeInvoiceId });
        } catch (e) {
          console.error("revenue_events insert failed", e);
        }
      }
    }

    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      const schoolId = sub.metadata?.schoolId;
      const userId = sub.metadata?.userId;

      const mapped =
        event.type === "customer.subscription.deleted" ? "canceled" : mapStripeSubscriptionStatus(sub.status);

      if (userId) {
        const boardMeta = sub.metadata?.board?.trim();
        await db
          .update(platformUsers)
          .set({
            stripeSubscriptionId: sub.id,
            subscriptionStatus: mapped,
            subscriptionCurrentPeriodEnd:
              sub.status === "canceled" ? null : new Date(sub.current_period_end * 1000),
            ...(boardMeta ? { board: boardMeta } : {}),
            updatedAt: new Date(),
          })
          .where(eq(platformUsers.id, userId));
      } else if (schoolId) {
        await db
          .update(schools)
          .set({
            stripeSubscriptionId: sub.id,
            subscriptionStatus: mapped,
            subscriptionCurrentPeriodEnd:
              sub.status === "canceled" ? null : new Date(sub.current_period_end * 1000),
            updatedAt: new Date(),
          })
          .where(eq(schools.id, schoolId));
      }
    }
  } catch (err) {
    console.error("billing webhook handler error", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
