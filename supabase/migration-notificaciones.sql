-- Migration: notificaciones in-app para vendedoras
-- Run in Supabase SQL Editor

BEGIN;

-- 1. Tabla notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('product_approved','product_rejected','seller_approved','seller_rejected')),
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  link TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON notifications (user_id, created_at DESC);

-- 2. Columna vendedor_id en productos
ALTER TABLE productos ADD COLUMN IF NOT EXISTS vendedor_id UUID;

-- 3. RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "admin_all_notifications" ON notifications
  FOR ALL USING (true) WITH CHECK (true);

COMMIT;
