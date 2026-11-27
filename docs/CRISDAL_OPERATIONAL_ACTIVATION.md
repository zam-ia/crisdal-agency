# Crisdal Agency — Activación operativa

> Estado vigente en la [entrega operativa diaria](CRISDAL_DAILY_OPERATIONS_RELEASE.md). Las 11 migraciones están aplicadas y el perfil propietario está activo. La sesión nominal y la publicación del primer trabajo se validan con el propietario.


Fecha de corte: 26 de noviembre de 2026  
Zona horaria: `America/Lima`

Este documento registra el estado comprobado del release comercial y separa con claridad lo publicado de lo que todavía requiere una ventana controlada de base de datos.

## Estado ejecutivo

- Producción: [https://crisdal-agency.vercel.app/](https://crisdal-agency.vercel.app/)
- Commit publicado: `531764dfe76d351fb5d48f1356fba8665b28a69c`
- Release integrado: PR `#23`, fusionado a `main`.
- Punto anterior para rollback de código: `ee5b044c2f7f7ef3cd2f2d1f67c7d6de01c3389a`.
- PR `#18`: cerrado por redundancia después de comprobar que los cuatro assets de marca y los dos documentos tenían blobs idénticos en `main`.
- Supabase: proyecto `CRISDAL LANDING`, ref `emdheaugznkzskrgkyaw`, región `sa-east-1`, estado `ACTIVE_HEALTHY`, Postgres 17.
- Migraciones remotas registradas: ninguna.
- Rama Supabase de ensayo: ninguna.
- Plan Supabase: Free.
- Decisión de seguridad: no ejecutar las migraciones de Crisdal OS ni entregas privadas hasta disponer de un respaldo recuperable y ensayar la restauración.

## Validación del release publicado

Se ejecutaron y aprobaron:

- `npm ci`
- `npm run lint`
- `npx tsc --noEmit --incremental false`
- `npm test` — 84/84 pruebas
- `npm run build` — Next.js 16.4.6
- Pruebas sin sesión: `/admin` redirige a `/admin/login`; las escrituras del portafolio administrativo responden `401` o `403`.
- Vercel: despliegue de `531764d` con estado `success`.
- HTTP 200: `/`, `/robots.txt`, `/sitemap.xml`, `/brand/crisdal-icon.png` y `/brand/crisdal-symbol.svg`.
- QA visual sin overflow en 320, 390, 768, 1280 y 1440 px.
- Rutas comprobadas: `/`, `/eventos`, `/portafolio`, `/paquetes`, `/consultar-fecha`, `/contacto`, `/ruta-crisdal`, `/admin` y `/panel`.
- Logo, navegación, CTA flotante de WhatsApp, favicon, títulos SEO y redirecciones de acceso visibles en producción.

La página pública no inventa trabajos: mientras no existan proyectos aprobados muestra un estado editorial pendiente.

## Inventario Supabase comprobado

El conector autorizado corresponde a `LANDING CRISDAL`; no debe usarse otro proyecto para este sistema. La base existente contiene once tablas públicas heredadas, entre ellas `landing_content_versions`, `admin_users`, catálogo, pedidos, onboarding y aliados. También existe una cuenta en Supabase Auth y un registro administrativo heredado.

El historial remoto de migraciones está vacío aunque la base contiene objetos. Por eso no se puede asumir que aplicar todos los archivos de `supabase/migrations` sea equivalente a crear una base nueva. Primero se debe reconciliar el estado real con los archivos versionados.

Hallazgos actuales del asesor de seguridad:

- Siete tablas con RLS habilitado y sin políticas: `allies`, `ally_contact_requests`, `landing_content_versions`, `onboarding_files`, `onboarding_submissions`, `orders` y `product_images`.
- `public.set_updated_at` tiene `search_path` mutable.
- `public.is_catalog_admin()` y `public.rls_auto_enable()` son `SECURITY DEFINER` ejecutables por `anon` y `authenticated`.
- La protección de contraseñas filtradas de Supabase Auth está deshabilitada.

Referencias de remediación:

- [RLS habilitado sin políticas](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)
- [Search path mutable](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable)
- [Funciones SECURITY DEFINER públicas](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable)
- [Protección de contraseñas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)

No se corrigieron estos objetos directamente porque forman parte del esquema heredado y todavía no existe un punto de recuperación probado.

## Gate obligatorio de respaldo y restauración

La CLI disponible es Supabase CLI 3.4.0. En esta versión el destino predeterminado es local y un cambio alojado requiere selección explícita de remoto. La sesión local de CLI pertenece a otra cuenta y solo expone `KAIROS CONTROL`; por seguridad no se vinculó ni se usó contra Crisdal.

Antes de ejecutar SQL en producción se debe completar, en este orden:

1. Autenticar la CLI con una credencial de alcance mínimo para el proyecto `emdheaugznkzskrgkyaw`, guardada en el entorno seguro, nunca en Git ni en este documento.
2. Abrir **Connect → Session pooler** en CRISDAL LANDING. Si está disponible la contraseña vigente, introducirla en un prompt local oculto de PostgreSQL. Generar dumps de roles, esquema y datos, con Auth y metadatos de Storage. La CLI ofrece `supabase db dump` si Docker está disponible. El entorno Windows también tiene los binarios nativos de PostgreSQL 17.12.
3. Exportar por separado los objetos de Storage y registrar los buckets, privacidad, límites y políticas.
4. Calcular hashes de los artefactos de respaldo, registrar fecha, responsable y ubicación cifrada.
5. Restaurar el respaldo en una base aislada y comprobar conteos, relaciones, Auth, Storage y lectura del CMS.
6. Ejecutar allí las migraciones versionadas y las pruebas de RLS.
7. Solo después abrir una ventana de producción, aplicar un lote por vez y ejecutar verificaciones de lectura/escritura tras cada lote.

Crear una rama de Supabase puede generar coste. No se debe crear ni confirmar ese coste sin autorización expresa.

## Orden de reconciliación y migraciones

El orden versionado actual es:

1. `20260918220000_landing_cms.sql`
2. `20261125120000_crisdal_os_identity.sql`
3. `20261125150000_crisdal_commercial_portfolio.sql`
4. `20261125160000_crisdal_commercial_packages.sql`
5. `20261125200000_crisdal_events_media_promotions.sql`
6. `20261125210000_crisdal_agenda_base.sql`
7. `20261126120000_crisdal_public_availability_inquiries.sql`
8. `20261126180000_crisdal_client_delivery_galleries.sql`
9. `20261126190000_crisdal_social_portfolio.sql`
10. `20261126200000_crisdal_operational_finance.sql`
11. `20261126200100_crisdal_operational_modules.sql`

La primera migración debe compararse con `landing_content_versions` y `admin_users` existentes en lugar de aplicarse a ciegas. Cada archivo posterior depende de la identidad y de objetos creados antes. El alta del propietario se realiza únicamente después de que `crisdal_os_users` exista:

1. Crear o identificar al único propietario en Supabase Auth.
2. Insertar su perfil nominal en `crisdal_os_users` con `role_code = 'owner'`, enlazado por `auth_user_id`.
3. Verificar login, creación de sesión, permisos, revocación y auditoría.
4. Ejecutar una escritura inocua y su lectura posterior en cada módulo habilitado.
5. Cerrar sesión y comprobar que el token y la sesión revocada ya no autorizan lecturas ni escrituras.

No se deben copiar contraseñas ni hashes del CMS heredado a Crisdal OS.

## Portafolio real

El flujo existente queda preservado: proyecto → datos editoriales → imágenes → videos sociales → portada → autorización → publicación. La primera carga debe seguir `docs/CRISDAL_PORTFOLIO_FIRST_UPLOAD.md`.

Reglas de activación:

- Solo material real con autorización verificable.
- No inventar nombres, ciudad, métricas, testimonios, precios ni alcance.
- Publicar primero un proyecto pequeño y comprobar la vista pública sin sesión.
- Despublicar y confirmar que deja de estar disponible públicamente.
- Verificar que imágenes, videos externos y CTA funcionan en móvil y escritorio.

## Entregas privadas — PR #14

El PR `#14` permanece en borrador y no se fusionó. Su diseño usa token aleatorio de 256 bits almacenado solo como SHA-256, bucket privado, URLs firmadas de corta duración, validación real del tipo de archivo y descargas revocables. También depende de migraciones y del bucket `crisdal-private-media` que todavía no existen en producción.

Gate antes de integrar:

- Rebasar el módulo sobre `main` y resolver los cambios de consentimiento y navegación del panel.
- Ensayar sus tablas y bucket en una base aislada.
- Probar expiración, regeneración y revocación del enlace.
- Confirmar que un token incorrecto, vencido o despublicado no revela existencia ni archivos.
- Probar eliminación parcial de derivados para evitar objetos huérfanos.
- Añadir rate limiting por token/IP a favoritos y descargas antes de exponer clientes reales.
- Ejecutar las pruebas completas, asesor de seguridad y QA responsive.

Hasta completar esos puntos, `/entregas/[token]` no se considera una función operativa.

## Rollback

### Código

- Commit anterior: `ee5b044c2f7f7ef3cd2f2d1f67c7d6de01c3389a`.
- Un rollback debe crear un commit de reversión auditable; no usar `reset --hard` sobre `main`.
- Después de revertir, esperar Vercel `success` y repetir los smoke tests públicos y administrativos.

### Base de datos

- No iniciar una migración sin dump y restauración ensayada.
- Preferir migraciones aditivas y compatibilidad hacia atrás.
- Para un fallo, detener nuevas escrituras, conservar evidencia, restaurar desde el punto probado y reconciliar Storage por inventario.
- No eliminar tablas, buckets ni usuarios como forma de rollback sin aprobación específica y copia verificada.

## Próxima ventana operativa

La siguiente acción es completar el respaldo de base y archivos del proyecto, restaurarlo en aislamiento y ensayar las once migraciones y los flujos de autenticación con esa copia. Hasta entonces, el sitio comercial y el CMS heredado siguen en el despliegue actual.

