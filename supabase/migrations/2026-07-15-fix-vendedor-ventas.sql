-- Migration: Fix seller sales visibility end-to-end
-- Ejecutar en Supabase SQL Editor

-- 1. Agregar 'sold' al CHECK de productos.status
ALTER TABLE productos DROP CONSTRAINT IF EXISTS productos_status_check;
ALTER TABLE productos ADD CONSTRAINT productos_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'sold'));

-- 2. Agregar columns faltantes en pedidos (si no existen)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pedidos' AND column_name = 'variante_label') THEN
    ALTER TABLE pedidos ADD COLUMN variante_label TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pedidos' AND column_name = 'variante_atributos') THEN
    ALTER TABLE pedidos ADD COLUMN variante_atributos JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pedidos' AND column_name = 'mail_pago_enviado') THEN
    ALTER TABLE pedidos ADD COLUMN mail_pago_enviado BOOLEAN DEFAULT false;
  END IF;
END $$;
