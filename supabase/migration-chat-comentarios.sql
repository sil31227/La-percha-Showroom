-- Migration: chat de envío + comentarios en productos
-- Run in Supabase SQL Editor

BEGIN;

-- 1. Tabla conversaciones (una por pedido)
CREATE TABLE IF NOT EXISTS conversaciones (
  id TEXT PRIMARY KEY,
  pedido_id TEXT NOT NULL UNIQUE REFERENCES pedidos(id),
  comprador_id UUID NOT NULL,
  vendedor_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS conversaciones_pedido_idx ON conversaciones(pedido_id);

-- 2. Tabla mensajes
CREATE TABLE IF NOT EXISTS mensajes (
  id TEXT PRIMARY KEY,
  conversacion_id TEXT NOT NULL REFERENCES conversaciones(id),
  sender_id UUID NOT NULL,
  texto TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS mensajes_conversacion_idx ON mensajes(conversacion_id, created_at);

-- 3. Tabla comentarios_producto
CREATE TABLE IF NOT EXISTS comentarios_producto (
  id TEXT PRIMARY KEY,
  producto_id TEXT NOT NULL REFERENCES productos(id),
  user_id UUID NOT NULL,
  texto TEXT NOT NULL,
  deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS comentarios_producto_idx ON comentarios_producto(producto_id, created_at);

-- 4. Ampliar CHECK constraint de notifications para nuevos tipos
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'product_approved','product_rejected','product_changes_requested',
    'seller_approved','seller_rejected',
    'order_shipped','order_delivered',
    'product_sold',
    'new_message','new_comment'
  ));

-- 5. RLS: conversaciones
ALTER TABLE conversaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversaciones_select_own" ON conversaciones
  FOR SELECT USING (auth.uid() = comprador_id OR auth.uid() = vendedor_id);

CREATE POLICY "conversaciones_insert_own" ON conversaciones
  FOR INSERT WITH CHECK (auth.uid() = comprador_id OR auth.uid() = vendedor_id);

-- 6. RLS: mensajes
ALTER TABLE mensajes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mensajes_select_participant" ON mensajes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversaciones c
      WHERE c.id = mensajes.conversacion_id
        AND (c.comprador_id = auth.uid() OR c.vendedor_id = auth.uid())
    )
  );

CREATE POLICY "mensajes_insert_participant" ON mensajes
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND EXISTS (
      SELECT 1 FROM conversaciones c
      WHERE c.id = mensajes.conversacion_id
        AND (c.comprador_id = auth.uid() OR c.vendedor_id = auth.uid())
    )
  );

-- 7. RLS: comentarios_producto
ALTER TABLE comentarios_producto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comentarios_select_public" ON comentarios_producto
  FOR SELECT USING (deleted = false);

CREATE POLICY "comentarios_insert_authenticated" ON comentarios_producto
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE para soft-delete (admin via service_role — sin policy, se maneja desde API)
-- No policy explícita para UPDATE porque el admin usa service_role

COMMIT;
