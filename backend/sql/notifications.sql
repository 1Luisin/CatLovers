-- Executado automaticamente pela API. Mantido aqui para documentação.

CREATE TABLE IF NOT EXISTS notification_subscriptions (
  id UUID PRIMARY KEY,
  device_id TEXT NOT NULL,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('android', 'ios', 'web')),
  expo_push_token TEXT,
  web_push_subscription JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (device_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_subscriptions_profile
  ON notification_subscriptions(profile_id);

CREATE TABLE IF NOT EXISTS notification_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_deliveries (
  delivery_key TEXT PRIMARY KEY,
  delivered_at TIMESTAMPTZ
);
