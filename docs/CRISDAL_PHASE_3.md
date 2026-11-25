# Crisdal Agency — Fase 3

Fecha de validación: 25 de noviembre de 2026

Rama: `codex/crisdal-premium-os`

Base: `7872a92`

## Alcance entregado

- Se preserva el CMS histórico en `/admin` y su autenticación existente.
- Se incorpora Crisdal OS en `/panel`, con login nominal separado en `/panel/login`.
- La identidad y las contraseñas quedan a cargo de Supabase Auth; la aplicación no almacena contraseñas.
- Cada sesión de Supabase se registra en `crisdal_os_sessions` y se comprueba en servidor en cada vista protegida. La expiración, inactividad del perfil o revocación bloquean el acceso.
- Roles implementados: `owner`, `administration`, `production`, `finance` y `commercial`.
- Capacidades explícitas implementadas para clientes, calendario, proyectos, finanzas, paquetes, cotizaciones, portafolio, sitio y usuarios.
- El rol se resuelve desde el perfil actual de base de datos, no únicamente desde un claim de larga duración.
- Se añaden rate limiting de login, verificación de origen, cookies seguras, auditoría y protección contra IDOR.
- La interfaz del panel es responsive, con estados reales y sin clientes, proyectos, ingresos o métricas ficticias.

## Arquitectura y seguridad

La autenticación usa cookies SSR siguiendo la guía oficial de [Supabase Auth para SSR](https://supabase.com/docs/guides/auth/server-side) y un `proxy.ts` limitado a `/panel` para actualizar tokens. La autorización se ejecuta en una DAL server-only y consulta el registro revocable de sesión antes de servir una vista protegida.

Supabase Auth administra el hash y la validación de contraseñas conforme a su [documentación de seguridad de contraseñas](https://supabase.com/docs/guides/auth/password-security). No se migran claves, hashes ni usuarios desde el JSON complementario.

Las tablas de identidad, sesiones, intentos, auditoría y control de migraciones activan RLS y revocan privilegios directos a `anon` y `authenticated`, siguiendo la [guía oficial de RLS](https://supabase.com/docs/guides/database/postgres/row-level-security). El acceso a estas tablas queda reservado al cliente server-only con `service_role`.

## Migración versionada

Archivo: `supabase/migrations/20261125120000_crisdal_os_identity.sql`

La migración crea únicamente la base de identidad y control:

- `crisdal_os_roles`
- `crisdal_os_capabilities`
- `crisdal_os_role_capabilities`
- `crisdal_os_users`
- `crisdal_os_sessions`
- `crisdal_os_login_attempts`
- `crisdal_os_audit_events`
- `crisdal_os_migration_runs`
- `crisdal_os_id_map`

No se aplicó la migración contra Supabase, no se crearon usuarios reales y no se modificaron datos remotos. Su aplicación y el alta del primer propietario requieren una ventana controlada posterior.

## Estrategia para el snapshot complementario

`app/lib/os/snapshot-migration.ts` inventaría las colecciones conocidas, valida identificadores, genera UUID deterministas y produce una huella de origen. El resultado es un plan, no una importación. La prueba usa exclusivamente datos sintéticos y confirma idempotencia.

Reglas fijadas para una futura migración:

- Zona horaria: `America/Lima`.
- Moneda predeterminada: `PEN`.
- Dinero: unidades menores enteras, nunca floats.
- Mapeo legado: `source_system + entity_type + legacy_id` único.
- Repetir el mismo snapshot debe producir el mismo plan y no duplicar entidades.
- Antes de aplicar: inventario, respaldo, validación, dry run, reconciliación y rollback documentado.

## Contratos de módulos futuros

`app/lib/os/domain-schemas.ts` define contratos versionables para clientes, proyectos, calendario, finanzas, paquetes, cotizaciones y portafolio. `app/lib/os/module-contracts.ts` separa repositorios por módulo. No se crearon tablas de negocio a ciegas y no se copió el snapshot JSON como persistencia final.

## Correcciones de regresión de Fase 2

- Pixel y CAPI resuelven el mismo `content_name` para la web audiovisual.
- `/ruta-crisdal` conserva `Sistema de Captación Directa`, su `event_id` compartido y su atribución histórica.
- El portafolio mantiene un estado pendiente explícito y ya no presenta filtros visuales que parezcan funcionales.
- La fotografía promocional ya no afirma que la persona mostrada sea integrante del equipo.
- JSON-LD ya no publica cobertura geográfica ni dirección sin confirmar.
- Pixel y consentimiento no se cargan en `/panel`.

## Límite del CMS anterior

El CMS de `/admin` continúa administrando la landing histórica almacenada en `landing_content_versions`. No administra la estructura, planes ni páginas de la nueva web pública y tampoco gestiona usuarios o módulos de Crisdal OS. Esta separación es intencional para evitar que un snapshot antiguo reemplace la web nueva.

## Variables de entorno

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` — solo servidor
- `OS_AUDIT_PEPPER` — solo servidor

Ningún valor real se incluye en Git. El panel muestra un estado seguro de no configurado cuando faltan variables.

## Validaciones

- Pruebas de login válido e inválido, rate limit, usuario no autorizado, expiración y revocación.
- Matriz de roles y protección financiera.
- Protección contra IDOR al consultar perfiles.
- Verificación de origen para acciones mutables.
- Plan de migración sintético determinista e idempotente.
- Regresión de identificadores de Pixel/CAPI y Ruta Crisdal.
- Prueba pgTAP preparada en `supabase/tests/crisdal_os_identity_rls.sql`; no se ejecutó contra producción.

Resultados locales:

- `npm run lint`: correcto.
- `npx tsc --noEmit --incremental false`: correcto.
- `npm test`: 13/13 pruebas correctas.
- `npm run build`: correcto con Next.js 16.4.6.
- `npm audit --omit=dev`: 0 vulnerabilidades de producción.
- Rutas públicas, `/ruta-crisdal` y `/panel/login`: HTTP 200.
- `/admin`: mantiene redirección a `/admin/login` sin sesión.
- `/panel`: no expone contenido y redirige a `/panel/login` sin sesión válida.
- Login revisado visualmente en 1280×800 y 390×844; sin overflow horizontal, con un `h1`, labels y foco accesible; consola sin errores.

Los comandos y resultados finales de lint, TypeScript, pruebas y build se registran en el commit de esta fase. No se realizó despliegue en Vercel ni migración remota.

## Próximo paso controlado

Aplicar la migración en un entorno de prueba, ejecutar pgTAP, crear un único usuario propietario mediante Supabase Auth y verificar el ciclo completo login → permisos → revocación → auditoría antes de considerar producción.
