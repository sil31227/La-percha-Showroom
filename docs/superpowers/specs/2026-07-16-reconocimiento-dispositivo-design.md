# Reconocimiento de dispositivo en el landing

**Fecha:** 2026-07-16  
**Estado:** Aprobado

## Objetivo

Cuando un usuario que ya se registró e inició sesión en La Percha vuelve a abrir la app en el mismo dispositivo, mostrar una pantalla que pregunte si quiere continuar con su perfil guardado o iniciar sesión con otra cuenta. Solo debe aparecer **una vez por dispositivo**; después de que confirme, las próximas aperturas van directo a `/home`.

## Reglas de negocio

1. Solo se muestra si hay una sesión activa guardada en el dispositivo (Supabase localStorage).
2. Solo se pregunta **una vez**; al confirmar se guarda flag `lapercha_device_remembered` en localStorage y no se vuelve a preguntar.
3. "Usar otra cuenta" redirige a `/ingresar` **sin cerrar sesión** (el usuario puede volver atrás y la sesión sigue intacta).
4. "Sí, continuar" guarda el flag y redirige a `/home`.
5. Si el dispositivo ya fue recordado, al abrir `/` se redirige automáticamente a `/home`.
6. Si no hay sesión guardada, se muestra el landing normal.

## Arquitectura

### Archivos

| Archivo | Cambio |
|---------|--------|
| `src/components/LandingGuard.tsx` | **NUEVO** — Client component con la lógica de detección y los 3 estados |
| `src/app/page.tsx` | **MODIFICADO** — El contenido actual se extrae a un componente interno, envuelto en `<LandingGuard>` |

### Componentes

```
src/app/page.tsx
  └── LandingGuard (client component, "use client")
        ├── Estado: loading → spinner
        ├── Estado: no-session → landing normal (children)
        ├── Estado: remembered → redirect a /home
        └── Estado: interstitial → "¿Sos [Name]?"
              ├── Botón "Sí, continuar" → guarda flag, redirect /home
              └── Link "Usar otra cuenta" → /ingresar
```

`page.tsx` se mantiene como **server component** que importa `LandingGuard` (client) y le pasa el contenido del landing como `children`. Esto preserva el SSR del HTML estático del landing y solo la parte interactiva se hidrata en el cliente.

### Flujo de datos

```
LandingGuard monta (cliente)
  ↓
useEffect: supabase.auth.getSession()
  ↓
  ├─ sin sesión → setState("no-session")
  ├─ sesión + localStorage "lapercha_device_remembered" → setState("remembered") → router.replace('/home')
  └─ sesión + sin flag → setState("interstitial")
       ├─ "Sí, continuar" → localStorage.setItem("lapercha_device_remembered", "true")
       │                      → router.replace('/home')
       └─ "Usar otra cuenta" → router.push('/ingresar')
```

## UI del interstitial

Mismo layout centrado del landing (logo arriba, max-w-md):

```
┌──────────────────────────────┐
│                              │
│         [LOGO]              │
│                              │
│       La Percha Showroom     │
│      Moda circular · ...     │
│                              │
│    ┌──────────────────┐      │
│    │  [avatar 48px]   │      │
│    │  ¿Sos Martina?    │      │
│    └──────────────────┘      │
│                              │
│  ┌──────────────────────┐    │
│  │  Sí, continuar       │    │  ← botón matcha (primario)
│  └──────────────────────┘    │
│                              │
│      Usar otra cuenta        │  ← link texto (secundario)
│                              │
└──────────────────────────────┘
```

## Estados

| Estado | Condición | UI |
|--------|-----------|-----|
| `loading` | `getSession()` en progreso | Landing normal con spinner overlay o skeleton |
| `no-session` | `getSession()` retorna `null` | Landing normal (children): Registrarme / Entrar / Ya tengo cuenta |
| `interstitial` | Sesión existe, flag NO está en localStorage | Interstitial "¿Sos [Name]?" |
| `remembered` | Sesión existe, flag SÍ está | `router.replace('/home')` inmediato |

## Persistencia

| Llave | Storage | Valor | Vida útil |
|-------|---------|-------|-----------|
| `sb-*-auth-token` | localStorage | Token JWT de Supabase | Hasta logout o expiración |
| `lapercha_device_remembered` | localStorage | `"true"` | Hasta que el usuario hace logout (se limpia en `useAuthStore.logout()`) |

La limpieza del flag en logout se agrega al método `logout()` existente del store.

## Edge cases

- **Token expirado:** `getSession()` devuelve `null` → landing normal. El usuario puede volver a loguearse.
- **Sin conexión:** Supabase `getSession()` lee de localStorage → funciona offline, muestra el interstitial igual.
- **SSR / hidratación:** `LandingGuard` es client-only. En el primer render de servidor muestra el landing normal (comportamiento por defecto). Al hidratarse en el cliente, corrige al estado real. Esto evita layout shift porque el landing normal y el interstitial comparten la misma estructura.
- **Múltiples cuentas:** localStorage solo almacena una sesión de Supabase a la vez. El interstitial siempre muestra el nombre de la sesión activa.
- **Usuario hace logout manual:** El flag `lapercha_device_remembered` se limpia junto con la sesión. La próxima vez que alguien inicie sesión en ese dispositivo, se volverá a preguntar.
- **Usuario entra a `/ingresar` directamente:** Si entra a `/ingresar` sin pasar por el landing e inicia sesión, el flag **no** se guarda (solo se guarda desde el interstitial del landing). Esto es aceptable: la próxima vez que visite `/`, se le preguntará.

## No incluido

- No se modifica el AuthInitializer ni el layout del cliente.
- No se agrega middleware ni rutas nuevas.
- No se modifica el flujo de registro ni login.
- No se persigue al usuario entre dispositivos (es solo por dispositivo).
