-- Reparación: ventas huérfanas (pedido delivered, venta pendiente)
-- -----------------------------------------------------------------------
-- Causa: el admin marcó el pedido como entregado desde /admin/pedidos
-- pero el RPC confirmar_entrega nunca corrió (actualizaba el status antes
-- de llamar al RPC, y el RPC veía 'delivered' en vez de 'shipped').
--
-- Ejecutar en Supabase SQL Editor:
-- https://hvmctiqzjbqsghuwhquk.supabase.co

BEGIN;

-- 1. Diagnóstico: mostrar ventas pendientes cuyo pedido ya está delivered
DO $$
DECLARE
  rec RECORD;
  total_fixed INTEGER := 0;
  total_amount INTEGER := 0;
BEGIN
  RAISE NOTICE '=== VENTAS HUÉRFANAS (pedido delivered, venta pendiente) ===';

  FOR rec IN
    SELECT v.id AS venta_id, v.pedido_id, v.vendedor_id, v.monto_neto,
           v.producto_titulo, pr.balance AS balance_actual
    FROM ventas v
    JOIN pedidos p ON v.pedido_id = p.id
    JOIN profiles pr ON v.vendedor_id = pr.id
    WHERE v.status = 'pendiente'
      AND p.status = 'delivered'
  LOOP
    RAISE NOTICE '  Venta % | Pedido % | Vendedor % | $% | Producto: % | Balance actual: $%',
      rec.venta_id, rec.pedido_id, rec.vendedor_id,
      rec.monto_neto, rec.producto_titulo, rec.balance_actual;

    -- 2. Reparar: liberar venta + acreditar balance
    UPDATE ventas
    SET status = 'liberado', liberado_at = NOW()
    WHERE id = rec.venta_id;

    UPDATE profiles
    SET balance = balance + rec.monto_neto
    WHERE id = rec.vendedor_id;

    total_fixed := total_fixed + 1;
    total_amount := total_amount + rec.monto_neto;
  END LOOP;

  IF total_fixed = 0 THEN
    RAISE NOTICE '  (ninguna) — no hay ventas huérfanas';
  ELSE
    RAISE NOTICE '=== REPARADAS: % ventas, $% acreditados a balances ===',
      total_fixed, total_amount;
  END IF;
END;
$$;

COMMIT;
