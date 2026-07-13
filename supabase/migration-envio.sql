-- Migration: shipping configuration support
-- Run in Supabase SQL Editor

BEGIN;

-- 1. Config table (single row)
CREATE TABLE IF NOT EXISTS configuracion_envio (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  sucursal_price INT NOT NULL DEFAULT 3500,
  domicilio_price INT NOT NULL DEFAULT 6500,
  free_threshold INT NOT NULL DEFAULT 60000,
  domicilio_surcharge INT NOT NULL DEFAULT 3000,
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO configuracion_envio (id, sucursal_price, domicilio_price, free_threshold, domicilio_surcharge)
VALUES (1, 3500, 6500, 60000, 3000)
ON CONFLICT (id) DO NOTHING;

-- 2. Add columns to pedidos
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS metodo_envio TEXT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS costo_envio INT DEFAULT 0;

COMMIT;
