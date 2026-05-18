-- Optional region hints collected at self-service registration (not required for login).
ALTER TABLE platform_users
  ADD COLUMN IF NOT EXISTS registration_state varchar(100);

ALTER TABLE platform_users
  ADD COLUMN IF NOT EXISTS registration_city varchar(128);
