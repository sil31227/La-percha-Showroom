-- Checkout atómico: reserva stock + crea pedidos en una sola transacción PostgreSQL.
-- Resuelve race condition de double-spend (issue #77).

CREATE OR REPLACE FUNCTION checkout_reservar_stock(
  p_items JSONB  -- [{product_id, variant_label, size}]
)
RETURNS TABLE(
  product_id TEXT,
  titulo TEXT,
  precio NUMERIC,
  variant_price NUMERIC,
  imagenes TEXT[],
  vendedor_nombre TEXT,
  vendedor_id UUID,
  vendedor_tipo TEXT,
  variant_label TEXT,
  variant_attributes JSONB,
  sold_out BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  item JSONB;
  prod RECORD;
  variantes JSONB;
  var_idx INT;
  var_data JSONB;
  var_precio NUMERIC;
  var_atributos JSONB;
  old_stock INT;
  new_stock INT;
  total_stock INT;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(p_items) ORDER BY value->>'product_id' LOOP
    SELECT * INTO prod FROM productos WHERE id = item->>'product_id' FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Producto no encontrado: %', item->>'product_id';
    END IF;

    IF item->>'variant_label' IS NOT NULL AND item->>'variant_label' != '' THEN
      variantes := COALESCE(prod.variantes, '[]'::jsonb);
      var_idx := -1;

      FOR i IN 0..jsonb_array_length(variantes) - 1 LOOP
        IF variantes->i->>'nombre' = item->>'variant_label' THEN
          var_data := variantes->i;
          var_idx := i;
          EXIT;
        END IF;
      END LOOP;

      IF var_idx = -1 THEN
        RAISE EXCEPTION 'Variante no encontrada: % para producto %', item->>'variant_label', item->>'product_id';
      END IF;

      old_stock := COALESCE((var_data->>'stock')::INT, 0);
      IF old_stock < 1 THEN
        RAISE EXCEPTION 'Sin stock de variante % para producto %', item->>'variant_label', item->>'product_id';
      END IF;

      new_stock := old_stock - 1;
      variantes := jsonb_set(variantes, ARRAY[var_idx::text, 'stock'], to_jsonb(new_stock));

      SELECT COALESCE(SUM(COALESCE((v->>'stock')::INT, 0)), 0) INTO total_stock
      FROM jsonb_array_elements(variantes) v;

      UPDATE productos SET variantes = variantes WHERE id = prod.id;

      var_precio := COALESCE((var_data->>'precio')::NUMERIC, prod.precio);
      var_atributos := var_data->'atributos';

      IF total_stock = 0 THEN
        UPDATE productos SET status = 'sold', vendido = true WHERE id = prod.id;
      END IF;
    ELSE
      old_stock := COALESCE(prod.stock, 0);
      IF old_stock < 1 THEN
        RAISE EXCEPTION 'Sin stock para producto %', item->>'product_id';
      END IF;

      new_stock := old_stock - 1;
      UPDATE productos SET stock = new_stock WHERE id = prod.id;

      var_precio := NULL;
      var_atributos := NULL;

      IF new_stock = 0 THEN
        UPDATE productos SET status = 'sold', vendido = true WHERE id = prod.id;
      END IF;
    END IF;

    product_id := prod.id;
    titulo := prod.titulo;
    precio := prod.precio;
    variant_price := var_precio;
    imagenes := prod.imagenes;
    vendedor_nombre := prod.vendedor_nombre;
    vendedor_id := prod.vendedor_id;
    vendedor_tipo := prod.vendedor_tipo;
    variant_label := CASE WHEN item->>'variant_label' != '' THEN item->>'variant_label' ELSE NULL END;
    variant_attributes := var_atributos;
    sold_out := (new_stock = 0);

    RETURN NEXT;

    INSERT INTO movimientos_stock (producto_id, variante_key, cantidad, tipo, stock_resultante)
    VALUES (prod.id,
      CASE WHEN item->>'variant_label' != '' THEN item->>'variant_label' ELSE NULL END,
      1, 'venta', new_stock);
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION checkout_reservar_stock(JSONB) TO anon, authenticated, service_role;
