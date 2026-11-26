# Crisdal Agency 2026 — Fases 0 y 1

Fecha de auditoría: 22 de noviembre de 2026  
Rama de trabajo: `codex/crisdal-premium-os`  
Repositorios auditados:

- `zam-ia/crisdal-agency` en `d15a26d`
- `zam-ia/formularios-de-clientes` en `83f558d` (`web/`)

Este documento es el entregable verificable de las fases 0 y 1. No se modificó producción, no se ejecutaron migraciones y no se copiaron datos reales.

## 1. Resumen ejecutivo

Crisdal no parte de cero. El repositorio principal contiene una landing funcional, medición de Meta, VSL, WhatsApp y un CMS sencillo. El repositorio complementario contiene el núcleo funcional de Crisdal OS: autenticación con roles, agenda, clientes, proyectos, finanzas, catálogo, cotizaciones, comisiones, usuarios, sitio y brochure.

La recomendación es **consolidar progresivamente el código de `formularios-de-clientes/web` dentro de `crisdal-agency`**, conservando temporalmente `/admin` como editor de la landing actual y adoptando `/panel` como la experiencia operativa. No se debe unir el almacenamiento actual de forma directa: el panel complementario guarda casi todo su estado en un documento JSON privado de Supabase Storage (`agency-os-current.json`). Ese mecanismo es útil como prototipo, pero no ofrece transacciones, índices, claves externas ni control de concurrencia suficiente para clientes, proyectos y finanzas.

La siguiente fase debe comenzar por un modelo PostgreSQL transaccional y una capa de acceso autorizada en servidor. La migración debe ser reversible, por módulos y con doble lectura controlada; nunca una sustitución inmediata del snapshot.

## 2. Estado real de los repositorios

### 2.1 Repositorio principal

Stack confirmado:

- Next.js 16.3.5, App Router, React 19.2.6 y TypeScript 5.9.
- CSS global propio y Motion; Tailwind está instalado, pero la interfaz actual no depende de un sistema Tailwind consolidado.
- Supabase mediante cliente de servicio exclusivamente del lado servidor.
- Zod para validar el documento administrable.
- Meta Pixel, Conversions API, GTM opcional y consentimiento.

Persistencia:

- `public.landing_content_versions`: historial append-only de documentos JSONB.
- `landing-media`: bucket público para imágenes, video y subtítulos.
- El CMS utiliza la última versión del documento; si Supabase falla, cae al contenido predeterminado del código.

Autenticación actual:

- Contraseña administrativa única desde entorno.
- Cookie HttpOnly, Secure en producción, SameSite Strict, firma HMAC y expiración de ocho horas.
- No hay usuarios nominales, roles, revocación de sesiones ni auditoría por actor.

### 2.2 Repositorio complementario

Stack confirmado:

- Next.js 16.3.0, React 19.2.8 y TypeScript.
- Supabase, Zod, React Hook Form, Lucide, Resend/Nodemailer y subida TUS.
- Panel con usuario propietario por entorno y usuarios adicionales con contraseña scrypt.
- Cookies HttpOnly, Secure en producción y verificación de permisos por ruta API.

Persistencia:

- `onboarding_submissions` y `onboarding_files` sí son tablas PostgreSQL con RLS.
- `allies` y `ally_contact_requests` sí son tablas PostgreSQL con RLS.
- El contenido del sitio y brochure se guarda como JSON en Storage.
- Clientes, agenda, proyectos, finanzas, cotizaciones, usuarios, servicios y comisiones se guardan juntos en `crisdal-admin-data/private/agency-os-current.json`, con copias históricas.
- Existe una cola de mutaciones en memoria, pero no coordina instancias serverless concurrentes.

## 3. Mapa de rutas existente

### Principal

| Ruta | Estado | Propósito |
| --- | --- | --- |
| `/` | funcional | Landing Ruta Crisdal |
| `/gracias` | funcional | Confirmación/medición |
| `/admin` | funcional | CMS de la landing |
| `/admin/login` | funcional | Acceso con contraseña compartida |
| `/api/admin/upload` | funcional | URL firmada para multimedia |
| `/api/lead` | funcional | Evento Meta CAPI |

### Complementario: público

