# Billing (Stripe) — go-live

## Environment

| Variable | Purpose |
|----------|---------|
| `REQUIRE_PAID_SUBSCRIPTION` | Set to `true` in production to enforce trial or paid access. |
| `STRIPE_SECRET_KEY` | Stripe secret API key. |
| `STRIPE_WEBHOOK_SECRET` | Signing secret from Stripe Dashboard → Webhooks. |
| `STRIPE_PRICE_SCHOOL_PRO` | Price ID for the school subscription (recurring). |
| `NEXT_PUBLIC_APP_URL` or `AUTH_URL` | Public base URL for Checkout success/cancel redirects. |

## Database

Run migrations so `schools` includes billing columns:

```bash
npm run db:migrate
```

## Stripe Dashboard

1. Create a **Product** and **recurring Price**; copy the Price ID into `STRIPE_PRICE_SCHOOL_PRO`.
2. Add endpoint: `https://<your-domain>/api/billing/webhook` with events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
3. Copy the webhook **signing secret** to `STRIPE_WEBHOOK_SECRET`.

## Trial

New schools created via **claim-school** get `subscription_status = trial` and a **14-day** `subscription_trial_ends_at`. Paid access while `REQUIRE_PAID_SUBSCRIPTION=true` requires:

- `trial` with trial end in the future, or  
- Stripe subscription status `active` or `trialing` with a valid `subscription_current_period_end`.

## User flows

- **Pricing:** `/pricing` → Stripe Checkout (requires signed-in session with `schoolId`).
- **Success:** `/billing/success` after payment.
