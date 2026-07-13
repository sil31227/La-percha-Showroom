# Mails de pedido y seguimiento de envío — Diseño

Fecha: 2026-07-13

## Problema

1. Cuando una clienta compra y paga por Mercado Pago (pantalla "¡Pago confirmado!"),
   no recibe ningún mail con los detalles del pedido/envío.
2. Cuando la admin marca un pedido como "Enviado", la clienta no recibe aviso ni ve
   que fue enviado por Correo Argentino, ni tiene el número de seguimiento.

## Alcance

- **Solo Mercado Pago** dispara el mail de pago confirmado (no transferencia ni otros).
- El aviso de envío aplica a envíos por Correo Argentino (`correo_sucursal`,
  `correo_domicilio`). "Arreglar con el vendedor" no lleva seguimiento.

## Funcionalidad 1 — Mail de pago confirmado (Mercado Pago)

- **Nueva ruta** `POST /api/email/pedido-confirmado`
  - Recibe: `email`, `orderId`, `items` (título, talle, precio, imagen),
    `direccion`, `metodo_envio`, `costo_envio`, `total`.
  - Arma HTML con el template visual existente (verde `#809671`, Playfair) y envía
    con Resend a `comprador_email`.
- **Disparo desde el webhook** `/api/mercadopago/webhook` (confirmación server-side confiable):
  - Cuando `paymentData.status === "approved"`, junta todos los `pedidos` de la orden
    (por prefijo `external_reference`), y si aún no se envió el mail, lo dispara.
- **Idempotencia:** columna nueva `mail_pago_enviado BOOLEAN DEFAULT false` en `pedidos`.
  El webhook envía el mail solo si `false`; luego marca `true` en todas las filas de la
  orden. Evita mails duplicados por reintentos de MP.

## Funcionalidad 2 — Envío por Correo Argentino + seguimiento

### Base de datos
- Columna nueva `seguimiento TEXT` en `pedidos`.

### Admin (`/admin/pedidos`)
- Al tocar "Enviar" en un pedido con `metodo_envio` de Correo Argentino, se abre una
  sección/campo para cargar el número de seguimiento que da Correo Argentino.
- El número es **obligatorio** para envíos por Correo Argentino. Para
  `arreglar_vendedor` no se pide.
- `markOrderShipped(id, seguimiento?)` guarda `status: 'shipped'` y `seguimiento`.

### Mail de envío
- **Nueva ruta** `POST /api/email/pedido-enviado`
  - Recibe: `email`, `orderId`, `producto_titulo`, `metodo_envio`, `seguimiento`.
  - Si es Correo Argentino: el texto dice "enviado por Correo Argentino", muestra el
    número de seguimiento y un link de rastreo de Correo Argentino.
  - Se dispara desde `markOrderShipped` después de actualizar el status.

### Cliente (`/perfil/compras`)
- Agregar `metodo_envio` y `seguimiento` al `select`.
- Cuando `status === 'shipped'` y método es Correo Argentino: mostrar
  "Enviado por Correo Argentino" + número de seguimiento + link de rastreo.

## Migración

Nuevo archivo `supabase/migration-mails-seguimiento.sql`:

```sql
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS mail_pago_enviado BOOLEAN DEFAULT false;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS seguimiento TEXT;
```

## Fuera de alcance

- Mails para transferencia u otros medios de pago.
- Notificaciones in-app del envío (los pedidos guardan email, no `user_id`).
- Estados de tracking en tiempo real (solo se guarda el número que carga la admin).
