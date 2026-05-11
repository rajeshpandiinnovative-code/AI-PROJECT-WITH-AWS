-- Demo login tracking + 1-day access window (run against your app database).
-- Example: psql "$DATABASE_URL" -f sql/0004_demo_sessions.sql

CREATE TABLE IF NOT EXISTS demo_sessions (
  id uuid PRIMARY KEY,
  display_name varchar(255) NOT NULL,
  mobile varchar(32) NOT NULL,
  board varchar(128) NOT NULL,
  role varchar(32) NOT NULL,
  state varchar(128) NOT NULL,
  district varchar(128) NOT NULL,
  city varchar(128) NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  user_agent text,
  ip varchar(45)
);

CREATE INDEX IF NOT EXISTS demo_sessions_expires_at_idx ON demo_sessions (expires_at);
CREATE INDEX IF NOT EXISTS demo_sessions_started_at_idx ON demo_sessions (started_at);

CREATE TABLE IF NOT EXISTS demo_session_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES demo_sessions (id) ON DELETE CASCADE,
  event_type varchar(64) NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS demo_session_events_session_id_idx ON demo_session_events (session_id);
CREATE INDEX IF NOT EXISTS demo_session_events_type_created_idx ON demo_session_events (event_type, created_at);
