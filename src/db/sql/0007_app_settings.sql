-- Key-value settings for runtime app configuration (e.g. founder global Gemini text model).
CREATE TABLE IF NOT EXISTS app_settings (
  key varchar(128) PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
