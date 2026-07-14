-- Migration: add datos de cobro columns to vendedores
-- Run in Supabase SQL Editor

BEGIN;

ALTER TABLE vendedores ADD COLUMN IF NOT EXISTS banco TEXT;
ALTER TABLE vendedores ADD COLUMN IF NOT EXISTS tipo_cuenta TEXT DEFAULT 'caja_ahorro';
ALTER TABLE vendedores ADD COLUMN IF NOT EXISTS alias TEXT;
ALTER TABLE vendedores ADD COLUMN IF NOT EXISTS titular TEXT;

COMMIT;
