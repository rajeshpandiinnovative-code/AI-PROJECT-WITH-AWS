-- Revenue ledger for master insights (Stripe invoice.paid). Run after platform_users + schools exist.

CREATE TABLE IF NOT EXISTS revenue_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_invoice_id varchar(255) NOT NULL UNIQUE,
  amount_minor integer NOT NULL,
  currency varchar(8) NOT NULL DEFAULT 'INR',
  school_id uuid REFERENCES schools (id) ON DELETE SET NULL,
  platform_user_id uuid REFERENCES platform_users (id) ON DELETE SET NULL,
  occurred_at timestamptz NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS revenue_events_occurred_at_idx ON revenue_events (occurred_at);
CREATE INDEX IF NOT EXISTS revenue_events_school_id_idx ON revenue_events (school_id);