| Ruta | Estado observado | Decisión |
| --- | --- | --- |
| `/` | funcional | adaptar como base de la nueva web |
| `/servicios`, `/servicios/[slug]` | funcional | conservar y reestructurar |
| `/servicios/kits-combinados` | funcional | revisar vigencia comercial |
| `/portafolio` | funcional | conservar, exigir material autorizado |
| `/contacto` | funcional | adaptar |
| `/formulario` | funcional | conservar como onboarding, no como reserva |
| `/brochure` | funcional | conservar como activo comercial |
| `/cotizacion/[token]` | funcional | conservar y endurecer ciclo de estados |
| `/aliados` | funcional | mantener separado del portal cliente |
| `/casos/[slug]`, `/industrias/[slug]` | funcional | conservar solo contenido verificable |
| `/nosotros`, `/metodo` | funcional | integrar en arquitectura editorial |

### Complementario: panel

| Ruta | Implementación | Decisión |
| --- | --- | --- |
| `/panel` | login/enrutador | conservar temporalmente |
| `/panel/dashboard` | dashboard con datos persistidos | adaptar |
| `/panel/agenda` | mensual/semanal/lista, CRUD y conflictos | conservar y ampliar |
| `/panel/clientes` | CRUD, búsqueda y asignación | conservar y migrar a tablas |
| `/panel/proyectos` | tablero y tareas | conservar, normalizar modelo |
| `/panel/finanzas` | ingresos/gastos y filtros | adaptar; rehacer importes y trazabilidad |
| `/panel/catalogo` | servicios y categorías | conservar |
| `/panel/cotizador` | cotizaciones y enlace público | conservar |
| `/panel/comisiones` | reglas y registros | adaptar |
| `/panel/usuarios` | usuarios y roles | conservar como transición |
| `/panel/personal` | personal | mantener fuera del P0/P1 inicial |
| `/panel/web` | CMS del sitio | fusionar gradualmente con `/admin` |
| `/panel/web/catalogo` | catálogo público | conservar |
| `/panel/brochure` | editor multimedia | conservar |
| `/panel/aliados` y `/panel/aliados/puntos` | aliados/fidelidad | P2; no bloquear núcleo |

## 4. Inventario y matriz de reutilización

| Capacidad | Fuente | Estado real | Decisión |
| --- | --- | --- | --- |
| Landing y medición | principal | producción activa | **Conservar** hasta Fase 2 |
| CMS landing | principal | JSONB versionado | **Adaptar** a `/panel/sitio` sin romper `/admin` |
| Autenticación con roles | complementario | funcional, firma propia | **Adaptar** como transición; migrar identidad a tablas |
| Agenda | complementario | CRUD y detección básica de conflicto | **Adaptar** a eventos relacionales |
| Clientes | complementario | CRUD funcional | **Migrar** a PostgreSQL |
| Proyectos | complementario | tablero de tareas | **Adaptar** y separar proyecto/tarea/entregable |
| Finanzas | complementario | movimientos simples con `number` | **Reemplazar almacenamiento**, conservar patrones UI |
| Servicios | complementario | catálogo funcional | **Migrar** a servicios/paquetes/items |
| Cotizaciones | complementario | snapshot de items y token público | **Conservar concepto**, migrar a tablas y estados auditados |
| Comisiones | complementario | funcional, modelo básico | **Adaptar** después del catálogo |
| Portafolio | complementario | web + editor | **Adaptar** a proyectos/activos autorizados |
| Galerías privadas | ninguno | no implementado | **Construir en P2** |
| Reservas públicas | ninguno | formulario general no equivale a reserva | **Construir** después de agenda |
| Notificaciones | complementario | correo/webhook parcial | **Adaptar**, nunca simular WhatsApp enviado |
| Onboarding | complementario | tablas SQL y archivos privados | **Conservar** separado del CRM hasta migración controlada |
| Aliados | complementario | tablas y panel propio | **Conservar**, no mezclar con usuarios internos |

## 5. Diferencias respecto de las referencias Focali

- El dashboard actual es informativo, pero no tiene una tarjeta protagonista de próximo evento con composición editorial ni una jerarquía móvil equivalente.
- La agenda ya ofrece vistas y conflictos, pero debe separar solicitud, preselección, reserva y confirmación; sus categorías actuales son genéricas.
- No existe el bottom sheet especializado para compartir paquetes con filtros, previsualización y atribución.
- No existe un portal público por etapas para servicio, paquete, fecha y solicitud.
- La navegación del panel es funcional, pero no se comporta aún como una app móvil con cinco destinos y acción central contextual.
- La identidad visual del panel complementario es cercana a una herramienta operativa, pero no comparte todavía tokens formalizados con la futura experiencia pública premium.

