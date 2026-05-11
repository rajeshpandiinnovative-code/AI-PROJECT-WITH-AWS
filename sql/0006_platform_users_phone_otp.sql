ALTER TABLE platform_users
ADD COLUMN IF NOT EXISTS phone_number varchar(20),
ADD COLUMN IF NOT EXISTS otp_secret varchar(255),
ADD COLUMN IF NOT EXISTS otp_expires timestamptz,
ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'platform_users_phone_number_unique'
  ) THEN
    CREATE UNIQUE INDEX platform_users_phone_number_unique
      ON platform_users (phone_number)
      WHERE phone_number IS NOT NULL;
  END IF;
END $$;
