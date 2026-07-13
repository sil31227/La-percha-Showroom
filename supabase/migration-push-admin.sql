-- Migration: suscripciones push del admin (web push / VAPID)
-- Run in Supabase SQL Editor

BEGIN;

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  endpoint   TEXT NOT NULL UNIQUE,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  audience   TEXT NOT NULL DEFAULT 'admin',
  user_id    UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS push_subscriptions_audience_idx
  ON push_subscriptions (audience);

CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx
  ON push_subscriptions (user_id);

-- RLS: solo el service_role (rutas API del servidor) accede.
-- Sin políticas públicas => el anon key no puede leer ni escribir.
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Si la tabla ya existe, ejecutar:
-- ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
-- CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx ON push_subscriptions (user_id);

COMMIT;
