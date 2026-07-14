-- Agregar columna vendido a productos para tracking explícito de ventas
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS vendido boolean DEFAULT false;

-- Índice para filtrar rápido por vendido
CREATE INDEX IF NOT EXISTS idx_productos_vendido ON public.productos(vendido);
