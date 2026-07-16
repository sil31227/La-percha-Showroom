-- Schema La Percha Showroom
-- Ejecutar en Supabase SQL Editor: https://hvmctiqzjbqsghuwhquk.supabase.co

-- 0. PROFILES (extiende auth.users de Supabase)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  is_seller BOOLEAN DEFAULT false,
  seller_status TEXT CHECK (seller_status IN ('none','pending','approved','rejected')) DEFAULT 'none',
  balance INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1. CATEGORÍAS
CREATE TABLE categorias (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  destacada BOOLEAN DEFAULT false,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SUBCATEGORÍAS
CREATE TABLE subcategorias (
  id TEXT PRIMARY KEY,
  categoria_id TEXT REFERENCES categorias(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PRODUCTOS
CREATE TABLE productos (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  descripcion TEXT DEFAULT '',
  precio NUMERIC NOT NULL DEFAULT 0,
  precio_anterior NUMERIC,
  marca TEXT,
  material TEXT,
  categoria_id TEXT,
  subcategoria_id TEXT,
  estado TEXT CHECK (estado IN ('new_tag','new','like_new','used')),
  talles TEXT[] DEFAULT '{}',
  colores TEXT[] DEFAULT '{}',
  imagenes TEXT[] DEFAULT '{}',
  stock INTEGER DEFAULT 1,
  variantes JSONB DEFAULT '[]',
  envio_gratis BOOLEAN DEFAULT false,
  destacado BOOLEAN DEFAULT false,
  retiro_local BOOLEAN DEFAULT true,
  tipo TEXT CHECK (tipo IN ('ropa','tienda')) DEFAULT 'ropa',
  vendedor_nombre TEXT NOT NULL DEFAULT 'Tienda Oficial',
  vendedor_id UUID REFERENCES profiles(id),
  vendedor_tipo TEXT NOT NULL CHECK (vendedor_tipo IN ('oficial','feria')) DEFAULT 'oficial',
  status TEXT CHECK (status IN ('pending','approved','rejected','changes_requested','sold')) DEFAULT 'pending',
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. VENDEDORES
CREATE TABLE vendedores (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT,
  avatar TEXT,
  cbu TEXT,
  productos_count INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('pending','approved','rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PEDIDOS
-- ⚠️  MIGRACIÓN PENDIENTE: ejecutar migration-vendedor-tipo-not-null.sql en SQL Editor
--     para agregar NOT NULL a vendedor_tipo + backfill si hubiera NULLs residuales.
--     Última migración aplicada: migration-vendedor-tipo-pedidos.sql (ADD COLUMN sin backfill).
--     Backfill vía REST: 5/5 pedidos corregidos el 2026-07-15.
CREATE TABLE pedidos (
  id TEXT PRIMARY KEY,
  producto_titulo TEXT NOT NULL,
  producto_imagen TEXT,
  producto_id TEXT,
  precio NUMERIC NOT NULL,
  comprador_nombre TEXT,
  comprador_email TEXT,
  vendedor_nombre TEXT,
  vendedor_email TEXT,
  vendedor_id UUID REFERENCES profiles(id),
  vendedor_tipo TEXT NOT NULL CHECK (vendedor_tipo IN ('oficial','feria')),
  talle TEXT,
  direccion TEXT,
  metodo_envio TEXT,
  costo_envio NUMERIC,
  seguimiento TEXT,
  status TEXT CHECK (status IN ('pending_shipment','shipped','delivered','cancelled')) DEFAULT 'pending_shipment',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5b. VENTAS (comisión 80/20)
CREATE TABLE IF NOT EXISTS ventas (
  id TEXT PRIMARY KEY,
  pedido_id TEXT REFERENCES pedidos(id) ON DELETE CASCADE,
  vendedor_id UUID REFERENCES profiles(id),
  producto_titulo TEXT NOT NULL,
  monto_bruto INTEGER NOT NULL,
  comision INTEGER NOT NULL,
  monto_neto INTEGER NOT NULL,
  status TEXT CHECK (status IN ('pendiente','liberado','cancelada')) DEFAULT 'pendiente',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  liberado_at TIMESTAMPTZ
);

-- 5c. RETIROS
CREATE TABLE IF NOT EXISTS retiros (
  id TEXT PRIMARY KEY,
  vendedor_id UUID REFERENCES profiles(id),
  monto INTEGER NOT NULL,
  cbu TEXT,
  status TEXT CHECK (status IN ('solicitado','pagado','rechazado')) DEFAULT 'solicitado',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  pagado_at TIMESTAMPTZ
);

-- 6. FAQ
CREATE TABLE faq (
  id TEXT PRIMARY KEY,
  pregunta TEXT NOT NULL,
  respuesta TEXT NOT NULL,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TÉRMINOS
CREATE TABLE terminos (
  id INTEGER PRIMARY KEY DEFAULT 1,
  contenido TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== SEED DATA =====

-- Categorías
INSERT INTO categorias (id, nombre, orden) VALUES
  ('mujer', 'Mujer', 1),
  ('hombre', 'Hombre', 2),
  ('kids', 'Kids', 3),
  ('tienda', 'Tienda Percha', 4);

-- Subcategorías
INSERT INTO subcategorias (id, categoria_id, nombre, orden) VALUES
  ('sub-m-ro', 'mujer', 'Ropa', 1),
  ('sub-m-ca', 'mujer', 'Calzado', 2),
  ('sub-m-ac', 'mujer', 'Accesorios', 3),
  ('sub-m-be', 'mujer', 'Belleza', 4),
  ('sub-h-ro', 'hombre', 'Ropa', 1),
  ('sub-h-ca', 'hombre', 'Calzado', 2),
  ('sub-h-ac', 'hombre', 'Accesorios', 3),
  ('sub-k-be', 'kids', 'Bebés', 1),
  ('sub-k-ni', 'kids', 'Niñas', 2),
  ('sub-k-no', 'kids', 'Niños', 3),
  ('sub-t-re', 'tienda', 'Regalería', 1),
  ('sub-t-ba', 'tienda', 'Bazar', 2),
  ('sub-t-de', 'tienda', 'Decoración', 3);

-- Los productos y vendedores ya no se siembran desde schema.sql.
-- Los vendedores se registran desde la app y se gestionan desde el admin.

-- FAQ
INSERT INTO faq (id, pregunta, respuesta, orden) VALUES
  ('f1', '¿Cómo comprar en La Percha?', 'Explorá los productos desde la sección Inicio, filtrá por categoría, talle o condición. Cuando encuentres algo que te guste, agregalo al carrito y seguí los pasos del checkout. Podés pagar con Mercado Pago o transferencia bancaria.', 1),
  ('f2', '¿Cómo vender mi ropa?', 'Andá a la sección Vender, completá el formulario con los datos de tu prenda, subí fotos, elegí el precio y publicala. Cuando alguien compre, coordinás el envío. Vos te quedás con el 80% de cada venta.', 2),
  ('f3', '¿Cuánto cuesta vender?', 'La comisión de La Percha es del 20% sobre el precio de venta. Si vendés una prenda a $10.000, recibís $8.000. No hay costos de publicación ni mensualidades.', 3),
  ('f4', '¿Cómo funciona el envío?', 'Cuando se concreta una venta, la vendedora coordina el envío con la compradora. Podés ofrecer envío gratis para destacar tus productos. Los envíos se acuerdan entre las partes.', 4),
  ('f5', '¿Cómo me registro como vendedora?', 'Creá tu cuenta en La Percha, completá tus datos de vendedora (CBU para cobrar) y empezá a publicar. Tu solicitud será revisada por nuestro equipo antes de activar tu perfil de venta.', 5),
  ('f6', '¿Puedo devolver un producto?', 'Las devoluciones se acuerdan directamente con la vendedora. Te recomendamos revisar bien las fotos y la descripción antes de comprar. Si tenés algún problema, contactanos por WhatsApp.', 6),
  ('f7', '¿Qué estado pueden tener las prendas?', 'Las prendas pueden ser Nuevas con etiqueta, Nuevas (sin etiqueta), Como nuevas (usadas una o dos veces) o Usadas. La vendedora debe indicar el estado real y cualquier detalle en la descripción.', 7);

-- Términos
INSERT INTO terminos (id, contenido) VALUES (1, $$Términos y Condiciones para Vendedoras

1. PRODUCTOS PERMITIDOS: Solo se permite la venta de ropa, calzado, accesorios, artículos de bazar, regalería y decoración en buen estado. No se permite la venta de productos ilegales, falsificados o que infrinjan derechos de autor.

2. ESTADO DE LOS PRODUCTOS: La vendedora se compromete a describir con honestidad el estado real de cada prenda, incluyendo cualquier defecto, mancha o rotura. Las fotos deben ser reales y actuales del producto.

3. COMISIÓN: La Percha Showroom retiene el 20% del precio de venta como comisión por el uso de la plataforma. El 80% restante se transfiere a la vendedora una vez confirmada la entrega.

4. ENVÍOS: La vendedora es responsable de coordinar y enviar los productos dentro de las 48hs hábiles posteriores a la confirmación de compra.

5. PAGOS: Los pagos a vendedoras se realizan por transferencia bancaria al CBU registrado, dentro de los 7 días hábiles posteriores a la confirmación de entrega.

6. CONDUCTA: No se tolera el acoso, lenguaje ofensivo ni ninguna forma de discriminación. La Percha se reserva el derecho de suspender cuentas que violen estas normas.

7. PRIVACIDAD: Los datos personales son tratados conforme a la Ley de Protección de Datos Personales. No compartimos información con terceros sin consentimiento.$$);

-- ===== RLS POLICIES =====
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE retiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminos ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/write their own
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Public read access for client-facing tables
CREATE POLICY "lectura_publica_productos" ON productos FOR SELECT USING (status = 'approved');
CREATE POLICY "lectura_publica_categorias" ON categorias FOR SELECT USING (true);
CREATE POLICY "lectura_publica_subcategorias" ON subcategorias FOR SELECT USING (true);
CREATE POLICY "lectura_publica_faq" ON faq FOR SELECT USING (true);
CREATE POLICY "lectura_publica_terminos" ON terminos FOR SELECT USING (true);

-- Full access for admin (service_role bypasses RLS; these are for the anon key with admin auth)
CREATE POLICY "admin_all_profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "admin_all_productos" ON productos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "admin_all_categorias" ON categorias FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "admin_all_subcategorias" ON subcategorias FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "admin_all_vendedores" ON vendedores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "admin_all_pedidos" ON pedidos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "admin_all_ventas" ON ventas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "admin_all_retiros" ON retiros FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "admin_all_faq" ON faq FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "admin_all_terminos" ON terminos FOR ALL USING (true) WITH CHECK (true);

-- Ventas: sellers see their own
CREATE POLICY "ventas_select_own" ON ventas FOR SELECT USING (auth.uid() = vendedor_id);

-- Retiros: sellers see and insert their own
CREATE POLICY "retiros_select_own" ON retiros FOR SELECT USING (auth.uid() = vendedor_id);
CREATE POLICY "retiros_insert_own" ON retiros FOR INSERT WITH CHECK (auth.uid() = vendedor_id);

-- ===== RPC FUNCTIONS =====

-- Confirmar entrega + acreditar 80% (atómica, idempotente)
CREATE OR REPLACE FUNCTION confirmar_entrega(p_pedido_id TEXT)
RETURNS void
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
    RETURN;
  END IF;

  UPDATE pedidos SET status = 'delivered' WHERE id = p_pedido_id;

  SELECT * INTO v_venta FROM ventas WHERE pedido_id = p_pedido_id AND status = 'pendiente' LIMIT 1;
  IF FOUND THEN
    UPDATE ventas SET status = 'liberado', liberado_at = NOW() WHERE id = v_venta.id;
    UPDATE profiles SET balance = balance + v_venta.monto_neto WHERE id = v_venta.vendedor_id;
  END IF;
END;
$$;

-- Solicitar retiro (valida saldo, descuenta, registra)
CREATE OR REPLACE FUNCTION solicitar_retiro(p_vendedor_id UUID, p_monto INTEGER, p_cbu TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance INTEGER;
  v_id TEXT;
BEGIN
  IF p_monto IS NULL OR p_monto <= 0 THEN
    RAISE EXCEPTION 'Monto inválido';
  END IF;
  SELECT balance INTO v_balance FROM profiles WHERE id = p_vendedor_id FOR UPDATE;
  IF v_balance IS NULL OR p_monto > v_balance THEN
    RAISE EXCEPTION 'Saldo insuficiente';
  END IF;

  v_id := 'R-' || to_char(NOW(), 'YYYYMMDDHH24MISS') || '-' || substr(md5(random()::text), 1, 4);
  INSERT INTO retiros (id, vendedor_id, monto, cbu, status)
  VALUES (v_id, p_vendedor_id, p_monto, p_cbu, 'solicitado');
  UPDATE profiles SET balance = balance - p_monto WHERE id = p_vendedor_id;
  RETURN v_id;
END;
$$;

-- Marcar retiro pagado (admin, idempotente, no toca balance)
CREATE OR REPLACE FUNCTION marcar_retiro_pagado(p_retiro_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE retiros SET status = 'pagado', pagado_at = NOW()
  WHERE id = p_retiro_id AND status <> 'pagado';
END;
$$;

-- Permisos de ejecución
GRANT EXECUTE ON FUNCTION confirmar_entrega(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION solicitar_retiro(UUID, INTEGER, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION marcar_retiro_pagado(TEXT) TO anon, authenticated, service_role;
