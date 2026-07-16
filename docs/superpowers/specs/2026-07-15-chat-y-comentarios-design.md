# Chat de envío y Comentarios en productos

## Resumen

Agregar dos funcionalidades de comunicación dentro de la app:
1. **Chat comprador ↔ vendedora** para coordinar envíos post-compra
2. **Comentarios en productos** visibles por cualquier usuario registrado

## Base de datos

### Tablas nuevas

```sql
CREATE TABLE conversaciones (
  id TEXT PRIMARY KEY,
  pedido_id TEXT NOT NULL UNIQUE REFERENCES pedidos(id),
  comprador_id UUID NOT NULL,
  vendedor_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE mensajes (
  id TEXT PRIMARY KEY,
  conversacion_id TEXT NOT NULL REFERENCES conversaciones(id),
  sender_id UUID NOT NULL,
  texto TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE comentarios_producto (
  id TEXT PRIMARY KEY,
  producto_id TEXT NOT NULL REFERENCES productos(id),
  user_id UUID NOT NULL,
  texto TEXT NOT NULL,
  deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### RLS

- `conversaciones`: SELECT/INSERT solo participantes (comprador_id o vendedor_id)
- `mensajes`: SELECT/INSERT solo participantes de la conversación padre
- `comentarios_producto`: SELECT público (no eliminados), INSERT usuarios autenticados, UPDATE deleted solo admin (service_role)

### Índices

- `mensajes(conversacion_id, created_at)` — orden cronológico
- `comentarios_producto(producto_id, created_at)` — orden cronológico
- `conversaciones(pedido_id)` — lookup por pedido

## API Routes

### Chat

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/conversaciones` | Crea conversación (body: `pedido_id`). Llamado desde checkout paso-3. Devuelve conversación existente si ya existe. |
| GET | `/api/conversaciones?pedido_id=` | Obtiene conversación por pedido |
| POST | `/api/conversaciones/[id]/mensajes` | Envía mensaje. Envía push + notificación in-app a la otra parte. |
| GET | `/api/conversaciones/[id]/mensajes` | Obtiene mensajes (orden cronológico ascendente) |

### Comentarios

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/productos/[id]/comentarios` | Obtiene comentarios no eliminados |
| POST | `/api/productos/[id]/comentarios` | Agrega comentario. Envía push + notificación in-app al dueño del producto. |
| DELETE | `/api/admin/comentarios/[id]` | Soft-delete (admin, service_role) |

### Autenticación

Todas las rutas de escritura requieren Bearer token. Las de lectura que involucran datos privados (chat) también.

## UI

### Chat de envío

**Inicio**: Al confirmar pedido con método "coordinar con la vendedora" en checkout paso-3, se crea automáticamente la conversación.

**Acceso**:
- Comprador: `/perfil/compras` → tarjeta del pedido muestra badge "chat" → click abre chat en modal o página
- Vendedora: `/perfil/ventas` → tarjeta del pedido muestra badge "chat" → click abre chat

**Componente `ChatWindow`**:
- Lista de mensajes con scroll automático al final
- Burbujas: derecha (propios, color primario), izquierda (otro, gris)
- Input de texto + botón enviar
- Polling cada 20s para nuevos mensajes
- Badge de "nuevo mensaje" en lista de pedidos cuando hay mensajes no leídos

### Comentarios en productos

**Ubicación**: `/producto/[id]` debajo de la sección de descripción

**Componente `CommentSection`**:
- Si usuario autenticado: formulario (textarea + botón "Comentar")
- Si no autenticado: texto "Iniciá sesión para comentar" con link a `/ingresar`
- Lista plana de comentarios: avatar + nombre + texto + fecha
- Botón de eliminar (✕) visible solo para admin
- Polling al cargar la página (no polling continuo)

## Notificaciones

### Nuevos tipos en tabla `notifications`

| type | title | body | link |
|------|-------|------|------|
| `new_message` | "Nuevo mensaje" | "[Nombre] te envió un mensaje sobre tu pedido" | Link a la conversación |
| `new_comment` | "Nuevo comentario" | "[Nombre] comentó en [título del producto]" | Link al producto |

### Push notifications

- Usar `sendSellerPush()` y `sendBuyerPush()` existentes para chat
- Nuevo helper `sendProductOwnerPush(vendedorId, payload)` para comentarios
- Reutilizar infraestructura `web-push` + `push_subscriptions` existente

## Stores (Zustand)

### `useChatStore`

```
conversaciones: Map<pedidoId, Conversacion>
mensajes: Map<conversacionId, Mensaje[]>
fetchConversacion(pedidoId)
sendMensaje(conversacionId, texto)
pollMensajes(conversacionId) — polling cada 20s
```

### `useCommentsStore`

```
comentarios: Map<productoId, Comentario[]>
fetchComentarios(productoId)
addComentario(productoId, texto)
```

## Flujo completo — Chat

1. Compradora hace checkout, elige "coordinar con la vendedora" como envío
2. Al confirmar pedido (paso-3), el frontend llama `POST /api/conversaciones` con `pedido_id`
3. Se crea conversación ligada al pedido
4. Compradora ve en Mis Compras un badge "Chat" en ese pedido → click abre el chat
5. Vendedora recibe notificación de nueva venta + ve badge "Chat" en Ventas
6. Ambas partes pueden enviar mensajes, con polling cada 20s
7. Cada mensaje nuevo genera notificación push + in-app para la otra parte

## Flujo completo — Comentarios

1. Usuario autenticado entra a `/producto/[id]`
2. Scroll a sección de comentarios
3. Escribe comentario y envía → `POST /api/productos/[id]/comentarios`
4. El dueño del producto recibe push + notificación in-app
5. Admin puede eliminar comentarios inapropiados → soft delete (no se muestran pero se preservan)

## Convenciones

- IDs: usar `crypto.randomUUID()` (mismo patrón que el resto del proyecto)
- Estilos: Tailwind 4, seguir clases y patrones de componentes existentes
- Lenguaje: TSX/TS con tipos explícitos
- Nombres de archivo: PascalCase para componentes, camelCase para hooks/stores
