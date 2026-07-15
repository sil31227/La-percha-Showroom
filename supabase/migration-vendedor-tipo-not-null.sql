-- Migration: backfill + NOT NULL para vendedor_tipo en pedidos
-- Ejecutar en Supabase SQL Editor después de que el backfill esté confirmado
-- Contexto: migration-vendedor-tipo-pedidos.sql agregó la columna pero sin backfill
--           ni NOT NULL, causando bug recurrente en /api/pedidos/despachar.
BEGIN;

-- 1. Backfill de filas existentes con vendedor_tipo NULL (por si no se hizo vía REST)
UPDATE pedidos p
SET vendedor_tipo = prod.vendedor_tipo
FROM productos prod
WHERE p.producto_id = prod.id
  AND p.vendedor_tipo IS NULL;

-- 2. Para pedidos sin producto_id (huérfanos), defaults a 'oficial' si son Tienda Oficial
UPDATE pedidos
SET vendedor_tipo = 'oficial'
WHERE vendedor_tipo IS NULL
  AND vendedor_nombre = 'Tienda Oficial';

-- 3. Validar que no quedan nulos
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count FROM pedidos WHERE vendedor_tipo IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Quedan % pedidos con vendedor_tipo NULL. Corregir antes de continuar.', null_count;
  END IF;
END $$;

-- 4. Agregar NOT NULL constraint
ALTER TABLE pedidos
  ALTER COLUMN vendedor_tipo SET NOT NULL;

-- 5. Notificar a PostgREST para que recargue el schema cache
NOTIFY pgrst, 'reload schema';

COMMIT;
