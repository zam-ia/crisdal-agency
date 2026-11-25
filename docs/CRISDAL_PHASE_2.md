# Crisdal Agency — Fase 2

Fecha de validación: 25 de noviembre de 2026

Rama: `codex/crisdal-premium-os`

Base: `d4429d1`

## Implementación

- Nueva web pública editorial y cinematográfica para creación de contenido, fotografía y producción audiovisual.
- Identidad visual carbón, marfil, bronce y dorado de marca `#fab713`.
- Navegación responsive con accesos visibles en móvil y escritorio.
- Mensajes de WhatsApp diferenciados por servicio, plan y paquete de eventos.
- Precios de referencia publicados sin inventar entregables ni cantidades.
- Portafolio preparado con categorías y un estado vacío explícito hasta contar con material real autorizado.
- Metadata, canonical, sitemap, robots y datos estructurados para la nueva web pública.

## Rutas

| Ruta | Estado | Propósito |
| --- | --- | --- |
| `/` | Nueva | Home principal |
| `/contenido` | Nueva | Servicios para marcas y negocios |
| `/eventos` | Nueva | Cobertura audiovisual |
| `/portafolio` | Nueva | Estructura para trabajos reales autorizados |
| `/planes` | Nueva | Planes y referencias comerciales |
| `/contacto` | Nueva | Contacto contextual por WhatsApp |
| `/ruta-crisdal` | Preservada | Landing de captación anterior |
| `/admin` | Preservada | Administración protegida |

## Compatibilidad

- `/ruta-crisdal` conserva el componente de la landing anterior; solo cambian las rutas de importación y su canonical/URL de Open Graph.
- La nueva home no consume el documento histórico de `landing_content_versions`, por lo que una versión antigua del CMS no puede sustituir la estructura pública nueva.
- No se modificaron `app/ui/os/`, esquemas, migraciones, credenciales, secretos ni datos de producción.
- Se conservaron Meta Pixel, GTM, CAPI, consentimiento, UTMs y la deduplicación de Lead por sesión.
- El evento de Lead mantiene el nombre histórico en `/ruta-crisdal` y usa el posicionamiento audiovisual en la web pública nueva.

## Validaciones ejecutadas

- `npm run lint`: correcto.
- `npx tsc --noEmit --incremental false`: correcto.
- `npm run build`: correcto con Next.js 16.4.6.
- Rutas públicas: HTTP 200.
- `/admin`: HTTP 307 a `/admin/login`; login HTTP 200.
- `/ruta-crisdal`: HTTP 200 y equivalencia comprobada contra `d4429d1` tras normalizar imports y metadata de ruta.
- Canonical: comprobado en todas las rutas públicas.
- Sitemap: contiene las seis rutas comerciales y `/ruta-crisdal`.
- WhatsApp: número `51992566725` presente y mensajes contextuales renderizados.
- Responsive: comprobado en 1280 px y 390 px, sin desbordamiento horizontal.
- Accesibilidad: un `h1`, enlace para saltar al contenido, nombres accesibles en enlaces, `alt` en imágenes, foco visible y soporte para movimiento reducido.
- Consola del navegador: sin errores durante la revisión.

## Contenido pendiente de validación comercial

- Entregables, cantidades, revisiones, condiciones y vigencia de IMPULSO, CRECIMIENTO y DOMINIO DIGITAL.
- Tarifas, duración, equipo y entregables de MOMENTO, HISTORIA y CINEMA.
- Fotografías, videos, clientes, descripciones y permisos del portafolio real.
