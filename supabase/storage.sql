-- Bucket público para imágenes de productos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('productos', 'productos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 10485760;

-- Acceso público de lectura
CREATE POLICY "lectura_publica_productos" ON storage.objects
FOR SELECT USING (bucket_id = 'productos');
