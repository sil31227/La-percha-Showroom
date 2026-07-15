-- Migration: agregar vendedor_tipo a pedidos
-- Ejecutar en Supabase SQL Editor
BEGIN;

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS vendedor_tipo TEXT;

COMMIT;