## 6. Riesgos de integración

### Críticos

1. **Documento JSON monolítico:** dos escrituras en instancias distintas pueden sobrescribirse.
2. **Finanzas en coma flotante:** `number` no es una representación aceptable para saldos auditables; usar enteros en céntimos.
3. **Datos de muestra predeterminados:** planes, servicios, casos y métricas embebidos podrían mostrarse como reales si Storage está vacío. Deben aislarse o marcarse como demo antes de consolidar.
4. **Dos autenticaciones incompatibles:** `/admin` y `/panel` generan cookies y sesiones distintas; no deben fusionarse cambiando secretos de golpe.
5. **Dos fuentes de contenido:** JSONB en tabla frente a JSON en Storage. Sin una autoridad definida, aparecerán ediciones divergentes.

### Altos

- Las sesiones firmadas no se revocan individualmente y el rol viaja dentro del token hasta su expiración.
- La limitación de intentos de login vive en memoria y no es consistente entre instancias.
- La creación automática de buckets durante peticiones mezcla provisión de infraestructura con ejecución normal.
- El bucket `landing-media` es público; no puede reutilizarse para galerías privadas.
- Los tokens de cotización tienen buena entropía, pero faltan expiración/revocación y registro de acceso.
- La API de subida pública del onboarding permite reservar URLs firmadas sin prueba previa de intención; necesita límites persistentes y caducidad operativa.

### Medios

- No existe historial transaccional/audit log general.
- Las rutas API realizan autorización, pero los permisos están codificados como listas de prefijos y serán difíciles de mantener al crecer.
- El panel posee archivos UI muy grandes y componentes altamente acoplados.
- No existe suite automatizada declarada en `package.json`.

## 7. Arquitectura recomendada

### Aplicación

Un solo proyecto Next.js en `crisdal-agency`:

```text
app/
  (marketing)/          web pública
  (portal)/             paquetes, solicitud, cotización, galería
  admin/                compatibilidad temporal del CMS anterior
  panel/                Crisdal OS
  api/                   integraciones y cargas controladas
  lib/
    auth/                sesiones, permisos y DAL
    data/                repositorios y DTO
    domain/              reglas de negocio puras
  ui/
    marketing/           sistema editorial
    os/                  sistema operativo
```

No se propone un SaaS ni multitenancy. Todos los registros pertenecen a Crisdal Agency.

### Estrategia de convivencia

1. Mantener `/admin` y su cookie sin cambios durante Fases 1–2.
2. Portar `/panel` con su autenticación actual, usando un nombre de cookie distinto durante la transición.
3. Crear un DAL server-only y permisos declarativos por capacidad.
4. Migrar módulos uno a uno desde snapshot a tablas.
5. Cuando CMS, usuarios y permisos estén consolidados, redirigir `/admin` a `/panel/sitio` conservando compatibilidad.
6. Retirar el snapshot solo después de reconciliación, respaldo y aprobación.

### Capas

- **UI:** Server Components por defecto; Client Components solo para calendario, formularios y interacción.
- **DAL:** verificación de sesión cerca de la consulta, selección explícita de columnas y DTO seguros.
- **Dominio:** reglas de estados, conflictos, totales y permisos sin acceso directo a UI.
- **Datos:** Supabase/PostgreSQL y Storage; service role solo en servidor.
- **Integraciones:** Meta, correo y futuros proveedores de mensajería aislados tras interfaces con estados verificables.

## 8. Modelo de datos propuesto

Los nombres definitivos deben compararse con el esquema remoto antes de migrar.

### Identidad y auditoría

- `staff_users(id, auth_user_id, display_name, role_id, active, created_at, updated_at)`
- `roles(id, code, name)`
- `permissions(id, code, name)`
- `role_permissions(role_id, permission_id)`
- `audit_logs(id, actor_id, entity_type, entity_id, action, before_json, after_json, created_at)`

### Operación

- `clients`
- `client_contacts`
- `projects`
- `project_members`
- `project_tasks`
- `deliverables`
- `calendar_events`
- `event_assignments`
- `event_resources`

### Comercial

- `services`
- `packages`
- `package_items`
- `quotes`
- `quote_items` con precio y descripción como snapshot
- `booking_requests`
- `bookings`
- `partners`
- `referrals`
- `commissions`

