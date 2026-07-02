-- Ejecutar en Supabase SQL Editor
-- https://hvmctiqzjbqsghuwhquk.supabase.co/project/default/sql/new

ALTER TABLE productos DROP CONSTRAINT IF EXISTS productos_categoria_id_fkey;
ALTER TABLE productos DROP CONSTRAINT IF EXISTS productos_subcategoria_id_fkey;
