---
type: project
status: diseño
owner: Silvina Torres
location: Palihue, Bahía Blanca, Argentina
---

# La Percha Showroom

Marketplace híbrido de ropa usada y nueva desde Palihue, Bahía Blanca. Dos vidrieras en dos apps web separadas:

1. **Tienda Oficial** — regalería, bazar, decoración, cosmética, accesorios e importados seleccionados por la dueña. Solo ella publica.
2. **Feria de Ropa** — miembros de la comunidad venden ropa (remeras, jeans, camperas, vestidos, calzado, deportiva, infantil). Cada publicación es revisada y aprobada manualmente por la admin.

## Arquitectura: dos apps web

| App | Quién la usa | Plataforma | Propósito |
|-----|-------------|------------|-----------|
| **App Admin** | Silvina (la dueña) | Desktop web | Carga productos de la Tienda Oficial, modera la Feria, gestiona pedidos/usuarios/finanzas |
| **App Cliente** | Compradores y vendedores | Mobile-first web | Explorar y comprar productos; registrarse y activar modo vendedor para publicar ropa |

## Modelo de negocio

- Comisión del 20% sobre cada venta de la Feria de Ropa
- Fondos retenidos hasta que se confirma la entrega, luego se liberan al vendedor
- La Tienda Oficial es venta directa, sin comisión
- Envíos por Correo Argentino (3-5 días) o retiro en el showroom de Palihue
- Envío gratis desde $25.000

## Roles

- [[Roles/Cliente|Cliente]] — usuario de la App Cliente. Sin registro puede comprar. Registrado puede además activar el modo vendedor si la admin lo autoriza.
- [[Roles/Admin|Admin]] — Silvina en la App Admin (escritorio): modera la Feria, gestiona la Tienda Oficial, autoriza vendedores, pedidos y finanzas.

> **Cuenta única:** no hay dos tipos de registro. El usuario se crea una sola cuenta y desde ahí puede comprar y, si la admin lo autoriza, también vender.

## Marca

**Valores:** confianza, cercanía, moda, comunidad, seguridad, profesionalismo.

**Tono:** argentino, voseo ("Renová tu placard", "Sumá prendas"), cálido y cercano. Como una vecina con buen gusto, no una plataforma sin cara.

**Visual:** mobile-first (390x844). Paleta cálida taupe/crema, verde salvia como acento primario, azul menta como secundario, terracota para errores. Tipografía Marcellus (display) + Mulish (UI). Íconos Lucide.

**Logo:** circular con percha + hoja + wordmark script.

## Design System

Ver [[02 - WDS/D-Design-System/README|D-Design-System]] y la carpeta `La Percha Showroom Design System/`.

## Estructura del proyecto

- [[02 - WDS/A-Product-Brief/README|A-Product-Brief]] — problema, audiencia, UVP, métricas
- [[02 - WDS/B-Trigger-Map/README|B-Trigger-Map]] — gatillos psicológicos
- [[02 - WDS/C-UX-Scenarios/README|C-UX-Scenarios]] — escenarios por rol
- [[02 - WDS/D-Design-System/README|D-Design-System]] — tokens, componentes, UI kits
- [[02 - WDS/E-Development/README|E-Development]] — arquitectura, stack, implementación
- [[Pricing]] — estructura de precios y comisiones
- [[Decisiones]] — log de decisiones de diseño
- [[Sprint]] — seguimiento del sprint actual

## Referencias

- [[03 - REFERENCIAS/Pantallas/README|Pantallas]]
- [[03 - REFERENCIAS/Investigacion/Mercado-Bahia-Blanca|Mercado Bahía Blanca]]
- [[03 - REFERENCIAS/Investigacion/Competencia|Competencia]]
- [[03 - REFERENCIAS/Investigacion/Tech-Stack|Tech Stack]]
