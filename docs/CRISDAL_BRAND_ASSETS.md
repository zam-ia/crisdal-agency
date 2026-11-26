# CRISDAL — Assets de marca y WhatsApp flotante

Esta entrega pertenece al PR #18, rama `parallel/crisdal-brand-floating-whatsapp`. **No se ha desplegado a `main` ni modificado producción.** Integrar tras la activación operativa que realiza Codex, revisando divergencia del HEAD actual.

## Archivos reales alojados en el repositorio

| Ruta | Origen | Formato/uso | Tamaño |
|---|---|---|---|
| `public/brand/crisdal-icon.png` | símbolo recortado del PNG oficial facilitado por el propietario | PNG transparente 160×149, encabezado | 3,645 B |
| `public/brand/crisdal-logo-full.png` | logo oficial Crisdal Agency facilitado por el propietario | PNG transparente 124×160, uso alternativo | 4,344 B |
| `public/brand/whatsapp-official.png` | segundo de los dos iconos de WhatsApp compartidos, `es.png` | PNG transparente 159×160, botón flotante | 2,525 B |
| `public/brand/crisdal-symbol.svg` | trazado vectorial de la misma marca | SVG, favicon | recurso previo del PR |

Los PNG mantienen canal alfa, sin fondos cuadrados. Son derivados ligeros para uso en UI: conservar los originales proporcionados como fuente maestra para futuras impresiones y material de alta resolución.

## Implementación

- `app/ui/marketing/marketing-shell.tsx`: el encabezado usa el símbolo PNG una sola vez junto al texto `Crisdal / Agency`; no inserta el logo completo con otra repetición del nombre. En el pie sigue el nombre comercial escrito. Incluye CTA de WhatsApp fijo con el PNG proporcionado, reutilizando `WhatsAppLink`, número y evento de seguimiento de la configuración existente.
- `app/ui/marketing/marketing.module.css`: botón flotante discreto, fondo oscuro que contrasta con el WhatsApp verde, tamaño táctil amplio, separación del aviso de consentimiento, adaptaciones móvil/escritorio y `prefers-reduced-motion`.
- `app/layout.tsx`: favicon SVG transparente, evitando el ícono de fondo cuadrado.

## Alcance y límites

La CTA flotante aparece en rutas que usan `MarketingShell`. La landing heredada `/ruta-crisdal` mantiene sus propios controles de contacto; **no** se inserta el CTA en `/panel`, `/admin`, ni `/entregas` para evitar interferir con las galerías privadas.

No se cambió `WHATSAPP_NUMBER`; se utiliza el número autorizado actualmente en el código y se preservan las reglas de tracking existentes. No se subieron fotografías del evento capturadas dentro de una imagen de Facebook: una captura de redes no sustituye archivos fotográficos originales.

## Criterios de integración para Codex

1. `git fetch`; verificar HEAD actual de `main`, PR #18 y cambios de la rama activa.
2. Incorporar cambios del PR #18; resolver conflictos puntuales si Codex modificó `marketing-shell.tsx`, `marketing.module.css` o `layout.tsx`. No reemplazar cambios recientes a ciegas.
3. Cargar `$crisdal-premium-ui` y comprobar jerarquía de logo + nombre en desktop y móvil.
4. Verificar `/brand/crisdal-icon.png`, `/brand/crisdal-logo-full.png`, `/brand/whatsapp-official.png` y `/brand/crisdal-symbol.svg` responden 200 en Vercel Preview.
5. Comprobar en 320, 390, 768, 1280 y 1440 px: menú móvil, botón fijo, consent banner, viewport corto, notch/iPhone safe-area y ausencia de overflow.
6. Comprobar `/portafolio`, `/eventos`, `/paquetes`, `/consultar-fecha`, `/contacto` y `/`. La CTA debe ser accesible al desplazarse.
7. Verificar destino de WhatsApp, UTMs/atribución y event tracking sin duplicar Lead/CAPI; no registrar un lead ficticio.
8. Revisar `/ruta-crisdal`, `/admin`, `/panel`, `/entregas` para evitar botones duplicados y regresiones.
9. Ejecutar `npm run lint`, `npx tsc --noEmit --incremental false`, `npm test`, `npm run build`.
10. Después de revisar y validar, fusionar por PR a `main` y comprobar despliegue real de Vercel. Mantener backup/rollback.

**QA de esta rama:** integridad binaria verificada con SHA de blob Git para los tres PNG; no hay validación local de Next.js/TypeScript/ESLint/build porque no se montó el proyecto completo. No declarar que quedó probado hasta que Codex lo ejecute.
