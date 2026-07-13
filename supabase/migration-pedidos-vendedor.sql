-- Migration: agregar vendedor_id y producto_id a la tabla pedidos
-- Run in Supabase SQL Editor

BEGIN;

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS producto_id UUID REFERENCES productos(id),
  ADD COLUMN IF NOT EXISTS vendedor_id UUID REFERENCES auth.users(id);

COMMIT;
