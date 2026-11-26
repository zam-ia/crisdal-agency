# Crisdal Agency — release de producción

Fecha: 26 de noviembre de 2026 (America/Lima).

## Resultado del release

- Repositorio: `zam-ia/crisdal-agency`
- Pull request: [#15 — Integración final Crisdal Agency y Crisdal OS](https://github.com/zam-ia/crisdal-agency/pull/15)
- `main` anterior: `d15a26dc1ebe6ce948aa2ec164cdd58049112e0a`
- Commit funcional desplegado: `7131bd534265e860b150cbcdfa655f916624ab3a` (los commits posteriores solo documentan este release).
- Rama de recuperación: `recovery/pre-production-2026-11-26`
- Producción: [https://crisdal-agency.vercel.app/](https://crisdal-agency.vercel.app/)
- Vercel: build de preview y build de producción finalizados con estado `success`.

## Integración realizada

- Skill local `crisdal-premium-ui` y sus reglas de marca, patrones y controles de calidad.
- Experiencia pública events-first, con `#fab713`, negro humo, navegación responsive y CTA principal hacia consulta de fecha.
- Portafolio privado/público, paquetes compartibles, promociones, agenda y Crisdal OS con permisos explícitos.
- Consulta pública de fecha y bandeja privada de solicitudes.
- Agenda como única fuente operativa de bloqueos: una actividad `confirmed` proyecta la fecha como no disponible sin publicar cliente, título ni horario.
- Galería cinematográfica y lightbox accesible con teclado, navegación y restauración de foco.
- Dominios puros de finanzas y cotizaciones con dinero entero y pruebas, sin activar contabilidad real.
- Migraciones versionadas con RLS y acceso directo revocado para `anon` y `authenticated`.

## Estado operativo comprobado

### Operativo en producción

- `/`, `/eventos`, `/portafolio`, `/paquetes`, `/consultar-fecha`, `/contacto` y `/ruta-crisdal` responden y renderizan contenido correcto.
- `/admin` redirige a `/admin/login` y mantiene protegido el CMS heredado.
- `/panel` redirige a `/panel/login` y no expone el panel sin sesión.
- La página pública no inventa proyectos: muestra un estado editorial honesto mientras no haya material autorizado.
- El calendario público falla cerrado: cuando no puede validar Supabase, las fechas quedan en `Consultar` y no se presenta disponibilidad falsa.
- No se encontraron desbordes horizontales en 320, 390, 768, 1280 ni 1440 px.
- Navegación desktop y móvil, foco visible, motion reducido y CTA hacia la consulta de fecha están presentes.

### Desplegado, pendiente de activación

- Crisdal OS nominal, agenda, solicitudes, disponibilidad verificable, portafolio persistente, paquetes persistentes y promociones dependen de las migraciones y secretos del entorno.
- Finanzas y cotizaciones están desplegadas como dominio y pruebas; no tienen UI, persistencia ni operación contable activada.
- El CMS heredado presenta login, pero el guardado autenticado no fue revalidado durante este release porque no se ingresaron ni expusieron credenciales.
- El portafolio está listo para datos reales, pero permanece vacío hasta publicar archivos y autorizaciones reales.

### Bloqueado y causa concreta

- No se ejecutaron migraciones en Supabase. El MCP está configurado para `emdheaugznkzskrgkyaw`, pero esta sesión no expuso herramientas SQL y la sesión web autenticada respondió que no tiene acceso a ese proyecto.
- Por la misma causa no se pudo verificar el historial real de migraciones, crear/confirmar un backup, probar en una rama aislada ni validar un usuario `owner` real.
- El endpoint público de disponibilidad confirmó `source: unavailable`; esto demuestra el comportamiento seguro, no una activación de base de datos.

## Migraciones pendientes de verificación

No deben ejecutarse por nombre ni repetirse a ciegas. Primero se compara este listado con el historial real del proyecto:

1. `20260918220000_landing_cms.sql`
2. `20261125120000_crisdal_os_identity.sql`
3. `20261125150000_crisdal_commercial_portfolio.sql`
4. `20261125160000_crisdal_commercial_packages.sql`
5. `20261125200000_crisdal_events_media_promotions.sql`
6. `20261125210000_crisdal_agenda_base.sql`
7. `20261126120000_crisdal_public_availability_inquiries.sql`

Procedimiento obligatorio: recuperar acceso al proyecto correcto, confirmar historial, crear backup o punto de recuperación, probar únicamente las migraciones faltantes en una rama/entorno aislado, ejecutar pruebas RLS y recién entonces promover cambios aditivos a producción.

## Controles ejecutados

```text
npm run lint        PASS
npx tsc --noEmit    PASS
npm test            PASS — 73/73
npm run build       PASS — Next.js 16.4.6
git diff --check    PASS
```

QA de producción:

- cinco anchos: 320, 390, 768, 1280 y 1440 px;
- sin overflow horizontal;
- CTA primario y navegación responsive visibles;
- rutas públicas comprobadas;
- protección de `/admin` y `/panel` comprobada por redirección a login;
- vista móvil y escritorio inspeccionadas visualmente;
- disponibilidad pública comprobada en modo seguro `unavailable`.

## Primera puesta en marcha

1. Recuperar acceso real a Supabase `emdheaugznkzskrgkyaw` sin compartir secretos por chat ni Git.
2. Confirmar backup e historial antes de cualquier SQL.
3. Aplicar solo migraciones faltantes en orden y validar RLS/funciones.
4. Confirmar en Vercel `SUPABASE_URL`, clave pública, clave secreta y `OS_AUDIT_PEPPER`, sin copiar sus valores a documentación.
5. Crear o verificar un usuario nominal `owner` por el procedimiento seguro del proyecto.
6. Probar login/logout, revocación, agenda, solicitud pública, carga/publicación/despublicación y una lectura pública sin datos privados.
7. Publicar únicamente proyectos, precios y evidencias reales y autorizados.

## Rollback

- Código: promover `recovery/pre-production-2026-11-26` o revertir el merge `7131bd5` mediante un PR revisado.
- Base de datos: usar exclusivamente el backup/punto de recuperación creado antes de migrar. No existe rollback SQL autorizado ni validado para este release porque no se ejecutó SQL en producción.
- Vercel: volver a desplegar el commit estable anterior `d15a26d` si el rollback de código fuese necesario.
