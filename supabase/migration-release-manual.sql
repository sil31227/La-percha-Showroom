-- ============================================================
-- Migración: Liberación manual de fondos por admin
-- Issue #64 — RPC confirmar_entrega ya no libera automáticamente
--            + nuevo RPC liberar_fondos para admin
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Reemplazar confirmar_entrega: agrega parámetro p_liberacion_automatica
--    DEFAULT true para backward-compat con admin/oficial
CREATE OR REPLACE FUNCTION confirmar_entrega(p_pedido_id TEXT, p_liberacion_automatica BOOLEAN DEFAULT true)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pedido_status TEXT;
  v_venta ventas%ROWTYPE;
BEGIN
  SELECT status INTO v_pedido_status FROM pedidos WHERE id = p_pedido_id;
  IF v_pedido_status IS DISTINCT FROM 'shipped' THEN
    RETURN false;
  END IF;

  UPDATE pedidos SET status = 'delivered' WHERE id = p_pedido_id;

  IF p_liberacion_automatica THEN
    SELECT * INTO v_venta FROM ventas WHERE pedido_id = p_pedido_id AND status = 'pendiente' LIMIT 1;
    IF FOUND THEN
      UPDATE ventas SET status = 'liberado', liberado_at = NOW() WHERE id = v_venta.id;
      UPDATE profiles SET balance = balance + v_venta.monto_neto WHERE id = v_venta.vendedor_id;
      GET DIAGNOSTICS v_pedido_status = ROW_COUNT;
      IF v_pedido_status = 0 THEN
        RAISE EXCEPTION 'No se pudo acreditar el saldo al vendedor %', v_venta.vendedor_id;
      END IF;
    END IF;
  END IF;

  RETURN true;
END;
$$;

-- 2. Nueva función: liberar fondos manualmente (admin)
CREATE OR REPLACE FUNCTION liberar_fondos(p_venta_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_venta ventas%ROWTYPE;
  v_pedido_status TEXT;
  v_affected INTEGER;
BEGIN
  SELECT * INTO v_venta FROM ventas WHERE id = p_venta_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Venta no encontrada';
  END IF;

  IF v_venta.status <> 'pendiente' THEN
    RAISE EXCEPTION 'La venta no está pendiente (status: %)', v_venta.status;
  END IF;

  SELECT status INTO v_pedido_status FROM pedidos WHERE id = v_venta.pedido_id;
  IF v_pedido_status IS DISTINCT FROM 'delivered' THEN
    RAISE EXCEPTION 'El pedido asociado no está entregado (status: %)', v_pedido_status;
  END IF;

  UPDATE ventas SET status = 'liberado', liberado_at = NOW() WHERE id = p_venta_id;
  UPDATE profiles SET balance = balance + v_venta.monto_neto WHERE id = v_venta.vendedor_id;
  GET DIAGNOSTICS v_affected = ROW_COUNT;
  IF v_affected = 0 THEN
    RAISE EXCEPTION 'No se pudo acreditar el saldo al vendedor %', v_venta.vendedor_id;
  END IF;

  RETURN true;
END;
$$;

-- 3. Actualizar permisos
GRANT EXECUTE ON FUNCTION confirmar_entrega(TEXT, BOOLEAN) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION liberar_fondos(TEXT) TO anon, authenticated, service_role;

-- 4. Verificación
SELECT 'confirmar_entrega' AS funcion, proname, pg_get_function_identity_arguments(oid) AS args
FROM pg_proc WHERE proname = 'confirmar_entrega'
UNION ALL
SELECT 'liberar_fondos', proname, pg_get_function_identity_arguments(oid)
FROM pg_proc WHERE proname = 'liberar_fondos';