### Finanzas

- `receivables`
- `payments`
- `expenses`
- `payment_accounts`
- `financial_voids` o estados de anulación auditables

Todo importe se almacena como `bigint` en unidades menores y `currency char(3)`; PEN es predeterminado. Los timestamps se guardan en UTC y se presentan en `America/Lima`.

### Contenido y entrega

- `portfolio_projects`
- `media_assets`
- `client_galleries`
- `gallery_assets`
- `shared_links(id, resource_type, resource_id, token_hash, expires_at, revoked_at)`

Los tokens se almacenan hasheados cuando no sea necesario recuperarlos. Galerías privadas usan buckets privados y URLs firmadas cortas.

## 9. Política de migración y recuperación

1. Exportar y versionar de forma privada el snapshot actual y los documentos CMS.
2. Registrar hash, tamaño, fecha y recuentos por colección.
3. Crear tablas nuevas solo mediante migraciones nuevas; nunca editar las históricas.
4. Importar en una rama o entorno aislado con identificadores estables.
5. Comparar totales y relaciones antes/después.
6. Activar doble lectura con preferencia a tablas y fallback al snapshot.
7. Mantener escritura al sistema anterior durante un periodo corto solo si se puede hacer idempotente.
8. Cortar por módulo, no por aplicación completa.
9. Conservar una ruta de rollback que reactive la lectura del snapshot.
10. Pedir autorización antes de ejecutar la migración remota.

## 10. Arquitectura de información final

### Público

- `/`
- `/contenido`
- `/eventos`
- `/portafolio`
- `/planes`
- `/contacto`
- `/ruta-crisdal` durante la transición comercial

### Panel

- `/panel`
- `/panel/agenda`
- `/panel/clientes`
- `/panel/proyectos`
- `/panel/finanzas`
- `/panel/paquetes`
- `/panel/cotizaciones`
- `/panel/portafolio`
- `/panel/comisiones`
- `/panel/usuarios`
- `/panel/configuracion`
- `/panel/sitio`

### Portal

- `/paquetes/[slug]`
- `/solicitar-fecha`
- `/cotizacion/[token]`
- `/galeria/[token]`

## 11. Flujos prioritarios

### Propietario

`Login → Dashboard → Próximo evento/cuentas por cobrar → Detalle → Registrar pago → Confirmación auditada`

### Producción

`Login → Agenda asignada → Proyecto → Tareas/entregables → Actualizar estado → Historial`

### Comercial

`Cliente → Cotización → Snapshot de items → Enlace privado → Seguimiento → Aceptación explícita`

### Cliente de eventos

`Categoría → Paquete → Fecha solicitada → Datos → Resumen → Solicitud pendiente`

La solicitud nunca crea una reserva confirmada. La aprobación vuelve a validar conflictos en servidor.

### Cliente de contenido

`Trabajo real → Plan/servicio → Brief corto → WhatsApp o solicitud → Seguimiento`

### Aliado

`Paquete autorizado → Enlace atribuible → Solicitud/cotización → Comisión según condición → Estado`

## 12. Wireframes estructurales

### Dashboard móvil

```text
┌ Crisdal             Avisos Perfil ┐
│ Hola, Crisdal · fecha real        │
│ ┌ Próximo evento / estado vacío ┐ │
│ │ fecha · cliente · lugar        │ │
│ │ saldo solo con permiso   Ver  │ │
│ └───────────────────────────────┘ │
│ [Por cobrar] [Proyectos activos]  │
│ [Cotizaciones] [Entregas]         │
│ Actividad próxima                 │
├ Inicio Agenda   +   Finanzas Más ┤
```

### Dashboard desktop

```text
┌ Sidebar ──────┬ Header / perfil ───────────┐
│ Inicio        │ Saludo y fecha             │
│ Agenda        │ ┌ Próximo evento ────────┐ │
│ Clientes      │ └────────────────────────┘ │
│ Proyectos     │ KPIs autorizados           │
│ Finanzas      │ Cuentas por cobrar | tareas│
│ ...           │ Actividad reciente         │
└───────────────┴────────────────────────────┘
```

### Agenda móvil

```text
Mes y flechas → chips Mensual/Semanal/Lista
Calendario táctil
Día seleccionado
Actividades del día
[+ Registrar actividad]
Bottom sheet de creación/edición
```

