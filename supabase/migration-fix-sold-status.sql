-- Restaurar 'sold' en el CHECK constraint de productos
-- (fue eliminado accidentalmente en migration-moderacion-notas.sql)
ALTER TABLE productos DROP CONSTRAINT IF EXISTS productos_status_check;
ALTER TABLE productos ADD CONSTRAINT productos_status_check
  CHECK (status IN ('pending','approved','rejected','changes_requested','sold'));
