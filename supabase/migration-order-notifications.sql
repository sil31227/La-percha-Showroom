-- Migration: nuevos tipos de notificación para pedidos (order_shipped, order_delivered)
--           + función helper para buscar user_id por email
-- Ejecutar en Supabase SQL Editor o con node supabase/migrate.mjs

BEGIN;

ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('product_approved','product_rejected','seller_approved','seller_rejected','order_shipped','order_delivered'));

CREATE OR REPLACE FUNCTION get_user_id_by_email(p_email TEXT)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT id FROM auth.users WHERE email = LOWER(p_email) LIMIT 1;
$$;

COMMIT;
