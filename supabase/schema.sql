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
  tipo TEXT CHECK (tipo IN ('ropa','tienda')) DEFAULT 'ropa',
  vendedor_nombre TEXT NOT NULL DEFAULT 'Tienda Oficial',
  vendedor_tipo TEXT CHECK (vendedor_tipo IN ('oficial','feria')) DEFAULT 'oficial',
  status TEXT CHECK (status IN ('pending','approved','rejected')) DEFAULT 'pending',
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
CREATE TABLE pedidos (
  id TEXT PRIMARY KEY,
  producto_titulo TEXT NOT NULL,
  producto_imagen TEXT,
  precio NUMERIC NOT NULL,
  comprador_nombre TEXT,
  comprador_email TEXT,
  vendedor_nombre TEXT,
  vendedor_email TEXT,
  talle TEXT,
  direccion TEXT,
  status TEXT CHECK (status IN ('pending_shipment','shipped','delivered','cancelled')) DEFAULT 'pending_shipment',
  created_at TIMESTAMPTZ DEFAULT NOW()
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

-- Productos de ejemplo
INSERT INTO productos (id, titulo, precio, precio_anterior, descripcion, marca, categoria_id, subcategoria_id, estado, talles, imagenes, envio_gratis, destacado, tipo, vendedor_nombre, vendedor_tipo, status) VALUES
  ('p1', 'Vestido lino sage', 18900, NULL, '', '', 'mujer', 'sub-m-ro', 'new_tag', ARRAY['S','M','L'], ARRAY['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop'], false, false, 'ropa', 'Laura M.', 'feria', 'pending'),
  ('p2', 'Blazer crema oversize', 24700, 31000, '', '', 'mujer', 'sub-m-ro', 'like_new', ARRAY['M','L'], ARRAY['https://images.unsplash.com/photo-1594938298603-c8148c4b4e6f?w=600&h=800&fit=crop'], true, true, 'ropa', 'Tienda Oficial', 'oficial', 'approved'),
  ('p3', 'Top crochet mint', 8300, NULL, '', '', 'mujer', 'sub-m-ro', 'new', ARRAY['XS','S','M'], ARRAY['https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&h=800&fit=crop'], false, false, 'ropa', 'Sofía R.', 'feria', 'pending'),
  ('p4', 'Jean mom fit talle 26', 15300, NULL, '', '', 'mujer', 'sub-m-ro', 'used', ARRAY['26'], ARRAY['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&h=800&fit=crop'], false, false, 'ropa', 'Carla G.', 'feria', 'pending'),
  ('p5', 'Camisa lino hombre M', 11600, NULL, '', '', 'hombre', 'sub-h-ro', 'new_tag', ARRAY['M','L','XL'], ARRAY['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&h=800&fit=crop'], false, false, 'ropa', 'Martín P.', 'feria', 'pending'),
  ('p6', 'Zapatillas urbanas t38', 19700, NULL, '', '', 'mujer', 'sub-m-ca', 'new', ARRAY['38','39','40'], ARRAY['https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&h=800&fit=crop'], true, false, 'ropa', 'Tienda Oficial', 'oficial', 'approved'),
  ('p7', 'Conjunto bebé orgánico', 9200, NULL, '', '', 'kids', 'sub-k-be', 'new_tag', ARRAY['Único'], ARRAY['https://images.unsplash.com/photo-1522771930-78848d9293e8?w=600&h=800&fit=crop'], false, false, 'ropa', 'Valen T.', 'feria', 'pending'),
  ('p8', 'Kimono seda estampado', 21500, NULL, '', '', 'mujer', 'sub-m-ro', 'like_new', ARRAY['S','M'], ARRAY['https://images.unsplash.com/photo-1602607144289-dcc40cc61b90?w=600&h=800&fit=crop'], false, false, 'ropa', 'Flor D.', 'feria', 'rejected'),
  ('p9', 'Buzo oversized kids 10', 10800, NULL, '', '', 'kids', 'sub-k-ni', 'used', ARRAY['10','12'], ARRAY['https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=600&h=800&fit=crop'], false, false, 'ropa', 'Romi S.', 'feria', 'pending'),
  ('p10', 'Sweater cashmere camel', 31200, 38000, '', '', 'mujer', 'sub-m-ro', 'new_tag', ARRAY['S','M','L','XL'], ARRAY['https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&h=800&fit=crop'], true, true, 'ropa', 'Tienda Oficial', 'oficial', 'approved');

-- Vendedores
INSERT INTO vendedores (id, nombre, email, avatar, cbu, productos_count, status) VALUES
  ('v1', 'María José López', 'majo@email.com', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop', '0171234540000012345678', 12, 'approved'),
  ('v2', 'Camila Suárez', 'cami@email.com', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop', '0110567840000098765432', 8, 'pending'),
  ('v3', 'Florencia D''Angelo', 'flor@email.com', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop', '0150999940000011112222', 15, 'pending'),
  ('v4', 'Valentina Ríos', 'vale@email.com', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop', '0720000780000001234567', 5, 'pending'),
  ('v5', 'Luciana Paz', 'lu@email.com', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop', '0110123450000099988776', 1, 'rejected'),
  ('v6', 'Agustina Vega', 'agus@email.com', 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=100&h=100&fit=crop', '0140333340000055556666', 20, 'approved');

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
CREATE POLICY "admin_all_faq" ON faq FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "admin_all_terminos" ON terminos FOR ALL USING (true) WITH CHECK (true);
