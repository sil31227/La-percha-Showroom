-- Migration v2: Stock tracking & product variants
-- Run this after schema.sql in Supabase SQL Editor
-- https://hvmctiqzjbqsghuwhquk.supabase.co

-- 1. Add stock column to productos
ALTER TABLE productos
ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 1;

-- 2. Add variantes column to productos (JSONB for talle x color variants)
ALTER TABLE productos
ADD COLUMN IF NOT EXISTS variantes JSONB DEFAULT '[]';

-- ============================================================
-- 3. movimientos_stock — audit table for stock changes
-- ============================================================
CREATE TABLE IF NOT EXISTS movimientos_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id TEXT REFERENCES productos(id),
  pedido_id TEXT REFERENCES pedidos(id),
  variante_key TEXT,
  cantidad INTEGER NOT NULL,
  tipo TEXT CHECK (tipo IN ('venta','ajuste','reposicion','baja')),
  stock_resultante INTEGER,
  nota TEXT,
  fecha TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for movimientos_stock
ALTER TABLE movimientos_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_movimientos_stock"
  ON movimientos_stock FOR ALL
  USING (true) WITH CHECK (true);

-- ============================================================
-- 4. decrementar_stock function
-- ============================================================
CREATE OR REPLACE FUNCTION decrementar_stock(
  p_producto_id TEXT,
  p_variante_key TEXT,
  p_cantidad INT,
  p_pedido_id TEXT DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_stock_actual INTEGER;
  v_nuevo_stock INTEGER;
BEGIN
  IF p_variante_key IS NOT NULL THEN
    SELECT (v->>'stock')::INTEGER INTO v_stock_actual
    FROM productos, jsonb_array_elements(variantes) v
    WHERE id = p_producto_id AND v->>'nombre' = p_variante_key;

    IF v_stock_actual IS NULL THEN
      RAISE EXCEPTION 'Variante no encontrada: %', p_variante_key;
    END IF;

    v_nuevo_stock := v_stock_actual - p_cantidad;
    IF v_nuevo_stock < 0 THEN
      RAISE EXCEPTION 'Stock insuficiente para variante %: %', p_variante_key, v_stock_actual;
    END IF;

    UPDATE productos
    SET variantes = jsonb_set(
      variantes,
      ARRAY[(SELECT ordinality - 1 FROM jsonb_array_elements(variantes) WITH ORDINALITY WHERE value->>'nombre' = p_variante_key)::TEXT, 'stock'],
      to_jsonb(v_nuevo_stock)
    )
    WHERE id = p_producto_id;
  ELSE
    SELECT stock INTO v_stock_actual FROM productos WHERE id = p_producto_id;
    v_nuevo_stock := v_stock_actual - p_cantidad;
    IF v_nuevo_stock < 0 THEN
      RAISE EXCEPTION 'Stock insuficiente para producto %: %', p_producto_id, v_stock_actual;
    END IF;

    UPDATE productos SET stock = v_nuevo_stock WHERE id = p_producto_id;
  END IF;

  INSERT INTO movimientos_stock (producto_id, pedido_id, variante_key, cantidad, tipo, stock_resultante)
  VALUES (p_producto_id, p_pedido_id, p_variante_key, p_cantidad, 'venta', v_nuevo_stock);
END;
$$;