### Finanzas desktop

```text
Periodo + moneda + exportar
Cobrado | Por cobrar | Gastos | Resultado operativo
Vencimientos
Movimientos con filtros y paginación
Panel lateral de registro/anulación
```

### Portal cliente

```text
Marca + progreso 1/5
Categorías visuales autorizadas
Paquete y condiciones
Fecha solicitada (no reservada)
Datos y resumen persistente
Enviar solicitud
Resultado: pendiente de confirmación
```

## 13. Sistema visual

Se incorporó una base aislada para Crisdal OS en `app/ui/os/`:

- Tokens de color, espaciado, radios, sombras y foco.
- `AppShell` responsive con sidebar en desktop y navegación inferior de hasta cinco destinos en móvil.
- `MetricCard`, `EmptyState` y `LoadingSkeleton` accesibles.

Esta base no está conectada a rutas productivas y no altera la landing actual. La web pública mantendrá la paleta carbón/marfil/dorado/bronce; Crisdal OS usará superficies claras y turquesa operativo con contraste AA.

## 14. Plan de implementación por archivos

### Fase 2

- Reorganizar `app/page.tsx` en grupo `(marketing)` sin cambiar la URL.
- Ampliar `app/lib/site-content.ts` con bloques compatibles y migrador de schema.
- Crear `app/(marketing)/contenido`, `eventos`, `planes`, `portafolio` y `contacto`.
- Preservar `app/ui/site-tracking.tsx`, Meta y consentimiento.
- No publicar precios nuevos hasta validación comercial.

### Fase 3

- Crear `app/lib/auth/dal.ts`, permisos y DTO.
- Añadir migraciones nuevas para identidad y auditoría.
- Portar shell y login del panel complementario.
- Mantener `/admin` hasta completar `/panel/sitio`.

### Fases 4–8

- Portar UI módulo por módulo.
- Sustituir `adminData.ts` por repositorios transaccionales.
- Añadir pruebas de reglas puras antes de conectar UI.

### Fase 9–10

- Separar portafolio público y galerías privadas.
- Añadir metadata, sitemap, robots, analítica y pruebas E2E.

## 15. Plan de pruebas

- Lint y TypeScript en cada commit.
- Build de producción antes de cada PR.
- Pruebas unitarias: importes, descuentos, saldos, estados y conflictos.
- Integración: permisos por rol, idempotencia, cotizaciones y pagos parciales.
- E2E: login, cliente, proyecto, evento, cotización, solicitud y CMS.
- Seguridad: rutas sin sesión, IDOR, CSRF, tokens expirados, límites de carga y exposición de secretos.
- Responsive: 360, 375, 390, 412, 430, 768, 1024, 1440 y 1920 px.
- Accesibilidad: teclado, foco, contraste, lectores, modales y reduced motion.

## 16. Criterio de salida de Fases 0 y 1

- Ambos repositorios fueron inspeccionados en sus commits remotos actuales.
- Se identificaron las implementaciones reutilizables y los prototipos que requieren migración.
- Existe una arquitectura de convivencia que no rompe `/admin` ni la landing.
- Existe un modelo de datos propuesto, estrategia de respaldo y rollback.
- Los flujos y wireframes móvil/desktop están definidos.
- La base visual no destructiva compila sin conectarse a producción.
- La Fase 2 queda bloqueada hasta recibir la instrucción `CONTINUAR FASE 2` y validar planes/precios vigentes.

## 17. Auditoría de dependencias

El primer `npm audit --omit=dev` del repositorio principal detectó una vulnerabilidad crítica en Next.js y vulnerabilidades altas en Sharp, Zod y `source-map-js`. Se actualizó únicamente el lockfile dentro de los rangos compatibles ya declarados:

- Next.js: 16.3.5 → 16.4.6.
- Sharp: 0.35.4 → 0.35.5.
- Zod: 4.6.5 → 4.6.7.
- `source-map-js`: 1.2.1 → 1.2.4.

La comprobación posterior reporta **0 vulnerabilidades** en dependencias de producción del repositorio principal.

El repositorio complementario conserva, sin modificación, avisos críticos/altos en Next.js, Nodemailer, Sharp, Zod y `source-map-js`. Su actualización debe realizarse en una rama propia y probarse antes de portar código. No se alteró porque esta rama pertenece únicamente al repositorio principal.

