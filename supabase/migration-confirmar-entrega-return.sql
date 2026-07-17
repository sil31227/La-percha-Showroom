-- Hace que confirmar_entrega retorne BOOLEAN: true si actualizó, false si fue no-op.
-- Ejecutar en Supabase SQL Editor.

CREATE OR REPLACE FUNCTION confirmar_entrega(p_pedido_id TEXT)
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

  SELECT * INTO v_venta FROM ventas WHERE pedido_id = p_pedido_id AND status = 'pendiente' LIMIT 1;
  IF FOUND THEN
    UPDATE ventas SET status = 'liberado', liberado_at = NOW() WHERE id = v_venta.id;
    UPDATE profiles SET balance = balance + v_venta.monto_neto WHERE id = v_venta.vendedor_id;
    GET DIAGNOSTICS v_pedido_status = ROW_COUNT;
    IF v_pedido_status = 0 THEN
      RAISE EXCEPTION 'No se pudo acreditar el saldo al vendedor %', v_venta.vendedor_id;
    END IF;
  END IF;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION confirmar_entrega(TEXT) TO anon, authenticated, service_role;
