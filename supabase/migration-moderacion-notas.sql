-- Agregar changes_requested al CHECK de status de productos
ALTER TABLE productos DROP CONSTRAINT IF EXISTS productos_status_check;
ALTER TABLE productos ADD CONSTRAINT productos_status_check
  CHECK (status IN ('pending','approved','rejected','changes_requested'));

-- Tabla de notas de moderacion
CREATE TABLE IF NOT EXISTS comentarios_moderacion (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id TEXT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL,
  tipo_accion TEXT NOT NULL CHECK (tipo_accion IN ('approved','rejected','changes_requested')),
  texto TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comentarios_producto ON comentarios_moderacion(producto_id, created_at DESC);

ALTER TABLE comentarios_moderacion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_access" ON comentarios_moderacion
  FOR ALL USING (true);
