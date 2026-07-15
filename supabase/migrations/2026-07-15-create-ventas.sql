-- Crear tabla ventas (comisión 80/20)
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

-- Habilitar RLS
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;

-- Admin access
CREATE POLICY "admin_all_ventas" ON ventas FOR ALL USING (true) WITH CHECK (true);

-- Sellers ven sus propias ventas
CREATE POLICY "ventas_select_own" ON ventas FOR SELECT USING (auth.uid() = vendedor_id);

-- Insertar la venta del Vestido de Martina
INSERT INTO ventas (id, pedido_id, vendedor_id, producto_titulo, monto_bruto, comision, monto_neto, status)
VALUES (
  'V-LP-MRMCVXF3-ELEM-97cw',
  'LP-MRMCVXF3-ELEM-97cw',
  '737b81c4-4373-4a5d-b61a-24a0c55573d1',
  'Vestido',
  100,
  20,
  80,
  'pendiente'
) ON CONFLICT (id) DO NOTHING;
