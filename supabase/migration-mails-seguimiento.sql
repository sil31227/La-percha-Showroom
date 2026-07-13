-- Mails de pedido, seguimiento de envío y retiro en local
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS mail_pago_enviado BOOLEAN DEFAULT false;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS seguimiento TEXT;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS retiro_local BOOLEAN DEFAULT false;

-- Los productos de tienda oficial permiten retiro en local por defecto
UPDATE productos SET retiro_local = true WHERE vendedor_tipo = 'oficial' AND retiro_local IS NOT true;
